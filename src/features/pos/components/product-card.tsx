import { Pressable, View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import { variantAndUnit } from '../../../domain/catalog';
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
  /** The 3 column grid under 400 pt: one type step down, so 2 lines of name still fit. */
  compact?: boolean;
  onAdd: () => void;
}

/**
 * Product tile per `docs/design/design-direction.md` section 5: image slot, name on exactly
 * two lines, unit line, price loudest. The whole tile adds one unit; there is no secondary
 * control on it, which is what keeps the 2 x 1:1 phone grid readable at arm's length.
 *
 * The name box is a fixed two lines high so a one-line name and a two-line name produce the
 * same tile height and the grid never staggers.
 *
 * `compact` is the 3 column phone grid of the polish pass: the name drops to the caption
 * variant and the price to the label variant, one step down the scale of section 4, which keeps
 * the name on two full lines at a 109 pt tile instead of clamping it.
 */
export function ProductCard({
  product,
  stock,
  inCart,
  imageAspectRatio,
  compact = false,
  onAdd,
}: ProductCardProps) {
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
      className={`flex-1 rounded-md border border-border ${compact ? 'gap-1 p-2' : 'gap-1.5 p-2.5'} ${
        outOfStock ? 'bg-surface-muted' : 'bg-surface active:bg-muted'
      }`}
    >
      <ProductImageSlot product={product} aspectRatio={imageAspectRatio} dimmed={outOfStock}>
        <StockBadge
          onHand={onHand}
          minLevel={minLevel}
          inCart={outOfStock ? 0 : inCart}
          compact={compact}
        />
      </ProductImageSlot>

      {/* Exactly two lines of the name, in a box sized to the step this tile uses: 2 x 16 at
          caption, 2 x 20 at label. The step comes from `variant`, not from a text size class:
          a font size in `className` loses to the component's own variant
          (docs/beeui-audit/findings-15-polish.md, 15-02). */}
      <View className={compact ? 'h-8 justify-start' : 'h-10 justify-start'}>
        <Text
          variant={compact ? 'caption' : 'label'}
          className={`font-semibold ${outOfStock ? 'text-muted-foreground' : 'text-foreground'}`}
          numberOfLines={2}
        >
          {product.name}
        </Text>
      </View>

      <Text variant="caption" className="text-muted-foreground" numberOfLines={1}>
        {variantAndUnit(product.variantLabel, product.unit)}
      </Text>
      <Text
        variant={compact ? 'label' : 'heading'}
        numeric="tabular"
        className={`font-bold ${outOfStock ? 'text-muted-foreground' : 'text-foreground'}`}
      >
        {formatVND(product.salePrice)}
      </Text>
    </Pressable>
  );
}
