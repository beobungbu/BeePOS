import { View } from 'react-native';
import { IconButton, Text } from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import { ProductThumb } from '../../../components/product-thumb';
import { variantAndUnit } from '../../../domain/catalog';
import { calcLine } from '../../../domain/pos';
import { formatVND } from '../../../domain/money';
import type { CartLine, Product } from '../../../domain/types';
import { useT } from '../../../i18n';
import {
  basePriceText,
  minOrderWarning,
  unitConversionText,
  type PriceSourceBadge as PriceSourceBadgeValue,
} from '../lib/wholesale';
import { LineDiscountPopover } from './line-discount-popover';
import { PriceSourceBadge } from './price-source-badge';
import { QtyStepper } from './qty-stepper';
import { UnitSelector } from './unit-selector';

interface CartLineItemProps {
  line: CartLine;
  product: Product | undefined;
  /** Desktop shows an explicit remove control next to the line total. */
  showRemoveControl: boolean;
  onSetQty: (qty: number) => void;
  onSetDiscount: (discount: CartLine['lineDiscount']) => void;
  onRemove: () => void;
  /** Wholesale only: the conversion line, the price-source label and the unit selector. */
  wholesale?: boolean;
  badge?: PriceSourceBadgeValue;
  onSetUnit?: (unit: string | undefined, factor: number) => void;
}

/**
 * Cart line per `docs/design/design-direction.md` section 5: 40 pt thumbnail, name, one
 * caption carrying unit and unit price, the line discount as a third caption in `success`,
 * the stepper under the name and the line total right aligned in tabular figures.
 *
 * On a wholesale order the caption writes the conversion out in full
 * (`10 thùng x 24 lon = 240 lon · 7.500 đ/lon`), because the seller and the buyer have to
 * read the same number, and the line carries the label naming where its price came from.
 */
export function CartLineItem({
  line,
  product,
  showRemoveControl,
  onSetQty,
  onSetDiscount,
  onRemove,
  wholesale = false,
  badge,
  onSetUnit,
}: CartLineItemProps) {
  const t = useT();
  const totals = calcLine({ ...line, taxRate: product?.taxRate ?? 0 });
  const discounted = totals.discount > 0;
  const minOrderText = wholesale ? minOrderWarning(t, product, line) : undefined;

  const caption = wholesale
    ? `${unitConversionText(product, line)} · ${basePriceText(product, line)}`
    : `${variantAndUnit(product?.variantLabel, product?.unit ?? t('pos.unit'))} · ${formatVND(
        line.unitPrice,
      )}`;

  return (
    <View className="min-h-16 flex-row items-start gap-3 border-b border-border px-4 py-3">
      {product ? (
        <ProductThumb name={product.name} categoryId={product.categoryId} imageUrl={product.imageUrl} />
      ) : null}

      <View className="flex-1 gap-0.5">
        <Text variant="label" className="font-semibold text-foreground" numberOfLines={2}>
          {product?.name ?? line.productId}
        </Text>
        <Text variant="caption" className="text-muted-foreground">
          {caption}
        </Text>
        {badge ? (
          <View className="mt-1 flex-row">
            <PriceSourceBadge badge={badge} />
          </View>
        ) : null}
        {minOrderText ? (
          <View className="mt-1 flex-row items-center gap-1">
            <AppIcon name="triangle-alert" size={12} tone="warning" />
            <Text variant="caption" className="font-semibold text-warning" numberOfLines={2}>
              {minOrderText}
            </Text>
          </View>
        ) : null}
        {discounted ? (
          <Text variant="caption" className="font-semibold text-success">
            {`${t('pos.cart.lineDiscountApplied')} ${formatVND(totals.discount)}`}
          </Text>
        ) : null}
        {wholesale && onSetUnit && product ? (
          <View className="mt-2">
            <UnitSelector product={product} value={line.unit} onChange={onSetUnit} />
          </View>
        ) : null}
        <View className="mt-2 flex-row items-center gap-1">
          <QtyStepper qty={line.qty} onChange={onSetQty} onRemove={onRemove} />
          <LineDiscountPopover discount={line.lineDiscount} onApply={onSetDiscount} />
        </View>
      </View>

      <View className="flex-row items-center gap-1">
        <Text variant="label" numeric="tabular" className="font-bold text-foreground">
          {formatVND(totals.total)}
        </Text>
        {showRemoveControl ? (
          <IconButton accessibilityLabel={t('pos.cart.removeLine')} variant="ghost" onPress={onRemove}>
            <AppIcon name="x" size={16} tone="muted-foreground" />
          </IconButton>
        ) : null}
      </View>
    </View>
  );
}
