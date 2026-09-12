import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import type { CartTotals } from '../../../domain/pos';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';

interface OrderTotalsPanelProps {
  totals: CartTotals;
  /** The cart pane draws its own surface; checkout needs the card. */
  bordered?: boolean;
  /**
   * Phone checkout folds the breakdown behind one row so the tendered field, the quick chips
   * and the change block all fit above the fold, as the mockup's phone frame does.
   */
  collapsible?: boolean;
}

/** Tạm tính, giảm giá, thuế, then the rule and the grand total in `text-title` weight 700. */
export function OrderTotalsPanel({ totals, bordered = true, collapsible = false }: OrderTotalsPanelProps) {
  const t = useT();
  const [expanded, setExpanded] = useState(!collapsible);

  return (
    <View className={`gap-2 ${bordered ? 'rounded-lg border border-border bg-surface p-4' : ''}`}>
      {collapsible ? (
        <Pressable
          onPress={() => setExpanded((previous) => !previous)}
          accessibilityRole="button"
          accessibilityLabel={t('pos.checkout.orderDetails')}
          accessibilityState={{ expanded }}
          className="min-h-11 flex-row items-center gap-2"
        >
          <Text className="flex-1 text-label font-semibold text-foreground">
            {t('pos.checkout.orderDetails')}
          </Text>
          <Text className="text-label tabular-nums text-muted-foreground">
            {formatVND(totals.subtotal)}
          </Text>
          <AppIcon name="chevron-right" size={18} tone="muted-foreground" />
        </Pressable>
      ) : null}

      {expanded ? (
        <>
          <View className="flex-row items-center justify-between">
            <Text className="text-label text-muted-foreground">{t('pos.cart.subtotal')}</Text>
            <Text className="text-label tabular-nums text-foreground">{formatVND(totals.subtotal)}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-label text-muted-foreground">{t('pos.cart.discount')}</Text>
            <Text
              className={`text-label tabular-nums ${
                totals.discountTotal > 0 ? 'font-semibold text-success' : 'text-foreground'
              }`}
            >
              {totals.discountTotal > 0 ? `-${formatVND(totals.discountTotal)}` : formatVND(0)}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-caption text-subtle-foreground">{t('pos.cart.taxIncluded')}</Text>
            <Text className="text-caption tabular-nums text-subtle-foreground">
              {formatVND(totals.taxTotal)}
            </Text>
          </View>
          <View className="my-1 h-px bg-border-strong" />
        </>
      ) : null}

      <View className="flex-row items-center justify-between">
        <Text className="text-label text-muted-foreground">{t('pos.cart.grandTotal')}</Text>
        <Text className="text-title font-bold tabular-nums text-foreground">{formatVND(totals.total)}</Text>
      </View>
    </View>
  );
}
