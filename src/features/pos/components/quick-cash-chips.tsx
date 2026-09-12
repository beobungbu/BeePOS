import { Pressable, View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import { formatAmount } from '../../../domain/money';
import { useT } from '../../../i18n';

/** The notes a Vietnamese customer actually hands over. */
const DENOMINATIONS = [100_000, 200_000, 500_000];

interface QuickCashChipsProps {
  remaining: number;
  onPick: (amount: number) => void;
}

/**
 * "Đủ tiền" first and in the neutral strong fill, then the three notes, so the cashier never
 * has to work the amount out (`docs/design/design-direction.md` section 5, payment).
 *
 * The chips grow into the row but keep their content width as the flex base size (`grow`, not
 * `flex-1`): `flex-1` bases every chip at 0, which forced all four onto one line whatever the
 * text size and truncated them to "Đủ ti" at accessibility sizes. With a content base size the
 * row wraps to two lines instead, and the height is a minimum so a wrapped label still fits.
 */
export function QuickCashChips({ remaining, onPick }: QuickCashChipsProps) {
  const t = useT();

  return (
    <View className="flex-row flex-wrap gap-2">
      <Pressable
        onPress={() => onPick(remaining)}
        accessibilityRole="button"
        accessibilityLabel={t('pos.checkout.exact')}
        className="min-h-11 grow items-center justify-center rounded-md bg-secondary px-3 py-2"
      >
        <Text variant="label" className="font-semibold text-secondary-foreground">{t('pos.checkout.exact')}</Text>
      </Pressable>
      {DENOMINATIONS.map((amount) => (
        <Pressable
          key={amount}
          onPress={() => onPick(amount)}
          accessibilityRole="button"
          accessibilityLabel={formatAmount(amount)}
          className="min-h-11 grow items-center justify-center rounded-md border border-border bg-surface px-3 py-2"
        >
          <Text variant="label" className="font-medium tabular-nums text-foreground">
            {formatAmount(amount)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
