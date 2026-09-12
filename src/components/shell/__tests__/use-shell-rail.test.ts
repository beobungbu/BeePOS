import { useSettingsStore } from '../../../data/settings-store';
import { isFocusedSellRoute, toggleShellRail } from '../use-shell-rail';

describe('isFocusedSellRoute', () => {
  it.each(['/pos', '/pos/cart', '/pos/checkout', '/pos/receipt/order-1'])('%s is focused sell', (path) => {
    expect(isFocusedSellRoute(path)).toBe(true);
  });

  it.each(['/orders', '/products', '/inventory', '/settings'])('%s is not', (path) => {
    expect(isFocusedSellRoute(path)).toBe(false);
  });
});

describe('toggleShellRail', () => {
  beforeEach(() => {
    useSettingsStore.setState({ sidebarCollapsed: false, posSidebarCollapsed: true });
  });

  it('flips the persisted preference on an admin route', () => {
    toggleShellRail('/orders');
    expect(useSettingsStore.getState().sidebarCollapsed).toBe(true);
    expect(useSettingsStore.getState().posSidebarCollapsed).toBe(true);
  });

  it('flips only the session override inside POS, so the preference survives', () => {
    toggleShellRail('/pos');
    expect(useSettingsStore.getState().posSidebarCollapsed).toBe(false);
    expect(useSettingsStore.getState().sidebarCollapsed).toBe(false);
  });
});
