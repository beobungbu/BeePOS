import { useState } from 'react';
import { View } from 'react-native';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Field,
  HStack,
  Input,
  Switch,
  Text,
} from '@beemvp/beeui-ui';
import type { PriceList } from '../../../domain/types';
import { useT } from '../../../i18n';

interface PriceListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The list being edited; absent creates a new one. */
  priceList?: PriceList;
  onSave: (input: { name: string; isActive: boolean }) => void;
}

export function PriceListDialog({ open, onOpenChange, priceList, onSave }: PriceListDialogProps) {
  const t = useT();
  const [name, setName] = useState(priceList?.name ?? '');
  const [isActive, setIsActive] = useState(priceList?.isActive ?? true);
  const [touched, setTouched] = useState(false);

  // Seeded on the open transition during render: the same dialog serves "new" and
  // "edit", and an effect would show the previous row's values for one frame.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(priceList?.name ?? '');
      setIsActive(priceList?.isActive ?? true);
      setTouched(false);
    }
  }

  const nameValid = name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t('pricing.lists.editTitle')}</DialogTitle>
        <View className="gap-4 py-2">
          <Field
            error={touched && !nameValid ? t('pricing.groups.nameRequired') : undefined}
            invalid={touched && !nameValid}
            label={t('pricing.lists.name')}
            required
          >
            <Input
              value={name}
              onChangeText={setName}
              placeholder={t('pricing.lists.namePlaceholder')}
            />
          </Field>
          <HStack gap="sm" align="center">
            <Switch
              accessibilityLabel={t('pricing.lists.active')}
              value={isActive}
              onValueChange={setIsActive}
            />
            <Text>{isActive ? t('pricing.lists.active') : t('pricing.lists.inactive')}</Text>
          </HStack>
        </View>
        <DialogFooter>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            {t('pricing.actions.cancel')}
          </Button>
          <Button
            onPress={() => {
              setTouched(true);
              if (!nameValid) return;
              onSave({ name: name.trim(), isActive });
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
