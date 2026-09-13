import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, ChipGroup, EmptyState, SearchInput } from '@beemvp/beeui-ui';
import { useCustomerStore } from '../../../data/customer-store';
import { useOrderStore } from '../../../data/order-store';
import { filterCustomers } from '../../../domain/customers';
import type { Customer, CustomerTier } from '../../../domain/types';
import { useScreenHeader } from '../../../components/shell/screen-header';
import { StatStrip } from '../../../components/stat-strip';
import { Toolbar } from '../../../components/toolbar';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';
import '../../../i18n/customers.vi';
import '../../../i18n/customers.en';
import { useBreakpoint } from '../../../hooks/use-breakpoint';
import { formatDate } from '../../../lib/datetime';
import { fill } from '../../orders/lib/fill';
import { CustomerTable } from '../components/customer-table';
import { CustomerListGroup } from '../components/customer-list-group';
import { AddCustomerDialog, type NewCustomerInput } from '../components/add-customer-dialog';
import { currentOrgId } from '../../../data/org-store';

const TIERS: CustomerTier[] = ['bronze', 'silver', 'gold', 'platinum'];

export function CustomersListScreen() {
  const t = useT();
  const breakpoint = useBreakpoint();
  const isPhone = breakpoint === 'phone';
  const isDesktop = breakpoint === 'desktop';

  const customers = useCustomerStore((state) => state.customers);
  const upsertCustomer = useCustomerStore((state) => state.upsertCustomer);
  const setProfileExtra = useCustomerStore((state) => state.setProfileExtra);
  const orders = useOrderStore((state) => state.orders);

  const [search, setSearch] = useState('');
  const [tier, setTier] = useState<CustomerTier | ''>('');
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(
    () => filterCustomers(customers, { search: search || undefined, tier: tier || undefined }),
    [customers, search, tier],
  );

  const lastOrderLabel = (customerId: string): string | null => {
    const customerOrders = orders.filter((order) => order.customerId === customerId);
    if (customerOrders.length === 0) return null;
    const latest = customerOrders.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
    return formatDate(latest.createdAt);
  };

  const handleCreate = (input: NewCustomerInput) => {
    const id = `customer-${Date.now()}`;
    const newCustomer: Customer = {
      id,
      orgId: currentOrgId(),
      name: input.name,
      phone: input.phone,
      points: 0,
      tier: 'bronze',
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    };
    upsertCustomer(newCustomer);
    if (input.birthday || input.note) {
      setProfileExtra(id, { birthday: input.birthday ?? undefined, note: input.note || undefined });
    }
  };

  const gutter = isPhone ? 'px-4' : breakpoint === 'tablet' ? 'px-5' : 'px-6';

  const totals = useMemo(
    () =>
      filtered.reduce(
        (sums, customer) => ({
          points: sums.points + customer.points,
          spent: sums.spent + customer.totalSpent,
        }),
        { points: 0, spent: 0 },
      ),
    [filtered],
  );

  useScreenHeader({
    title: t('customers.title'),
    subtitle: fill(t('customers.results'), { count: filtered.length }),
  });

  const tierChips = (
    <ChipGroup
      className="flex-row flex-nowrap gap-2"
      onValueChange={(v) => setTier(v === 'all' ? '' : (v as CustomerTier))}
      selectionMode="single"
      value={tier || 'all'}
    >
      <Chip value="all">{t('customers.tier.all')}</Chip>
      {TIERS.map((item) => (
        <Chip key={item} value={item}>
          {t(`customers.tier.${item}`)}
        </Chip>
      ))}
    </ChipGroup>
  );

  return (
    <View className="flex-1 bg-background">
      {isDesktop ? (
        <>
          <View className={`border-b border-border bg-surface ${gutter}`}>
            <Toolbar
              actions={<Button onPress={() => setAddOpen(true)}>{t('customers.addButton')}</Button>}
              activeFilterCount={tier ? 1 : 0}
              search={
                // 300 pt at rest; the row may squeeze it to 240 before the filters collapse
                // (`src/components/toolbar-fit.ts`).
                <View className="w-[300px] min-w-60 shrink">
                  <SearchInput
                    accessibilityLabel={t('customers.search')}
                    onSearch={setSearch}
                    placeholder={t('customers.search')}
                  />
                </View>
              }
            >
              {tierChips}
            </Toolbar>
          </View>
          <View className={gutter}>
            <StatStrip
              items={[
                { label: t('customers.stats.customers'), value: String(filtered.length) },
                { label: t('customers.stats.totalSpent'), value: formatVND(totals.spent) },
                { label: t('customers.stats.points'), value: String(totals.points) },
              ]}
            />
          </View>
        </>
      ) : (
        <>
          {/* Title and result count live in the app header; this row keeps the page action. */}
          <View className={`flex-row items-center justify-end bg-surface pb-2 pt-3 ${gutter}`}>
            <Button onPress={() => setAddOpen(true)}>{t('customers.addButton')}</Button>
          </View>

          <View className={`gap-3 border-b border-border bg-surface pb-3 pt-1 ${gutter}`}>
            <SearchInput accessibilityLabel={t('customers.search')} onSearch={setSearch} placeholder={t('customers.search')} />
            <ScrollView contentContainerClassName="flex-row items-center gap-2 pr-4" horizontal showsHorizontalScrollIndicator={false}>
              {tierChips}
            </ScrollView>
          </View>
        </>
      )}

      <ScrollView className="min-h-0 flex-1" contentContainerClassName={isDesktop ? 'pb-6' : 'pb-6 pt-3'}>
        {filtered.length === 0 ? (
          <View className={`py-8 ${gutter}`}>
            <EmptyState description={t('customers.empty.description')} title={t('customers.empty.title')} />
          </View>
        ) : isPhone ? (
          <CustomerListGroup customers={filtered} lastOrderLabel={lastOrderLabel} />
        ) : (
          <CustomerTable
            customers={filtered}
            lastOrderLabel={lastOrderLabel}
            showLastOrder={breakpoint === 'desktop'}
          />
        )}
      </ScrollView>

      <AddCustomerDialog onCreate={handleCreate} onOpenChange={setAddOpen} open={addOpen} />
    </View>
  );
}
