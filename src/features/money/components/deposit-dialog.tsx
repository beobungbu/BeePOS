import { useState } from 'react';
import { View } from 'react-native';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Field,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  useToast,
} from '@beemvp/beeui-ui';
import { formatVND } from '../../../domain/money';
import { useLedgerStore } from '../../../data/ledger-store';
import { currentOrgId, useSessionStore } from '../../../data/session-store';
import { useT } from '../../../i18n';
import { fill } from '../../orders/lib/fill';
import { MoneyInput } from '../../pos/components/money-input';

/**
 * Cash carried from the till to the bank. It is the one bank row that belongs in the cash
 * book, because the notes really did leave the drawer, which is why the dialog leads with what
 * the drawer holds now and what it will hold afterwards.
 */
export function DepositDialog({
  open,
  storeId,
  drawerBalance,
  onClose,
}: {
  open: boolean;
  storeId: string;
  /** Cash the branch's book says is in the till right now. */
  drawerBalance: number;
  onClose: () => void;
}) {
  const t = useT();
  const toast = useToast();
  const bankAccounts = useLedgerStore((state) => state.bankAccounts);
  const deposit = useLedgerStore((state) => state.deposit);
  const staff = useSessionStore((state) => state.staff);

  const [amountDigits, setAmountDigits] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [error, setError] = useState<string | undefined>();

  const amount = Number(amountDigits) || 0;

  function handleClose() {
    setAmountDigits('');
    setBankAccountId('');
    setError(undefined);
    onClose();
  }

  function handleConfirm() {
    if (!staff) return;
    if (amount <= 0) {
      setError(t('money.deposit.errorAmount'));
      return;
    }
    if (!bankAccountId) {
      setError(t('money.deposit.errorAccount'));
      return;
    }
    const entry = deposit({
      orgId: currentOrgId(),
      storeId,
      amount,
      bankAccountId,
      staffId: staff.id,
    });
    if (!entry) {
      setError(t('money.deposit.errorAmount'));
      return;
    }
    toast.show({
      title: fill(t('money.deposit.savedToast'), { amount: formatVND(amount) }),
      variant: 'success',
    });
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="w-full max-w-[440px] gap-3">
        <DialogTitle>{t('money.deposit.title')}</DialogTitle>

        <Field label={t('money.deposit.amountLabel')} required invalid={Boolean(error)} error={error}>
          <MoneyInput value={amountDigits} onChangeText={setAmountDigits} />
        </Field>

        {bankAccounts.length === 0 ? (
          <Text variant="caption" className="text-warning">
            {t('money.deposit.noAccounts')}
          </Text>
        ) : (
          <Field label={t('money.deposit.accountLabel')} required>
            <Select value={bankAccountId} onValueChange={setBankAccountId}>
              <SelectTrigger accessibilityLabel={t('money.deposit.accountLabel')}>
                <SelectValue placeholder={t('money.deposit.accountLabel')} />
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
        )}

        <View className="gap-1.5 rounded-lg bg-surface-muted p-3">
          <View className="flex-row items-center justify-between gap-3">
            <Text variant="label" className="font-normal text-muted-foreground">
              {t('money.deposit.drawerNow')}
            </Text>
            <Text variant="label" numeric="tabular" className="font-semibold text-foreground">
              {formatVND(drawerBalance)}
            </Text>
          </View>
          <View className="flex-row items-center justify-between gap-3">
            <Text variant="label" className="font-normal text-muted-foreground">
              {t('money.deposit.drawerAfter')}
            </Text>
            <Text variant="label" numeric="tabular" className="font-bold text-foreground">
              {formatVND(drawerBalance - amount)}
            </Text>
          </View>
        </View>

        <DialogFooter>
          <Button variant="outline" onPress={handleClose}>
            {t('money.deposit.cancel')}
          </Button>
          <Button onPress={handleConfirm} disabled={bankAccounts.length === 0}>
            {fill(t('money.deposit.confirm'), { amount: formatVND(amount) })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
