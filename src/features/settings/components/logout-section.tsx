import { useState } from 'react';
import { useRouter } from 'expo-router';
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
} from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { useSessionStore } from '../../../data/session-store';

/**
 * Uses a controlled `AlertDialog` (open state owned here) driven by `SettingsItem`'s own
 * `onPress`, instead of nesting an `AlertDialogTrigger` pressable inside `SettingsItem`'s
 * pressable row. Wrapping one interactive BeeUI component inside another produced a nested
 * `<button>` hydration warning during phase 0 (see docs/beeui-audit/findings-00-scaffold.md,
 * finding scaffold-05), so this avoids the same pitfall here.
 */
export function LogoutSection() {
  const t = useT();
  const router = useRouter();
  const logout = useSessionStore((state) => state.logout);
  const [open, setOpen] = useState(false);

  function handleConfirm() {
    logout();
    router.replace('/login');
  }

  return (
    <Section title={t('settings.section.account')}>
      <ListGroup>
        <SettingsItem title={t('settings.logout.action')} onPress={() => setOpen(true)} />
      </ListGroup>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('settings.logout.confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('settings.logout.confirmDescription')}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onPress={handleConfirm}>{t('settings.logout.confirmAction')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
  );
}
