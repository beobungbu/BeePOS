import { View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import { useT } from '../../../i18n';
import { stockLabel } from '../lib/stock-label';

interface StockBadgeProps {
  onHand: number;
  minLevel: number;
  /** Units of this product already in the active order; it takes the badge's corner. */
  inCart?: number;
  /** 3 column phone grid: the pill drops the warning glyph so the word stays on one line. */
  compact?: boolean;
}

/**
 * The tile's stock pill, per `docs/design/design-direction.md` section 5: a caption with a
 * word, never a bare circled number, and the in-cart counter takes the same corner so the
 * cashier sees "this one is already in the order" without opening the cart.
 *
 * The caption step comes from `variant`: a text size in `className` loses to the
 * component's own variant and the pill rendered at body size, which took a third of a tile in
 * the 3 column phone grid (docs/beeui-audit/findings-15-polish.md, 15-02).
 */
export function StockBadge({ onHand, minLevel, inCart = 0, compact = false }: StockBadgeProps) {
  const t = useT();

  if (inCart > 0) {
    return (
      <View className="absolute right-1.5 top-1.5 min-w-6 items-center rounded-full bg-primary px-2 py-0.5">
        <Text variant="caption" numeric="tabular" className="font-bold text-primary-foreground">
          {inCart}
        </Text>
      </View>
    );
  }

  if (onHand <= 0) {
    return (
      <View className="absolute right-1.5 top-1.5 rounded-full bg-destructive px-2 py-0.5">
        <Text variant="caption" numberOfLines={1} className="font-semibold text-primary-foreground">
          {stockLabel(t, onHand, minLevel)}
        </Text>
      </View>
    );
  }

  if (onHand <= minLevel) {
    return (
      <View className="absolute right-1.5 top-1.5 flex-row items-center gap-1 rounded-full bg-warning px-2 py-0.5">
        {compact ? null : <AppIcon name="triangle-alert" size={12} tone="primary-foreground" />}
        <Text
          variant="caption"
          numeric="tabular"
          numberOfLines={1}
          className="font-semibold text-primary-foreground"
        >
          {stockLabel(t, onHand, minLevel)}
        </Text>
      </View>
    );
  }

  return (
    <View className="absolute right-1.5 top-1.5 rounded-full bg-surface px-2 py-0.5">
      <Text variant="caption" numeric="tabular" numberOfLines={1} className="text-muted-foreground">
        {stockLabel(t, onHand, minLevel)}
      </Text>
    </View>
  );
}
