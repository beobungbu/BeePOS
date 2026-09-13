import { useState } from 'react';
import { View } from 'react-native';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Field,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@beemvp/beeui-ui';
import { selectContentHeight } from '../../../components/select-content-height';
import type { CustomerGroup, PriceList } from '../../../domain/types';
import { useT } from '../../../i18n';

const NO_LIST = 'none';

interface CustomerGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The group being edited; absent creates a new one. */
  group?: CustomerGroup;
  priceLists: PriceList[];
  onSave: (input: { name: string; discountPercent: number; priceListId?: string }) => void;
}

export function CustomerGroupDialog({
  open,
  onOpenChange,
  group,
  priceLists,
  onSave,
}: CustomerGroupDialogProps) {
  const t = useT();
  const [name, setName] = useState(group?.name ?? '');
  const [discount, setDiscount] = useState(String(group?.discountPercent ?? 0));
  const [priceListId, setPriceListId] = useState(group?.priceListId ?? NO_LIST);
  const [touched, setTouched] = useState(false);

  // The same dialog serves "new" and "edit", so it reloads when the row it is about changes.
  // Seeded on the open transition during render: the same dialog serves "new" and
  // "edit", and an effect would show the previous row's values for one frame.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(group?.name ?? '');
      setDiscount(String(group?.discountPercent ?? 0));
      setPriceListId(group?.priceListId ?? NO_LIST);
      setTouched(false);
    }
  }

  const nameValid = name.trim().length > 0;
  const parsedDiscount = Number.parseFloat(discount);
  const discountPercent =
    Number.isFinite(parsedDiscount) && parsedDiscount > 0 ? Math.min(parsedDiscount, 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t('pricing.groups.editTitle')}</DialogTitle>
        <View className="gap-4 py-2">
          <Field
            error={touched && !nameValid ? t('pricing.groups.nameRequired') : undefined}
            invalid={touched && !nameValid}
            label={t('pricing.groups.name')}
            required
          >
            <Input
              value={name}
              onChangeText={setName}
              placeholder={t('pricing.groups.namePlaceholder')}
            />
          </Field>
          <Field
            label={t('pricing.groups.discountPercent')}
            description={t('pricing.groups.discountHint')}
          >
            <Input
              value={discount}
              onChangeText={setDiscount}
              keyboardType="numeric"
              className="text-right tabular-nums"
            />
          </Field>
          <Field label={t('pricing.groups.priceList')}>
            <Select value={priceListId} onValueChange={setPriceListId}>
              <SelectTrigger accessibilityLabel={t('pricing.groups.priceList')}>
                <SelectValue placeholder={t('pricing.groups.priceListNone')} />
              </SelectTrigger>
              <SelectContent maxHeight={selectContentHeight(priceLists.length + 1)}>
                <SelectItem value={NO_LIST}>{t('pricing.groups.priceListNone')}</SelectItem>
                {priceLists.map((list) => (
                  <SelectItem key={list.id} value={list.id}>
                    {list.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </View>
        <DialogFooter>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            {t('pricing.actions.cancel')}
          </Button>
          <Button
            onPress={() => {
              setTouched(true);
              if (!nameValid) return;
              onSave({
                name: name.trim(),
                discountPercent,
                priceListId: priceListId === NO_LIST ? undefined : priceListId,
              });
              onOpenChange(false);
            }}
          >
            {t('pricing.actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
