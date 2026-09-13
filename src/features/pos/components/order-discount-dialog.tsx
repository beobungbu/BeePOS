import { useState } from 'react';
import { Pressable, View } from 'react-native';
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
  Text,
  Textarea,
} from '@beemvp/beeui-ui';
import type { Discount } from '../../../domain/types';
import { SecondaryButtonLabel } from './secondary-button-label';
import { useT } from '../../../i18n';
import { useHoldScanCapture } from '../lib/capture-lock';

interface OrderDiscountDialogProps {
  discount: Discount | undefined;
  onApply: (discount: Discount | undefined) => void;
}

/**
 * The three cuts a Vietnamese grocery actually gives. A preset is one press instead of
 * picking the type and typing a number, and the free input below stays for everything else.
 */
const PERCENT_PRESETS = [5, 10, 20] as const;

export function OrderDiscountDialog({ discount, onApply }: OrderDiscountDialogProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  useHoldScanCapture(open);
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
      <DialogTrigger variant="outline" className="flex-1">
        <SecondaryButtonLabel>{t('pos.orderDiscount.trigger')}</SecondaryButtonLabel>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{t('pos.orderDiscount.title')}</DialogTitle>
        <View className="gap-4 py-2">
          <SegmentedControl value={type} onValueChange={(next) => setType(next as Discount['type'])}>
            <SegmentedControlItem value="percent">{t('pos.lineDiscount.percent')}</SegmentedControlItem>
            <SegmentedControlItem value="amount">{t('pos.lineDiscount.amount')}</SegmentedControlItem>
          </SegmentedControl>

          <View className="gap-2">
            <Text variant="caption" className="text-muted-foreground">{t('pos.orderDiscount.presets')}</Text>
            <View className="flex-row gap-2">
              {PERCENT_PRESETS.map((percent) => {
                const selected = type === 'percent' && value === String(percent);
                return (
                  <PresetChip
                    key={percent}
                    label={`${percent}%`}
                    selected={selected}
                    onPress={() => {
                      setType('percent');
                      setValue(String(percent));
                    }}
                  />
                );
              })}
              {/* Not a percentage: hands the dialog back to the free input in dong. */}
              <PresetChip
                label={t('pos.lineDiscount.amount')}
                selected={type === 'amount'}
                onPress={() => {
                  setType('amount');
                  setValue('');
                }}
              />
            </View>
          </View>

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
            <SecondaryButtonLabel>{t('common.actions.cancel')}</SecondaryButtonLabel>
          </DialogClose>
          <Button onPress={apply}>
            <ButtonLabel>{t('common.actions.apply')}</ButtonLabel>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PresetChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** A 36 pt chip in a 44 pt row, selected in `primary`, per the direction doc's chip spec. */
function PresetChip({ label, selected, onPress }: PresetChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      className={`h-9 min-w-14 items-center justify-center rounded-full px-4 ${
        selected ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <Text
        variant="label"
        className={`font-medium ${selected ? 'text-primary-foreground' : 'text-foreground'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
