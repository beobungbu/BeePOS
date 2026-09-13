import {
  Button,
  ButtonLabel,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@beemvp/beeui-ui';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';
import { fill } from '../../orders/lib/fill';
import { useCashMovementSubmit } from '../hooks/use-cash-movement';
import { CashMovementForm, draftAmount } from './cash-movement-form';
import { SecondaryButtonLabel } from './secondary-button-label';

interface CashMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftId: string | undefined;
  expectedCash: number;
}

/**
 * Desktop shape of the cash sheet (`docs/design/mockups/chain-ops.html` section 5). The phone
 * gets the pushed `/pos/shift/cash` route instead of a sheet, because BeeUI's `Sheet` does not
 * present on iOS (`docs/beeui-audit/findings-11-native.md`).
 */
export function CashMovementDialog({
  open,
  onOpenChange,
  shiftId,
  expectedCash,
}: CashMovementDialogProps) {
  const t = useT();
  const { draft, setDraft, error, submit } = useCashMovementSubmit(shiftId, () => onOpenChange(false));
  const amount = draftAmount(draft);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[440px] gap-3">
        <DialogTitle>{t('chain.cash.title')}</DialogTitle>
        <CashMovementForm draft={draft} onChange={setDraft} expectedCash={expectedCash} error={error} />
        <DialogFooter>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            <SecondaryButtonLabel>{t('chain.cash.cancel')}</SecondaryButtonLabel>
          </Button>
          <Button onPress={submit}>
            <ButtonLabel>
              {amount > 0
                ? fill(t(draft.type === 'in' ? 'chain.cash.submitIn' : 'chain.cash.submitOut'), {
                    amount: formatVND(amount),
                  })
                : t('chain.cash.submit')}
            </ButtonLabel>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
