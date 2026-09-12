import { View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import { AppIcon } from '../icons';

export type BrandMarkSize = 'sm' | 'md' | 'lg';

const MARK_CLASS: Record<BrandMarkSize, string> = {
  sm: 'h-8 w-8 rounded-md',
  md: 'h-9 w-9 rounded-md',
  lg: 'h-14 w-14 rounded-lg',
};

const GLYPH_SIZE: Record<BrandMarkSize, number> = { sm: 18, md: 20, lg: 28 };

/** The amber BeePOS square: brand block on the auth screens, logo slot in rail and sidebar. */
export function BrandMark({ size = 'md' }: { size?: BrandMarkSize }) {
  return (
    <View className={`shrink-0 items-center justify-center bg-primary ${MARK_CLASS[size]}`}>
      <AppIcon name="hexagon" size={GLYPH_SIZE[size]} tone="primary-foreground" strokeWidth={2.5} />
    </View>
  );
}

/** Brand mark plus the wordmark, used at the top of the desktop sidebar and the auth pages. */
export function BrandBlock() {
  return (
    <View className="flex-row items-center gap-2.5">
      <BrandMark />
      <Text className="text-body font-bold text-foreground">BeePOS</Text>
    </View>
  );
}

/** Up to two initials for an avatar fallback ("Vũ Thị Giang" reads "VG"). */
export function initialsOf(name: string | undefined): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0][0] ?? '';
  const last = words.length > 1 ? words[words.length - 1][0] ?? '' : '';
  return `${first}${last}`.toUpperCase();
}
