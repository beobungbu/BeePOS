import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import {
  Button,
  ButtonLabel,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  Field,
  Input,
  SearchInput,
  Text,
  useToast,
} from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import type { Customer } from '../../../domain/types';
import { SecondaryButtonLabel } from './secondary-button-label';
import { useT } from '../../../i18n';
import { validateCustomerDraft, type CustomerDraftError } from '../lib/customer-draft';

interface CustomerDialogProps {
  customers: Customer[];
  selectedCustomerId: string | undefined;
  onSelect: (customerId: string | undefined) => void;
  /** Creates the customer and returns it, so the new record can be attached straight away. */
  onCreate: (input: { name: string; phone: string }) => Customer;
}

/**
 * The customer row at the top of the cart: the whole row is the trigger, so attaching a
 * customer is one press anywhere along it rather than a small button at the end.
 *
 * A customer standing at the till who is not in the book yet is the common case, so the
 * dialog also creates one from the two fields a cashier can collect without slowing the
 * queue: a name and a phone number. The full profile (birthday, note, tier) stays in the
 * Khách hàng screen.
 */
export function CustomerDialog({ customers, selectedCustomerId, onSelect, onCreate }: CustomerDialogProps) {
  const t = useT();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<CustomerDraftError | undefined>(undefined);

  const selected = customers.find((customer) => customer.id === selectedCustomerId);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter(
      (customer) => customer.name.toLowerCase().includes(needle) || customer.phone.includes(needle),
    );
  }, [customers, query]);

  function handleOpenChange(next: boolean) {
    if (!next) closeForm();
    setOpen(next);
  }

  function closeForm() {
    setAdding(false);
    setName('');
    setPhone('');
    setError(undefined);
  }

  /** Prefills the name from what was searched for, which is usually what the cashier typed. */
  function startAdding() {
    const typed = query.trim();
    setName(/\d/.test(typed) ? '' : typed);
    setPhone(/^\d+$/.test(typed) ? typed : '');
    setError(undefined);
    setAdding(true);
  }

  function handleCreate() {
    const failure = validateCustomerDraft(
      { name, phone },
      customers.map((customer) => customer.phone),
    );
    if (failure) {
      setError(failure);
      return;
    }

    const created = onCreate({ name, phone });
    onSelect(created.id);
    toast.show({ title: t('pos.customerDialog.created'), description: created.name, variant: 'success' });
    closeForm();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        variant="ghost"
        className="h-12 w-full justify-start rounded-none border-b border-border px-4"
      >
        <AppIcon name="users-round" size={18} tone="muted-foreground" />
        <Text variant="label" className="font-normal ml-2.5 flex-1 text-foreground" numberOfLines={1}>
          {selected ? `${selected.name} · ${selected.phone}` : t('pos.cart.customerDefault')}
        </Text>
        {/* The row is one press either way, so the action word says which press this is:
            attaching the first customer, or swapping the one already on the bill. */}
        <Text variant="label" className="font-semibold text-info">
          {selected ? t('pos.cart.changeCustomer') : t('pos.cart.attachCustomer')}
        </Text>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>
          {adding ? t('pos.customerDialog.addTitle') : t('pos.customerDialog.title')}
        </DialogTitle>

        {adding ? (
          <View className="gap-3 py-2">
            <Field label={t('pos.customerDialog.name')}>
              <Input
                value={name}
                onChangeText={(next) => {
                  setName(next);
                  setError(undefined);
                }}
                placeholder={t('pos.customerDialog.namePlaceholder')}
                autoFocus
              />
            </Field>
            <Field label={t('pos.customerDialog.phone')}>
              <Input
                value={phone}
                onChangeText={(next) => {
                  setPhone(next);
                  setError(undefined);
                }}
                placeholder={t('pos.customerDialog.phonePlaceholder')}
                keyboardType="phone-pad"
                onSubmitEditing={handleCreate}
              />
            </Field>
            {error ? (
              <Text variant="caption" className="text-destructive" accessibilityLiveRegion="polite">
                {t(`pos.customerDialog.${error}`)}
              </Text>
            ) : null}
            <View className="flex-row gap-2">
              <Button variant="outline" className="flex-1" onPress={closeForm}>
                <SecondaryButtonLabel>{t('common.actions.cancel')}</SecondaryButtonLabel>
              </Button>
              <Button className="flex-1" onPress={handleCreate}>
                <ButtonLabel>{t('pos.customerDialog.save')}</ButtonLabel>
              </Button>
            </View>
          </View>
        ) : (
          <View className="gap-3 py-2">
            <SearchInput
              value={query}
              onChangeText={setQuery}
              onSearch={setQuery}
              placeholder={t('pos.customerDialog.searchPlaceholder')}
            />

            <View className="flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => {
                  onSelect(undefined);
                  setOpen(false);
                }}
              >
                <SecondaryButtonLabel>{t('pos.customerDialog.detach')}</SecondaryButtonLabel>
              </Button>
              <Button variant="outline" className="flex-1" onPress={startAdding}>
                <SecondaryButtonLabel>{t('pos.customerDialog.addAction')}</SecondaryButtonLabel>
              </Button>
            </View>

            {results.length === 0 ? (
              <EmptyState title={t('pos.customerDialog.noResults')} />
            ) : (
              /* A capped `View` does not clip on iOS: the rows past the cap painted over the
                 cart and the tab bar with no way to reach them. A `ScrollView` both clips and
                 scrolls, and `overflow-hidden` keeps the rounded dialog edge over the rows. */
              <ScrollView
                className="max-h-80 overflow-hidden"
                contentContainerClassName="gap-2"
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
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
              </ScrollView>
            )}
          </View>
        )}
      </DialogContent>
    </Dialog>
  );
}
