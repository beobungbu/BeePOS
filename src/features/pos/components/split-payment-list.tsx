import { View } from 'react-native';
import { IconButton, Text } from '@beemvp/beeui-ui';
import { formatVND } from '../../../domain/money';
import type { Payment } from '../../../domain/types';
import { useT } from '../../../i18n';

const METHOD_LABEL_KEY: Record<Payment['method'], string> = {
  cash: 'pos.checkout.methodCash',
  transfer: 'pos.checkout.methodTransfer',
  card: 'pos.checkout.methodCard',
  points: 'pos.checkout.methodPoints',
};

interface SplitPaymentListProps {
  payments: Payment[];
  onRemove: (index: number) => void;
}

export function SplitPaymentList({ payments, onRemove }: SplitPaymentListProps) {
  const t = useT();
  if (payments.length === 0) return null;

  return (
    <View className="gap-2 rounded-lg border border-border p-3">
      <Text className="text-sm font-medium text-foreground">{t('pos.checkout.payments')}</Text>
      {payments.map((payment, index) => (
        <View key={`${payment.method}-${index}`} className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">{t(METHOD_LABEL_KEY[payment.method])}</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-sm text-foreground">{formatVND(payment.amount)}</Text>
            <IconButton
              accessibilityLabel={t('pos.checkout.removePayment')}
              variant="ghost"
              onPress={() => onRemove(index)}
            >
              <Text className="text-destructive">✕</Text>
            </IconButton>
          </View>
        </View>
      ))}
    </View>
  );
}
