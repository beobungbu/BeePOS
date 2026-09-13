import { useState } from 'react';
import { useToast } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { recordCashMovement } from '../../../data/cash-movement-store';
import {
  draftAmount,
  EMPTY_CASH_DRAFT,
  type CashMovementDraft,
} from '../components/cash-movement-form';

export interface CashMovementSubmit {
  draft: CashMovementDraft;
  setDraft: (draft: CashMovementDraft) => void;
  /** Set when the last submit was refused; cleared by the next successful one. */
  error?: string;
  submit: () => void;
}

/**
 * The submit half of the cash sheet, shared by the phone route and the desktop dialog so the
 * two cannot record a movement differently. The refusal is turned into the field error the
 * form shows: a submit that silently does nothing is how a cashier ends up recording the same
 * amount three times.
 */
export function useCashMovementSubmit(
  shiftId: string | undefined,
  onDone: () => void,
): CashMovementSubmit {
  const t = useT();
  const toast = useToast();
  const [draft, setDraft] = useState<CashMovementDraft>(EMPTY_CASH_DRAFT);
  const [error, setError] = useState<string | undefined>(undefined);

  function submit() {
    if (!shiftId) {
      setError(t('chain.cash.errorSession'));
      return;
    }
    const result = recordCashMovement({
      shiftId,
      type: draft.type,
      amount: draftAmount(draft),
      reason: draft.reason,
      note: draft.note,
      reasonLabel: t(`chain.cash.reasons.${draft.reason}`),
    });
    if (!result.ok) {
      setError(result.reason === 'invalid_amount' ? t('chain.cash.errorAmount') : t('chain.cash.errorSession'));
      return;
    }
    setDraft(EMPTY_CASH_DRAFT);
    setError(undefined);
    toast.show({ title: t('chain.cash.savedToast'), variant: 'success' });
    onDone();
  }

  return { draft, setDraft, error, submit };
}
