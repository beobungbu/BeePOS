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
  Field,
  Input,
  SegmentedControl,
  SegmentedControlItem,
  Textarea,
} from '@beemvp/beeui-ui';
import type { Discount } from '../../../domain/types';
import { useT } from '../../../i18n';

interface OrderDiscountDialogProps {
  discount: Discount | undefined;
  onApply: (discount: Discount | undefined) => void;
}

export function OrderDiscountDialog({ discount, onApply }: OrderDiscountDialogProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<Discount['type']>(discount?.type ?? 'percent');
  const [value, setValue] = useState(discount ? String(discount.value) : '');
  const [reason, setReason] = useState(discount?.reason ?? '');

  function handleOpenChange(next: boolean) {
    if (next) {
      setType(discount?.type ?? 'percent');
      setValue(discount ? String(discount.value) : '');
      setReason(discount?.reason ?? '');
    }
    setOpen(next);
  }

  function apply() {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      onApply({ type, value: parsed, reason: reason.trim() || undefined });
    } else {
      onApply(undefined);
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger variant="outline" size="sm">
        <ButtonLabel>{t('pos.orderDiscount.trigger')}</ButtonLabel>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{t('pos.orderDiscount.title')}</DialogTitle>
        <View className="gap-4 py-2">
          <SegmentedControl value={type} onValueChange={(next) => setType(next as Discount['type'])}>
            <SegmentedControlItem value="percent">{t('pos.lineDiscount.percent')}</SegmentedControlItem>
            <SegmentedControlItem value="amount">{t('pos.lineDiscount.amount')}</SegmentedControlItem>
          </SegmentedControl>
          <Input value={value} onChangeText={setValue} keyboardType="numeric" placeholder="0" />
          <Field label={t('pos.orderDiscount.reason')}>
            <Textarea
              value={reason}
              onChangeText={setReason}
              placeholder={t('pos.orderDiscount.reasonPlaceholder')}
            />
          </Field>
        </View>
        <DialogFooter>
          <DialogClose variant="outline">
            <ButtonLabel>{t('common.actions.cancel')}</ButtonLabel>
          </DialogClose>
          <Button onPress={apply}>
            <ButtonLabel>{t('common.actions.apply')}</ButtonLabel>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
