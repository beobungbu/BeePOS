import { Pressable, ScrollView, View } from 'react-native';
import { Button, ButtonLabel, SafeArea, Screen, Stack, Text, useToast, VStack } from '@beemvp/beeui-ui';
import { usePathname, useRouter } from 'expo-router';
import { useBreakpoint } from '../../../hooks/use-breakpoint';
import { Toolbar } from '../../../components/toolbar';
import { useOrgStore } from '../../../data/org-store';
import { useT } from '../../../i18n';
import { PeriodFilter } from './period-filter';
import type { ReportFiltersState } from '../use-report-filters';

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'p-6' } as const;

/**
 * The report cuts, in the order a shop owner asks for them: how much, from what, when, on
 * which products, by whom, what the shelves are worth, who owes what.
 */
export const REPORT_TABS = [
  { id: 'overview', href: '/reports', labelKey: 'reports.tab.overview' },
  { id: 'category', href: '/reports/category', labelKey: 'reports.tab.category' },
  { id: 'hours', href: '/reports/hours', labelKey: 'reports.tab.hours' },
  { id: 'products', href: '/reports/products', labelKey: 'reports.tab.products' },
  { id: 'staff', href: '/reports/staff', labelKey: 'reports.tab.staff' },
  { id: 'valuation', href: '/reports/inventory-valuation', labelKey: 'reports.tab.valuation' },
  { id: 'debt', href: '/reports/debt', labelKey: 'reports.tab.debt' },
] as const;

export type ReportTabId = (typeof REPORT_TABS)[number]['id'];

interface ReportsFrameProps {
  tab: ReportTabId;
  filters: ReportFiltersState;
  children: React.ReactNode;
}

/**
 * The frame every report screen sits in: the cut chips, the shared period and branch filters,
 * and the export action. The filters are shared state (`use-report-filters.ts`), so moving
 * between cuts keeps the period the reader chose rather than resetting it to today.
 */
export function ReportsFrame({ tab, filters, children }: ReportsFrameProps) {
  const t = useT();
  const toast = useToast();
  const breakpoint = useBreakpoint();
  const stores = useOrgStore((state) => state.stores);
  const isDesktop = breakpoint === 'desktop';
  const isWide = breakpoint !== 'phone';

  function handleExport() {
    toast.show({
      title: t('reports.export.toastTitle'),
      description: t('reports.export.toastDescription'),
      variant: 'success',
    });
  }

  const exportButton = (
    <Button variant="outline" size="sm" onPress={handleExport} accessibilityLabel={t('reports.export.button')}>
      {/* `ButtonLabel` paints itself `text-primary-foreground` whatever the variant, which is
          1.2:1 on an outline button in dark (docs/beeui-audit/findings-18-w-c.md). */}
      <ButtonLabel className="text-foreground">{t('reports.export.button')}</ButtonLabel>
    </Button>
  );

  return (
    <Screen>
      <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
        <ScrollView className="flex-1">
          <View className="border-b border-border bg-surface">
            <ReportTabs active={tab} />
            {isDesktop ? (
              <View className="px-6">
                <Toolbar
                  activeFilterCount={
                    (filters.periodKey === 'today' ? 0 : 1) + (filters.storeId ? 1 : 0)
                  }
                  actions={exportButton}
                >
                  <PeriodFilter filters={filters} stores={stores} inline />
                </Toolbar>
              </View>
            ) : null}
          </View>

          <VStack gap="lg" className={GUTTER[breakpoint]}>
            {isDesktop ? null : (
              <Stack direction={isWide ? 'horizontal' : 'vertical'} gap="md" wrap justify="between" align="start">
                <PeriodFilter filters={filters} stores={stores} />
                {exportButton}
              </Stack>
            )}
            {children}
          </VStack>
        </ScrollView>
      </SafeArea>
    </Screen>
  );
}

/**
 * Chips rather than a `SegmentedControl`: seven equal segments squeeze "Lợi nhuận sản phẩm"
 * onto three lines at 375, and a scrolling chip row is the direction doc's answer to a filter
 * set that does not fit (section 5).
 */
function ReportTabs({ active }: { active: ReportTabId }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 8 }}
    >
      {REPORT_TABS.map((entry) => {
        const selected = entry.id === active;
        const label = t(entry.labelKey);
        return (
          <Pressable
            key={entry.id}
            onPress={() => {
              if (pathname !== entry.href) router.navigate(entry.href as never);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            className={`h-9 items-center justify-center rounded-full px-4 ${
              selected ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <Text
              variant="label"
              className={`font-medium ${selected ? 'text-primary-foreground' : 'text-foreground'}`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
