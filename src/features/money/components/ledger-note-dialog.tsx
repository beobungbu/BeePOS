import { useState } from 'react';
import { View } from 'react-native';
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
  Text,
  useToast,
} from '@beemvp/beeui-ui';
import { balanceFor } from '../../../domain/ledger';
import { formatVND } from '../../../domain/money';
import type { LedgerParty } from '../../../domain/types';
import { useLedgerStore } from '../../../data/ledger-store';
import { currentOrgId, useSessionStore } from '../../../data/session-store';
import { useT } from '../../../i18n';
import { fill } from '../../orders/lib/fill';
import { MoneyInput } from '../../pos/components/money-input';

type NoteKind = 'credit_note' | 'debit_note';

/** A party the note can be raised against. */
export interface NoteCandidate {
  id: string;
  name: string;
}

/**
 * A credit or debit note typed in by a manager: goods taken back outside the return flow, a
 * discount agreed after the bill went out, a delivery fee added on.
 *
 * The return flow writes its own credit note through `useLedgerStore.createCreditNote`, so
 * this is only for the adjustments no document explains. Both directions live in one dialog
 * because they differ by a sign and by nothing else, and the party is picked inside the dialog
 * so the action can sit in the toolbar rather than being repeated on every row.
 */
export function LedgerNoteDialog({
  open,
  party,
  candidates,
  onClose,
}: {
  open: boolean;
  party: LedgerParty;
  candidates: NoteCandidate[];
  onClose: () => void;
}) {
  const t = useT();
  const toast = useToast();
  const entries = useLedgerStore((state) => state.entries);
  const addManualNote = useLedgerStore((state) => state.addManualNote);
  const staff = useSessionStore((state) => state.staff);
  const store = useSessionStore((state) => state.store);

  const [partyId, setPartyId] = useState('');
  const [kind, setKind] = useState<NoteKind>('credit_note');
  const [amountDigits, setAmountDigits] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | undefined>();

  const amount = Number(amountDigits) || 0;
  const balance = partyId ? balanceFor(entries, party, partyId) : 0;
  const balanceAfter = kind === 'credit_note' ? balance - amount : balance + amount;

  function handleClose() {
    setPartyId('');
    setKind('credit_note');
    setAmountDigits('');
    setNote('');
    setError(undefined);
    onClose();
  }

  function handleConfirm() {
    if (!staff || !store) return;
    if (!partyId) {
      setError(t('money.note.errorParty'));
      return;
    }
    if (amount <= 0) {
      setError(t('money.note.errorAmount'));
      return;
    }
    const entry = addManualNote({
      orgId: currentOrgId(),
      storeId: store.id,
      party,
      partyId,
      kind,
      amount,
      note: note.trim() || undefined,
    });
    if (!entry) {
      setError(t('money.note.errorAmount'));
      return;
    }
    toast.show({
      title: fill(t('money.note.savedToast'), { amount: formatVND(amount) }),
      variant: 'success',
    });
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="w-full max-w-[440px] gap-3">
        <DialogTitle>{t('money.note.title')}</DialogTitle>

        <Field label={t('money.note.partyLabel')} required>
          <Select value={partyId} onValueChange={setPartyId}>
            <SelectTrigger accessibilityLabel={t('money.note.partyLabel')}>
              <SelectValue placeholder={t('money.note.partyLabel')} />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((candidate) => (
                <SelectItem key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label={t('money.note.kindLabel')}>
          <SegmentedControl
            value={kind}
            onValueChange={(value) => setKind(value as NoteKind)}
            accessibilityLabel={t('money.note.kindLabel')}
          >
            <SegmentedControlItem value="credit_note">{t('money.note.credit')}</SegmentedControlItem>
            <SegmentedControlItem value="debit_note">{t('money.note.debit')}</SegmentedControlItem>
          </SegmentedControl>
        </Field>

        <Text variant="caption" className="text-muted-foreground">
          {t(kind === 'credit_note' ? 'money.note.creditHint' : 'money.note.debitHint')}
        </Text>

        <Field label={t('money.note.amountLabel')} required invalid={Boolean(error)} error={error}>
          <MoneyInput value={amountDigits} onChangeText={setAmountDigits} />
        </Field>

        <Field label={t('money.note.noteLabel')}>
          <Input value={note} onChangeText={setNote} accessibilityLabel={t('money.note.noteLabel')} />
        </Field>

        <View className="flex-row items-center justify-between gap-3 rounded-lg bg-surface-muted p-3">
          <Text variant="label" className="font-semibold text-foreground">
            {t('money.note.balanceAfter')}
          </Text>
          <Text variant="label" numeric="tabular" className="font-bold text-foreground">
            {formatVND(balanceAfter)}
          </Text>
        </View>

        <DialogFooter>
          <Button variant="outline" onPress={handleClose}>
            {t('money.note.cancel')}
          </Button>
          <Button onPress={handleConfirm}>{t('money.note.confirm')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
