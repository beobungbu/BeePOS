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
import { fill } from '../../orders/lib/fill';

/**
 * Deleting is blocked once the customer has orders. That is a permanent property of the
 * record, so it disables the control and explains itself through the accessibility hint; a
 * standing `alert-banner` would break the one-banner rule of the direction doc, section 5.
 */
export function DeleteCustomerDialog({
  open,
  onOpenChange,
  onConfirm,
  blocked,
  name,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  blocked: boolean;
  /** The destructive confirmation names the object it deletes, per the copy rules. */
  name: string;
}) {
  const t = useT();

  return (
    <Fragment>
      <Button
        accessibilityHint={blocked ? t('customers.deleteDialog.blockedBanner') : undefined}
        className="border-destructive"
        disabled={blocked}
        labelClassName="text-destructive"
        onPress={() => onOpenChange(true)}
        variant="outline"
      >
        {t('customers.detail.deleteButton')}
      </Button>
      <AlertDialog onOpenChange={onOpenChange} open={open}>
        <AlertDialogContent>
          <AlertDialogTitle>{fill(t('customers.deleteDialog.confirmTitleWithName'), { name })}</AlertDialogTitle>
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
