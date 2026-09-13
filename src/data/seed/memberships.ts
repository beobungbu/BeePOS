/**
 * Which chains the seeded accounts belong to.
 *
 * The owner is a member of two: the demo chain and a second, one-shop chain. That second
 * membership is the whole point of this file, because an org switch that only ever has one
 * destination is not a switch. Persistence keys are namespaced by chain
 * (`persistence-bootstrap.ts`), so switching to `chuoi-demo-2` starts from empty storage and
 * switching back finds the demo chain exactly as it was left.
 */

import type { OrgMembership, OrgSummary } from '../../domain/types';
import { DEMO_ORG_ID, organization } from './org';
import { accounts } from './accounts';
import { staff } from './staff';
import { stores } from './stores';

/** The second chain the owner also runs. */
export const SECOND_ORG_ID = 'chuoi-demo-2';

/** The staff record the owner holds inside the second chain. */
export const SECOND_ORG_STAFF_ID = 'staff-d2-1';

export const orgDirectory: OrgSummary[] = [
  {
    id: DEMO_ORG_ID,
    code: organization.code,
    name: organization.name,
    storeCount: stores.length,
  },
  {
    id: SECOND_ORG_ID,
    code: 'chuoi-demo-2',
    name: 'Chuỗi Minh Châu',
    storeCount: 1,
  },
];

function accountIdFor(staffId: string): string {
  return accounts.find((account) => account.staffId === staffId)?.id ?? `account-${staffId}`;
}

/**
 * One membership per seeded staff member in the demo chain, plus the owner's second one.
 * A membership is keyed by the sign-in account, not by the staff record, because the staff
 * record is what differs between the two chains.
 */
export const memberships: OrgMembership[] = [
  ...staff.map((member) => ({
    userId: accountIdFor(member.id),
    orgId: DEMO_ORG_ID,
    staffId: member.id,
  })),
  {
    userId: accountIdFor('staff-1'),
    orgId: SECOND_ORG_ID,
    staffId: SECOND_ORG_STAFF_ID,
  },
];

/** The chains one account may switch between, in directory order. */
export function orgsForUser(userId: string): OrgSummary[] {
  const orgIds = new Set(
    memberships.filter((membership) => membership.userId === userId).map((membership) => membership.orgId),
  );
  return orgDirectory.filter((org) => orgIds.has(org.id));
}
