import { View } from 'react-native';
import { Button, ButtonLabel } from '@beemvp/beeui-ui';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';

const DENOMINATIONS = [50000, 100000, 200000, 500000];

interface QuickCashChipsProps {
  remaining: number;
  onPick: (amount: number) => void;
}

/** Quick-fill amount buttons for cash payment, plus an "exact remaining amount" shortcut. */
export function QuickCashChips({ remaining, onPick }: QuickCashChipsProps) {
  const t = useT();
  return (
    <View className="flex-row flex-wrap gap-2">
      <Button variant="outline" size="sm" onPress={() => onPick(remaining)}>
        <ButtonLabel>{t('pos.checkout.exact')}</ButtonLabel>
      </Button>
      {DENOMINATIONS.map((amount) => (
        <Button key={amount} variant="outline" size="sm" onPress={() => onPick(amount)}>
          <ButtonLabel>{formatVND(amount)}</ButtonLabel>
        </Button>
      ))}
    </View>
  );
}
