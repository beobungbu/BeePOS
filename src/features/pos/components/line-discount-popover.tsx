import { useState } from 'react';
import { View } from 'react-native';
import {
  Button,
  ButtonLabel,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SegmentedControl,
  SegmentedControlItem,
  Text,
} from '@beemvp/beeui-ui';
import type { Discount } from '../../../domain/types';
import { SecondaryButtonLabel } from './secondary-button-label';
import { useT } from '../../../i18n';

interface LineDiscountPopoverProps {
  discount: Discount | undefined;
  onApply: (discount: Discount | undefined) => void;
}

/**
 * PopoverTrigger is itself the pressable button (BeeUI ButtonProps), so it renders a
 * glyph directly rather than wrapping a nested IconButton inside it (see the DropdownMenuTrigger
 * nested-pressable pitfall in docs/beeui-audit/findings-00-scaffold.md, finding scaffold-05).
 */
export function LineDiscountPopover({ discount, onApply }: LineDiscountPopoverProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<Discount['type']>(discount?.type ?? 'percent');
  const [value, setValue] = useState(discount ? String(discount.value) : '');

  function handleOpenChange(next: boolean) {
    if (next) {
      setType(discount?.type ?? 'percent');
      setValue(discount ? String(discount.value) : '');
    }
    setOpen(next);
  }

  function apply() {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) onApply({ type, value: parsed });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger accessibilityLabel={t('pos.cart.lineDiscount')} variant="ghost" size="icon">
        <Text className={discount ? 'text-warning' : 'text-muted-foreground'}>%</Text>
      </PopoverTrigger>
      <PopoverContent className="w-64 gap-3 p-3">
        <Text className="text-sm font-medium text-foreground">{t('pos.lineDiscount.title')}</Text>
        <SegmentedControl value={type} onValueChange={(next) => setType(next as Discount['type'])}>
          <SegmentedControlItem value="percent">{t('pos.lineDiscount.percent')}</SegmentedControlItem>
          <SegmentedControlItem value="amount">{t('pos.lineDiscount.amount')}</SegmentedControlItem>
        </SegmentedControl>
        <Input value={value} onChangeText={setValue} keyboardType="numeric" placeholder="0" />
        <View className="flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onPress={() => {
              onApply(undefined);
              setOpen(false);
            }}
          >
            <SecondaryButtonLabel>{t('pos.lineDiscount.clear')}</SecondaryButtonLabel>
          </Button>
          <Button className="flex-1" onPress={apply}>
            <ButtonLabel>{t('pos.lineDiscount.apply')}</ButtonLabel>
          </Button>
        </View>
      </PopoverContent>
    </Popover>
  );
}
