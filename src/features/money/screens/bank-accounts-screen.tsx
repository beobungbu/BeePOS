import { useState } from 'react';
import { View } from 'react-native';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  ListGroup,
  ListItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  useToast,
} from '@beemvp/beeui-ui';
import type { BankAccount } from '../../../domain/types';
import { makeBankAccountId, useLedgerStore } from '../../../data/ledger-store';
import { currentOrgId } from '../../../data/session-store';
import { useScreenHeader } from '../../../components/shell/screen-header';
import { Toolbar } from '../../../components/toolbar';
import { useBreakpoint } from '../../../hooks/use-breakpoint';
import { useT } from '../../../i18n';
import { fill } from '../../orders/lib/fill';
import { MoneyScreen } from '../components/money-screen';

interface AccountDraft {
  id?: string;
  name: string;
  bank: string;
  number: string;
}

const EMPTY_DRAFT: AccountDraft = { name: '', bank: '', number: '' };

/**
 * `/money/banks`: the accounts a transfer can land in or be paid from. Small enough to be a
 * list plus one dialog; the collection and payment dialogs pick from exactly this list, which
 * is why an empty list there sends the manager here.
 */
export function BankAccountsScreen() {
  const t = useT();
  const toast = useToast();
  const isWide = useBreakpoint() !== 'phone';
  const bankAccounts = useLedgerStore((state) => state.bankAccounts);
  const upsertBankAccount = useLedgerStore((state) => state.upsertBankAccount);

  const [draft, setDraft] = useState<AccountDraft | null>(null);
  const [error, setError] = useState<string | undefined>();

  useScreenHeader({
    title: t('money.banks.title'),
    subtitle: fill(t('money.banks.subtitle'), { count: bankAccounts.length }),
  });

  function handleSave() {
    if (!draft) return;
    const name = draft.name.trim();
    const bank = draft.bank.trim();
    const number = draft.number.trim();
    if (!name || !bank || !number) {
      setError(t('money.banks.errorRequired'));
      return;
    }
    const account: BankAccount = {
      id: draft.id ?? makeBankAccountId(),
      orgId: currentOrgId(),
      name,
      bank,
      number,
    };
    upsertBankAccount(account);
    toast.show({ title: t('money.banks.savedToast'), variant: 'success' });
    setDraft(null);
    setError(undefined);
  }

  return (
    <MoneyScreen>
      <Toolbar
        actions={<Button onPress={() => setDraft(EMPTY_DRAFT)}>{t('money.banks.add')}</Button>}
      />

      {bankAccounts.length === 0 ? (
        <EmptyState title={t('money.banks.empty')} description="" />
      ) : isWide ? (
        <Table layout="scroll">
          <TableHeader>
            <TableRow>
              <TableHead label={t('money.banks.columns.name')}>{t('money.banks.columns.name')}</TableHead>
              <TableHead label={t('money.banks.columns.bank')}>{t('money.banks.columns.bank')}</TableHead>
              <TableHead label={t('money.banks.columns.number')}>{t('money.banks.columns.number')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bankAccounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell label={t('money.banks.columns.name')}>
                  <Button
                    variant="ghost"
                    accessibilityLabel={`${t('money.banks.edit')} ${account.name}`}
                    onPress={() =>
                      setDraft({ id: account.id, name: account.name, bank: account.bank, number: account.number })
                    }
                  >
                    {account.name}
                  </Button>
                </TableCell>
                <TableCell label={t('money.banks.columns.bank')}>
                  <Text variant="label">{account.bank}</Text>
                </TableCell>
                <TableCell label={t('money.banks.columns.number')}>
                  <Text variant="label" numeric="tabular">{account.number}</Text>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <ListGroup>
          {bankAccounts.map((account) => (
            <ListItem
              key={account.id}
              title={account.name}
              description={`${account.bank} · ${account.number}`}
              onPress={() =>
                setDraft({ id: account.id, name: account.name, bank: account.bank, number: account.number })
              }
            />
          ))}
        </ListGroup>
      )}

      <Dialog
        open={draft !== null}
        onOpenChange={(next) => {
          if (!next) {
            setDraft(null);
            setError(undefined);
          }
        }}
      >
        <DialogContent className="w-full max-w-[440px] gap-3">
          <DialogTitle>{draft?.id ? t('money.banks.edit') : t('money.banks.add')}</DialogTitle>
          <View className="gap-3">
            <Field label={t('money.banks.nameLabel')} required invalid={Boolean(error)} error={error}>
              <Input
                value={draft?.name ?? ''}
                onChangeText={(name) => setDraft((current) => (current ? { ...current, name } : current))}
              />
            </Field>
            <Field label={t('money.banks.bankLabel')} required>
              <Input
                value={draft?.bank ?? ''}
                onChangeText={(bank) => setDraft((current) => (current ? { ...current, bank } : current))}
              />
            </Field>
            <Field label={t('money.banks.numberLabel')} required>
              <Input
                value={draft?.number ?? ''}
                onChangeText={(number) => setDraft((current) => (current ? { ...current, number } : current))}
                keyboardType="numbers-and-punctuation"
              />
            </Field>
          </View>
          <DialogFooter>
            <Button
              variant="outline"
              onPress={() => {
                setDraft(null);
                setError(undefined);
              }}
            >
              {t('money.banks.cancel')}
            </Button>
            <Button onPress={handleSave}>{t('money.banks.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MoneyScreen>
  );
}
