import { useState } from 'react';
import { View } from 'react-native';
import { Box, Button, ButtonLabel, Card, Field, Input, Text } from '@beemvp/beeui-ui';
import { calcChange, pointsToVnd } from '../../../domain/pos';
import { formatVND } from '../../../domain/money';
import type { Customer, Payment, PaymentMethod } from '../../../domain/types';
import { useT } from '../../../i18n';
import { QuickCashChips } from './quick-cash-chips';

interface PaymentMethodPanelProps {
  method: PaymentMethod;
  remaining: number;
  customer: Customer | undefined;
  onAddPayment: (payment: Payment) => void;
}

/**
 * Rendered with `key={method}` by the checkout screen so switching tabs remounts this
 * component and clears its per-method input state instead of leaking it across methods.
 */
export function PaymentMethodPanel({ method, remaining, customer, onAddPayment }: PaymentMethodPanelProps) {
  const t = useT();
  const [amountText, setAmountText] = useState(method === 'cash' ? '' : String(remaining));
  const [refText, setRefText] = useState('');
  const [pointsText, setPointsText] = useState('');

  const parsedAmount = Number.parseFloat(amountText) || 0;
  const dueAmount = Math.max(0, Math.min(remaining, parsedAmount));

  if (method === 'cash') {
    const change = calcChange(dueAmount, parsedAmount);
    return (
      <View className="gap-3">
        <QuickCashChips remaining={remaining} onPick={(amount) => setAmountText(String(amount))} />
        <Field label={t('pos.checkout.amountReceived')}>
          <Input value={amountText} onChangeText={setAmountText} keyboardType="numeric" placeholder="0" />
        </Field>
        {parsedAmount > 0 && (
          <Text className="text-sm text-muted-foreground">
            {t('pos.checkout.changeDue')}: {formatVND(change)}
          </Text>
        )}
        <Button
          disabled={parsedAmount <= 0}
          onPress={() => {
            onAddPayment({ method: 'cash', amount: dueAmount, ref: `tendered=${parsedAmount}` });
            setAmountText('');
          }}
        >
          <ButtonLabel>{t('pos.checkout.addPayment')}</ButtonLabel>
        </Button>
      </View>
    );
  }

  if (method === 'transfer') {
    return (
      <View className="gap-3">
        <Card padding="sm" className="gap-2">
          <Text className="text-sm font-medium text-foreground">{t('pos.checkout.transferInfo')}</Text>
          <Box className="h-32 w-32 flex-row flex-wrap self-center border border-border">
            {Array.from({ length: 64 }).map((_, i) => (
              <View key={i} className={`h-[12.5%] w-[12.5%] ${(i * 7) % 5 === 0 ? 'bg-foreground' : 'bg-background'}`} />
            ))}
          </Box>
          <Text className="text-xs text-muted-foreground">
            {t('pos.checkout.bankName')}: Vietcombank · {t('pos.checkout.accountNumber')}: 0123456789
          </Text>
          <Text className="text-xs text-muted-foreground">{t('pos.checkout.accountHolder')}: BeePOS Store</Text>
        </Card>
        <Field label={t('pos.checkout.transferAmount')}>
          <Input value={amountText} onChangeText={setAmountText} keyboardType="numeric" placeholder="0" />
        </Field>
        <Button
          disabled={parsedAmount <= 0}
          onPress={() => {
            onAddPayment({ method: 'transfer', amount: dueAmount });
            setAmountText('');
          }}
        >
          <ButtonLabel>{t('pos.checkout.addPayment')}</ButtonLabel>
        </Button>
      </View>
    );
  }

  if (method === 'card') {
    return (
      <View className="gap-3">
        <Text className="text-sm text-muted-foreground">{t('pos.checkout.cardNote')}</Text>
        <Field label={t('pos.checkout.cardAmount')}>
          <Input value={amountText} onChangeText={setAmountText} keyboardType="numeric" placeholder="0" />
        </Field>
        <Field label={t('pos.checkout.cardRef')}>
          <Input value={refText} onChangeText={setRefText} placeholder="—" />
        </Field>
        <Button
          disabled={parsedAmount <= 0}
          onPress={() => {
            onAddPayment({ method: 'card', amount: dueAmount, ref: refText.trim() || undefined });
            setAmountText('');
            setRefText('');
          }}
        >
          <ButtonLabel>{t('pos.checkout.addPayment')}</ButtonLabel>
        </Button>
      </View>
    );
  }

  // method === 'points'
  if (!customer) {
    return <Text className="text-sm text-destructive">{t('pos.checkout.needCustomerForPoints')}</Text>;
  }

  const parsedPoints = Math.max(0, Math.floor(Number.parseFloat(pointsText) || 0));
  const exceedsBalance = parsedPoints > customer.points;
  const clampedPoints = Math.min(parsedPoints, customer.points);
  const pointsDue = Math.max(0, Math.min(remaining, pointsToVnd(clampedPoints)));

  return (
    <View className="gap-3">
      <Text className="text-sm text-muted-foreground">
        {t('pos.checkout.pointsAvailable')}: {customer.points}
      </Text>
      <Field label={t('pos.checkout.pointsAmount')}>
        <Input value={pointsText} onChangeText={setPointsText} keyboardType="numeric" placeholder="0" />
      </Field>
      {exceedsBalance && <Text className="text-sm text-destructive">{t('pos.checkout.pointsInsufficient')}</Text>}
      <Button
        disabled={clampedPoints <= 0}
        onPress={() => {
          onAddPayment({ method: 'points', amount: pointsDue, ref: `points=${clampedPoints}` });
          setPointsText('');
        }}
      >
        <ButtonLabel>{t('pos.checkout.addPayment')}</ButtonLabel>
      </Button>
    </View>
  );
}
