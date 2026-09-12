import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Stat,
  StatLabel,
  StatValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from '@beemvp/beeui-ui';
import { useCustomerStore } from '../../../data/customer-store';
import { useOrderStore } from '../../../data/order-store';
import { pointHistory } from '../../../domain/customers';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';
import '../../../i18n/customers.vi';
import '../../../i18n/customers.en';
import { useBreakpoint } from '../../../hooks/use-breakpoint';
import { useScreenHeader } from '../../../components/shell/screen-header';
import { formatDate } from '../../orders/lib/order-presentation';
import { TierBadge } from '../components/tier-badge';
import { CustomerOrdersTab } from '../components/customer-orders-tab';
import { CustomerPointsTab } from '../components/customer-points-tab';
import { CustomerInfoTab } from '../components/customer-info-tab';
import { DeleteCustomerDialog } from '../components/delete-customer-dialog';
import { initials } from '../lib/initials';

export function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const breakpoint = useBreakpoint();
  const isPhone = breakpoint === 'phone';

  const customer = useCustomerStore((state) => state.customers.find((item) => item.id === id));
  const extra = useCustomerStore((state) => (id ? state.profileExtras[id] : undefined));
  const movements = useCustomerStore((state) => state.pointHistory);
  const upsertCustomer = useCustomerStore((state) => state.upsertCustomer);
  const setProfileExtra = useCustomerStore((state) => state.setProfileExtra);
  const addPointMovement = useCustomerStore((state) => state.addPointMovement);
  const removeCustomer = useCustomerStore((state) => state.removeCustomer);
  // Select the raw array (stable reference) and derive with useMemo: an inline `.filter()`
  // inside the zustand selector returns a new array every call, which makes
  // useSyncExternalStore see a changed snapshot on every render and loops forever
  // ("Maximum update depth exceeded").
  const allOrders = useOrderStore((state) => state.orders);
  const orders = useMemo(() => allOrders.filter((order) => order.customerId === id), [allOrders, id]);

  const [tab, setTab] = useState<'orders' | 'points' | 'info'>('orders');
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Pushed route: the back control lives in the shell header, with the customer as the title.
  useScreenHeader({ title: customer?.name ?? t('customers.title'), backTo: '/customers' });

  if (!customer || !id) {
    return (
      <View className="flex-1 items-center justify-center gap-4 p-4">
        <EmptyState description={t('customers.empty.description')} title={t('customers.empty.title')} />
        <Button onPress={() => router.push('/customers')} variant="outline">
          {t('customers.detail.back')}
        </Button>
      </View>
    );
  }

  const history = pointHistory(movements, customer.id);
  const gutter = isPhone ? 'px-4' : breakpoint === 'tablet' ? 'px-5' : 'px-6';

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName={`gap-4 pb-8 pt-3 ${gutter}`}>
      <Card className="gap-4">
        <View className="flex-row flex-wrap items-center justify-between gap-4">
          <View className="min-w-0 flex-row items-center gap-3">
            <Avatar fallback={initials(customer.name)} fallbackClassName="text-foreground" size="xl" />
            <View className="min-w-0 gap-1">
              <View className="flex-row flex-wrap items-center gap-2">
                <Text variant="title" className="font-bold text-foreground" numberOfLines={1}>
                  {customer.name}
                </Text>
                <TierBadge tier={customer.tier} />
              </View>
              <Text variant="caption" className="text-muted-foreground" numeric="tabular">
                {customer.phone}
              </Text>
            </View>
          </View>
          <DeleteCustomerDialog
            blocked={orders.length > 0}
            name={customer.name}
            onConfirm={() => {
              removeCustomer(customer.id);
              router.push('/customers');
            }}
            onOpenChange={setDeleteOpen}
            open={deleteOpen}
          />
        </View>

        <View className="flex-row flex-wrap gap-3">
          <Stat className="min-w-36 flex-1 rounded-lg border border-border p-4">
            <StatLabel>{t('customers.detail.points')}</StatLabel>
            <StatValue numeric="tabular">{customer.points}</StatValue>
          </Stat>
          <Stat className="min-w-36 flex-1 rounded-lg border border-border p-4">
            <StatLabel>{t('customers.detail.totalSpent')}</StatLabel>
            <StatValue numeric="tabular">{formatVND(customer.totalSpent)}</StatValue>
          </Stat>
          <Stat className="min-w-36 flex-1 rounded-lg border border-border p-4">
            <StatLabel>{t('customers.detail.memberSince')}</StatLabel>
            <StatValue numeric="tabular">{formatDate(customer.createdAt)}</StatValue>
          </Stat>
        </View>
      </Card>

      <Tabs onValueChange={(v) => setTab(v as typeof tab)} value={tab}>
        <TabsList>
          <TabsTrigger value="orders">{t('customers.tabs.orders')}</TabsTrigger>
          <TabsTrigger value="points">{t('customers.tabs.points')}</TabsTrigger>
          <TabsTrigger value="info">{t('customers.tabs.info')}</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <CustomerOrdersTab orders={orders} />
        </TabsContent>
        <TabsContent value="points">
          <CustomerPointsTab
            balance={customer.points}
            movements={history}
            onAdjust={(points, reason) =>
              addPointMovement({
                id: `pm-manual-${customer.id}-${Date.now()}`,
                customerId: customer.id,
                kind: 'adjust',
                points,
                note: reason,
                createdAt: new Date().toISOString(),
              })
            }
          />
        </TabsContent>
        <TabsContent value="info">
          <View className="max-w-120">
            <CustomerInfoTab
              birthday={extra?.birthday ?? null}
              name={customer.name}
              note={extra?.note ?? ''}
              onSave={(input) => {
                upsertCustomer({ ...customer, name: input.name, phone: input.phone });
                setProfileExtra(customer.id, { birthday: input.birthday ?? undefined, note: input.note || undefined });
              }}
              phone={customer.phone}
            />
          </View>
        </TabsContent>
      </Tabs>
    </ScrollView>
  );
}
