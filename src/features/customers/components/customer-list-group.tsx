import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Avatar, ListGroup, ListItem, Text } from '@beemvp/beeui-ui';
import type { Customer } from '../../../domain/types';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';
import { fill } from '../../orders/lib/fill';
import { AppIcon } from '../../../components/icons';
import { TierBadge } from './tier-badge';
import { initials } from '../lib/initials';

/**
 * Phone rows, the same three-line shape the orders list uses: name and total spent on the
 * first line, phone and points on the second, tier badge and last order on the third.
 */
export function CustomerListGroup({
  customers,
  lastOrderLabel,
}: {
  customers: Customer[];
  lastOrderLabel: (customerId: string) => string | null;
}) {
  const router = useRouter();
  const t = useT();

  return (
    <ListGroup>
      {customers.map((customer) => {
        const lastOrder = lastOrderLabel(customer.id);
        const meta = `${customer.phone} · ${fill(t('customers.pointsLabel'), { count: customer.points })}`;
        const orderLine = lastOrder ? `${t('customers.table.lastOrder')} ${lastOrder}` : t('customers.table.never');

        return (
          <ListItem
            accessibilityLabel={`${customer.name}. ${meta}. ${orderLine}. ${t(`customers.tier.${customer.tier}`)}. ${formatVND(customer.totalSpent)}`}
            description={
              <View className="gap-1">
                <Text className="text-caption text-muted-foreground" numberOfLines={1}>
                  {meta}
                </Text>
                <View className="flex-row items-center gap-2">
                  <TierBadge tier={customer.tier} />
                  <Text className="min-w-0 shrink text-caption text-muted-foreground" numberOfLines={1}>
                    {orderLine}
                  </Text>
                </View>
              </View>
            }
            key={customer.id}
            leading={<Avatar fallback={initials(customer.name)} size="md" />}
            onPress={() => router.push(`/customers/${customer.id}`)}
            title={
              <View className="flex-row items-center gap-3">
                <Text className="min-w-0 flex-1 text-label font-semibold text-foreground" numberOfLines={1}>
                  {customer.name}
                </Text>
                <Text className="text-label font-bold text-foreground" numeric="tabular">
                  {formatVND(customer.totalSpent)}
                </Text>
              </View>
            }
            trailing={<AppIcon name="chevron-right" size={20} tone="subtle-foreground" />}
          />
        );
      })}
    </ListGroup>
  );
}
