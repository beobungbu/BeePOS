import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
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
import { AppIcon } from '../../components/icons';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useT } from '../../i18n';
import { formatVND } from '../../domain/money';
import { staffForStore } from '../../domain/org';
import { filterOrders, periodRange, totalRevenue } from '../../domain/reports';
import { useOrderStore } from '../../data/order-store';
import { useOrgStore } from '../../data/org-store';
import { StoreFormFields } from './components/store-form-fields';
import { storeToForm, useStoreForm } from './store-form-state';

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'p-6' } as const;
/** Form content is capped at 480 and centred at every breakpoint (direction doc section 7). */
const FORM_MAX_WIDTH = 480;
/** One card style for every Stat on the admin screens (direction doc section 5). */
const STAT_CARD = 'min-w-40 grow gap-1 rounded-lg border border-border bg-surface p-4';

interface StoreDetailScreenProps {
  storeId: string;
}

export function StoreDetailScreen({ storeId }: StoreDetailScreenProps) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const breakpoint = useBreakpoint();

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
        {/* `Screen` owns no scroll behaviour, so the detail sections need one here. */}
        <ScrollView className="flex-1">
        <VStack gap="lg" className={GUTTER[breakpoint]}>
          <Button variant="ghost" size="sm" onPress={() => goBackOr('/stores')} className="self-start">
            <AppIcon name="chevron-left" size={16} tone="foreground" />
            <ButtonLabel>{t('common.actions.back')}</ButtonLabel>
          </Button>

          <VStack gap="xs">
            <Text variant="title">{store.name}</Text>
            <Text variant="caption" tone="muted">{`${store.code} · ${store.address}`}</Text>
          </VStack>

          <Card variant="outlined" className="gap-3">
            <Text variant="label" className="font-semibold text-foreground">{t('stores.detail.info')}</Text>
            <DescriptionList>
              <DescriptionItem label={t('stores.field.code')} value={store.code} />
              <DescriptionItem label={t('stores.field.address')} value={store.address} />
              <DescriptionItem label={t('stores.field.phone')} value={store.phone} />
              <DescriptionItem label={t('stores.field.hours')} value={storeHoursById[storeId] ?? '08:00 - 21:00'} />
            </DescriptionList>
          </Card>

          <Section title={t('stores.detail.todayStats')}>
            <HStack gap="md" wrap>
              <Stat className={STAT_CARD}>
                <StatLabel>{t('stores.detail.todayOrders')}</StatLabel>
                <StatValue className="text-2xl font-bold text-foreground">{String(todayStats.orders)}</StatValue>
              </Stat>
              <Stat className={STAT_CARD}>
                <StatLabel>{t('stores.detail.todayRevenue')}</StatLabel>
                <StatValue className="text-2xl font-bold text-foreground">{formatVND(todayStats.revenue)}</StatValue>
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
            <View className="w-full" style={{ maxWidth: FORM_MAX_WIDTH }}>
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
            </View>
          </Section>
        </VStack>
        </ScrollView>
      </SafeArea>
    </Screen>
  );
}
