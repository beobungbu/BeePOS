import { Pressable, View } from 'react-native';
import {
  Chip,
  ChipGroup,
  Field,
  Input,
  SegmentedControl,
  SegmentedControlItem,
  Text,
} from '@beemvp/beeui-ui';
import { formatAmount, formatVND } from '../../../domain/money';
import type { CashMovementType } from '../../../domain/types';
import { useT } from '../../../i18n';
import { CASH_REASONS, type CashReason } from '../../../data/cash-movement-store';
import { MoneyInput } from './money-input';

/** The notes a shop moves in and out of a till in one go. */
const QUICK_AMOUNTS = [200_000, 500_000, 1_000_000, 2_000_000];

export interface CashMovementDraft {
  type: CashMovementType;
  /** Digits only, no separators, as `MoneyInput` keeps them. */
  amountDigits: string;
  reason: CashReason;
  note: string;
}

export const EMPTY_CASH_DRAFT: CashMovementDraft = {
  type: 'in',
  amountDigits: '',
  reason: 'deposit',
  note: '',
};

/** Whole dong of a draft; 0 when nothing has been typed. */
export function draftAmount(draft: CashMovementDraft): number {
  const value = Number(draft.amountDigits);
  return Number.isFinite(value) ? value : 0;
}

/** The drawer after this movement is booked. */
export function drawerAfterDraft(expectedCash: number, draft: CashMovementDraft): number {
  const amount = draftAmount(draft);
  return draft.type === 'in' ? expectedCash + amount : expectedCash - amount;
}

interface CashMovementFormProps {
  draft: CashMovementDraft;
  onChange: (draft: CashMovementDraft) => void;
  /** Cash the drawer should hold right now, before this movement. */
  expectedCash: number;
  /** Shown under the amount when a submit was refused. */
  error?: string;
}

/**
 * The cash in / out form (`docs/design/mockups/chain-ops.html` section 5). One form for both
 * directions and both devices: the phone puts it on a pushed route and the desktop in a
 * dialog, but a cashier who learned it on one is not learning it again on the other.
 *
 * The drawer before and after is on the form rather than only on the button, because the
 * number the cashier is checking is the one they will count later, and a confirmation that
 * only appears on a button is a confirmation nobody reads.
 */
export function CashMovementForm({ draft, onChange, expectedCash, error }: CashMovementFormProps) {
  const t = useT();
  const after = drawerAfterDraft(expectedCash, draft);

  return (
    <View className="gap-4">
      <SegmentedControl
        value={draft.type}
        onValueChange={(value) => onChange({ ...draft, type: value as CashMovementType })}
        accessibilityLabel={t('chain.cash.typeLabel')}
      >
        <SegmentedControlItem value="in">{t('chain.cash.typeIn')}</SegmentedControlItem>
        <SegmentedControlItem value="out">{t('chain.cash.typeOut')}</SegmentedControlItem>
      </SegmentedControl>

      <Field label={t('chain.cash.amountLabel')} required invalid={Boolean(error)} error={error}>
        <MoneyInput
          value={draft.amountDigits}
          onChangeText={(amountDigits) => onChange({ ...draft, amountDigits })}
        />
      </Field>

      <View className="flex-row flex-wrap gap-2">
        {QUICK_AMOUNTS.map((amount) => (
          <Pressable
            key={amount}
            onPress={() => onChange({ ...draft, amountDigits: String(amount) })}
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

      <View className="gap-2">
        <Text variant="label" className="font-medium text-foreground">{t('chain.cash.reasonLabel')}</Text>
        <ChipGroup
          className="flex-row flex-wrap gap-2"
          selectionMode="single"
          value={draft.reason}
          onValueChange={(value) => onChange({ ...draft, reason: value as CashReason })}
        >
          {CASH_REASONS.map((reason) => (
            <Chip key={reason} value={reason}>
              {t(`chain.cash.reasons.${reason}`)}
            </Chip>
          ))}
        </ChipGroup>
        <Input
          value={draft.note}
          onChangeText={(note) => onChange({ ...draft, note })}
          placeholder={t('chain.cash.notePlaceholder')}
          accessibilityLabel={t('chain.cash.noteLabel')}
        />
      </View>

      <View className="gap-1.5 rounded-lg bg-surface-muted p-3">
        <View className="flex-row items-center justify-between gap-3">
          <Text variant="label" className="font-normal text-muted-foreground">
            {t('chain.cash.drawerNow')}
          </Text>
          <Text variant="label" numeric="tabular" className="font-semibold text-foreground">
            {formatVND(expectedCash)}
          </Text>
        </View>
        <View className="flex-row items-center justify-between gap-3">
          <Text variant="label" className="font-normal text-muted-foreground">
            {t('chain.cash.drawerAfter')}
          </Text>
          <Text
            variant="label"
            numeric="tabular"
            className={`font-bold ${draft.type === 'in' ? 'text-success' : 'text-foreground'}`}
          >
            {formatVND(after)}
          </Text>
        </View>
      </View>
    </View>
  );
}
