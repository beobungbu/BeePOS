import { useState } from 'react';
import { View } from 'react-native';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTitle,
  Button,
  Field,
  Textarea,
} from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { fill } from '../lib/fill';

interface CancelOrderDialogProps {
  code: string;
  disabled: boolean;
  onConfirm: (reason: string) => void;
}

/**
 * Cancelling a wholesale order always asks why.
 *
 * The reason is not decoration: a quote that went nowhere and an order cancelled because the
 * stock never arrived are different facts about the business, and the only moment anyone
 * knows which it was is now.
 */
export function CancelOrderDialog({ code, disabled, onConfirm }: CancelOrderDialogProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const valid = reason.trim().length > 0;

  return (
    <>
      <Button
        className="border-destructive"
        disabled={disabled}
        labelClassName="text-destructive"
        onPress={() => {
          setReason('');
          setTouched(false);
          setOpen(true);
        }}
        variant="outline"
      >
        {t('orders.lifecycle.cancel')}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>{fill(t('orders.lifecycle.cancelTitle'), { code })}</AlertDialogTitle>
          <View className="py-2">
            <Field
              error={touched && !valid ? t('orders.lifecycle.cancelReasonRequired') : undefined}
              invalid={touched && !valid}
              label={t('orders.lifecycle.cancelReason')}
              required
            >
              <Textarea
                value={reason}
                onChangeText={setReason}
                placeholder={t('orders.lifecycle.cancelReasonPlaceholder')}
              />
            </Field>
          </View>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('pricing.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onPress={() => {
                setTouched(true);
                if (!valid) return;
                onConfirm(reason.trim());
                setOpen(false);
              }}
            >
              {t('orders.lifecycle.cancelConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
