import { Link } from 'expo-router';
import { Avatar, HStack, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@beemvp/beeui-ui';
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

export function CustomerTable({
  customers,
  lastOrderLabel,
}: {
  customers: Customer[];
  lastOrderLabel: (customerId: string) => string | null;
}) {
  const t = useT();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead label={t('customers.table.name')}>{t('customers.table.name')}</TableHead>
          <TableHead label={t('customers.table.phone')}>{t('customers.table.phone')}</TableHead>
          <TableHead label={t('customers.table.tier')}>{t('customers.table.tier')}</TableHead>
          <TableHead label={t('customers.table.points')}>{t('customers.table.points')}</TableHead>
          <TableHead label={t('customers.table.totalSpent')}>{t('customers.table.totalSpent')}</TableHead>
          <TableHead label={t('customers.table.lastOrder')}>{t('customers.table.lastOrder')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell label={t('customers.table.name')}>
              <Link href={`/customers/${customer.id}`}>
                <HStack className="items-center gap-2">
                  <Avatar fallback={initials(customer.name)} size="sm" />
                  <Text className="font-medium text-primary">{customer.name}</Text>
                </HStack>
              </Link>
            </TableCell>
            <TableCell label={t('customers.table.phone')}>
              <Text>{customer.phone}</Text>
            </TableCell>
            <TableCell label={t('customers.table.tier')}>
              <TierBadge tier={customer.tier} />
            </TableCell>
            <TableCell label={t('customers.table.points')}>
              <Text>{customer.points}</Text>
            </TableCell>
            <TableCell label={t('customers.table.totalSpent')}>
              <Text>{formatVND(customer.totalSpent)}</Text>
            </TableCell>
            <TableCell label={t('customers.table.lastOrder')}>
              <Text tone="muted">{lastOrderLabel(customer.id) ?? t('customers.table.never')}</Text>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
