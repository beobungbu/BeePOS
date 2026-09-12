import { Fragment } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  Button,
} from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { fill } from '../lib/fill';

/**
 * Voiding is destructive, so the confirmation names the object it destroys
 * (`docs/design/design-direction.md` section 10: `Huỷ đơn HD20260912-0007?`).
 */
export function VoidAlertDialog({
  open,
  onOpenChange,
  onConfirm,
  disabled,
  code,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  disabled: boolean;
  code: string;
}) {
  const t = useT();

  return (
    <Fragment>
      <Button
        accessibilityHint={disabled ? t('orders.voidDialog.triggerDisabledHint') : undefined}
        disabled={disabled}
        onPress={() => onOpenChange(true)}
        variant="outline"
      >
        {t('orders.actions.void')}
      </Button>
      <AlertDialog onOpenChange={onOpenChange} open={open}>
        <AlertDialogContent>
          <AlertDialogTitle>{fill(t('orders.voidDialog.confirmTitleWithCode'), { code })}</AlertDialogTitle>
          <AlertDialogDescription>{t('orders.voidDialog.confirmDescription')}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('orders.voidDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onPress={onConfirm}>{t('orders.voidDialog.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Fragment>
  );
}
