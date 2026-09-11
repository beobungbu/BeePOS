import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { goBackOr } from '../../lib/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  ButtonLabel,
  Card,
  DescriptionItem,
  DescriptionList,
  HStack,
  ListGroup,
  ListItem,
  SafeArea,
  Screen,
  Section,
  Stat,
  StatLabel,
  StatValue,
  Text,
  useToast,
  VStack,
} from '@beemvp/beeui-ui';
import { useT } from '../../i18n';
import { formatVND } from '../../domain/money';
import { staffForStore } from '../../domain/org';
import { filterOrders, periodRange, totalRevenue } from '../../domain/reports';
import { useOrderStore } from '../../data/order-store';
import { useOrgStore } from '../../data/org-store';
import { StoreFormFields } from './components/store-form-fields';
import { storeToForm, useStoreForm } from './store-form-state';

interface StoreDetailScreenProps {
  storeId: string;
}

export function StoreDetailScreen({ storeId }: StoreDetailScreenProps) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();

  const stores = useOrgStore((state) => state.stores);
  const staff = useOrgStore((state) => state.staff);
  const storeHoursById = useOrgStore((state) => state.storeHoursById);
  const upsertStore = useOrgStore((state) => state.upsertStore);
  const setStoreActive = useOrgStore((state) => state.setStoreActive);
  const setStoreHours = useOrgStore((state) => state.setStoreHours);
  const orders = useOrderStore((state) => state.orders);

  const store = stores.find((item) => item.id === storeId);
  const assignedStaff = staffForStore(staff, storeId);

  const todayStats = useMemo(() => {
    const range = periodRange('today', new Date());
    const todayOrders = filterOrders(orders, range, storeId);
    return { orders: todayOrders.length, revenue: totalRevenue(todayOrders) };
  }, [orders, storeId]);

  const form = useStoreForm(
    store ? storeToForm(store, storeHoursById[storeId] ?? '08:00 - 21:00') : storeToForm({ id: '', code: '', name: '', address: '', phone: '', isActive: true }, ''),
    t('stores.validation.required'),
  );

  if (!store) {
    return (
      <Screen>
        <SafeArea className="flex-1 items-center justify-center p-6" edges={['bottom', 'left', 'right']}>
          <Text tone="muted">{t('stores.list.empty')}</Text>
        </SafeArea>
      </Screen>
    );
  }

  function handleSave() {
    if (!store || !form.validate()) return;
    upsertStore({ ...store, code: form.values.code, name: form.values.name, address: form.values.address, phone: form.values.phone });
    setStoreHours(store.id, form.values.hours);
    toast.show({ title: t('stores.toast.saved'), variant: 'success' });
  }

  function handleDeactivate() {
    if (!store) return;
    setStoreActive(store.id, !store.isActive);
    toast.show({ title: t('stores.toast.statusChanged'), variant: 'info' });
  }

  return (
    <Screen>
      <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
        <VStack gap="lg" className="flex-1 p-6">
          <Button variant="ghost" size="sm" onPress={() => goBackOr('/stores')} className="self-start">
            <ButtonLabel>{`< ${t('common.actions.back')}`}</ButtonLabel>
          </Button>

          <Text className="text-xl font-semibold text-foreground">{store.name}</Text>

          <Card variant="outlined" className="gap-3">
            <Text className="font-medium text-foreground">{t('stores.detail.info')}</Text>
            <DescriptionList>
              <DescriptionItem label={t('stores.field.code')} value={store.code} />
              <DescriptionItem label={t('stores.field.address')} value={store.address} />
              <DescriptionItem label={t('stores.field.phone')} value={store.phone} />
              <DescriptionItem label={t('stores.field.hours')} value={storeHoursById[storeId] ?? '08:00 - 21:00'} />
            </DescriptionList>
          </Card>

          <Section title={t('stores.detail.todayStats')}>
            <HStack gap="md" wrap>
              <Stat className="min-w-32 flex-1 gap-1 rounded-lg border border-border bg-card p-4">
                <StatLabel>{t('stores.detail.todayOrders')}</StatLabel>
                <StatValue className="text-xl font-semibold text-foreground">{String(todayStats.orders)}</StatValue>
              </Stat>
              <Stat className="min-w-32 flex-1 gap-1 rounded-lg border border-border bg-card p-4">
                <StatLabel>{t('stores.detail.todayRevenue')}</StatLabel>
                <StatValue className="text-xl font-semibold text-foreground">{formatVND(todayStats.revenue)}</StatValue>
              </Stat>
            </HStack>
          </Section>

          <Section title={t('stores.detail.staffAssigned')}>
            {assignedStaff.length === 0 ? (
              <Text tone="muted">{t('stores.detail.noStaff')}</Text>
            ) : (
              <ListGroup>
                {assignedStaff.map((member) => (
                  <ListItem
                    key={member.id}
                    title={member.name}
                    description={t(`staff.role.${member.role}`)}
                    onPress={() => router.push(`/staff/${member.id}`)}
                  />
                ))}
              </ListGroup>
            )}
          </Section>

          <Section title={t('stores.detail.edit')}>
            <StoreFormFields values={form.values} errors={form.errors} setField={form.setField} />
            <HStack gap="sm" wrap className="mt-4">
              <Button onPress={handleSave}>
                <ButtonLabel>{t('stores.detail.save')}</ButtonLabel>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger variant={store.isActive ? 'destructive' : 'outline'}>
                  {store.isActive ? t('stores.deactivate.action') : t('stores.deactivate.activateAction')}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogTitle>{t('stores.deactivate.confirmTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('stores.deactivate.confirmDescription')}</AlertDialogDescription>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onPress={handleDeactivate}>{t('stores.deactivate.confirmAction')}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </HStack>
          </Section>
        </VStack>
      </SafeArea>
    </Screen>
  );
}
