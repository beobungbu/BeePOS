import { View } from 'react-native';
import { Field, Input, Text } from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import { formatVND } from '../../../domain/money';
import type { Customer, PaymentMethod } from '../../../domain/types';
import { useT } from '../../../i18n';
import type { PaymentDraft } from '../lib/payment-draft';
import { MoneyInput } from './money-input';
import { QuickCashChips } from './quick-cash-chips';

interface PaymentMethodPanelProps {
  method: PaymentMethod;
  remaining: number;
  customer: Customer | undefined;
  draft: PaymentDraft;
  amountText: string;
  onAmountChange: (value: string) => void;
  refText: string;
  onRefChange: (value: string) => void;
  pointsText: string;
  onPointsChange: (value: string) => void;
  storeName?: string;
}

/**
 * The inputs for the selected method. The panel only edits text: the payment itself is
 * derived by `draftPayment`, so the screen's one primary button can decide between adding a
 * partial payment and completing the order without this component knowing about either.
 */
export function PaymentMethodPanel({
  method,
  remaining,
  customer,
  draft,
  amountText,
  onAmountChange,
  refText,
  onRefChange,
  pointsText,
  onPointsChange,
  storeName,
}: PaymentMethodPanelProps) {
  const t = useT();

  if (method === 'cash') {
    const tendered = Number.parseFloat(amountText) || 0;
    return (
      <View className="gap-3">
        <Field label={t('pos.checkout.tendered')}>
          <MoneyInput value={amountText} onChangeText={onAmountChange} />
        </Field>
        <QuickCashChips remaining={remaining} onPick={(amount) => onAmountChange(String(amount))} />
        {tendered > 0 ? (
          <View
            className={`flex-row items-center justify-between rounded-md px-4 py-3 ${
              draft.settlesBalance ? 'bg-success/10' : 'bg-destructive/10'
            }`}
          >
            <Text className="text-label text-muted-foreground">
              {draft.settlesBalance ? t('pos.checkout.changeDue') : t('pos.checkout.remaining')}
            </Text>
            <Text
              className={`text-title font-bold tabular-nums ${
                draft.settlesBalance ? 'text-success' : 'text-destructive'
              }`}
            >
              {formatVND(draft.settlesBalance ? draft.change : remaining - tendered)}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  if (method === 'transfer') {
    return (
      <View className="gap-3">
        <Field label={t('pos.checkout.transferAmount')}>
          <MoneyInput value={amountText} onChangeText={onAmountChange} />
        </Field>
        <View className="items-center gap-3 rounded-lg border border-border bg-surface p-4">
          <View className="h-28 w-28 items-center justify-center rounded-md bg-muted">
            <AppIcon name="qr-code" size={72} tone="muted-foreground" />
          </View>
          <Text className="text-label font-semibold text-foreground">
            {`${t('pos.checkout.qrTitle')} ${formatVND(draft.payment?.amount ?? remaining)}`}
          </Text>
          <Text className="text-caption text-muted-foreground">
            {`${t('pos.checkout.bankName')}: Vietcombank · 0011 0023 4567`}
          </Text>
          <Text className="text-caption text-muted-foreground">
            {`${t('pos.checkout.accountHolder')}: ${storeName ?? 'BeePOS'}`}
          </Text>
        </View>
      </View>
    );
  }

  if (method === 'card') {
    return (
      <View className="gap-3">
        <Field label={t('pos.checkout.cardAmount')}>
          <MoneyInput value={amountText} onChangeText={onAmountChange} />
        </Field>
        <Field label={t('pos.checkout.cardRef')}>
          <Input value={refText} onChangeText={onRefChange} placeholder="0000" />
        </Field>
        <Text className="text-caption text-muted-foreground">{t('pos.checkout.cardNote')}</Text>
      </View>
    );
  }

  if (!customer) {
    return (
      <View className="rounded-md bg-destructive/10 px-4 py-3">
        <Text className="text-label text-destructive">{t('pos.checkout.needCustomerForPoints')}</Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <Field label={t('pos.checkout.pointsAmount')}>
        <Input
          value={pointsText}
          onChangeText={onPointsChange}
          keyboardType="numeric"
          placeholder="0"
          className="text-right tabular-nums"
        />
      </Field>
      <View className="flex-row items-center justify-between">
        <Text className="text-caption text-muted-foreground">{t('pos.checkout.pointsAvailable')}</Text>
        <Text className="text-caption font-semibold tabular-nums text-foreground">{customer.points}</Text>
      </View>
      {draft.exceedsPoints ? (
        <Text className="text-caption text-destructive">{t('pos.checkout.pointsInsufficient')}</Text>
      ) : null}
    </View>
  );
}
