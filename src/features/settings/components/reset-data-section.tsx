import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  ListGroup,
  Section,
  SettingsItem,
  useToast,
} from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { resetDemoData } from '../../../data/persistence-bootstrap';

/**
 * Throws away everything the app persisted and reseeds, which is how a demo gets back to a
 * known state after a session of editing prices and refunding orders.
 *
 * Same controlled-`AlertDialog` shape as the logout section, and for the same reason: nesting
 * an `AlertDialogTrigger` inside `SettingsItem`'s own pressable produced a nested `<button>`
 * warning (`docs/beeui-audit/findings-00-scaffold.md`, scaffold-05). The confirm names what is
 * lost, per the destructive-confirm rule in the direction doc.
 */
export function ResetDataSection() {
  const t = useT();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    if (busy) return;
    setBusy(true);
    try {
      await resetDemoData();
      toast.show({ title: t('settings.resetData.successToast'), variant: 'success' });
    } catch (error) {
      // Storage can refuse a write (private mode, a full quota); saying so beats a screen that
      // silently keeps the old data while the cashier believes it was reset.
      console.error('Reset demo data failed', error);
      toast.show({ title: t('settings.resetData.errorToast'), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title={t('settings.section.data')}>
      <ListGroup>
        <SettingsItem
          description={t('settings.resetData.description')}
          disabled={busy}
          onPress={() => setOpen(true)}
          title={t('settings.resetData.action')}
        />
      </ListGroup>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('settings.resetData.confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('settings.resetData.confirmDescription')}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onPress={handleConfirm}>{t('settings.resetData.confirmAction')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
  );
}
