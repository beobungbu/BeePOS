import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from '@beemvp/beeui-ui';
import { useCustomerStore } from '../../../data/customer-store';
import { useLedgerStore } from '../../../data/ledger-store';
import { useOrderStore } from '../../../data/order-store';
import { useOrgStore } from '../../../data/org-store';
import { usePricingStore } from '../../../data/pricing-store';
import { pointHistory } from '../../../domain/customers';
import { agingFor, balanceFor, creditCheck } from '../../../domain/ledger';
import { groupFor } from '../../../domain/pricing';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';
import '../../../i18n/customers.vi';
import '../../../i18n/customers.en';
import { useBreakpoint } from '../../../hooks/use-breakpoint';
import { useScreenHeader } from '../../../components/shell/screen-header';
import { StatStrip, type StatStripItem } from '../../../components/stat-strip';
import { formatDate } from '../../../lib/datetime';
import { TierBadge } from '../components/tier-badge';
import { CustomerOrdersTab } from '../components/customer-orders-tab';
import { CustomerPointsTab } from '../components/customer-points-tab';
import { CustomerInfoTab } from '../components/customer-info-tab';
import { CustomerDebtTab } from '../components/customer-debt-tab';
import { DeleteCustomerDialog } from '../components/delete-customer-dialog';
import { initialsOf } from '../../../lib/initials';

/** Window the "doanh số 90 ngày" figure covers, in milliseconds. */
const SALES_WINDOW_MS = 90 * 86_400_000;

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
  const ledgerEntries = useLedgerStore((state) => state.entries);
  const groups = usePricingStore((state) => state.customerGroups);
  // The roster of the chain this device is signed into, not the demo seed: a sales rep from
  // another chain must never be offered as this customer's.
  const allStaff = useOrgStore((state) => state.staff);
  // Select the raw array (stable reference) and derive with useMemo: an inline `.filter()`
  // inside the zustand selector returns a new array every call, which makes
  // useSyncExternalStore see a changed snapshot on every render and loops forever
  // ("Maximum update depth exceeded").
  const allOrders = useOrderStore((state) => state.orders);
  const orders = useMemo(() => allOrders.filter((order) => order.customerId === id), [allOrders, id]);

  const [tab, setTab] = useState<'orders' | 'debt' | 'points' | 'info'>('orders');
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Read the clock once per order set rather than on every render: the window is ninety days
  // wide, so re-deriving it on each keystroke buys nothing.
  const sales90 = useMemo(() => {
    const since = new Date().getTime() - SALES_WINDOW_MS;
    return orders
      .filter((order) => new Date(order.createdAt).getTime() >= since)
      .reduce((total, order) => total + order.total, 0);
  }, [orders]);

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
  const isCompany = customer.type === 'company';
  const group = groupFor(customer, groups);
  const rep = allStaff.find((member) => member.id === customer.salesRepId);

  const balance = balanceFor(ledgerEntries, 'customer', customer.id);
  const aging = agingFor(ledgerEntries, 'customer', customer.id);
  const overdue = aging.total - aging.current;
  const credit = creditCheck(customer, ledgerEntries, 0);

  // The company strip leads with the five numbers a seller is asked for on the phone; a
  // retail customer has no ledger, so it keeps the three it always had.
  const stats: StatStripItem[] = isCompany
    ? [
        { label: t('customers.debt.balance'), value: formatVND(balance), tone: balance > 0 ? 'warning' : 'foreground' },
        { label: t('customers.debt.overdue'), value: formatVND(overdue), tone: overdue > 0 ? 'destructive' : 'foreground' },
        { label: t('customers.debt.limit'), value: formatVND(credit.limit) },
        { label: t('customers.debt.available'), value: formatVND(credit.available) },
        { label: t('customers.debt.sales90'), value: formatVND(sales90) },
      ]
    : [
        { label: t('customers.detail.points'), value: String(customer.points) },
        { label: t('customers.detail.totalSpent'), value: formatVND(customer.totalSpent) },
        { label: t('customers.detail.memberSince'), value: formatDate(customer.createdAt) },
      ];

  const subtitle = [
    isCompany ? t('customers.business.typeCompany') : t('customers.business.typeRetail'),
    group?.name,
    customer.taxCode ? `${t('customers.business.taxCode')} ${customer.taxCode}` : undefined,
    rep?.name,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName={`gap-4 pb-8 pt-3 ${gutter}`}>
      <Card className="gap-4">
        <View className="flex-row flex-wrap items-center justify-between gap-4">
          <View className="min-w-0 flex-row items-center gap-3">
            <Avatar fallback={initialsOf(customer.name)} fallbackClassName="text-foreground" size="xl" />
            <View className="min-w-0 gap-1">
              <View className="flex-row flex-wrap items-center gap-2">
                <Text variant="title" className="font-bold text-foreground" numberOfLines={1}>
                  {customer.name}
                </Text>
                <Badge variant={isCompany ? 'info' : 'outline'}>
                  {isCompany ? t('customers.business.typeCompany') : t('customers.business.typeRetail')}
                </Badge>
                <TierBadge tier={customer.tier} />
              </View>
              <Text variant="caption" className="text-muted-foreground" numeric="tabular" numberOfLines={2}>
                {`${customer.phone} · ${subtitle}`}
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

        <StatStrip items={stats} layout={isPhone ? 'stacked' : 'row'} />
      </Card>

      <Tabs onValueChange={(v) => setTab(v as typeof tab)} value={tab}>
        <TabsList>
          <TabsTrigger value="orders">{t('customers.tabs.orders')}</TabsTrigger>
          <TabsTrigger value="debt">{t('customers.debt.tab')}</TabsTrigger>
          <TabsTrigger value="points">{t('customers.tabs.points')}</TabsTrigger>
          <TabsTrigger value="info">{t('customers.tabs.info')}</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <CustomerOrdersTab orders={orders} />
        </TabsContent>
        <TabsContent value="debt">
          <CustomerDebtTab customer={customer} entries={ledgerEntries} />
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
              customer={customer}
              birthday={extra?.birthday ?? null}
              note={extra?.note ?? ''}
              groups={groups}
              reps={allStaff}
              onSave={(input) => {
                upsertCustomer({
                  ...customer,
                  ...input.business,
                  name: input.name,
                  phone: input.phone,
                });
                setProfileExtra(customer.id, {
                  birthday: input.birthday ?? undefined,
                  note: input.note || undefined,
                });
              }}
            />
          </View>
        </TabsContent>
      </Tabs>
    </ScrollView>
  );
}
