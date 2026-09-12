import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@beemvp/beeui-ui';
import type { Product } from '../../../domain/types';
import { monogramOf, useCategoryAccent } from '../../../lib/category-accent';

interface ProductImageSlotProps {
  product: Product;
  /** Slot shape: 1 on phone and tablet tiles, 4 / 3 on desktop tiles. */
  aspectRatio?: number;
  /** Out of stock: the picture greys out and dims, overlays stay at full strength. */
  dimmed?: boolean;
  /** Badges and counters that sit on the picture's top right corner. */
  children?: ReactNode;
  className?: string;
}

/** Greyscale plus dim for an out of stock product; `filter` is a view style from RN 0.76. */
const OUT_OF_STOCK_STYLE = { opacity: 0.45, filter: [{ grayscale: 1 }] } as const;

/**
 * The image slot of the product tile, per `docs/design/design-direction.md` section 5. The slot is reserved at a fixed aspect before
 * the picture resolves, so the grid never reflows, and the monogram fallback is a property of
 * the slot rather than a different tile: a product with a photo and one without occupy the
 * same box.
 */
export function ProductImageSlot({
  product,
  aspectRatio = 1,
  dimmed = false,
  children,
  className = '',
}: ProductImageSlotProps) {
  const accent = useCategoryAccent(product.categoryId);
  const hasImage = product.imageUrl !== undefined;

  return (
    <View
      className={`w-full overflow-hidden rounded-sm ${accent.tint ? '' : 'bg-muted'} ${className}`}
      style={[{ aspectRatio }, accent.tint ? { backgroundColor: accent.tint } : null]}
    >
      {/* The picture dims on its own layer so the stock badge above it keeps full contrast. */}
      <View className="absolute inset-0" style={dimmed ? OUT_OF_STOCK_STYLE : null}>
        {hasImage ? (
          <Image
            source={product.imageUrl}
            contentFit="cover"
            transition={150}
            accessibilityIgnoresInvertColors
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text
              variant="heading"
              className="font-bold"
              style={accent.color ? { color: accent.color } : undefined}
            >
              {monogramOf(product.name)}
            </Text>
          </View>
        )}
      </View>
      {children}
    </View>
  );
}
