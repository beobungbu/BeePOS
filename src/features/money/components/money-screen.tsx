import { ScrollView, View } from 'react-native';
import { EmptyState, Text } from '@beemvp/beeui-ui';
import { useBreakpoint } from '../../../hooks/use-breakpoint';
import { useCan } from '../../../data/session-store';
import { useT } from '../../../i18n';
import '../../../i18n/money.vi';
import '../../../i18n/money.en';
import { MoneyNav } from './money-nav';

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'p-6' } as const;

/**
 * The frame every `/money` screen sits in: the permission gate, the area's own tab row and
 * the page gutter.
 *
 * The gate is here rather than in the route guard because the money area has no nav entry
 * yet, so `permissionForPath` cannot cost it (W-S owns `nav-items.ts`). `reports.store` is the
 * permission: the cash book is a manager's screen and a cashier has no business in the debt
 * ledgers, which is exactly the line that permission already draws.
 */
export function MoneyScreen({ children }: { children: React.ReactNode }) {
  const t = useT();
  const breakpoint = useBreakpoint();
  const allowed = useCan('reports.store');

  if (!allowed) {
    return (
      <View className={`flex-1 justify-center ${GUTTER[breakpoint]}`}>
        <EmptyState title={t('money.guard.title')} description={t('money.guard.body')} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
      <View className={`flex-1 gap-4 ${GUTTER[breakpoint]}`}>
        <MoneyNav />
        {children}
      </View>
    </ScrollView>
  );
}

/** Section heading inside a money screen, so the panels read the same on every one. */
export function MoneySectionTitle({ children }: { children: string }) {
  return (
    <Text variant="label" className="font-semibold text-foreground">
      {children}
    </Text>
  );
}
