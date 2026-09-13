import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Field,
  Input,
  SegmentedControl,
  SegmentedControlItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Text,
  useToast,
} from '@beemvp/beeui-ui';
import { balanceFor, openInvoices } from '../../../domain/ledger';
import { formatAmount, formatVND } from '../../../domain/money';
import type { LedgerEntry, LedgerParty } from '../../../domain/types';
import { useLedgerStore } from '../../../data/ledger-store';
import { useOrderStore } from '../../../data/order-store';
import { currentOrgId, useSessionStore } from '../../../data/session-store';
import { useT } from '../../../i18n';
import { fill } from '../../orders/lib/fill';
import { MoneyInput } from '../../pos/components/money-input';
import { allocatePayment, overdueAmount, quickAmounts } from '../lib/allocation';
import { formatDate } from '../../../lib/datetime';

/** Who the money is moving with, and what to call them on the dialog title. */
export interface SettlementTarget {
  party: LedgerParty;
  partyId: string;
  name: string;
}

/** Allocation choice that means "let the ledger apply this oldest invoice first". */
const OLDEST = 'oldest';
const CASH = 'cash';
const TRANSFER = 'transfer';

/**
 * Collecting from a customer and paying a supplier are the same dialog with the direction of
 * the money reversed, which is what the spec asks for: "receivables and payables share one
 * shape". Two dialogs would be two places to fix the allocation rule.
 *
 * The allocation preview is computed with the same rule the ledger applies on read, so the
 * line by line breakdown the cashier confirms is the one the aging table will show afterwards.
 */
export function SettlementDialog({
  target,
  onClose,
}: {
  target: SettlementTarget | null;
  onClose: () => void;
}) {
  const t = useT();
  const toast = useToast();
  const entries = useLedgerStore((state) => state.entries);
  const bankAccounts = useLedgerStore((state) => state.bankAccounts);
  const settle = useLedgerStore((state) => state.settle);
  const orders = useOrderStore((state) => state.orders);
  const staff = useSessionStore((state) => state.staff);
  const store = useSessionStore((state) => state.store);

  const [amountDigits, setAmountDigits] = useState('');
  const [method, setMethod] = useState<typeof CASH | typeof TRANSFER>(CASH);
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [invoiceChoice, setInvoiceChoice] = useState<string>(OLDEST);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | undefined>();

  const isCustomer = target?.party === 'customer';
  const open = useMemo(
    () => (target ? openInvoices(entries, target.party, target.partyId) : []),
    [entries, target],
  );
  const balance = target ? balanceFor(entries, target.party, target.partyId) : 0;
  const overdue = overdueAmount(open);
  const amount = Number(amountDigits) || 0;
  const allocation = allocatePayment(
    open,
    amount,
    balance,
    invoiceChoice === OLDEST ? undefined : invoiceChoice,
  );

  const orderCodeById = useMemo(
    () => new Map(orders.map((order) => [order.id, order.code])),
    [orders],
  );

  function invoiceLabel(entry: LedgerEntry): string {
    if (entry.note) return entry.note;
    if (entry.refType === 'order' && entry.refId) {
      return orderCodeById.get(entry.refId) ?? formatDate(entry.createdAt.toISOString());
    }
    return formatDate(entry.createdAt.toISOString());
  }

  function ageLabel(days: number, hasDueDate: boolean): string {
    if (!hasDueDate) return t('money.settlement.ageNoDue');
    if (days > 0) return fill(t('money.settlement.ageOverdue'), { days });
    return fill(t('money.settlement.ageDue'), { days: Math.abs(days) });
  }

  function handleClose() {
    setAmountDigits('');
    setMethod(CASH);
    setBankAccountId('');
    setInvoiceChoice(OLDEST);
    setNote('');
    setError(undefined);
    onClose();
  }

  function handleConfirm() {
    if (!target || !staff || !store) return;
    if (amount <= 0) {
      setError(t('money.settlement.errorAmount'));
      return;
    }
    if (method === TRANSFER && !bankAccountId) {
      setError(t('money.settlement.errorAccount'));
      return;
    }

    const entry = settle({
      orgId: currentOrgId(),
      storeId: store.id,
      party: target.party,
      partyId: target.partyId,
      amount,
      staffId: staff.id,
      bankAccountId: method === TRANSFER ? bankAccountId : undefined,
      invoiceEntryId: invoiceChoice === OLDEST ? undefined : invoiceChoice,
      note: note.trim() || undefined,
    });
    if (!entry) {
      setError(t('money.settlement.errorAmount'));
      return;
    }

    toast.show({
      title: fill(t(isCustomer ? 'money.settlement.savedCollect' : 'money.settlement.savedPay'), {
        amount: formatVND(amount),
      }),
      variant: 'success',
    });
    handleClose();
  }

  const chips = quickAmounts(balance, overdue);

  return (
    <Dialog open={target !== null} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="w-full max-w-[480px] gap-3">
        <DialogTitle>
          {fill(t(isCustomer ? 'money.settlement.collectTitle' : 'money.settlement.payTitle'), {
            party: target?.name ?? '',
          })}
        </DialogTitle>

        <View className="flex-row items-center justify-between gap-3">
          <Text variant="label" className="font-normal text-muted-foreground">
            {t(isCustomer ? 'money.settlement.balanceCustomer' : 'money.settlement.balanceSupplier')}
          </Text>
          <Text variant="label" numeric="tabular" className="font-bold text-foreground">
            {formatVND(balance)}
          </Text>
        </View>

        <Field
          label={t(isCustomer ? 'money.settlement.amountCollect' : 'money.settlement.amountPay')}
          required
          invalid={Boolean(error)}
          error={error}
        >
          <MoneyInput value={amountDigits} onChangeText={setAmountDigits} />
        </Field>

        <View className="flex-row flex-wrap gap-2">
          {chips.map((value, index) => {
            const label =
              index === 0
                ? t(isCustomer ? 'money.settlement.chipAll' : 'money.settlement.chipAllPay')
                : value === overdue
                  ? fill(t('money.settlement.chipOverdue'), { amount: formatAmount(value) })
                  : formatAmount(value);
            return (
              <Pressable
                key={`${value}-${index}`}
                onPress={() => setAmountDigits(String(value))}
                accessibilityRole="button"
                accessibilityLabel={label}
                className="min-h-11 grow items-center justify-center rounded-md border border-border bg-surface px-3 py-2"
              >
                <Text variant="label" className="font-medium tabular-nums text-foreground">
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Field label={t('money.settlement.methodLabel')}>
          <SegmentedControl
            value={method}
            onValueChange={(value) => setMethod(value as typeof CASH | typeof TRANSFER)}
            accessibilityLabel={t('money.settlement.methodLabel')}
          >
            <SegmentedControlItem value={CASH}>{t('money.settlement.methodCash')}</SegmentedControlItem>
            <SegmentedControlItem value={TRANSFER}>{t('money.settlement.methodTransfer')}</SegmentedControlItem>
          </SegmentedControl>
        </Field>

        {method === TRANSFER ? (
          <Field
            label={t(isCustomer ? 'money.settlement.accountCollect' : 'money.settlement.accountPay')}
            required
          >
            <Select value={bankAccountId} onValueChange={setBankAccountId}>
              <SelectTrigger
                accessibilityLabel={t(
                  isCustomer ? 'money.settlement.accountCollect' : 'money.settlement.accountPay',
                )}
              >
                <SelectValue
                  placeholder={t(
                    isCustomer ? 'money.settlement.accountCollect' : 'money.settlement.accountPay',
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {`${account.bank} · ${account.number}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}

        {open.length > 0 ? (
          <Field label={t('money.settlement.invoiceLabel')}>
            <Select value={invoiceChoice} onValueChange={setInvoiceChoice}>
              <SelectTrigger accessibilityLabel={t('money.settlement.invoiceLabel')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={OLDEST}>{t('money.settlement.invoiceOldest')}</SelectItem>
                {open.map((row) => (
                  <SelectItem key={row.entry.id} value={row.entry.id}>
                    {`${invoiceLabel(row.entry)} · ${formatVND(row.openAmount)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}

        <View className="gap-1.5 rounded-lg bg-surface-muted p-3">
          <Text variant="label" className="font-semibold text-foreground">
            {t(invoiceChoice === OLDEST ? 'money.settlement.allocationTitle' : 'money.settlement.allocationPicked')}
          </Text>
          {allocation.lines.map((line) => {
            const row = open.find((candidate) => candidate.entry.id === line.entryId);
            return (
              <View key={line.entryId} className="flex-row items-center justify-between gap-3">
                <Text variant="caption" className="shrink text-muted-foreground" numberOfLines={1}>
                  {fill(t('money.settlement.allocationRow'), {
                    code: row ? invoiceLabel(row.entry) : line.entryId,
                    age: ageLabel(line.daysOverdue, line.dueDate !== undefined),
                  })}
                </Text>
                <Text variant="caption" numeric="tabular" className="text-foreground">
                  {formatVND(line.applied)}
                </Text>
              </View>
            );
          })}
          {allocation.unapplied > 0 ? (
            <View className="flex-row items-center justify-between gap-3">
              <Text variant="caption" className="shrink text-warning" numberOfLines={2}>
                {t('money.settlement.unapplied')}
              </Text>
              <Text variant="caption" numeric="tabular" className="text-warning">
                {formatVND(allocation.unapplied)}
              </Text>
            </View>
          ) : null}
          <Separator className="my-1" />
          <View className="flex-row items-center justify-between gap-3">
            <Text variant="label" className="font-semibold text-foreground">
              {t(
                isCustomer
                  ? 'money.settlement.balanceAfterCustomer'
                  : 'money.settlement.balanceAfterSupplier',
              )}
            </Text>
            <Text variant="label" numeric="tabular" className="font-bold text-foreground">
              {formatVND(allocation.balanceAfter)}
            </Text>
          </View>
        </View>

        <Field label={t('money.settlement.noteLabel')}>
          <Input value={note} onChangeText={setNote} accessibilityLabel={t('money.settlement.noteLabel')} />
        </Field>

        <DialogFooter>
          <Button variant="outline" onPress={handleClose}>
            {t('money.settlement.cancel')}
          </Button>
          <Button onPress={handleConfirm}>
            {fill(t(isCustomer ? 'money.settlement.confirmCollect' : 'money.settlement.confirmPay'), {
              amount: formatVND(amount),
            })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
