/**
 * Which chain this device is signed into.
 *
 * Kept in its own tiny module, with no store imports, because three places need it before any
 * store exists: the persistence keys (`beepos.persist.<orgId>.<slice>`), the org store's seed
 * (which chain's shops, staff and credentials it starts from) and the login path (which staff
 * record an account holds inside the active chain).
 *
 * The value is read once, at import time, and the switcher reloads the app after writing it
 * (`src/features/settings/lib/org-switch.ts`). Reading it later would leave half the app
 * addressing one chain's keys and half the other's.
 */

import { getPlatformStorage } from './persist';
import { DEMO_ORG_ID } from './seed/org';

export const ACTIVE_ORG_KEY = 'beepos.persist.active-org';

function read(): string {
  try {
    return getPlatformStorage().getItemSync?.(ACTIVE_ORG_KEY) || DEMO_ORG_ID;
  } catch {
    return DEMO_ORG_ID;
  }
}

const SCOPE = read();

/** The chain whose data this process addresses. Fixed for the life of the process. */
export function activeOrgId(): string {
  return SCOPE;
}

/** Points the next launch at `orgId`. The caller reloads the app, which re-reads the value. */
export function setActiveOrgId(orgId: string): void {
  const storage = getPlatformStorage();
  storage.setItemSync?.(ACTIVE_ORG_KEY, orgId);
  void storage.setItem(ACTIVE_ORG_KEY, orgId);
}
