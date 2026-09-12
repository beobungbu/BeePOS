import { resolveRuntimeTheme } from '../theme-mode';

describe('resolveRuntimeTheme', () => {
  it('takes an explicit mode whatever the OS says', () => {
    expect(resolveRuntimeTheme('light', 'dark')).toBe('light');
    expect(resolveRuntimeTheme('dark', 'light')).toBe('dark');
  });

  it('follows the OS scheme in system mode', () => {
    expect(resolveRuntimeTheme('system', 'dark')).toBe('dark');
    expect(resolveRuntimeTheme('system', 'light')).toBe('light');
  });

  it('reads an unknown OS scheme as light', () => {
    expect(resolveRuntimeTheme('system', null)).toBe('light');
    expect(resolveRuntimeTheme('system', undefined)).toBe('light');
  });

  it('re-follows the OS after an explicit choice, so a switch back is not sticky', () => {
    // The sequence the settings screen produces: system, an explicit Tối, then system again
    // while the OS sits on light. The last answer must be the OS one, not the choice before.
    expect(resolveRuntimeTheme('system', 'light')).toBe('light');
    expect(resolveRuntimeTheme('dark', 'light')).toBe('dark');
    expect(resolveRuntimeTheme('system', 'light')).toBe('light');
  });
});
