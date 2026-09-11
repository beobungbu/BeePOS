import { Redirect, Slot } from 'expo-router';
import { useSessionStore } from '../../src/data/session-store';
import { AppShell } from '../../src/components/shell/app-shell';

export default function AppAreaLayout() {
  const staff = useSessionStore((state) => state.staff);
  if (!staff) return <Redirect href="/login" />;

  return (
    <AppShell>
      <Slot />
    </AppShell>
  );
}
