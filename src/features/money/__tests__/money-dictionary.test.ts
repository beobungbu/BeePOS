import { moneyEn } from '../../../i18n/money.en';
import { moneyVi } from '../../../i18n/money.vi';

/** Every leaf path of a dictionary, e.g. `cashBook.columns.balance`. */
function leafKeys(node: unknown, prefix = ''): string[] {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return [prefix];
  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
    leafKeys(value, prefix ? `${prefix}.${key}` : key),
  );
}

// The suite-wide parity test only walks the dictionaries `src/i18n/index.ts` imports, and the
// money namespace is registered by the screens that use it (the customers and orders pattern),
// so its parity is checked here instead. A key present in one locale only renders as the raw
// dot path on screen, which nothing throws on.
describe('money dictionary', () => {
  const vi = leafKeys(moneyVi).sort();
  const en = leafKeys(moneyEn).sort();

  it('is key-for-key equal across vi and en', () => {
    expect(en.filter((key) => !vi.includes(key))).toEqual([]);
    expect(vi.filter((key) => !en.includes(key))).toEqual([]);
  });

  it('has no em-dash in either locale', () => {
    const withDash = [...leafKeys(moneyVi), ...leafKeys(moneyEn)];
    expect(withDash.length).toBeGreaterThan(0);
    expect(JSON.stringify(moneyVi).includes('—')).toBe(false);
    expect(JSON.stringify(moneyEn).includes('—')).toBe(false);
  });
});
