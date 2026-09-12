import { Pressable, View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import { formatVND } from '../../../domain/money';
import type { Product, StockLevel } from '../../../domain/types';
import { ProductImageSlot } from './product-image-slot';
import { StockBadge } from './stock-badge';

interface ProductCardProps {
  product: Product;
  stock: StockLevel | undefined;
  /** Units of this product in the active order, shown as the in-cart counter. */
  inCart: number;
  /** 1 on phone and tablet, 4 / 3 in the desktop two-pane layout. */
  imageAspectRatio: number;
  onAdd: () => void;
}

/**
 * Product tile per `docs/design/design-direction.md` section 5: image slot, name on exactly
 * two lines, unit line, price loudest. The whole tile adds one unit; there is no secondary
 * control on it, which is what keeps the 2 x 1:1 phone grid readable at arm's length.
 *
 * The name box is a fixed two lines high so a one-line name and a two-line name produce the
 * same tile height and the grid never staggers.
 */
export function ProductCard({ product, stock, inCart, imageAspectRatio, onAdd }: ProductCardProps) {
  const onHand = stock?.onHand ?? 0;
  const minLevel = stock?.minLevel ?? 0;
  const outOfStock = onHand <= 0;

  return (
    <Pressable
      onPress={onAdd}
      disabled={outOfStock}
      accessibilityRole="button"
      accessibilityLabel={product.name}
      accessibilityState={{ disabled: outOfStock }}
      className={`flex-1 gap-1.5 rounded-md border border-border p-2.5 ${
        outOfStock ? 'bg-surface-muted' : 'bg-surface active:bg-muted'
      }`}
    >
      <ProductImageSlot product={product} aspectRatio={imageAspectRatio} dimmed={outOfStock}>
        <StockBadge onHand={onHand} minLevel={minLevel} inCart={outOfStock ? 0 : inCart} />
      </ProductImageSlot>

      <View className="h-10 justify-start">
        <Text
          className={`text-label font-semibold ${outOfStock ? 'text-muted-foreground' : 'text-foreground'}`}
          numberOfLines={2}
        >
          {product.name}
        </Text>
      </View>

      <Text className="text-caption text-muted-foreground" numberOfLines={1}>
        {product.unit}
      </Text>
      <Text
        className={`text-heading font-bold tabular-nums ${
          outOfStock ? 'text-muted-foreground' : 'text-foreground'
        }`}
      >
        {formatVND(product.salePrice)}
      </Text>
    </Pressable>
  );
}
