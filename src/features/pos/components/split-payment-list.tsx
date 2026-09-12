import { View } from 'react-native';
import { IconButton, Text } from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import { formatVND } from '../../../domain/money';
import type { Payment } from '../../../domain/types';
import { useT } from '../../../i18n';
import { METHOD_ICON, METHOD_LABEL_KEY } from './payment-method-cards';

interface SplitPaymentListProps {
  payments: Payment[];
  remaining: number;
  onRemove: (index: number) => void;
}

/**
 * Payments applied so far, each removable, with the balance in `warning` underneath: split
 * payment is the only place the cashier can lose track of what has actually been taken.
 */
export function SplitPaymentList({ payments, remaining, onRemove }: SplitPaymentListProps) {
  const t = useT();
  if (payments.length === 0) return null;

  return (
    <View className="rounded-lg border border-border bg-surface p-4">
      <Text variant="label" className="font-semibold text-foreground">{t('pos.checkout.paid')}</Text>
      {payments.map((payment, index) => (
        <View
          key={`${payment.method}-${index}`}
          className="min-h-12 flex-row items-center gap-2.5 border-b border-border py-2"
        >
          <AppIcon name={METHOD_ICON[payment.method]} size={18} tone="muted-foreground" />
          <Text variant="label" className="font-normal flex-1 text-foreground">{t(METHOD_LABEL_KEY[payment.method])}</Text>
          <Text variant="label" className="font-bold tabular-nums text-foreground">
            {formatVND(payment.amount)}
          </Text>
          <IconButton
            accessibilityLabel={t('pos.checkout.removePayment')}
            variant="ghost"
            onPress={() => onRemove(index)}
          >
            <AppIcon name="x" size={16} tone="muted-foreground" />
          </IconButton>
        </View>
      ))}
      <View className="flex-row items-center justify-between pt-2.5">
        <Text variant="label" className={`font-semibold ${remaining > 0 ? 'text-warning' : 'text-success'}`}>
          {remaining > 0 ? t('pos.checkout.balance') : t('pos.checkout.fullyPaid')}
        </Text>
        <Text
          variant="heading"
          className={`font-bold tabular-nums ${
            remaining > 0 ? 'text-warning' : 'text-success'
          }`}
        >
          {formatVND(remaining)}
        </Text>
      </View>
    </View>
  );
}
