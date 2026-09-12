/**
 * Single source of truth for app navigation. `app/(app)/_layout.tsx` renders from this
 * list only, so later phases never need to touch the layout file to add a screen.
 */
import type { AppIconName } from '../icons';

export interface NavItem {
  id: string;
  href: string;
  labelKey: string;
  icon: AppIconName;
  /** Shown as one of the primary bottom tabs on narrow screens (< 768). */
  primaryOnMobile: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'pos', href: '/pos', labelKey: 'common.nav.pos', icon: 'shopping-cart', primaryOnMobile: true },
  { id: 'orders', href: '/orders', labelKey: 'common.nav.orders', icon: 'receipt-text', primaryOnMobile: true },
  { id: 'products', href: '/products', labelKey: 'common.nav.products', icon: 'package', primaryOnMobile: true },
  { id: 'inventory', href: '/inventory', labelKey: 'common.nav.inventory', icon: 'warehouse', primaryOnMobile: true },
  { id: 'customers', href: '/customers', labelKey: 'common.nav.customers', icon: 'users-round', primaryOnMobile: false },
  { id: 'reports', href: '/reports', labelKey: 'common.nav.reports', icon: 'chart-column', primaryOnMobile: false },
  { id: 'stores', href: '/stores', labelKey: 'common.nav.stores', icon: 'store', primaryOnMobile: false },
  { id: 'staff', href: '/staff', labelKey: 'common.nav.staff', icon: 'id-card', primaryOnMobile: false },
  { id: 'settings', href: '/settings', labelKey: 'common.nav.settings', icon: 'settings', primaryOnMobile: false },
];

export const PRIMARY_MOBILE_TABS = NAV_ITEMS.filter((item) => item.primaryOnMobile);
export const SECONDARY_MOBILE_ITEMS = NAV_ITEMS.filter((item) => !item.primaryOnMobile);

/** Rail and sidebar show every area; Cài đặt is pinned to the bottom instead of the list. */
export const SETTINGS_NAV_ITEM = NAV_ITEMS.find((item) => item.id === 'settings') as NavItem;
export const WIDE_NAV_ITEMS = NAV_ITEMS.filter((item) => item.id !== 'settings');
