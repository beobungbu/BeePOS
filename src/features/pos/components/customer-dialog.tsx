import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  Button,
  ButtonLabel,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  SearchInput,
  Text,
} from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import type { Customer } from '../../../domain/types';
import { SecondaryButtonLabel } from './secondary-button-label';
import { useT } from '../../../i18n';

interface CustomerDialogProps {
  customers: Customer[];
  selectedCustomerId: string | undefined;
  onSelect: (customerId: string | undefined) => void;
}

/**
 * The customer row at the top of the cart: the whole row is the trigger, so attaching a
 * customer is one press anywhere along it rather than a small button at the end.
 */
export function CustomerDialog({ customers, selectedCustomerId, onSelect }: CustomerDialogProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = customers.find((customer) => customer.id === selectedCustomerId);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter(
      (customer) => customer.name.toLowerCase().includes(needle) || customer.phone.includes(needle),
    );
  }, [customers, query]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        variant="ghost"
        className="h-12 w-full justify-start rounded-none border-b border-border px-4"
      >
        <AppIcon name="users-round" size={18} tone="muted-foreground" />
        <Text variant="label" className="font-normal ml-2.5 flex-1 text-foreground" numberOfLines={1}>
          {selected ? `${selected.name} · ${selected.phone}` : t('pos.cart.customerDefault')}
        </Text>
        <Text variant="label" className="font-semibold text-info">{t('pos.cart.attachCustomer')}</Text>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{t('pos.customerDialog.title')}</DialogTitle>
        <View className="gap-3 py-2">
          <SearchInput
            value={query}
            onChangeText={setQuery}
            onSearch={setQuery}
            placeholder={t('pos.customerDialog.searchPlaceholder')}
          />

          <Button
            variant="outline"
            onPress={() => {
              onSelect(undefined);
              setOpen(false);
            }}
          >
            <SecondaryButtonLabel>{t('pos.customerDialog.detach')}</SecondaryButtonLabel>
          </Button>

          {results.length === 0 ? (
            <EmptyState title={t('pos.customerDialog.noResults')} />
          ) : (
            <View className="max-h-80 gap-2">
              {results.slice(0, 20).map((customer) => (
                <Pressable
                  key={customer.id}
                  onPress={() => {
                    onSelect(customer.id);
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={customer.name}
                  className="min-h-14 flex-row items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <View className="gap-0.5">
                    <Text variant="label" className="font-semibold text-foreground">{customer.name}</Text>
                    <Text variant="caption" className="text-muted-foreground">{customer.phone}</Text>
                  </View>
                  {/* Tier lives in the `customers` dictionary, which POS does not own; the
                      points balance is what a cashier needs here anyway. */}
                  <Text variant="caption" className="tabular-nums text-muted-foreground">
                    {`${customer.points} ${t('pos.customerDialog.points')}`}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </DialogContent>
    </Dialog>
  );
}
