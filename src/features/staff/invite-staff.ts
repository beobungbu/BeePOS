/**
 * Turns an invite into the two records a new member needs: the roster entry the till works
 * with, and the account they will sign in with. Kept out of the screen so the list, the detail
 * screen and the tests all create members the same way.
 */
import { createSalt, hashPassword, nextAvailablePin, normalizeEmail } from '../../domain/auth';
import type { Staff, UserAccount } from '../../domain/types';
import type { StaffInvite } from './components/invite-staff-dialog';

export interface InvitedMember {
  staff: Staff;
  account: UserAccount;
  /** The temporary password, shown once in the invite toast; never stored in clear. */
  temporaryPassword: string;
}

/** A readable one-off password, long enough to pass the policy the change screen enforces. */
export function temporaryPassword(): string {
  return `Bee${String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')}`;
}

export async function buildInvitedMember(
  invite: StaffInvite,
  orgId: string,
  takenPins: readonly string[],
  now: Date = new Date(),
): Promise<InvitedMember> {
  const staffId = `staff-${now.getTime()}`;
  const salt = createSalt();
  const password = temporaryPassword();

  return {
    staff: {
      id: staffId,
      orgId,
      name: invite.name,
      role: invite.role,
      storeIds: invite.storeIds,
      // PINs are unique per chain, so the lock screen can name a cashier from the PIN alone.
      pin: nextAvailablePin(takenPins),
    },
    account: {
      id: `account-${staffId}`,
      orgId,
      email: normalizeEmail(invite.email),
      passwordHash: await hashPassword(password, salt),
      salt,
      staffId,
      status: 'invited',
      // The invite hands out a one-off password, so the first sign-in has to replace it.
      mustChangePassword: true,
      createdAt: now,
    },
    temporaryPassword: password,
  };
}
