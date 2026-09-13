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
  // Promotions is an area of its own rather than a tab inside Sản phẩm: it is a calendar of
  // campaigns, edited by whoever sets prices, and nothing about it is per product.
  { id: 'promotions', href: '/promotions', labelKey: 'common.nav.promotions', icon: 'percent', primaryOnMobile: false, permission: 'catalog.manage' },
  { id: 'customers', href: '/customers', labelKey: 'common.nav.customers', icon: 'users-round', primaryOnMobile: false, permission: 'customers.manage' },
  { id: 'money', href: '/money', labelKey: 'common.nav.money', icon: 'wallet', primaryOnMobile: false, permission: 'reports.store' },
  { id: 'reports', href: '/reports', labelKey: 'common.nav.reports', icon: 'chart-column', primaryOnMobile: false, permission: 'reports.store' },
  { id: 'stores', href: '/stores', labelKey: 'common.nav.stores', icon: 'store', primaryOnMobile: false, permission: 'stores.manage' },
  { id: 'staff', href: '/staff', labelKey: 'common.nav.staff', icon: 'id-card', primaryOnMobile: false, permission: 'staff.manage' },
  // Before Settings, and deliberately: `permissionForPath` takes the first item whose href
  // prefixes the path, so a `/settings` entry placed first would demand `settings.manage` for
  // the log and lock a manager (who may read it) out of a screen their nav offers them.
  { id: 'audit', href: '/settings/audit', labelKey: 'common.nav.audit', icon: 'clipboard-list', primaryOnMobile: false, permission: 'audit.view' },
  { id: 'settings', href: '/settings', labelKey: 'common.nav.settings', icon: 'settings', primaryOnMobile: false, permission: 'settings.manage' },
];

/**
 * Screens that belong inside another area rather than being an area of their own: they are
 * not in the sidebar, the rail or the tab bar, but the command palette offers them and the
 * route guard has to know what they cost. Suppliers lives under Kho hàng, where the receipt
 * that needs one is created.
 */
export const SUB_NAV_ITEMS: NavItem[] = [
  { id: 'suppliers', href: '/inventory/suppliers', labelKey: 'common.nav.suppliers', icon: 'truck', primaryOnMobile: false, permission: 'inventory.manage' },
  // Selling prices belong to the catalogue: price lists and rules are read next to the product
  // they price, so the area is Sản phẩm and this is the way in.
  { id: 'pricing', href: '/pricing', labelKey: 'common.nav.pricing', icon: 'tag', primaryOnMobile: false, permission: 'catalog.manage' },
  // The notification centre is reached from the bell in the header at every width. It is here
  // so the command palette offers it and so the route guard knows what it costs: every role
  // gets notifications, so it costs what standing at the till costs.
  { id: 'notifications', href: '/notifications', labelKey: 'common.nav.notifications', icon: 'bell', primaryOnMobile: false, permission: 'pos.sell' },
  // Inventory 2 screens: reached from the Kho hàng toolbar, and from the palette through here.
  // `/inventory/purchase-orders` must precede nothing in particular, but every entry has to
  // exist or `permissionForPath` falls back to the Kho hàng area's permission, which is the
  // same one here; the entries are for the palette.
  { id: 'purchase-orders', href: '/inventory/purchase-orders', labelKey: 'inventory.purchaseOrders.title', icon: 'clipboard-list', primaryOnMobile: false, permission: 'inventory.manage' },
  { id: 'expiring', href: '/inventory/expiring', labelKey: 'inventory.expiring.title', icon: 'triangle-alert', primaryOnMobile: false, permission: 'inventory.manage' },
  { id: 'csv-import', href: '/inventory/import', labelKey: 'inventory.import.title', icon: 'package', primaryOnMobile: false, permission: 'inventory.manage' },
  // Returning goods is a refund, so it costs what a refund costs rather than what selling
  // costs: a cashier who may not refund must not reach the screen by typing its URL.
  { id: 'returns', href: '/pos/returns', labelKey: 'returns.entryTitle', icon: 'receipt-text', primaryOnMobile: false, permission: 'pos.refund' },
  // The shift, and the cash sheet, the Z report and the close behind it. It belongs here
  // because it was reachable only from the "no shift open" banner, which is what disappears
  // the moment a shift exists: on a phone there was then no way back to it at all (P7-05).
  // Costs what standing at the till costs; the screen itself checks `cash.movement` before it
  // offers cash in and out.
  { id: 'shift', href: '/pos/shift', labelKey: 'pos.shift.title', icon: 'clock', primaryOnMobile: false, permission: 'pos.sell' },
];

/** The sub-area screens the "Thêm" menu lists under the areas, in the order it lists them. */
export const MORE_SHEET_SUB_NAV_IDS = ['shift'] as const;

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

/** The sub-area screens this role may open. The command palette lists these after the areas. */
export function useVisibleSubNavItems(): NavItem[] {
  const role = useSessionStore((state) => state.staff?.role);
  return SUB_NAV_ITEMS.filter((item) => can(role, item.permission));
}

/** The permission a path needs, from the nav item that owns it (`/staff/new` -> staff). */
export function permissionForPath(pathname: string): Permission | undefined {
  const owns = (item: NavItem) => pathname === item.href || pathname.startsWith(`${item.href}/`);
  return (SUB_NAV_ITEMS.find(owns) ?? NAV_ITEMS.find(owns))?.permission;
}
