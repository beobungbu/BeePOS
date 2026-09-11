/**
 * Single source of truth for app navigation. `app/(app)/_layout.tsx` renders from this
 * list only, so later phases never need to touch the layout file to add a screen.
 */
export interface NavItem {
  id: string;
  href: string;
  labelKey: string;
  icon: string;
  /** Shown as one of the primary bottom tabs on narrow screens (< 768). */
  primaryOnMobile: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'pos', href: '/pos', labelKey: 'common.nav.pos', icon: '🛒', primaryOnMobile: true },
  { id: 'orders', href: '/orders', labelKey: 'common.nav.orders', icon: '🧾', primaryOnMobile: true },
  { id: 'products', href: '/products', labelKey: 'common.nav.products', icon: '📦', primaryOnMobile: true },
  { id: 'inventory', href: '/inventory', labelKey: 'common.nav.inventory', icon: '🏷️', primaryOnMobile: true },
  { id: 'customers', href: '/customers', labelKey: 'common.nav.customers', icon: '👥', primaryOnMobile: false },
  { id: 'reports', href: '/reports', labelKey: 'common.nav.reports', icon: '📊', primaryOnMobile: false },
  { id: 'stores', href: '/stores', labelKey: 'common.nav.stores', icon: '🏬', primaryOnMobile: false },
  { id: 'staff', href: '/staff', labelKey: 'common.nav.staff', icon: '🧑‍💼', primaryOnMobile: false },
  { id: 'settings', href: '/settings', labelKey: 'common.nav.settings', icon: '⚙️', primaryOnMobile: false },
];

export const PRIMARY_MOBILE_TABS = NAV_ITEMS.filter((item) => item.primaryOnMobile);
export const SECONDARY_MOBILE_ITEMS = NAV_ITEMS.filter((item) => !item.primaryOnMobile);
