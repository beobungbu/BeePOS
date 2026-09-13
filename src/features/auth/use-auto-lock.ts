/**
 * Drives the two things that can end a session while the app is open: the idle auto-lock and
 * the session expiry. Mounted once by the app-area layout, because that is the only tree both
 * apply to; the auth screens are what they send the cashier back to.
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { isSessionExpired, shouldAutoLock } from '../../domain/auth';
import { useSessionStore } from '../../data/session-store';

/** How often the idle check runs. A minute of slack on a 15 minute lock is not worth a timer. */
const TICK_MS = 15_000;

export function useAutoLock(): void {
  const session = useSessionStore((state) => state.session);
  const autoLockMinutes = useSessionStore((state) => state.autoLockMinutes);

  // Interaction anywhere in the app postpones the lock. Web listens on the document because
  // the shell has no single pressable wrapper; native leans on the interval alone, where the
  // OS screen lock is the real backstop.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const touch = () => useSessionStore.getState().touch();
    document.addEventListener('pointerdown', touch, { passive: true });
    document.addEventListener('keydown', touch, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', touch);
      document.removeEventListener('keydown', touch);
    };
  }, []);

  useEffect(() => {
    if (!session || session.lockedAt) return;
    const timer = setInterval(() => {
      const state = useSessionStore.getState();
      if (!state.session || state.session.lockedAt) return;
      if (isSessionExpired(state.session)) {
        state.logout();
        return;
      }
      if (shouldAutoLock(state.lastActivityAt, state.autoLockMinutes)) state.lock();
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [session, autoLockMinutes]);
}
