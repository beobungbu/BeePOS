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

export function VoidAlertDialog({
  open,
  onOpenChange,
  onConfirm,
  disabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  disabled: boolean;
}) {
  const t = useT();

  return (
    <Fragment>
      <Button disabled={disabled} onPress={() => onOpenChange(true)} variant="outline">
        {t('orders.actions.void')}
      </Button>
      <AlertDialog onOpenChange={onOpenChange} open={open}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('orders.voidDialog.confirmTitle')}</AlertDialogTitle>
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
