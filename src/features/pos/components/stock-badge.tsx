import { View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import { useT } from '../../../i18n';

interface StockBadgeProps {
  onHand: number;
  minLevel: number;
  /** Units of this product already in the active order; it takes the badge's corner. */
  inCart?: number;
}

/**
 * The tile's stock pill, per `docs/design/design-direction.md` section 5: a caption with a
 * word, never a bare circled number, and the in-cart counter takes the same corner so the
 * cashier sees "this one is already in the order" without opening the cart.
 */
export function StockBadge({ onHand, minLevel, inCart = 0 }: StockBadgeProps) {
  const t = useT();

  if (inCart > 0) {
    return (
      <View className="absolute right-1.5 top-1.5 min-w-6 items-center rounded-full bg-primary px-2 py-0.5">
        <Text className="text-caption font-bold tabular-nums text-primary-foreground">{inCart}</Text>
      </View>
    );
  }

  if (onHand <= 0) {
    return (
      <View className="absolute right-1.5 top-1.5 rounded-full bg-destructive px-2 py-0.5">
        <Text className="text-caption font-semibold text-primary-foreground">{t('pos.stockOut')}</Text>
      </View>
    );
  }

  if (onHand <= minLevel) {
    return (
      <View className="absolute right-1.5 top-1.5 flex-row items-center gap-1 rounded-full bg-warning px-2 py-0.5">
        <AppIcon name="triangle-alert" size={12} tone="primary-foreground" />
        <Text className="text-caption font-semibold tabular-nums text-primary-foreground">
          {`${t('pos.stockLow')} ${onHand}`}
        </Text>
      </View>
    );
  }

  return (
    <View className="absolute right-1.5 top-1.5 rounded-full bg-surface px-2 py-0.5">
      <Text className="text-caption tabular-nums text-muted-foreground">
        {`${t('pos.stockOnHand')} ${onHand}`}
      </Text>
    </View>
  );
}
