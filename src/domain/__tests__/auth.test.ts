import {
  ALL_PERMISSIONS,
  PASSWORD_ITERATIONS,
  ROLE_DEFINITIONS,
  can,
  createSalt,
  generateResetCode,
  hashPassword,
  hashPasswordSync,
  hashesEqual,
  isSessionExpired,
  isSessionLocked,
  issueSession,
  isValidEmail,
  lockSession,
  nextAvailablePin,
  normalizeEmail,
  passwordsMatch,
  sha256Hex,
  shouldAutoLock,
  unlockSession,
  validatePassword,
  verifyPassword,
} from '../auth';
import { accounts, DEMO_PASSWORD, seedSalt } from '../../data/seed';

describe('sha256Hex', () => {
  // The published vectors: the stretching loop, the seed hashes and any hash written on one
  // platform and checked on another all rest on this being real SHA-256.
  it('matches the published vectors', () => {
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    expect(sha256Hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  it('hashes multi-byte text and long input', () => {
    // Both values come from Node's own `crypto.createHash('sha256')`, so the TS digest is
    // checked against a reference implementation and not only against itself.
    expect(sha256Hex('Tạp hoá Cầu Giấy')).toBe(
      '961ea35119d59a34ffcde921ce4c9ced80f674c05141836b8e119027370762a7',
    );
    expect(sha256Hex('a'.repeat(1000))).toBe(
      '41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3',
    );
  });
});

describe('password hashing', () => {
  it('is deterministic for one salt and different across salts', async () => {
    const first = await hashPassword('BeePOS@2026', 'salt-a');
    expect(first).toBe(hashPasswordSync('BeePOS@2026', 'salt-a'));
    expect(first).not.toBe(hashPasswordSync('BeePOS@2026', 'salt-b'));
    expect(first).toHaveLength(64);
  });

  it('verifies the right password and rejects a wrong one', async () => {
    const salt = createSalt();
    const hash = await hashPassword('BeePOS@2026', salt);
    await expect(verifyPassword('BeePOS@2026', salt, hash)).resolves.toBe(true);
    await expect(verifyPassword('BeePOS@2027', salt, hash)).resolves.toBe(false);
    await expect(verifyPassword('BeePOS@2026', createSalt(), hash)).resolves.toBe(false);
    await expect(verifyPassword('BeePOS@2026', salt, '')).resolves.toBe(false);
  });

  it('stretches the digest rather than hashing once', () => {
    expect(PASSWORD_ITERATIONS).toBe(10_000);
    expect(hashPasswordSync('x', 'salt')).not.toBe(sha256Hex('salt:x'));
  });

  // The seed hashes are constants so a cold boot does not pay for twelve stretched hashes;
  // this is what stops them drifting away from the hashing code that has to verify them.
  it('still matches the precomputed seed hashes', async () => {
    const owner = accounts.find((account) => account.email === 'owner@chuoi.vn');
    if (!owner) throw new Error('the seed lost its owner account');
    expect(owner.salt).toBe(seedSalt(owner.staffId));
    await expect(verifyPassword(DEMO_PASSWORD, owner.salt, owner.passwordHash)).resolves.toBe(true);

    for (const account of accounts) {
      expect(account.passwordHash).toHaveLength(64);
      expect(account.salt).toBe(seedSalt(account.staffId));
    }
  });

  it('compares hashes without leaking their length', () => {
    expect(hashesEqual('abc', 'abc')).toBe(true);
    expect(hashesEqual('abc', 'abd')).toBe(false);
    expect(hashesEqual('abc', 'ab')).toBe(false);
  });
});

describe('validatePassword', () => {
  it.each([
    ['', 'empty'],
    ['Bee1', 'too_short'],
    ['12345678', 'no_letter'],
    ['beeposbee', 'no_digit'],
  ])('rejects %s', (password, code) => {
    expect(validatePassword(password)).toEqual({ valid: false, errorCode: code });
  });

  it('accepts the demo password', () => {
    expect(validatePassword(DEMO_PASSWORD)).toEqual({ valid: true });
  });

  it('reports a mismatch only once both are valid', () => {
    expect(passwordsMatch('BeePOS@2026', 'BeePOS@2026')).toEqual({ valid: true });
    expect(passwordsMatch('BeePOS@2026', 'BeePOS@2027')).toEqual({ valid: false, errorCode: 'mismatch' });
    expect(passwordsMatch('short', 'short')).toEqual({ valid: false, errorCode: 'too_short' });
  });
});

describe('email helpers', () => {
  it('normalizes case and whitespace', () => {
    expect(normalizeEmail('  Owner@Chuoi.VN ')).toBe('owner@chuoi.vn');
  });

  it.each(['owner@chuoi.vn', 'a.b@c.co'])('accepts %s', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each(['owner', 'owner@', 'owner@chuoi', 'a b@c.vn'])('rejects %s', (email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});

describe('sessions', () => {
  const NOW = new Date('2026-09-13T08:00:00.000Z');
  const base = { orgId: 'org-1', userId: 'account-1', staffId: 'staff-1' };

  it('issues a session with a token and a lifetime', () => {
    const session = issueSession({ ...base, storeId: 'store-1', now: NOW, ttlMinutes: 60 });
    expect(session.token).toMatch(/^sess_/);
    expect(session.issuedAt).toEqual(NOW);
    expect(session.expiresAt.getTime() - NOW.getTime()).toBe(3_600_000);
    expect(session.lockedAt).toBeUndefined();
  });

  it('expires exactly at its expiry', () => {
    const session = issueSession({ ...base, now: NOW, ttlMinutes: 60 });
    expect(isSessionExpired(session, new Date(NOW.getTime() + 59 * 60_000))).toBe(false);
    expect(isSessionExpired(session, session.expiresAt)).toBe(true);
    expect(isSessionExpired(null)).toBe(true);
  });

  it('locks and unlocks, and an unlock renews the lifetime', () => {
    const session = issueSession({ ...base, now: NOW, ttlMinutes: 60 });
    const locked = lockSession(session, new Date(NOW.getTime() + 10 * 60_000));
    expect(isSessionLocked(locked)).toBe(true);

    const later = new Date(NOW.getTime() + 30 * 60_000);
    const unlocked = unlockSession(locked, later, 60);
    expect(isSessionLocked(unlocked)).toBe(false);
    expect(unlocked.expiresAt.getTime() - later.getTime()).toBe(3_600_000);
  });

  it('auto-locks only after the idle window, and never when turned off', () => {
    const last = NOW.getTime();
    expect(shouldAutoLock(last, 15, last + 14 * 60_000)).toBe(false);
    expect(shouldAutoLock(last, 15, last + 15 * 60_000)).toBe(true);
    expect(shouldAutoLock(last, 0, last + 24 * 3_600_000)).toBe(false);
  });
});

describe('permissions', () => {
  it('gives the owner every permission', () => {
    for (const permission of ALL_PERMISSIONS) expect(can('owner', permission)).toBe(true);
  });

  it('keeps chain reports, branches and settings to the owner', () => {
    expect(can('manager', 'reports.chain')).toBe(false);
    expect(can('manager', 'stores.manage')).toBe(false);
    expect(can('manager', 'settings.manage')).toBe(false);
    expect(can('manager', 'reports.store')).toBe(true);
    expect(can('manager', 'staff.manage')).toBe(true);
  });

  it('keeps reports, staff and settings away from a cashier', () => {
    expect(can('cashier', 'reports.store')).toBe(false);
    expect(can('cashier', 'staff.manage')).toBe(false);
    expect(can('cashier', 'settings.manage')).toBe(false);
    expect(can('cashier', 'pos.refund')).toBe(false);
    expect(can('cashier', 'pos.sell')).toBe(true);
  });

  it('refuses everything without a role', () => {
    expect(can(null, 'pos.sell')).toBe(false);
    expect(can(undefined, 'orders.view')).toBe(false);
  });

  it('defines every role once and lists no unknown permission', () => {
    expect(ROLE_DEFINITIONS.map((definition) => definition.role)).toEqual([
      'owner',
      'manager',
      'cashier',
    ]);
    for (const definition of ROLE_DEFINITIONS) {
      for (const permission of definition.permissions) {
        expect(ALL_PERMISSIONS).toContain(permission);
      }
    }
  });
});

describe('pins and reset codes', () => {
  it('never returns a PIN already in use', () => {
    const taken = Array.from({ length: 200 }, (_, index) => String(index).padStart(4, '0'));
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const pin = nextAvailablePin(taken);
      expect(pin).toMatch(/^\d{4}$/);
      expect(taken).not.toContain(pin);
    }
  });

  it('falls back to a sweep when random draws keep colliding', () => {
    const taken = Array.from({ length: 9_999 }, (_, index) => String(index).padStart(4, '0'));
    expect(nextAvailablePin(taken)).toBe('9999');
  });

  it('generates a 6 digit reset code', () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      expect(generateResetCode()).toMatch(/^\d{6}$/);
    }
  });
});
