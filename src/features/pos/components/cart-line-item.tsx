import { View } from 'react-native';
import { IconButton, Text } from '@beemvp/beeui-ui';
import { calcLine } from '../../../domain/pos';
import { formatVND } from '../../../domain/money';
import type { CartLine, Product } from '../../../domain/types';
import { useT } from '../../../i18n';
import { LineDiscountPopover } from './line-discount-popover';
import { QtyStepper } from './qty-stepper';

interface CartLineItemProps {
  line: CartLine;
  product: Product | undefined;
  onSetQty: (qty: number) => void;
  onSetDiscount: (discount: CartLine['lineDiscount']) => void;
  onRemove: () => void;
}

export function CartLineItem({ line, product, onSetQty, onSetDiscount, onRemove }: CartLineItemProps) {
  const t = useT();
  const totals = calcLine({ ...line, taxRate: product?.taxRate ?? 0 });

  return (
    <View className="gap-2 border-b border-border py-3">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-sm font-medium text-foreground" numberOfLines={2}>
          {product?.name ?? line.productId}
        </Text>
        <IconButton accessibilityLabel={t('pos.cart.removeLine')} variant="ghost" onPress={onRemove}>
          <Text className="text-destructive">✕</Text>
        </IconButton>
      </View>

      <Text className="text-xs text-muted-foreground">
        {formatVND(line.unitPrice)} / {product?.unit ?? t('pos.unit')}
      </Text>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <QtyStepper qty={line.qty} onChange={onSetQty} />
          <LineDiscountPopover discount={line.lineDiscount} onApply={onSetDiscount} />
        </View>
        <Text className="text-sm font-semibold text-foreground">{formatVND(totals.total)}</Text>
      </View>
    </View>
  );
}
