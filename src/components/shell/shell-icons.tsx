/**
 * The four glyphs the phase-7 shell needs that the app icon set does not carry yet: a bell for
 * the notification centre, a tag for Giá bán, a percent for Khuyến mãi and a wallet for Tiền.
 *
 * They live here rather than in `src/components/icons.tsx` because that file is shared by
 * every feature this phase and four workers adding entries to one `as const` map is a merge
 * conflict per worker. `ShellIcon` accepts an app icon name or one of these, renders both the
 * same way, and takes the same semantic tone tokens, so the rail, the sidebar and the tab bar
 * keep one call shape. Fold these back into the app set once the phase lands.
 */

import { Bell, Check, Percent, Tag, Wallet, type LucideIcon } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useBeeToken } from '@beemvp/beeui-ui';
import { AppIcon, type AppIconName, type AppIconTone } from '../icons';

const EXTRA_ICONS = {
  bell: Bell,
  check: Check,
  percent: Percent,
  tag: Tag,
  wallet: Wallet,
} as const satisfies Record<string, LucideIcon>;

export type ShellExtraIconName = keyof typeof EXTRA_ICONS;
export type ShellIconName = AppIconName | ShellExtraIconName;

/** Same rule as `AppIcon`: the glyph is decorative, the control around it carries the name. */
const DECORATIVE_PROPS =
  Platform.OS === 'web' ? ({ 'aria-hidden': true } as const) : ({ accessible: false } as const);

function isExtra(name: ShellIconName): name is ShellExtraIconName {
  return name in EXTRA_ICONS;
}

export interface ShellIconProps {
  name: ShellIconName;
  size?: number;
  tone?: AppIconTone;
  strokeWidth?: number;
}

export function ShellIcon({ name, size = 20, tone = 'foreground', strokeWidth = 2 }: ShellIconProps) {
  // Called unconditionally: the token read is a hook, and a component may not choose per
  // render whether to run one.
  const tokenColor = useBeeToken(`colors.${tone}`);
  if (!isExtra(name)) return <AppIcon name={name} size={size} tone={tone} strokeWidth={strokeWidth} />;

  const Icon = EXTRA_ICONS[name];
  return <Icon {...DECORATIVE_PROPS} color={tokenColor} size={size} strokeWidth={strokeWidth} />;
}
