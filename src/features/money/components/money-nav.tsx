import { Pressable, ScrollView } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import { router, usePathname } from 'expo-router';
import { useT } from '../../../i18n';

/** The five screens of the money area, in the order a manager works through them. */
export const MONEY_ROUTES = [
  { href: '/money/cashbook', labelKey: 'money.nav.cashBook' },
  { href: '/money/receivables', labelKey: 'money.nav.receivables' },
  { href: '/money/payables', labelKey: 'money.nav.payables' },
  { href: '/money/debts', labelKey: 'money.nav.debts' },
  { href: '/money/banks', labelKey: 'money.nav.banks' },
] as const;

/**
 * The area's own tab row, scrollable on a phone.
 *
 * `/money` is one area with five screens and no sidebar entry of its own yet, so without this
 * the only way from the cash book to the receivables ledger would be a typed URL. Chips rather
 * than a `SegmentedControl` because five Vietnamese labels of unequal length get equal widths
 * in a segmented control and two of them wrap at 375.
 */
export function MoneyNav() {
  const t = useT();
  const pathname = usePathname();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // A horizontal `ScrollView` inside a flex column claims the free height on web, which
      // leaves a 150 pt hole between the chips and the toolbar; it only ever needs its row.
      style={{ flexGrow: 0, flexShrink: 0 }}
      contentContainerStyle={{ gap: 8, paddingRight: 16 }}
    >
      {MONEY_ROUTES.map((route) => {
        const selected = pathname === route.href;
        const label = t(route.labelKey);
        return (
          <Pressable
            key={route.href}
            onPress={() => router.push(route.href)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            className={`h-9 items-center justify-center rounded-full px-4 ${selected ? 'bg-primary' : 'bg-muted'}`}
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
