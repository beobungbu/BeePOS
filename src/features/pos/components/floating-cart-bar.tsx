import { Pressable, View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';

interface FloatingCartBarProps {
  itemCount: number;
  total: number;
  onPress: () => void;
}

/** Narrow-screen summary bar that opens the cart Sheet; hidden entirely when the cart is empty. */
export function FloatingCartBar({ itemCount, total, onPress }: FloatingCartBarProps) {
  const t = useT();
  if (itemCount === 0) return null;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between border-t border-border bg-primary px-4 py-3"
    >
      <View>
        <Text className="text-sm text-primary-foreground">
          {itemCount} {t('pos.cart.items')}
        </Text>
        <Text className="text-base font-semibold text-primary-foreground">{formatVND(total)}</Text>
      </View>
      <Text className="text-sm font-medium text-primary-foreground">{t('pos.cart.viewCart')}</Text>
    </Pressable>
  );
}
