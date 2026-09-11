import { useRouter } from 'expo-router';
import { Avatar, ListGroup, ListItem, Text, VStack } from '@beemvp/beeui-ui';
import type { Customer } from '../../../domain/types';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';
import { TierBadge } from './tier-badge';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

export function CustomerListGroup({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const t = useT();

  return (
    <ListGroup>
      {customers.map((customer) => (
        <ListItem
          description={customer.phone}
          key={customer.id}
          leading={<Avatar fallback={initials(customer.name)} size="md" />}
          onPress={() => router.push(`/customers/${customer.id}`)}
          title={customer.name}
          trailing={
            <VStack className="items-end gap-1">
              <Text className="font-medium">{formatVND(customer.totalSpent)}</Text>
              <TierBadge tier={customer.tier} />
            </VStack>
          }
        />
      ))}
    </ListGroup>
  );
}
