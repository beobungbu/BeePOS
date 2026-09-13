/**
 * The second chain the owner also runs, so the org switch has somewhere to land.
 *
 * One shop, one staff record, one till. The sign-in identity is deliberately the *same*
 * account row as in the demo chain (same id, same email, same credential): a person has one
 * login, and which staff record that login works as is what `OrgMembership` answers. That is
 * why `session-store.login` resolves the member through the membership for the active chain
 * rather than off `account.staffId`, which can only ever name one of the two.
 *
 * The chain's data slices are keyed by org (`src/data/active-org.ts`), so switching here
 * starts from this seed and switching back finds the demo chain as it was left.
 */

import type { Organization, Register, Staff, Store, UserAccount } from '../../domain/types';
import { accounts } from './accounts';

export const SECOND_ORG_ID = 'chuoi-demo-2';

/** The staff record the owner holds inside the second chain. */
export const SECOND_ORG_STAFF_ID = 'staff-d2-1';

export const SECOND_ORG_STORE_ID = 'store-d2-1';

export const secondOrganization: Organization = {
  id: SECOND_ORG_ID,
  code: 'chuoi-demo-2',
  name: 'Chuỗi Minh Châu',
  plan: 'free',
  currency: 'VND',
  taxCode: '0313996402',
  taxRate: 0.08,
  receiptHeader: 'Minh Châu',
  receiptFooter: 'Cảm ơn quý khách',
  createdAt: new Date('2026-06-01T00:00:00.000Z'),
};

export const secondOrgStores: Store[] = [
  {
    id: SECOND_ORG_STORE_ID,
    orgId: SECOND_ORG_ID,
    code: 'MC01',
    name: 'Minh Châu Quận 7',
    address: '236 Nguyễn Thị Thập, Quận 7, TP.HCM',
    phone: '028 3771 8890',
    isActive: true,
  },
];

export const secondOrgStaff: Staff[] = [
  {
    id: SECOND_ORG_STAFF_ID,
    orgId: SECOND_ORG_ID,
    name: 'Nguyễn Văn An',
    role: 'owner',
    storeIds: [SECOND_ORG_STORE_ID],
    // Unique across both chains: the lock screen names the cashier from the PIN alone.
    pin: '1200',
  },
];

export const secondOrgRegisters: Register[] = [
  {
    id: `${SECOND_ORG_STORE_ID}-reg-1`,
    orgId: SECOND_ORG_ID,
    storeId: SECOND_ORG_STORE_ID,
    code: 'Q1',
    name: 'Quầy 1',
    isActive: true,
  },
];

const OWNER_ACCOUNT_ID = 'account-staff-1';

/**
 * The owner's one credential, re-stamped for this chain. Id, email, salt and hash are the
 * demo chain's, so the same password signs in on both sides and a password changed in one
 * chain is not silently a different password in the other.
 */
export const secondOrgAccounts: UserAccount[] = (() => {
  const owner = accounts.find((account) => account.id === OWNER_ACCOUNT_ID);
  if (!owner) return [];
  return [{ ...owner, orgId: SECOND_ORG_ID, staffId: SECOND_ORG_STAFF_ID }];
})();
