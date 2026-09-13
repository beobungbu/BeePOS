import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import type { CartTotals } from '../../../domain/pos';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';

/** Label may wrap, amount may not, and the pair drops to a second line before either clips. */
const ROW_CLASS = 'flex-row flex-wrap items-center justify-between gap-x-3 gap-y-0.5';

interface OrderTotalsPanelProps {
  totals: CartTotals;
  /** The cart pane draws its own surface; checkout needs the card. */
  bordered?: boolean;
  /**
   * Phone checkout folds the breakdown behind one row so the tendered field, the quick chips
   * and the change block all fit above the fold, as the mockup's phone frame does.
   */
  collapsible?: boolean;
  /**
   * Wholesale relabels the breakdown: `Tạm tính chưa VAT` and `VAT` on their own lines,
   * because a VAT invoice has to show the tax separately, where a retail bill keeps it inside
   * the price (`docs/design/specs/commerce.md` section A).
   */
  wholesale?: boolean;
}

/**
 * Tạm tính, giảm giá, thuế, then the rule and the grand total in the title step, weight 700.
 *
 * Every row is a label that may shrink and wrap next to an amount that may not: at
 * accessibility text sizes the amount used to be the side that gave way, and the row read
 * "TỔNG CỘNG 13.200" with the currency suffix cut off. The row wraps before that happens.
 */
export function OrderTotalsPanel({
  totals,
  bordered = true,
  collapsible = false,
  wholesale = false,
}: OrderTotalsPanelProps) {
  const t = useT();
  const [expanded, setExpanded] = useState(!collapsible);
  const subtotalLabel = wholesale ? t('pos.wholesale.vat.subtotal') : t('pos.cart.subtotal');
  const taxLabel = wholesale ? t('pos.wholesale.vat.tax') : t('pos.cart.taxIncluded');

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
          <Text variant="label" className="flex-1 font-semibold text-foreground">
            {t('pos.checkout.orderDetails')}
          </Text>
          <Text variant="label" className="shrink-0 font-normal tabular-nums text-muted-foreground">
            {formatVND(totals.subtotal)}
          </Text>
          <AppIcon name="chevron-right" size={18} tone="muted-foreground" />
        </Pressable>
      ) : null}

      {expanded ? (
        <>
          <View className={ROW_CLASS}>
            <Text variant="label" className="min-w-0 shrink font-normal text-muted-foreground">{subtotalLabel}</Text>
            <Text variant="label" className="shrink-0 font-normal tabular-nums text-foreground">{formatVND(totals.subtotal)}</Text>
          </View>
          <View className={ROW_CLASS}>
            <Text variant="label" className="min-w-0 shrink font-normal text-muted-foreground">{t('pos.cart.discount')}</Text>
            <Text
              variant="label"
              className={`shrink-0 font-normal tabular-nums ${
                totals.discountTotal > 0 ? 'font-semibold text-success' : 'text-foreground'
              }`}
            >
              {totals.discountTotal > 0 ? `-${formatVND(totals.discountTotal)}` : formatVND(0)}
            </Text>
          </View>
          <View className={ROW_CLASS}>
            <Text
              variant={wholesale ? 'label' : 'caption'}
              className={`min-w-0 shrink ${wholesale ? 'font-normal text-muted-foreground' : 'text-subtle-foreground'}`}
            >
              {taxLabel}
            </Text>
            <Text
              variant={wholesale ? 'label' : 'caption'}
              className={`shrink-0 tabular-nums ${wholesale ? 'font-normal text-foreground' : 'text-subtle-foreground'}`}
            >
              {formatVND(totals.taxTotal)}
            </Text>
          </View>
          <View className="my-1 h-px bg-border-strong" />
        </>
      ) : null}

      <View className={ROW_CLASS}>
        <Text variant="label" className="min-w-0 shrink font-normal text-muted-foreground">{t('pos.cart.grandTotal')}</Text>
        <Text variant="title" className="shrink-0 font-bold tabular-nums text-foreground">{formatVND(totals.total)}</Text>
      </View>
    </View>
  );
}
