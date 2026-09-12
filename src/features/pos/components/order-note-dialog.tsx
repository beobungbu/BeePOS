import { useState } from 'react';
import { View } from 'react-native';
import {
  Button,
  ButtonLabel,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  Textarea,
} from '@beemvp/beeui-ui';
import { SecondaryButtonLabel } from './secondary-button-label';
import { useT } from '../../../i18n';

interface OrderNoteDialogProps {
  note: string | undefined;
  onApply: (note: string) => void;
}

/**
 * The order note behind a button instead of a always-open textarea: the cart pane is 380 pt
 * and a note is written on maybe one order in twenty, so it does not get to spend four lines
 * of the pane. `Dialog` works on every platform; `Sheet` never presents on iOS (BeeUI #584).
 */
export function OrderNoteDialog({ note, onApply }: OrderNoteDialogProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(note ?? '');

  function handleOpenChange(next: boolean) {
    if (next) setDraft(note ?? '');
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger variant="outline" className="flex-1">
        <SecondaryButtonLabel>{t('pos.cart.noteAction')}</SecondaryButtonLabel>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{t('pos.cart.noteTitle')}</DialogTitle>
        <View className="py-2">
          <Textarea
            value={draft}
            onChangeText={setDraft}
            placeholder={t('pos.cart.notePlaceholder')}
            numberOfLines={3}
          />
        </View>
        <DialogFooter>
          <DialogClose variant="outline">
            <SecondaryButtonLabel>{t('common.actions.cancel')}</SecondaryButtonLabel>
          </DialogClose>
          <Button
            onPress={() => {
              onApply(draft.trim());
              setOpen(false);
            }}
          >
            <ButtonLabel>{t('common.actions.apply')}</ButtonLabel>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
