import { Pressable, View } from 'react-native';
import { Button, ButtonLabel, Text } from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';
import { SecondaryButtonLabel } from './secondary-button-label';
import { countLabel } from '../lib/order-label';

interface FloatingCartBarProps {
  /** "Đơn 1", so the cashier never pays the wrong customer's order. */
  orderLabel: string;
  unitCount: number;
  lineCount: number;
  total: number;
  customerName?: string;
  /** Tablet has room for a separate "view cart" control and the total on the pay button. */
  wide: boolean;
  onOpenCart: () => void;
  onCheckout: () => void;
}

/**
 * Docked order bar on phone and tablet: it always names the order and always carries the
 * amount, so the cashier never opens the cart just to read the total.
 */
export function FloatingCartBar({
  orderLabel,
  unitCount,
  lineCount,
  total,
  customerName,
  wide,
  onOpenCart,
  onCheckout,
}: FloatingCartBarProps) {
  const t = useT();
  const isEmpty = lineCount === 0;
  const summary = [orderLabel, countLabel(t, lineCount, 'pos.cart.lineItems'), customerName]
    .filter(Boolean)
    .join(' · ');

  return (
    <View className="flex-row items-center gap-3 border-t border-border bg-surface-raised px-4 py-2">
      <Pressable
        onPress={onOpenCart}
        accessibilityRole="button"
        accessibilityLabel={t('pos.cart.viewCart')}
        className="min-h-11 flex-1 flex-row items-center gap-3"
      >
        <View className="flex-row items-center gap-1">
          <AppIcon name="shopping-cart" tone="muted-foreground" />
          <Text className="text-label font-bold tabular-nums text-foreground">{unitCount}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-caption text-muted-foreground" numberOfLines={1}>
            {summary}
          </Text>
          <Text className="text-heading font-bold tabular-nums text-foreground">{formatVND(total)}</Text>
        </View>
      </Pressable>

      {wide ? (
        <Button variant="outline" onPress={onOpenCart}>
          <SecondaryButtonLabel>{t('pos.cart.viewCart')}</SecondaryButtonLabel>
        </Button>
      ) : null}

      <Button disabled={isEmpty} onPress={onCheckout}>
        <ButtonLabel>
          {wide ? `${t('pos.cart.checkout')} · ${formatVND(total)}` : t('pos.cart.checkout')}
        </ButtonLabel>
      </Button>
    </View>
  );
}
