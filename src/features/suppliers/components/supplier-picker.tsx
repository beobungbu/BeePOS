import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Field,
  ListGroup,
  ListItem,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from '@beemvp/beeui-ui';
import { useBreakpoint } from '../../../hooks/use-breakpoint';
import { useT } from '../../../i18n';
import { fill } from '../../orders/lib/fill';
import { useSupplierHistories, useSuppliers } from '../../../data/supplier-store';

interface SupplierPickerProps {
  value: string | undefined;
  onChange: (supplierId: string) => void;
  disabled?: boolean;
}

/**
 * Picks the partner a goods receipt is booked against.
 *
 * Two shapes for two devices, one value underneath: a `Select` from tablet up, and on the
 * phone the searchable pushed list of the mockup (section 3), because a `Select` of eight
 * long company names on a 375 pt screen truncates every one of them to the same prefix.
 *
 * Only active suppliers are offered. A partner the shop has stopped buying from is still in
 * the list screen, with their history intact, but offering them here is how a receipt ends up
 * booked to a company that no longer delivers.
 */
export function SupplierPicker({ value, onChange, disabled = false }: SupplierPickerProps) {
  const t = useT();
  const isPhone = useBreakpoint() === 'phone';
  const suppliers = useSuppliers();
  const histories = useSupplierHistories();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const options = useMemo(() => suppliers.filter((supplier) => supplier.isActive), [suppliers]);
  const selected = suppliers.find((supplier) => supplier.id === value);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(needle) ||
        (supplier.phone ?? '').toLowerCase().includes(needle),
    );
  }, [options, query]);

  if (!isPhone) {
    return (
      <Field label={t('chain.suppliers.picker.label')} required>
        <Select value={value ?? ''} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger accessibilityLabel={t('chain.suppliers.picker.label')}>
            <SelectValue placeholder={t('chain.suppliers.picker.placeholder')} />
          </SelectTrigger>
          <SelectContent>
            {options.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id} textValue={supplier.name}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    );
  }

  return (
    <Field label={t('chain.suppliers.picker.label')} required>
      <Button
        variant="outline"
        disabled={disabled}
        onPress={() => setOpen(true)}
        accessibilityLabel={t('chain.suppliers.picker.label')}
      >
        {selected?.name ?? t('chain.suppliers.picker.placeholder')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-[480px] gap-3">
          <DialogTitle>{t('chain.suppliers.picker.title')}</DialogTitle>
          <SearchInput
            accessibilityLabel={t('chain.suppliers.picker.search')}
            placeholder={t('chain.suppliers.picker.search')}
            onChangeText={setQuery}
            onSearch={setQuery}
          />
          {matches.length === 0 ? (
            <Text variant="label" tone="muted">{t('chain.suppliers.picker.empty')}</Text>
          ) : (
            <ScrollView className="max-h-80">
              <ListGroup>
                {matches.map((supplier) => (
                  <ListItem
                    key={supplier.id}
                    title={supplier.name}
                    description={`${supplier.phone ?? ''} · ${fill(
                      t('chain.suppliers.picker.receiptCount'),
                      { count: histories.get(supplier.id)?.receiptCount ?? 0 },
                    )}`}
                    onPress={() => {
                      onChange(supplier.id);
                      setOpen(false);
                    }}
                  />
                ))}
              </ListGroup>
            </ScrollView>
          )}
          {/* The way out of the flow the mockup asks for: a partner missing from the list is
              discovered while the receipt is being written, not before it. */}
          <View>
            <Button
              variant="outline"
              onPress={() => {
                setOpen(false);
                router.push('/inventory/suppliers/new');
              }}
            >
              {t('chain.suppliers.picker.addNew')}
            </Button>
          </View>
        </DialogContent>
      </Dialog>
    </Field>
  );
}
