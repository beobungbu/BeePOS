import '../index';
import { getDictionary } from '../registry';

/** Every leaf path of a dictionary, e.g. `common.shell.collapseMenu`. */
function leafKeys(node: unknown, prefix = ''): string[] {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return [prefix];
  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
    leafKeys(value, prefix ? `${prefix}.${key}` : key),
  );
}

// A key that exists in one locale only falls back to the raw dot path on screen ("common.shell
// .collapseMenu" inside a button), which is a silent defect: nothing throws and the English
// build looks fine to a Vietnamese reviewer.
describe('i18n dictionaries', () => {
  const vi = leafKeys(getDictionary('vi')).sort();
  const en = leafKeys(getDictionary('en')).sort();

  it('has at least one key registered', () => {
    expect(vi.length).toBeGreaterThan(0);
  });

  it('is key-for-key equal across vi and en', () => {
    expect(en.filter((key) => !vi.includes(key))).toEqual([]);
    expect(vi.filter((key) => !en.includes(key))).toEqual([]);
  });
});
