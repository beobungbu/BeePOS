/**
 * The product thumbnail of `docs/design/design-direction.md` section 5: a fixed 40 pt slot on
 * the category accent tint that shows the photo when the product has one and the product
 * monogram when it does not, so a list never reflows between the two cases.
 *
 * One component for every list in the app. The cart line, the orders preview, the order
 * detail, the product table and the product rows all render this, which is what stops the
 * same 40 pt slot drifting into three different tints and three different monograms.
 */

import { Image } from 'expo-image';
import { View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import { monogramOf, useCategoryAccent } from '../lib/category-accent';

interface ProductThumbProps {
  name: string;
  categoryId: string;
  imageUrl?: string | number;
  /** Slot edge in points; 40 in table, list and cart rows, larger in the product form. */
  size?: number;
}

export function ProductThumb({ name, categoryId, imageUrl, size = 40 }: ProductThumbProps) {
  const accent = useCategoryAccent(categoryId);

  return (
    <View
      className={`items-center justify-center overflow-hidden rounded-sm ${accent.color ? '' : 'bg-muted'}`}
      style={[
        { width: size, height: size },
        // Section 5 puts the thumbnail slot on the accent at 10 percent.
        accent.color ? { backgroundColor: `${accent.color}1a` } : null,
      ]}
    >
      {imageUrl !== undefined ? (
        <Image
          accessibilityIgnoresInvertColors
          contentFit="cover"
          source={imageUrl}
          style={{ width: size, height: size }}
          transition={150}
        />
      ) : (
        <Text
          variant={size >= 56 ? 'heading' : 'caption'}
          className="font-semibold"
          style={accent.color ? { color: accent.color } : undefined}
        >
          {monogramOf(name)}
        </Text>
      )}
    </View>
  );
}
