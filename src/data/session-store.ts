import { create } from 'zustand';
import {
  DEFAULT_AUTO_LOCK_MINUTES,
  can,
  hashPassword,
  isSessionExpired,
  issueSession,
  lockSession,
  unlockSession,
  verifyPassword,
} from '../domain/auth';
import type { Permission, Register, Session, Staff, Store, UserAccount } from '../domain/types';
import { accountByEmail, accountForStaff, isStaffActive, registersForStore, useOrgStore } from './org-store';
import { useOrgSettingsStore } from './org-settings-store';
import { activeOrgId } from './active-org';
import { auditText, recordAudit, setAuditActorSource } from './audit-store';

export type LoginFailure = 'invalid' | 'disabled' | 'invited' | 'no_store';

export type LoginResult =
  | { ok: true; mustChangePassword: boolean; storeOptions: Store[] }
  | { ok: false; reason: LoginFailure };

export type UnlockResult =
  | { ok: true; switched: boolean; staff: Staff }
  | { ok: false; reason: 'unknown_pin' | 'not_here' | 'disabled' };

interface SessionState {
  /** The issued session: identity, chain, till and lifetime. `null` when signed out. */
  session: Session | null;
  /** The account that signed in; the staff record beside it is who works the till. */
  account: UserAccount | null;
  staff: Staff | null;
  store: Store | null;
  register: Register | null;
  storeOptions: Store[];
  registerOptions: Register[];
  /** Minutes of inactivity before the till locks itself; `0` turns the auto-lock off. */
  autoLockMinutes: number;
  /** Epoch ms of the last interaction, the input to the auto-lock. Never persisted. */
  lastActivityAt: number;
  login: (email: string, password: string) => Promise<LoginResult>;
  selectStore: (storeId: string) => void;
  selectRegister: (registerId: string) => void;
  lock: () => void;
  unlock: (pin: string) => UnlockResult;
  logout: () => void;
  touch: () => void;
  setAutoLockMinutes: (minutes: number) => void;
  /** Verifies the current password and stores the new one. Used by the change-password screen. */
  changePassword: (currentPassword: string, nextPassword: string) => Promise<boolean>;
}

function storeOptionsFor(member: Staff, stores: Store[]): Store[] {
  return stores.filter((store) => member.storeIds.includes(store.id) && store.isActive);
}

/**
 * The staff record an account works as inside `orgId`.
 *
 * One person has one login and may hold a different staff record in each chain they belong
 * to, so the membership table is what answers this, not `account.staffId`: that field can only
 * ever name one of them, and after an org switch it names the wrong one. A chain with no
 * membership row falls back to the account's own staff id, which is the single-chain case
 * every onboarding-created chain is in.
 */
function staffIdForOrg(account: UserAccount, orgId: string): string {
  const { memberships } = useOrgSettingsStore.getState();
  const membership = memberships.find(
    (entry) => entry.userId === account.id && entry.orgId === orgId,
  );
  return membership?.staffId ?? account.staffId;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  account: null,
  staff: null,
  store: null,
  register: null,
  storeOptions: [],
  registerOptions: [],
  autoLockMinutes: DEFAULT_AUTO_LOCK_MINUTES,
  lastActivityAt: Date.now(),

  /**
   * Email and password against the accounts in the org store, never against the seed arrays:
   * a password changed in the app, an invite accepted and a member switched off all have to
   * reach this path, and reading the seed would leave every one of them inert.
   *
   * The store is not chosen here. A member assigned to one branch is dropped straight onto it,
   * anyone else picks on `/select-store`, and the till is picked after that.
   */
  login: async (email, password) => {
    const { accounts, staff, stores, staffActiveById, organization } = useOrgStore.getState();
    const account = accountByEmail(accounts, email);
    if (!account) return { ok: false, reason: 'invalid' };
    if (account.status === 'disabled') return { ok: false, reason: 'disabled' };

    const ok = await verifyPassword(password, account.salt, account.passwordHash);
    if (!ok) return { ok: false, reason: 'invalid' };

    // The chain this device is signed into, then the staff record this account holds inside it.
    const orgId = organization?.id ?? activeOrgId();
    const member = staff.find((candidate) => candidate.id === staffIdForOrg(account, orgId));
    if (!member || !isStaffActive(staffActiveById, member.id)) return { ok: false, reason: 'disabled' };

    const options = storeOptionsFor(member, stores);
    if (options.length === 0) return { ok: false, reason: 'no_store' };

    const only = options.length === 1 ? options[0] : null;
    const session = issueSession({
      orgId,
      userId: account.id,
      staffId: member.id,
      storeId: only?.id,
    });

    useOrgStore.getState().markAccountSignedIn(account.id, session.issuedAt);
    set({
      session,
      account,
      staff: member,
      store: only,
      register: null,
      storeOptions: options,
      registerOptions: only ? registersForStore(useOrgStore.getState().registers, only.id) : [],
      lastActivityAt: Date.now(),
    });

    // After the state is set, so `recordAudit` reads the member it is about to name. The two
    // session events are the only ones the log cannot get from a screen: nothing else runs
    // between the credentials being accepted and the app area taking over.
    recordAudit({
      action: 'login',
      entity: 'session',
      entityId: account.email,
      staffId: member.id,
      storeId: only?.id,
      summary: auditText('chain.audit.summary.login'),
    });

    return { ok: true, mustChangePassword: account.mustChangePassword, storeOptions: options };
  },

  selectStore: (storeId) => {
    const { staff: member, storeOptions, session } = get();
    if (!member) return;
    const nextStore = storeOptions.find((store) => store.id === storeId);
    if (!nextStore) return;
    const registerOptions = registersForStore(useOrgStore.getState().registers, nextStore.id);
    set({
      store: nextStore,
      // Switching branch drops the till: a register belongs to one shop, and keeping the old
      // one would book the next sale to a station in another city.
      register: null,
      registerOptions,
      session: session ? { ...session, storeId: nextStore.id, registerId: undefined } : session,
      lastActivityAt: Date.now(),
    });
  },

  selectRegister: (registerId) => {
    const { registerOptions, session } = get();
    const nextRegister = registerOptions.find((register) => register.id === registerId);
    if (!nextRegister) return;
    set({
      register: nextRegister,
      session: session ? { ...session, registerId: nextRegister.id } : session,
      lastActivityAt: Date.now(),
    });
  },

  lock: () => {
    const { session } = get();
    if (!session) return;
    set({ session: lockSession(session) });
  },

  /**
   * One PIN pad does both jobs: the signed-in cashier's own PIN reopens the till, and any
   * other member of this branch's PIN hands the till over to them. PINs are unique per chain,
   * so the PIN alone names the person.
   */
  unlock: (pin) => {
    const { session, store, staff: current } = get();
    if (!session) return { ok: false, reason: 'unknown_pin' };

    const { staff, accounts, staffActiveById } = useOrgStore.getState();
    const member = staff.find((candidate) => candidate.pin === pin);
    if (!member) return { ok: false, reason: 'unknown_pin' };
    if (!isStaffActive(staffActiveById, member.id)) return { ok: false, reason: 'disabled' };
    if (store && !member.storeIds.includes(store.id)) return { ok: false, reason: 'not_here' };

    if (current && member.id === current.id) {
      set({ session: unlockSession(session), lastActivityAt: Date.now() });
      return { ok: true, switched: false, staff: member };
    }

    const account = accountForStaff(accounts, member.id);
    if (account?.status === 'disabled') return { ok: false, reason: 'disabled' };

    const nextSession = unlockSession({
      ...session,
      userId: account?.id ?? session.userId,
      staffId: member.id,
    });
    set({
      session: nextSession,
      account: account ?? null,
      staff: member,
      lastActivityAt: Date.now(),
    });
    return { ok: true, switched: true, staff: member };
  },

  logout: () => {
    const { account, staff: member, store } = get();
    // Recorded before the state is cleared: afterwards there is no member left to attribute
    // the act to, and `recordAudit` would drop it.
    if (member) {
      recordAudit({
        action: 'logout',
        entity: 'session',
        entityId: account?.email ?? member.id,
        staffId: member.id,
        storeId: store?.id,
        summary: auditText('chain.audit.summary.logout'),
      });
    }
    set({
      session: null,
      account: null,
      staff: null,
      store: null,
      register: null,
      storeOptions: [],
      registerOptions: [],
    });
  },

  touch: () => set({ lastActivityAt: Date.now() }),

  setAutoLockMinutes: (autoLockMinutes) => set({ autoLockMinutes }),

  changePassword: async (currentPassword, nextPassword) => {
    const { account } = get();
    if (!account) return false;
    const fresh = useOrgStore.getState().accounts.find((item) => item.id === account.id) ?? account;
    if (!(await verifyPassword(currentPassword, fresh.salt, fresh.passwordHash))) return false;

    const passwordHash = await hashPassword(nextPassword, fresh.salt);
    useOrgStore.getState().setAccountPassword(fresh.id, passwordHash, fresh.salt);
    const updated = useOrgStore.getState().accounts.find((item) => item.id === fresh.id) ?? null;
    set({ account: updated });
    return true;
  },
}));

// Who the log names. Registered here rather than read from the audit store, which knows
// nothing about sessions; see `setAuditActorSource`.
setAuditActorSource(() => {
  const { staff, store } = useSessionStore.getState();
  return { staffId: staff?.id, storeId: store?.id };
});

export function getCurrentStaff(): Staff | null {
  return useSessionStore.getState().staff;
}

export function getCurrentStore(): Store | null {
  return useSessionStore.getState().store;
}

export function getCurrentRegister(): Register | null {
  return useSessionStore.getState().register;
}

/** The chain of the active session; falls back to the loaded chain when signed out. */
export function currentOrgId(): string {
  return useSessionStore.getState().session?.orgId ?? useOrgStore.getState().organization?.id ?? '';
}

/** True while the lock screen should be covering the app. */
export function isLocked(session: Session | null): boolean {
  return Boolean(session?.lockedAt);
}

/** True when there is no session left to work with (signed out or timed out). */
export function isSignedOut(session: Session | null, now: Date = new Date()): boolean {
  return !session || isSessionExpired(session, now);
}

/** Permission check bound to the signed-in member. `false` while signed out. */
export function useCan(permission: Permission): boolean {
  const role = useSessionStore((state) => state.staff?.role);
  return can(role, permission);
}
