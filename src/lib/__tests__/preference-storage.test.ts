import { readBooleanPreference, readPreference, writeBooleanPreference, writePreference } from '../preference-storage';

// Platform-agnostic on purpose: the module answers from `localStorage` on web and from module
// memory everywhere else, and both paths have to satisfy the same contract.
describe('preference-storage', () => {
  it('returns null for a key that was never written', () => {
    expect(readPreference('beepos.test.missing')).toBeNull();
  });

  it('round-trips a value', () => {
    writePreference('beepos.test.key', 'value');
    expect(readPreference('beepos.test.key')).toBe('value');
  });

  it('reads booleans back as booleans', () => {
    writeBooleanPreference('beepos.test.flag', true);
    expect(readBooleanPreference('beepos.test.flag', false)).toBe(true);

    writeBooleanPreference('beepos.test.flag', false);
    expect(readBooleanPreference('beepos.test.flag', true)).toBe(false);
  });

  it('falls back when the stored value is not a boolean', () => {
    writePreference('beepos.test.unparsable', 'maybe');
    expect(readBooleanPreference('beepos.test.unparsable', true)).toBe(true);
    expect(readBooleanPreference('beepos.test.unparsable', false)).toBe(false);
  });

  it('falls back when the key is absent', () => {
    expect(readBooleanPreference('beepos.test.absent', true)).toBe(true);
    expect(readBooleanPreference('beepos.test.absent', false)).toBe(false);
  });
});
