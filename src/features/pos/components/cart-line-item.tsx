import { View } from 'react-native';
import { IconButton, Text } from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import { calcLine } from '../../../domain/pos';
import { formatVND } from '../../../domain/money';
import type { CartLine, Product } from '../../../domain/types';
import { useT } from '../../../i18n';
import { LineDiscountPopover } from './line-discount-popover';
import { ProductImageSlot } from './product-image-slot';
import { QtyStepper } from './qty-stepper';

interface CartLineItemProps {
  line: CartLine;
  product: Product | undefined;
  /** Desktop shows an explicit remove control next to the line total. */
  showRemoveControl: boolean;
  onSetQty: (qty: number) => void;
  onSetDiscount: (discount: CartLine['lineDiscount']) => void;
  onRemove: () => void;
}

/**
 * Cart line per `docs/design/design-direction.md` section 5: 40 pt thumbnail, name, one
 * caption carrying unit and unit price, the line discount as a third caption in `success`,
 * the stepper under the name and the line total right aligned in tabular figures.
 */
export function CartLineItem({
  line,
  product,
  showRemoveControl,
  onSetQty,
  onSetDiscount,
  onRemove,
}: CartLineItemProps) {
  const t = useT();
  const totals = calcLine({ ...line, taxRate: product?.taxRate ?? 0 });
  const discounted = totals.discount > 0;

  return (
    <View className="min-h-16 flex-row items-start gap-3 border-b border-border px-4 py-3">
      {product ? (
        <View className="w-10">
          <ProductImageSlot product={product} compact />
        </View>
      ) : null}

      <View className="flex-1 gap-0.5">
        <Text className="text-label font-semibold text-foreground" numberOfLines={2}>
          {product?.name ?? line.productId}
        </Text>
        <Text className="text-caption text-muted-foreground">
          {`${product?.unit ?? t('pos.unit')} · ${formatVND(line.unitPrice)}`}
        </Text>
        {discounted ? (
          <Text className="text-caption font-semibold text-success">
            {`${t('pos.cart.lineDiscountApplied')} ${formatVND(totals.discount)}`}
          </Text>
        ) : null}
        <View className="mt-2 flex-row items-center gap-1">
          <QtyStepper qty={line.qty} onChange={onSetQty} onRemove={onRemove} />
          <LineDiscountPopover discount={line.lineDiscount} onApply={onSetDiscount} />
        </View>
      </View>

      <View className="flex-row items-center gap-1">
        <Text className="text-label font-bold tabular-nums text-foreground">{formatVND(totals.total)}</Text>
        {showRemoveControl ? (
          <IconButton accessibilityLabel={t('pos.cart.removeLine')} variant="ghost" onPress={onRemove}>
            <AppIcon name="x" size={16} tone="muted-foreground" />
          </IconButton>
        ) : null}
      </View>
    </View>
  );
}
