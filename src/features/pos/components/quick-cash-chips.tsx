import { Pressable, View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';

/** The notes a Vietnamese customer actually hands over. */
const DENOMINATIONS = [100_000, 200_000, 500_000];

const PLAIN_NUMBER = new Intl.NumberFormat('vi-VN');

interface QuickCashChipsProps {
  remaining: number;
  onPick: (amount: number) => void;
}

/**
 * "Đủ tiền" first and in the neutral strong fill, then the three notes, so the cashier never
 * has to work the amount out (`docs/design/design-direction.md` section 5, payment).
 */
export function QuickCashChips({ remaining, onPick }: QuickCashChipsProps) {
  const t = useT();

  return (
    <View className="flex-row flex-wrap gap-2">
      <Pressable
        onPress={() => onPick(remaining)}
        accessibilityRole="button"
        accessibilityLabel={t('pos.checkout.exact')}
        className="h-11 flex-1 items-center justify-center rounded-md bg-secondary px-3"
      >
        <Text variant="label" className="font-semibold text-secondary-foreground">{t('pos.checkout.exact')}</Text>
      </Pressable>
      {DENOMINATIONS.map((amount) => (
        <Pressable
          key={amount}
          onPress={() => onPick(amount)}
          accessibilityRole="button"
          accessibilityLabel={PLAIN_NUMBER.format(amount)}
          className="h-11 flex-1 items-center justify-center rounded-md border border-border bg-surface px-3"
        >
          <Text variant="label" className="font-medium tabular-nums text-foreground">
            {PLAIN_NUMBER.format(amount)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
