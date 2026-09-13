import { Redirect, Slot, usePathname } from 'expo-router';
import { can } from '../../src/domain/auth';
import { isLocked, isSignedOut, useSessionStore } from '../../src/data/session-store';
import { useAutoLock } from '../../src/features/auth/use-auto-lock';
import { AppShell } from '../../src/components/shell/app-shell';
import { permissionForPath } from '../../src/components/shell/nav-items';

/**
 * The app area's gate, in the order the states rank: no session (or an expired one) means the
 * login form, a locked session means the PIN pad, and a role without the area's permission is
 * sent to the sell screen rather than shown an empty page. The nav lists are filtered by the
 * same permission, so this only catches a typed URL or a stale deep link.
 */
export default function AppAreaLayout() {
  const session = useSessionStore((state) => state.session);
  const staff = useSessionStore((state) => state.staff);
  const pathname = usePathname();
  useAutoLock();

  if (isSignedOut(session) || !staff) return <Redirect href="/login" />;
  if (isLocked(session)) return <Redirect href="/lock" />;

  const required = permissionForPath(pathname);
  if (required && !can(staff.role, required)) return <Redirect href="/pos" />;

  return (
    <AppShell>
      <Slot />
    </AppShell>
  );
}
