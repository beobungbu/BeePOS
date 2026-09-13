import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button,
  Chip,
  ChipGroup,
  EmptyState,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@beemvp/beeui-ui';
import { can } from '../../../domain/auth';
import { useCustomerStore } from '../../../data/customer-store';
import { useOrderStore } from '../../../data/order-store';
import { usePricingStore } from '../../../data/pricing-store';
import { useSessionStore } from '../../../data/session-store';
import { staff as allStaff } from '../../../data/seed';
import { filterCustomers } from '../../../domain/customers';
import type { Customer, CustomerTier, CustomerType } from '../../../domain/types';
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
import { selectContentHeight } from '../../../components/select-content-height';
import { currentOrgId } from '../../../data/org-store';

const TIERS: CustomerTier[] = ['bronze', 'silver', 'gold', 'platinum'];
const ALL = 'all';

export function CustomersListScreen() {
  const t = useT();
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const isPhone = breakpoint === 'phone';
  const isDesktop = breakpoint === 'desktop';

  const customers = useCustomerStore((state) => state.customers);
  const upsertCustomer = useCustomerStore((state) => state.upsertCustomer);
  const setProfileExtra = useCustomerStore((state) => state.setProfileExtra);
  const orders = useOrderStore((state) => state.orders);
  const groups = usePricingStore((state) => state.customerGroups);
  const role = useSessionStore((state) => state.staff?.role);

  const [search, setSearch] = useState('');
  const [tier, setTier] = useState<CustomerTier | ''>('');
  const [type, setType] = useState<CustomerType | ''>('');
  const [groupId, setGroupId] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const byTier = filterCustomers(customers, {
      search: search || undefined,
      tier: tier || undefined,
    });
    return byTier.filter(
      (customer) =>
        (!type || customer.type === type) && (!groupId || customer.groupId === groupId),
    );
  }, [customers, search, tier, type, groupId]);

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
      type: 'retail',
      totalSpent: 0,
      createdAt: new Date().toISOString(),
      ...input.business,
    };
    upsertCustomer(newCustomer);
    if (input.birthday || input.note || input.billingAddress) {
      setProfileExtra(id, {
        birthday: input.birthday ?? undefined,
        note: input.note || undefined,
        billingAddress: input.billingAddress || undefined,
      });
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

  /**
   * The way into the pricing screens until the nav list carries them (W-S owns
   * `src/components/shell/nav-items.ts`). Customer groups and price lists are the two halves
   * of one decision, so the customers screen is where a manager already is when they need it.
   */
  const pricingAction = can(role, 'catalog.manage') ? (
    <Button variant="outline" onPress={() => router.push('/pricing')}>
      {t('customers.pricingLink')}
    </Button>
  ) : null;

  const typeSelect = (
    <View className="min-w-36">
      <Select
        value={type || ALL}
        onValueChange={(value) => setType(value === ALL ? '' : (value as CustomerType))}
      >
        <SelectTrigger accessibilityLabel={t('customers.filters.type')}>
          <SelectValue placeholder={t('customers.filters.allTypes')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t('customers.filters.allTypes')}</SelectItem>
          <SelectItem value="retail">{t('customers.business.typeRetail')}</SelectItem>
          <SelectItem value="company">{t('customers.business.typeCompany')}</SelectItem>
        </SelectContent>
      </Select>
    </View>
  );

  const groupSelect = (
    <View className="min-w-36">
      <Select
        value={groupId || ALL}
        onValueChange={(value) => setGroupId(value === ALL ? '' : value)}
      >
        <SelectTrigger accessibilityLabel={t('customers.filters.group')}>
          <SelectValue placeholder={t('customers.filters.allGroups')} />
        </SelectTrigger>
        <SelectContent maxHeight={selectContentHeight(groups.length + 1)}>
          <SelectItem value={ALL}>{t('customers.filters.allGroups')}</SelectItem>
          {groups.map((group) => (
            <SelectItem key={group.id} value={group.id}>
              {group.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </View>
  );

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
              actions={
                <>
                  {pricingAction}
                  <Button onPress={() => setAddOpen(true)}>{t('customers.addButton')}</Button>
                </>
              }
              activeFilterCount={(tier ? 1 : 0) + (type ? 1 : 0) + (groupId ? 1 : 0)}
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
              {typeSelect}
              {groupSelect}
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
          <View className={`flex-row items-center justify-end gap-2 bg-surface pb-2 pt-3 ${gutter}`}>
            {pricingAction}
            <Button onPress={() => setAddOpen(true)}>{t('customers.addButton')}</Button>
          </View>

          <View className={`gap-3 border-b border-border bg-surface pb-3 pt-1 ${gutter}`}>
            <SearchInput accessibilityLabel={t('customers.search')} onSearch={setSearch} placeholder={t('customers.search')} />
            <View className="flex-row flex-wrap gap-2">
              {typeSelect}
              {groupSelect}
            </View>
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
            groups={groups}
            lastOrderLabel={lastOrderLabel}
            showLastOrder={breakpoint === 'desktop'}
          />
        )}
      </ScrollView>

      <AddCustomerDialog
        groups={groups}
        onCreate={handleCreate}
        onOpenChange={setAddOpen}
        open={addOpen}
        reps={allStaff}
      />
    </View>
  );
}
