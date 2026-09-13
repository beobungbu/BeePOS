/**
 * The prototype's stand-in for "we sent you a code". No email leaves the device: the code is
 * generated here, shown in a toast, and matched from this module's memory. It is deliberately
 * not persisted, so a reload ends the reset attempt rather than leaving a live code behind.
 */
import { generateResetCode, normalizeEmail } from '../../domain/auth';

/** A code is good for ten minutes, the same order of magnitude a real one would be. */
export const RESET_CODE_TTL_MS = 10 * 60_000;

interface PendingReset {
  code: string;
  expiresAt: number;
}

const pending = new Map<string, PendingReset>();

/** Issues (or replaces) the code for an email and returns it for the toast to show. */
export function issueResetCode(email: string, now: number = Date.now()): string {
  const code = generateResetCode();
  pending.set(normalizeEmail(email), { code, expiresAt: now + RESET_CODE_TTL_MS });
  return code;
}

/** True when `code` is the live code for `email`. A used or expired code is dropped. */
export function consumeResetCode(email: string, code: string, now: number = Date.now()): boolean {
  const key = normalizeEmail(email);
  const entry = pending.get(key);
  if (!entry) return false;
  if (entry.expiresAt <= now) {
    pending.delete(key);
    return false;
  }
  if (entry.code !== code.trim()) return false;
  pending.delete(key);
  return true;
}

/** Test hook: forgets every outstanding code. */
export function clearResetCodes(): void {
  pending.clear();
}
