/**
 * Switching the chain the app is signed into.
 *
 * The chain is identity, the branch is working context (`docs/design/specs/commerce.md`
 * section G), so the switcher lives in the avatar menu and not in the store chip. What it
 * actually does is re-point the persisted keys: every data slice is stored under
 * `beepos.persist.<orgId>.<slice>`, and those keys are resolved once, at import time. The
 * scope is written, the session is dropped, and the app reloads into the other chain.
 *
 * Dropping the session is not a shortcut. The session slice is itself chain-scoped, so the
 * chain being switched to has no session to come back to; leaving the old one in memory would
 * mean a till signed into one chain writing orders into another's storage.
 */

import { Platform } from 'react-native';
import { useOrgSettingsStore, orgsForMember } from '../../../data/org-settings-store';
import { setActiveOrgId } from '../../../data/active-org';
import { useSessionStore } from '../../../data/session-store';
import { useCartStore } from '../../../data/cart-store';
import type { OrgSummary } from '../../../domain/types';

/** The chains the signed-in account may switch between, in directory order. */
export function useAccountOrgs(): OrgSummary[] {
  const memberships = useOrgSettingsStore((state) => state.memberships);
  const directory = useOrgSettingsStore((state) => state.orgDirectory);
  const accountId = useSessionStore((state) => state.account?.id);
  if (!accountId) return [];
  return orgsForMember(memberships, directory, accountId);
}

/** Parked orders at the branch being left, so the switch can warn before it drops them. */
export function openCartCount(): number {
  return useCartStore.getState().carts.length;
}

/**
 * Re-points the storage scope at `orgId` and takes the app back to the sign-in flow, where
 * the branch of the other chain is chosen. On web the reload is what makes the new keys take
 * effect; native picks them up on its next launch, which the caller tells the user.
 *
 * Resolves only once the new scope is on disk, so the caller can navigate afterwards knowing
 * the switch has actually been recorded. `setActiveOrgId` swallows a storage failure (the app
 * keeps running on the chain it is on), so this never rejects.
 */
export async function switchOrg(orgId: string): Promise<void> {
  await setActiveOrgId(orgId);
  useSessionStore.getState().logout();
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.replace('/login');
  }
}
