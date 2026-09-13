/**
 * The app's only icon vocabulary: the lucide set named in `docs/design/design-direction.md`
 * section 3, mapped once so screens reference a stable app name (`shopping-cart`) instead of
 * importing lucide components directly. One family on web and native, stroke and colour are
 * props, so an icon inherits a semantic token instead of carrying a literal colour.
 *
 * Colour comes from BeeUI's typed runtime token reader (`useBeeToken`), the sanctioned path
 * for non-`className` consumers such as SVG props; icons are decorative and stay out of the
 * accessibility tree, so the surrounding control owns the accessible name.
 */

import {
  Banknote,
  ChartColumn,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Ellipsis,
  Hexagon,
  IdCard,
  Minus,
  Package,
  Plus,
  QrCode,
  ReceiptText,
  ScanBarcode,
  Search,
  Settings,
  ShoppingCart,
  Store,
  Trash2,
  TriangleAlert,
  Truck,
  UsersRound,
  Warehouse,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { Platform } from 'react-native';
import { useBeeToken } from '@beemvp/beeui-ui';

/**
 * The 20 icons of the direction doc plus five the shell, auth and chain-ops screens need and
 * the doc's list does not cover: `id-card` for the Nhân viên nav item (the mockup's distinct
 * staff glyph), `chevron-left` for the back control on `/select-store`, `hexagon` for the
 * BeePOS brand mark, and `truck` / `clipboard-list` for the Nhà cung cấp and Nhật ký items of
 * `docs/design/mockups/chain-ops.html`.
 */
export const APP_ICONS = {
  search: Search,
  'scan-barcode': ScanBarcode,
  'shopping-cart': ShoppingCart,
  'receipt-text': ReceiptText,
  package: Package,
  warehouse: Warehouse,
  'users-round': UsersRound,
  'chart-column': ChartColumn,
  store: Store,
  settings: Settings,
  ellipsis: Ellipsis,
  plus: Plus,
  minus: Minus,
  'trash-2': Trash2,
  x: X,
  'chevron-right': ChevronRight,
  banknote: Banknote,
  'qr-code': QrCode,
  'credit-card': CreditCard,
  'triangle-alert': TriangleAlert,
  'id-card': IdCard,
  'chevron-left': ChevronLeft,
  hexagon: Hexagon,
  truck: Truck,
  'clipboard-list': ClipboardList,
} as const satisfies Record<string, LucideIcon>;

export type AppIconName = keyof typeof APP_ICONS;

/** The semantic colour tokens an icon may take; every one exists in both themes. */
export type AppIconTone =
  | 'foreground'
  | 'muted-foreground'
  | 'subtle-foreground'
  | 'primary'
  | 'primary-foreground'
  | 'primary-pressed'
  | 'secondary-foreground'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'disabled-foreground';

export interface AppIconProps {
  name: AppIconName;
  /** Defaults to 20; the rail and the bottom tab bar use 24. */
  size?: number;
  /** Semantic token the stroke resolves to. Defaults to `foreground`. */
  tone?: AppIconTone;
  /** Escape hatch for a colour already resolved by the caller (e.g. a chart series token). */
  color?: string;
  strokeWidth?: number;
}

/**
 * Hiding a decorative glyph differs per platform: `react-native-svg` on web forwards unknown
 * props straight to the DOM, so `accessible={false}` would land as a non-boolean `accessible`
 * attribute React refuses to write. Web gets `aria-hidden`, native keeps `accessible`.
 */
const DECORATIVE_PROPS =
  Platform.OS === 'web' ? ({ 'aria-hidden': true } as const) : ({ accessible: false } as const);

export function AppIcon({
  name,
  size = 20,
  tone = 'foreground',
  color,
  strokeWidth = 2,
}: AppIconProps) {
  const tokenColor = useBeeToken(`colors.${tone}`);
  const Icon = APP_ICONS[name];

  return <Icon {...DECORATIVE_PROPS} color={color ?? tokenColor} size={size} strokeWidth={strokeWidth} />;
}
