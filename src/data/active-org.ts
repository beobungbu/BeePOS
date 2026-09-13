/**
 * Which chain this device is signed into.
 *
 * Kept in its own tiny module, with no store imports, because three places need it before any
 * store exists: the persistence keys (`beepos.persist.<orgId>.<slice>`), the org store's seed
 * (which chain's shops, staff and credentials it starts from) and the login path (which staff
 * record an account holds inside the active chain).
 *
 * The value is resolved once per launch and then fixed: reading it later would leave half the
 * app addressing one chain's keys and half the other's. Web resolves it at import, because
 * `localStorage` answers synchronously, and the switcher reloads the page
 * (`src/features/settings/lib/org-switch.ts`). Native storage has no synchronous read, so
 * there the value is resolved by `loadActiveOrgId()`, which the persistence bootstrap awaits
 * before it derives a single key or seed from it; until then the demo chain is the answer.
 */

import { getPlatformStorage } from './persist';
import { DEMO_ORG_ID } from './seed/org';

export const ACTIVE_ORG_KEY = 'beepos.persist.active-org';

function readSync(): string {
  try {
    return getPlatformStorage().getItemSync?.(ACTIVE_ORG_KEY) || DEMO_ORG_ID;
  } catch {
    return DEMO_ORG_ID;
  }
}

let scope = readSync();
/** True once the stored value has actually been seen; only a synchronous storage is sure at import. */
let resolved = Boolean(getPlatformStorage().getItemSync);

/** The chain whose data this process addresses. Fixed for the life of the process. */
export function activeOrgId(): string {
  return scope;
}

/**
 * Native: reads the stored chain before anything is derived from it. Idempotent, and a no-op
 * on web, where the value was already read at import.
 */
export async function loadActiveOrgId(): Promise<string> {
  if (resolved) return scope;
  try {
    scope = (await getPlatformStorage().getItem(ACTIVE_ORG_KEY)) || DEMO_ORG_ID;
  } catch (error) {
    // A chain that cannot be read is the demo chain: the app still boots, on seed data.
    console.warn('[persist] could not read the active chain:', error);
  }
  resolved = true;
  return scope;
}

/**
 * Points the next launch at `orgId`. The caller reloads the app, which re-reads the value.
 *
 * Awaited, not fired and forgotten: on native the write goes to AsyncStorage, and the app is
 * about to drop the session and send the cashier back to the sign-in flow. A kill inside that
 * window used to lose the switch and bring the till back up in the chain it had just left.
 * The synchronous web write happens first, so web is unchanged in practice.
 */
export async function setActiveOrgId(orgId: string): Promise<void> {
  const storage = getPlatformStorage();
  storage.setItemSync?.(ACTIVE_ORG_KEY, orgId);
  await storage.setItem(ACTIVE_ORG_KEY, orgId);
}
