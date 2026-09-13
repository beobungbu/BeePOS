/** Where the sign-in flow goes next. One place, so every entry point agrees on the order. */
import { useSessionStore } from '../../data/session-store';

export type AuthRoute = '/change-password' | '/select-store' | '/select-register' | '/pos';

/**
 * The next screen after the password has been accepted: a forced password change first, then
 * the branch when the member works at several, then the till when the branch has more than one.
 *
 * A shop with a single till has nothing to ask, so that one register is bound here and the
 * cashier lands on the sell screen: the session still carries a register, which is what the
 * shift and the receipt name.
 */
export function resumeRoute(mustChangePassword = false): AuthRoute {
  if (mustChangePassword) return '/change-password';

  const { store, storeOptions, register, registerOptions, selectRegister } =
    useSessionStore.getState();

  if (!store) return storeOptions.length > 1 ? '/select-store' : '/pos';
  if (!register) {
    if (registerOptions.length > 1) return '/select-register';
    if (registerOptions.length === 1) selectRegister(registerOptions[0].id);
  }
  return '/pos';
}
