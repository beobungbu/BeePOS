/**
 * The 40 pt product thumbnail of `docs/design/design-direction.md` section 5: a fixed-size
 * slot on the category accent tint that shows the photo when the product has one and the
 * product monogram when it does not, so a list never reflows between the two cases.
 */

import { Image } from 'expo-image';
import { View } from 'react-native';
import { Text, useBeeToken } from '@beemvp/beeui-ui';

/**
 * The category accent set from the direction doc, section 2 (chart series tokens). The
 * installed token path is `chart.<name>`; the docs' `colors.chart-<name>` form is rejected
 * by `BeeTokenPath` (filed in docs/beeui-audit/findings-14-restyle-w-adm.md).
 */
const ACCENT_TOKENS = [
  'chart.series-1',
  'chart.series-2',
  'chart.series-3',
  'chart.series-4',
  'chart.highlight',
] as const;

/** Stable accent per category id, so the same category always reads the same colour. */
function accentIndex(categoryId: string): number {
  let hash = 0;
  for (let i = 0; i < categoryId.length; i += 1) hash = (hash * 31 + categoryId.charCodeAt(i)) % 9973;
  return hash % ACCENT_TOKENS.length;
}

/** Up to two initials, the fallback when a product carries no photo. */
export function monogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const letters = words.slice(0, 2).map((word) => word[0]?.toUpperCase() ?? '');
  return letters.join('');
}

interface ProductThumbProps {
  name: string;
  categoryId: string;
  imageUrl?: string | number;
  /** Slot edge in points; 40 in table and list rows, larger in the product form. */
  size?: number;
}

export function ProductThumb({ name, categoryId, imageUrl, size = 40 }: ProductThumbProps) {
  const accent = String(useBeeToken(ACCENT_TOKENS[accentIndex(categoryId)]));

  return (
    <View
      className="items-center justify-center overflow-hidden rounded-sm"
      style={{ width: size, height: size, backgroundColor: `${accent}1a` }}
    >
      {imageUrl ? (
        <Image
          source={imageUrl}
          contentFit="cover"
          transition={150}
          style={{ width: size, height: size }}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text variant="caption" style={{ color: accent }} className="font-semibold">
          {monogram(name)}
        </Text>
      )}
    </View>
  );
}
