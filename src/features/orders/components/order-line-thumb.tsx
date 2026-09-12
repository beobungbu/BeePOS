/**
 * The 40 pt line thumbnail of `docs/design/design-direction.md` section 5 ("The orders
 * preview pane uses the identical thumbnail" as the cart line): a fixed slot tinted with the
 * category accent that shows the product photo when there is one and the product monogram
 * when there is not, so a list never reflows between the two cases.
 *
 * Duplicated rather than shared: the cart line (`src/features/pos`) and the product row
 * (`src/features/products`) carry their own copy this phase because the three features are
 * being restyled in parallel and `src/components/` belongs to none of them. Consolidating
 * the three into one `src/components/product-thumb.tsx` is filed as a follow-up in this
 * worker's report.
 */

import { Image } from 'expo-image';
import { View } from 'react-native';
import { Text, useBeeToken } from '@beemvp/beeui-ui';

/**
 * The category accent set of the direction doc, section 2. The installed token path is
 * `chart.<name>`; the docs' `colors.chart-<name>` form is rejected by `BeeTokenPath`.
 */
const ACCENT_TOKENS = ['chart.series-1', 'chart.series-2', 'chart.series-3', 'chart.series-4', 'chart.highlight'] as const;

/** Stable accent per category id, so one category always reads as the same colour. */
function accentIndex(categoryId: string): number {
  let hash = 0;
  for (let i = 0; i < categoryId.length; i += 1) hash = (hash * 31 + categoryId.charCodeAt(i)) % 9973;
  return hash % ACCENT_TOKENS.length;
}

/** Up to two initials, the fallback when a product carries no photo. */
export function monogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

export function OrderLineThumb({
  name,
  categoryId,
  imageUrl,
  size = 40,
}: {
  name: string;
  categoryId: string;
  imageUrl?: string | number;
  size?: number;
}) {
  const accent = String(useBeeToken(ACCENT_TOKENS[accentIndex(categoryId)]));

  return (
    <View
      className="items-center justify-center overflow-hidden rounded-sm"
      style={{ width: size, height: size, backgroundColor: `${accent}1a` }}
    >
      {imageUrl ? (
        <Image
          accessibilityIgnoresInvertColors
          contentFit="cover"
          source={imageUrl}
          style={{ width: size, height: size }}
          transition={150}
        />
      ) : (
        <Text className="font-semibold" style={{ color: accent }} variant="caption">
          {monogram(name)}
        </Text>
      )}
    </View>
  );
}
