import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, Button, Card, EmptyState, HStack, Tabs, TabsContent, TabsList, TabsTrigger, Text, VStack } from '@beemvp/beeui-ui';
import { useCustomerStore } from '../../../data/customer-store';
import { useOrderStore } from '../../../data/order-store';
import { pointHistory } from '../../../domain/customers';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';
import '../../../i18n/customers.vi';
import '../../../i18n/customers.en';
import { TierBadge } from '../components/tier-badge';
import { CustomerOrdersTab } from '../components/customer-orders-tab';
import { CustomerPointsTab } from '../components/customer-points-tab';
import { CustomerInfoTab } from '../components/customer-info-tab';
import { DeleteCustomerDialog } from '../components/delete-customer-dialog';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

export function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();

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

  if (!customer || !id) {
    return (
      <VStack className="flex-1 items-center justify-center gap-4 p-4">
        <EmptyState description="" title={t('customers.empty.title')} />
        <Button onPress={() => router.push('/customers')} variant="outline">
          {t('customers.detail.back')}
        </Button>
      </VStack>
    );
  }

  const history = pointHistory(movements, customer.id);

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4">
      <Button onPress={() => router.push('/customers')} variant="ghost">
        {t('customers.detail.back')}
      </Button>
      <Card className="gap-3">
        <HStack className="flex-wrap items-center justify-between gap-4">
          <HStack className="items-center gap-3">
            <Avatar fallback={initials(customer.name)} size="xl" />
            <VStack>
              <Text variant="heading">{customer.name}</Text>
              <TierBadge tier={customer.tier} />
            </VStack>
          </HStack>
          <DeleteCustomerDialog
            blocked={orders.length > 0}
            onConfirm={() => {
              removeCustomer(customer.id);
              router.push('/customers');
            }}
            onOpenChange={setDeleteOpen}
            open={deleteOpen}
          />
        </HStack>
        <HStack className="flex-wrap gap-6">
          <VStack>
            <Text tone="muted">{t('customers.detail.points')}</Text>
            <Text className="font-medium">{customer.points}</Text>
          </VStack>
          <VStack>
            <Text tone="muted">{t('customers.detail.totalSpent')}</Text>
            <Text className="font-medium">{formatVND(customer.totalSpent)}</Text>
          </VStack>
          <VStack>
            <Text tone="muted">{t('customers.detail.memberSince')}</Text>
            <Text className="font-medium">{new Date(customer.createdAt).toLocaleDateString('vi-VN')}</Text>
          </VStack>
        </HStack>
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
        </TabsContent>
      </Tabs>
    </ScrollView>
  );
}
