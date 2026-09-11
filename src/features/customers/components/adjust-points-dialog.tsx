import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogFooter, DialogTitle, Field, Input, Textarea, VStack } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';

export function AdjustPointsDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (points: number, reason: string) => void;
}) {
  const t = useT();
  const [pointsText, setPointsText] = useState('');
  const [reason, setReason] = useState('');

  const points = Number.parseInt(pointsText, 10);
  const canConfirm = Number.isFinite(points) && points !== 0 && reason.trim().length > 0;

  const reset = () => {
    setPointsText('');
    setReason('');
  };

  return (
    <Dialog
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      open={open}
    >
      <DialogContent>
        <DialogTitle>{t('customers.adjustDialog.title')}</DialogTitle>
        <VStack className="gap-4">
          <Field label={t('customers.adjustDialog.points')}>
            <Input keyboardType="numbers-and-punctuation" onChangeText={setPointsText} value={pointsText} />
          </Field>
          <Field label={t('customers.adjustDialog.reason')}>
            <Textarea onChangeText={setReason} placeholder={t('customers.adjustDialog.reasonPlaceholder')} value={reason} />
          </Field>
        </VStack>
        <DialogFooter>
          <Button
            onPress={() => {
              reset();
              onOpenChange(false);
            }}
            variant="outline"
          >
            {t('customers.adjustDialog.cancel')}
          </Button>
          <Button
            disabled={!canConfirm}
            onPress={() => {
              onConfirm(points, reason.trim());
              reset();
              onOpenChange(false);
            }}
          >
            {t('customers.adjustDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
