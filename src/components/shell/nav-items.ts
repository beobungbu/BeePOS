/**
 * Single source of truth for app navigation. `app/(app)/_layout.tsx` renders from this
 * list only, so later phases never need to touch the layout file to add a screen.
 */
import { can } from '../../domain/auth';
import type { Permission, StaffRole } from '../../domain/types';
import { useSessionStore } from '../../data/session-store';
import type { AppIconName } from '../icons';

export interface NavItem {
  id: string;
  href: string;
  labelKey: string;
  icon: AppIconName;
  /** Shown as one of the primary bottom tabs on narrow screens (< 768). */
  primaryOnMobile: boolean;
  /**
   * What a role must be allowed to do for this area to exist for them. The route guard in
   * `app/(app)/_layout.tsx` reads the same field, so a hidden nav item and a blocked route can
   * never disagree: a cashier neither sees Báo cáo nor reaches it by typing the URL.
   */
  permission: Permission;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'pos', href: '/pos', labelKey: 'common.nav.pos', icon: 'shopping-cart', primaryOnMobile: true, permission: 'pos.sell' },
  { id: 'orders', href: '/orders', labelKey: 'common.nav.orders', icon: 'receipt-text', primaryOnMobile: true, permission: 'orders.view' },
  { id: 'products', href: '/products', labelKey: 'common.nav.products', icon: 'package', primaryOnMobile: true, permission: 'catalog.manage' },
  { id: 'inventory', href: '/inventory', labelKey: 'common.nav.inventory', icon: 'warehouse', primaryOnMobile: true, permission: 'inventory.manage' },
  { id: 'customers', href: '/customers', labelKey: 'common.nav.customers', icon: 'users-round', primaryOnMobile: false, permission: 'customers.manage' },
  { id: 'reports', href: '/reports', labelKey: 'common.nav.reports', icon: 'chart-column', primaryOnMobile: false, permission: 'reports.store' },
  { id: 'stores', href: '/stores', labelKey: 'common.nav.stores', icon: 'store', primaryOnMobile: false, permission: 'stores.manage' },
  { id: 'staff', href: '/staff', labelKey: 'common.nav.staff', icon: 'id-card', primaryOnMobile: false, permission: 'staff.manage' },
  { id: 'settings', href: '/settings', labelKey: 'common.nav.settings', icon: 'settings', primaryOnMobile: false, permission: 'settings.manage' },
];

/**
 * The areas a role may open, in nav order. One filter for the rail, the sidebar, the bottom
 * tabs and the "Thêm" sheet, so a role never sees a door it cannot walk through.
 */
export function visibleNavItems(role: StaffRole | null | undefined): NavItem[] {
  return NAV_ITEMS.filter((item) => can(role, item.permission));
}

/** Hook form, bound to the signed-in member. */
export function useVisibleNavItems(): NavItem[] {
  const role = useSessionStore((state) => state.staff?.role);
  return visibleNavItems(role);
}

/** The permission a path needs, from the nav item that owns it (`/staff/new` -> staff). */
export function permissionForPath(pathname: string): Permission | undefined {
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    ?.permission;
}
