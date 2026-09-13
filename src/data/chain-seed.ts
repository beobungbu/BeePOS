/**
 * What a chain starts with when it has no stored data yet.
 *
 * The demo chain starts with the seeded shop: a catalogue, stock, orders and customers, which
 * is what makes the prototype demonstrable. Any other chain, whether created through
 * onboarding or switched to from the avatar menu, starts with **nothing to sell**: it used to
 * inherit the demo catalogue at zero stock, so every tile read "Hết hàng" and no sale could be
 * rung up anywhere in it, which is neither a demo nor a real shop
 * (`reports/w-n-native-report.md`, section 5).
 *
 * Kept beside `org-store.seedForActiveOrg()` in shape: a function, not a constant, because on
 * native the active chain is only known after `loadActiveOrgId()`, and the persistence
 * bootstrap re-applies these before it registers a single slice.
 */

import { activeOrgId } from './active-org';
import { DEMO_ORG_ID } from './seed/org';

/** True while the app is addressing the chain the seed data belongs to. */
export function isDemoChain(): boolean {
  return activeOrgId() === DEMO_ORG_ID;
}
