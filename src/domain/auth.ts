/**
 * Authentication domain: password hashing, session lifetime and the role/permission matrix.
 *
 * Hashing is SHA-256 over `salt:password`, stretched by 10 000 further digests. The first
 * digest goes through `expo-crypto`'s `digestStringAsync` when the module is there (native
 * implementation on device, WebCrypto on web); the stretching loop is the pure TypeScript
 * SHA-256 below, because 10 000 round trips across the native bridge would cost seconds per
 * login. Both paths compute the same SHA-256, so a hash made on one platform verifies on any
 * other, and the Node scripts that precompute the seed hashes agree with the app.
 *
 * This is prototype-grade, not a substitute for a server: the hash lives on the device and an
 * attacker with the device has the whole chain's data anyway. What it does buy is that no
 * password is ever stored or logged in clear, which is the property the old shared PIN lacked.
 */
import type { Permission, RoleDefinition, Session, StaffRole } from './types';

/* -------------------------------------------------------------------------- */
/* SHA-256                                                                     */
/* -------------------------------------------------------------------------- */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

/** UTF-8 bytes of a string, without depending on `TextEncoder` (absent in some RN runtimes). */
function utf8Bytes(input: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < input.length; i += 1) {
    let code = input.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < input.length) {
      const next = input.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = ((code - 0xd800) << 10) + (next - 0xdc00) + 0x10000;
        i += 1;
      }
    }
    if (code < 0x80) out.push(code);
    else if (code < 0x800) out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    else if (code < 0x10000) {
      out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      out.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  return Uint8Array.from(out);
}

function rotr(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits));
}

/** SHA-256 of a UTF-8 string, lower-case hex. Same digest as `expo-crypto`, in pure TS. */
export function sha256Hex(input: string): string {
  const bytes = utf8Bytes(input);
  const bitLength = bytes.length * 8;
  // Message + 0x80 + zero padding to 56 mod 64 + 8 byte big-endian length.
  const paddedLength = (((bytes.length + 8) >> 6) + 1) << 6;
  const buffer = new Uint8Array(paddedLength);
  buffer.set(bytes);
  buffer[bytes.length] = 0x80;
  // Lengths above 2^32 bits cannot occur here (inputs are passwords and digests).
  buffer[paddedLength - 4] = (bitLength >>> 24) & 0xff;
  buffer[paddedLength - 3] = (bitLength >>> 16) & 0xff;
  buffer[paddedLength - 2] = (bitLength >>> 8) & 0xff;
  buffer[paddedLength - 1] = bitLength & 0xff;

  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const w = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i += 1) {
      const j = offset + i * 4;
      w[i] = (buffer[j] << 24) | (buffer[j + 1] << 16) | (buffer[j + 2] << 8) | buffer[j + 3];
    }
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, hh] = [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7]];

    for (let i = 0; i < 64; i += 1) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hh + s1 + ch + K[i] + w[i]) >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;
      hh = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h[0] = (h[0] + a) >>> 0;
    h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0;
    h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0;
    h[5] = (h[5] + f) >>> 0;
    h[6] = (h[6] + g) >>> 0;
    h[7] = (h[7] + hh) >>> 0;
  }

  let hex = '';
  for (let i = 0; i < 8; i += 1) hex += h[i].toString(16).padStart(8, '0');
  return hex;
}

interface CryptoModule {
  digestStringAsync(algorithm: string, data: string): Promise<string>;
  getRandomBytes?(count: number): Uint8Array;
}

let cryptoModule: CryptoModule | null | undefined;

/**
 * `expo-crypto` when the native/web module is present, `null` under the test runner and in
 * plain Node. Resolved once: a missing module is the expected state in those two, and a warn
 * per digest would drown the console.
 */
function nativeCrypto(): CryptoModule | null {
  if (cryptoModule !== undefined) return cryptoModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cryptoModule = require('expo-crypto') as CryptoModule;
    if (typeof cryptoModule?.digestStringAsync !== 'function') cryptoModule = null;
  } catch {
    cryptoModule = null;
  }
  return cryptoModule;
}

const HEX_DIGEST = /^[0-9a-f]{64}$/;

/**
 * SHA-256 through `expo-crypto` where available, otherwise the pure TS digest above.
 *
 * Anything that is not 64 hex characters falls back rather than being trusted: under the test
 * runner the native module is auto-mocked and answers with an empty string, and a hash built
 * on that would not verify against one built on a device.
 */
export async function digestHex(input: string): Promise<string> {
  const crypto = nativeCrypto();
  if (!crypto) return sha256Hex(input);
  try {
    const digest = (await crypto.digestStringAsync('SHA-256', input)).toLowerCase();
    return HEX_DIGEST.test(digest) ? digest : sha256Hex(input);
  } catch (error) {
    console.warn('[auth] expo-crypto digest failed, using the TS digest:', error);
    return sha256Hex(input);
  }
}

/* -------------------------------------------------------------------------- */
/* Passwords                                                                   */
/* -------------------------------------------------------------------------- */

/** Stretching rounds applied after the first digest. */
export const PASSWORD_ITERATIONS = 10_000;

/** Minimum length a password is accepted at. */
export const PASSWORD_MIN_LENGTH = 8;

function stretch(salt: string, firstDigest: string): string {
  let digest = firstDigest;
  for (let i = 0; i < PASSWORD_ITERATIONS; i += 1) digest = sha256Hex(`${salt}:${digest}`);
  return digest;
}

/** Salted, stretched password hash. Async so the platform digest can be used for round one. */
export async function hashPassword(password: string, salt: string): Promise<string> {
  return stretch(salt, await digestHex(`${salt}:${password}`));
}

/**
 * Same hash without awaiting, for the seed and for the script that precomputes its hashes.
 * Produces the identical value: the platform digest and the TS digest are both SHA-256.
 */
export function hashPasswordSync(password: string, salt: string): string {
  return stretch(salt, sha256Hex(`${salt}:${password}`));
}

/** Length-independent comparison, so a wrong password cannot be narrowed down by timing. */
export function hashesEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** True when `password` hashes to `expectedHash` under `salt`. */
export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  if (!expectedHash) return false;
  return hashesEqual(await hashPassword(password, salt), expectedHash);
}

/** Machine-readable validation outcome; the UI layer owns the localized copy per code. */
export type PasswordErrorCode = 'empty' | 'too_short' | 'no_letter' | 'no_digit' | 'mismatch';

export interface PasswordValidation {
  valid: boolean;
  errorCode?: PasswordErrorCode;
}

/** At least 8 characters with one letter and one digit. */
export function validatePassword(password: string): PasswordValidation {
  if (password.length === 0) return { valid: false, errorCode: 'empty' };
  if (password.length < PASSWORD_MIN_LENGTH) return { valid: false, errorCode: 'too_short' };
  if (!/[a-zA-Z]/.test(password)) return { valid: false, errorCode: 'no_letter' };
  if (!/\d/.test(password)) return { valid: false, errorCode: 'no_digit' };
  return { valid: true };
}

/** Both entered passwords valid and equal. */
export function passwordsMatch(password: string, confirm: string): PasswordValidation {
  const base = validatePassword(password);
  if (!base.valid) return base;
  if (password !== confirm) return { valid: false, errorCode: 'mismatch' };
  return { valid: true };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lower-cased and trimmed; accounts are looked up by this form only. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(normalizeEmail(email));
}

function randomHex(bytes: number): string {
  const crypto = nativeCrypto();
  if (crypto?.getRandomBytes) {
    try {
      return Array.from(crypto.getRandomBytes(bytes))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      // Falls through to the Math.random path below.
    }
  }
  let out = '';
  for (let i = 0; i < bytes; i += 1) {
    out += Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0');
  }
  return out;
}

/** 16 byte salt, hex. Device randomness when `expo-crypto` is there, `Math.random` otherwise. */
export function createSalt(): string {
  return randomHex(16);
}

/** The mock "sent to your email" code of the prototype's forgot-password flow. */
export function generateResetCode(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
}

/**
 * A 4 digit PIN no one in `taken` already uses. PINs are unique per org, which is what lets
 * the lock screen identify a cashier from the PIN alone.
 */
export function nextAvailablePin(taken: readonly string[]): string {
  const used = new Set(taken);
  for (let attempt = 0; attempt < 10_000; attempt += 1) {
    const pin = String(Math.floor(Math.random() * 10_000)).padStart(4, '0');
    if (!used.has(pin)) return pin;
  }
  // Every PIN is taken (10 000 staff in one chain): the caller gets a deterministic sweep.
  for (let value = 0; value < 10_000; value += 1) {
    const pin = String(value).padStart(4, '0');
    if (!used.has(pin)) return pin;
  }
  throw new Error('Không còn mã PIN 4 chữ số nào chưa dùng');
}

/* -------------------------------------------------------------------------- */
/* Sessions                                                                    */
/* -------------------------------------------------------------------------- */

/** A session is good for one working day; a longer one outlives the shift that opened it. */
export const SESSION_TTL_MINUTES = 12 * 60;

/** Minutes of inactivity before the till locks itself. `0` turns the auto-lock off. */
export const AUTO_LOCK_OPTIONS = [0, 1, 5, 15, 30] as const;
export const DEFAULT_AUTO_LOCK_MINUTES = 15;

export interface IssueSessionInput {
  orgId: string;
  userId: string;
  staffId: string;
  storeId?: string;
  registerId?: string;
  now?: Date;
  ttlMinutes?: number;
}

export function issueSession(input: IssueSessionInput): Session {
  const now = input.now ?? new Date();
  const ttl = input.ttlMinutes ?? SESSION_TTL_MINUTES;
  return {
    token: `sess_${randomHex(12)}`,
    orgId: input.orgId,
    userId: input.userId,
    staffId: input.staffId,
    storeId: input.storeId,
    registerId: input.registerId,
    issuedAt: now,
    expiresAt: new Date(now.getTime() + ttl * 60_000),
  };
}

export function isSessionExpired(session: Session | null, now: Date = new Date()): boolean {
  if (!session) return true;
  return session.expiresAt.getTime() <= now.getTime();
}

export function isSessionLocked(session: Session | null): boolean {
  return Boolean(session?.lockedAt);
}

export function lockSession(session: Session, now: Date = new Date()): Session {
  return { ...session, lockedAt: now };
}

/**
 * Clears the lock and gives the session a fresh full lifetime: the cashier just proved who
 * they are with a PIN, so making them sign in again minutes later would be theatre.
 */
export function unlockSession(
  session: Session,
  now: Date = new Date(),
  ttlMinutes: number = SESSION_TTL_MINUTES,
): Session {
  const { lockedAt: _lockedAt, ...rest } = session;
  return { ...rest, expiresAt: new Date(now.getTime() + ttlMinutes * 60_000) };
}

/** Whether an idle till should lock now. `minutes <= 0` means the auto-lock is off. */
export function shouldAutoLock(
  lastActivityAt: number,
  minutes: number,
  now: number = Date.now(),
): boolean {
  if (minutes <= 0) return false;
  return now - lastActivityAt >= minutes * 60_000;
}

/* -------------------------------------------------------------------------- */
/* Permissions                                                                 */
/* -------------------------------------------------------------------------- */

const OWNER_PERMISSIONS: Permission[] = [
  'pos.sell',
  'pos.refund',
  'pos.discount',
  'pos.void',
  'orders.view',
  'catalog.manage',
  'inventory.manage',
  'inventory.transfer',
  'customers.manage',
  'reports.store',
  'reports.chain',
  'stores.manage',
  'staff.manage',
  'settings.manage',
  'audit.view',
  'cash.movement',
];

/**
 * The default matrix. A manager runs one branch: everything operational plus their own
 * branch's reports and staff, but no chain-wide figures (`reports.chain`), no branch creation
 * (`stores.manage`) and no system settings (`settings.manage`), all three of which belong to
 * the chain rather than to a shop. A cashier sells and looks after customers, and needs a
 * manager for a refund, a void, the catalogue or stock.
 *
 * `label` is the Vietnamese role name; the permissions screen localizes through the
 * dictionary and uses this only as its fallback.
 */
export const ROLE_DEFINITIONS: RoleDefinition[] = [
  { role: 'owner', label: 'Chủ chuỗi', permissions: OWNER_PERMISSIONS },
  {
    role: 'manager',
    label: 'Quản lý',
    permissions: [
      'pos.sell',
      'pos.refund',
      'pos.discount',
      'pos.void',
      'orders.view',
      'catalog.manage',
      'inventory.manage',
      'inventory.transfer',
      'customers.manage',
      'reports.store',
      'staff.manage',
      'audit.view',
      'cash.movement',
    ],
  },
  {
    role: 'cashier',
    label: 'Thu ngân',
    permissions: ['pos.sell', 'pos.discount', 'orders.view', 'customers.manage', 'cash.movement'],
  },
];

/** Every permission in the order the matrix screen lists them. */
export const ALL_PERMISSIONS: Permission[] = OWNER_PERMISSIONS;

const PERMISSIONS_BY_ROLE: Record<StaffRole, ReadonlySet<Permission>> = {
  owner: new Set(ROLE_DEFINITIONS[0].permissions),
  manager: new Set(ROLE_DEFINITIONS[1].permissions),
  cashier: new Set(ROLE_DEFINITIONS[2].permissions),
};

export function permissionsForRole(role: StaffRole): Permission[] {
  return ROLE_DEFINITIONS.find((definition) => definition.role === role)?.permissions ?? [];
}

/** The one authority on "may this role do that". Screens never test the role directly. */
export function can(role: StaffRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return PERMISSIONS_BY_ROLE[role].has(permission);
}
