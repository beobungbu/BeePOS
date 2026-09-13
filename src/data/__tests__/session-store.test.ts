/**
 * The session store is where identity, branch and till meet, so these cover the four ways a
 * shift actually starts or ends: a sign-in, a branch and register pick, a lock with the PIN
 * that reopens it, and the handover to the next cashier.
 *
 * Credentials are read from the org store rather than the seed arrays, so a password changed
 * in the app or a member switched off on `/staff` has to reach this path; the cases below pin
 * that down.
 */
import { DEFAULT_AUTO_LOCK_MINUTES, isSessionExpired } from '../../domain/auth';
import { useOrgStore } from '../org-store';
import { useSessionStore } from '../session-store';
import {
  accounts as seedAccounts,
  DEMO_PASSWORD,
  organization as seedOrganization,
  registers as seedRegisters,
  staff as seedStaff,
  stores as seedStores,
} from '../seed';

const OWNER_EMAIL = 'owner@chuoi.vn';
const STORE = seedStores[0];
const CASHIER = seedStaff.find(
  (member) => member.role === 'cashier' && member.storeIds.includes(STORE.id),
)!;
const OTHER_CASHIER = seedStaff.find(
  (member) => member.role === 'cashier' && member.storeIds.includes(STORE.id) && member.id !== CASHIER.id,
)!;
const CASHIER_EMAIL = seedAccounts.find((account) => account.staffId === CASHIER.id)!.email;
const ELSEWHERE = seedStaff.find((member) => !member.storeIds.includes(STORE.id))!;

function resetStores(): void {
  useOrgStore.setState({
    organization: seedOrganization,
    stores: seedStores,
    staff: seedStaff,
    registers: seedRegisters,
    accounts: seedAccounts,
    staffActiveById: {},
    storeHoursById: {},
  });
  useSessionStore.setState({
    session: null,
    account: null,
    staff: null,
    store: null,
    register: null,
    storeOptions: [],
    registerOptions: [],
    autoLockMinutes: DEFAULT_AUTO_LOCK_MINUTES,
    lastActivityAt: Date.now(),
  });
}

const login = (email: string, password: string) => useSessionStore.getState().login(email, password);

beforeEach(resetStores);

describe('login', () => {
  it('signs in a seeded account and offers its branches', async () => {
    const result = await login(OWNER_EMAIL, DEMO_PASSWORD);

    expect(result).toMatchObject({ ok: true, mustChangePassword: false });
    const state = useSessionStore.getState();
    expect(state.staff?.id).toBe('staff-1');
    expect(state.session?.orgId).toBe(seedOrganization.id);
    expect(isSessionExpired(state.session)).toBe(false);
    expect(state.storeOptions).toHaveLength(seedStores.length);
    // Four branches: nothing may be picked for the owner.
    expect(state.store).toBeNull();
  });

  it('drops a single-branch member straight onto their branch', async () => {
    await login(CASHIER_EMAIL, DEMO_PASSWORD);

    const state = useSessionStore.getState();
    expect(state.store?.id).toBe(STORE.id);
    expect(state.registerOptions.length).toBeGreaterThan(1);
    // The till is still unanswered: it is the next screen, never a guess.
    expect(state.register).toBeNull();
  });

  it('rejects an unknown email and a wrong password', async () => {
    await expect(login('nobody@chuoi.vn', DEMO_PASSWORD)).resolves.toEqual({ ok: false, reason: 'invalid' });
    await expect(login(OWNER_EMAIL, 'wrong-password')).resolves.toEqual({ ok: false, reason: 'invalid' });
    expect(useSessionStore.getState().staff).toBeNull();
  });

  it('ignores case and padding in the email', async () => {
    await expect(login('  Owner@Chuoi.VN ', DEMO_PASSWORD)).resolves.toMatchObject({ ok: true });
  });

  it('turns away a member deactivated on the staff screen', async () => {
    useOrgStore.getState().setStaffActive(CASHIER.id, false);

    await expect(login(CASHIER_EMAIL, DEMO_PASSWORD)).resolves.toEqual({ ok: false, reason: 'disabled' });
    expect(useSessionStore.getState().staff).toBeNull();
  });

  it('asks an invited account to set its own password first', async () => {
    const invited = seedAccounts.find((account) => account.status === 'invited')!;

    await expect(login(invited.email, DEMO_PASSWORD)).resolves.toMatchObject({
      ok: true,
      mustChangePassword: true,
    });
  });

  it('honours a password changed through the app', async () => {
    await login(OWNER_EMAIL, DEMO_PASSWORD);
    await expect(
      useSessionStore.getState().changePassword(DEMO_PASSWORD, 'Cuahang@2027'),
    ).resolves.toBe(true);
    useSessionStore.getState().logout();

    await expect(login(OWNER_EMAIL, DEMO_PASSWORD)).resolves.toEqual({ ok: false, reason: 'invalid' });
    await expect(login(OWNER_EMAIL, 'Cuahang@2027')).resolves.toMatchObject({ ok: true });
  });

  it('refuses to change a password without the current one', async () => {
    await login(OWNER_EMAIL, DEMO_PASSWORD);
    await expect(useSessionStore.getState().changePassword('nope', 'Cuahang@2027')).resolves.toBe(false);
    await expect(login(OWNER_EMAIL, DEMO_PASSWORD)).resolves.toMatchObject({ ok: true });
  });
});

describe('store and register', () => {
  it('records the branch and the till on the session', async () => {
    await login(OWNER_EMAIL, DEMO_PASSWORD);
    useSessionStore.getState().selectStore(STORE.id);
    const register = useSessionStore.getState().registerOptions[0];
    useSessionStore.getState().selectRegister(register.id);

    const state = useSessionStore.getState();
    expect(state.session?.storeId).toBe(STORE.id);
    expect(state.session?.registerId).toBe(register.id);
    expect(state.register?.id).toBe(register.id);
  });

  it('drops the till when the branch changes', async () => {
    await login(OWNER_EMAIL, DEMO_PASSWORD);
    useSessionStore.getState().selectStore(STORE.id);
    useSessionStore.getState().selectRegister(useSessionStore.getState().registerOptions[0].id);

    useSessionStore.getState().selectStore(seedStores[1].id);

    const state = useSessionStore.getState();
    expect(state.register).toBeNull();
    expect(state.session?.registerId).toBeUndefined();
    expect(state.registerOptions.every((item) => item.storeId === seedStores[1].id)).toBe(true);
  });

  it('ignores a branch the member is not assigned to', async () => {
    await login(CASHIER_EMAIL, DEMO_PASSWORD);
    useSessionStore.getState().selectStore(seedStores[2].id);
    expect(useSessionStore.getState().store?.id).toBe(STORE.id);
  });
});

describe('lock, unlock and cashier switch', () => {
  async function signInCashier(): Promise<void> {
    await login(CASHIER_EMAIL, DEMO_PASSWORD);
    useSessionStore.getState().selectRegister(useSessionStore.getState().registerOptions[0].id);
    useSessionStore.getState().lock();
  }

  it('reopens the same session for the signed-in cashier', async () => {
    await signInCashier();
    expect(useSessionStore.getState().session?.lockedAt).toBeInstanceOf(Date);

    const result = useSessionStore.getState().unlock(CASHIER.pin);

    expect(result).toMatchObject({ ok: true, switched: false });
    const state = useSessionStore.getState();
    expect(state.session?.lockedAt).toBeUndefined();
    expect(state.staff?.id).toBe(CASHIER.id);
    // The open till survives a lock: the branch and the register are still bound.
    expect(state.register).not.toBeNull();
  });

  it('hands the till to another cashier of the same branch', async () => {
    await signInCashier();

    const result = useSessionStore.getState().unlock(OTHER_CASHIER.pin);

    expect(result).toMatchObject({ ok: true, switched: true });
    const state = useSessionStore.getState();
    expect(state.staff?.id).toBe(OTHER_CASHIER.id);
    expect(state.session?.staffId).toBe(OTHER_CASHIER.id);
    expect(state.account?.staffId).toBe(OTHER_CASHIER.id);
    expect(state.register).not.toBeNull();
  });

  it('refuses an unknown PIN, another branch and a disabled member', async () => {
    await signInCashier();

    expect(useSessionStore.getState().unlock('0000')).toEqual({ ok: false, reason: 'unknown_pin' });
    expect(useSessionStore.getState().unlock(ELSEWHERE.pin)).toEqual({ ok: false, reason: 'not_here' });

    useOrgStore.getState().setStaffActive(OTHER_CASHIER.id, false);
    expect(useSessionStore.getState().unlock(OTHER_CASHIER.pin)).toEqual({ ok: false, reason: 'disabled' });
    expect(useSessionStore.getState().session?.lockedAt).toBeInstanceOf(Date);
  });

  it('honours a PIN reset made on the staff screen', async () => {
    await signInCashier();
    useOrgStore.getState().resetStaffPin(CASHIER.id, '4321');

    expect(useSessionStore.getState().unlock(CASHIER.pin)).toEqual({ ok: false, reason: 'unknown_pin' });
    expect(useSessionStore.getState().unlock('4321')).toMatchObject({ ok: true });
  });
});

describe('logout', () => {
  it('leaves nothing of the session behind', async () => {
    await login(OWNER_EMAIL, DEMO_PASSWORD);
    useSessionStore.getState().selectStore(STORE.id);
    useSessionStore.getState().logout();

    const state = useSessionStore.getState();
    expect(state.session).toBeNull();
    expect(state.account).toBeNull();
    expect(state.staff).toBeNull();
    expect(state.store).toBeNull();
    expect(state.register).toBeNull();
    expect(state.storeOptions).toEqual([]);
  });
});
