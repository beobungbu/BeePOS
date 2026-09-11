import { useState } from 'react';
import {
  Button,
  ButtonLabel,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  Field,
  OTPInput,
  Text,
  VStack,
} from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { pinsMatch } from '../../../domain/org';

interface ResetPinDialogProps {
  onConfirm: (pin: string) => void;
}

export function ResetPinDialog({ onConfirm }: ResetPinDialogProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setPin('');
      setConfirmPin('');
      setError(null);
    }
  }

  function handleConfirm() {
    const result = pinsMatch(pin, confirmPin);
    if (!result.valid) {
      setError(result.errorCode === 'mismatch' ? t('staff.validation.pinMismatch') : t('staff.validation.pinInvalid'));
      return;
    }
    onConfirm(pin);
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger variant="outline">{t('staff.resetPin.action')}</DialogTrigger>
      <DialogContent>
        <DialogTitle>{t('staff.resetPin.title')}</DialogTitle>
        <DialogDescription>{t('staff.resetPin.description')}</DialogDescription>

        <VStack gap="md" className="mt-2">
          <Field label={t('staff.resetPin.newPin')}>
            <OTPInput length={4} value={pin} onChange={(e) => setPin(e.nativeEvent.text)} secureTextEntry />
          </Field>
          <Field label={t('staff.resetPin.confirmPin')}>
            <OTPInput length={4} value={confirmPin} onChange={(e) => setConfirmPin(e.nativeEvent.text)} secureTextEntry />
          </Field>
          {error && <Text className="text-sm text-destructive">{error}</Text>}
        </VStack>

        <DialogFooter>
          <DialogClose variant="outline">{t('common.actions.cancel')}</DialogClose>
          <Button onPress={handleConfirm}>
            <ButtonLabel>{t('staff.resetPin.confirm')}</ButtonLabel>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
