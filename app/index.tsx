import { Redirect } from 'expo-router';
import { useOrgStore } from '../src/data/org-store';
import { isLocked, isSignedOut, useSessionStore } from '../src/data/session-store';

/**
 * Entry: no chain yet means the onboarding wizard, no (or expired) session means the login
 * form, a locked session means the PIN pad, and anything else opens on the sell screen.
 */
export default function Index() {
  const organization = useOrgStore((state) => state.organization);
  const session = useSessionStore((state) => state.session);

  if (!organization) return <Redirect href="/onboarding" />;
  if (isSignedOut(session)) return <Redirect href="/login" />;
  if (isLocked(session)) return <Redirect href="/lock" />;
  return <Redirect href="/pos" />;
}
