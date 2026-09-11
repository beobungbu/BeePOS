import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  Badge,
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
import type { Customer } from '../../../domain/types';
import { useT } from '../../../i18n';

interface CustomerDialogProps {
  customers: Customer[];
  selectedCustomerId: string | undefined;
  onSelect: (customerId: string | undefined) => void;
}

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
      <DialogTrigger variant="outline" size="sm">
        <ButtonLabel>{selected ? selected.name : t('pos.cart.customerDefault')}</ButtonLabel>
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
            <ButtonLabel>{t('pos.customerDialog.detach')}</ButtonLabel>
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
                  className="flex-row items-center justify-between rounded-lg border border-border p-3"
                >
                  <View className="gap-0.5">
                    <Text className="text-sm font-medium text-foreground">{customer.name}</Text>
                    <Text className="text-xs text-muted-foreground">{customer.phone}</Text>
                  </View>
                  <View className="items-end gap-1">
                    <Badge variant="secondary">{customer.tier}</Badge>
                    <Text className="text-xs text-muted-foreground">
                      {customer.points} {t('pos.customerDialog.points')}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </DialogContent>
    </Dialog>
  );
}
