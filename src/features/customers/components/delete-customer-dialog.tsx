import { Fragment } from 'react';
import {
  AlertBanner,
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

export function DeleteCustomerDialog({
  open,
  onOpenChange,
  onConfirm,
  blocked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  blocked: boolean;
}) {
  const t = useT();

  if (blocked) {
    return <AlertBanner description={t('customers.deleteDialog.blockedBanner')} title={t('customers.detail.deleteButton')} variant="warning" />;
  }

  return (
    <Fragment>
      <Button onPress={() => onOpenChange(true)} variant="destructive">
        {t('customers.detail.deleteButton')}
      </Button>
      <AlertDialog onOpenChange={onOpenChange} open={open}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('customers.deleteDialog.confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('customers.deleteDialog.confirmDescription')}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('customers.deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onPress={onConfirm}>{t('customers.deleteDialog.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Fragment>
  );
}
