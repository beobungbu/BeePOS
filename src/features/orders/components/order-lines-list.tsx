import { View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import type { CartLine, Product } from '../../../domain/types';
import { formatVND } from '../../../domain/money';
import { lineNetAmount } from '../../../domain/orders';
import { ProductThumb } from '../../../components/product-thumb';

/**
 * The order's items as cart-line rows (`docs/design/design-direction.md` section 5): the 40 pt
 * thumbnail, the product name, a caption carrying the unit and the quantity, and the line
 * total right aligned in tabular figures.
 */
export function OrderLinesList({ lines, products }: { lines: CartLine[]; products: Product[] }) {
  return (
    <View className="gap-2">
      {lines.map((line) => {
        const product = products.find((item) => item.id === line.productId);
        const name = product?.name ?? line.productId;

        return (
          <View className="flex-row items-center gap-2.5" key={line.productId}>
            <ProductThumb
              categoryId={product?.categoryId ?? line.productId}
              imageUrl={product?.imageUrl}
              name={name}
            />
            <View className="min-w-0 flex-1">
              <Text variant="label" className="font-semibold text-foreground" numberOfLines={1}>
                {name}
              </Text>
              <Text variant="caption" className="text-muted-foreground" numberOfLines={1}>
                {product?.unit ? `${product.unit} x${line.qty}` : `x${line.qty}`}
              </Text>
            </View>
            <Text variant="label" className="font-bold text-foreground" numeric="tabular">
              {formatVND(lineNetAmount(line))}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
