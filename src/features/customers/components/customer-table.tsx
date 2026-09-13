import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@beemvp/beeui-ui';
import type { Customer, CustomerGroup } from '../../../domain/types';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';
import { useTableRowClass } from '../../../components/table-row-density';
import { fill } from '../../orders/lib/fill';
import { TierBadge } from './tier-badge';
import { initialsOf } from '../../../lib/initials';

/**
 * Customers table from 768 pt up, same rules as the orders table: the name cell carries the
 * press target and the avatar, money and points are right aligned and tabular, and the last
 * order column is dropped at tablet instead of being clipped.
 */
export function CustomerTable({
  customers,
  groups,
  lastOrderLabel,
  showLastOrder,
}: {
  customers: Customer[];
  /** Groups to name `Customer.groupId` with; a customer with none reads as unfiled. */
  groups: CustomerGroup[];
  lastOrderLabel: (customerId: string) => string | null;
  /** Dropped at 768: six columns clip the date rather than fit, and a clipped column is banned. */
  showLastOrder: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const rowClass = useTableRowClass();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead label={t('customers.table.name')}>{t('customers.table.name')}</TableHead>
          <TableHead label={t('customers.table.phone')}>{t('customers.table.phone')}</TableHead>
          <TableHead label={t('customers.business.type')}>{t('customers.business.type')}</TableHead>
          <TableHead label={t('customers.business.group')}>{t('customers.business.group')}</TableHead>
          <TableHead label={t('customers.table.tier')}>{t('customers.table.tier')}</TableHead>
          <TableHead className="items-end text-right" label={t('customers.table.points')}>
            {t('customers.table.points')}
          </TableHead>
          <TableHead className="items-end text-right" label={t('customers.table.totalSpent')}>
            {t('customers.table.totalSpent')}
          </TableHead>
          {showLastOrder ? (
            <TableHead label={t('customers.table.lastOrder')}>{t('customers.table.lastOrder')}</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow className={rowClass} key={customer.id}>
            <TableCell label={t('customers.table.name')}>
              <Pressable
                accessibilityLabel={fill(t('customers.table.selectRow'), { name: customer.name })}
                accessibilityRole="button"
                className="min-h-11 flex-row items-center gap-2.5"
                onPress={() => router.push(`/customers/${customer.id}`)}
              >
                <Avatar fallback={initialsOf(customer.name)} fallbackClassName="text-foreground" size="sm" />
                <Text variant="label" className="min-w-0 flex-1 font-semibold text-foreground" numberOfLines={1}>
                  {customer.name}
                </Text>
              </Pressable>
            </TableCell>
            <TableCell label={t('customers.table.phone')}>
              <Text variant="label" className="font-normal text-foreground" numeric="tabular">
                {customer.phone}
              </Text>
            </TableCell>
            <TableCell label={t('customers.business.type')}>
              <View className="flex-row">
                <Badge variant={customer.type === 'company' ? 'info' : 'outline'}>
                  {customer.type === 'company'
                    ? t('customers.business.typeCompany')
                    : t('customers.business.typeRetail')}
                </Badge>
              </View>
            </TableCell>
            <TableCell label={t('customers.business.group')}>
              <Text variant="label" className="font-normal text-foreground" numberOfLines={1}>
                {groups.find((group) => group.id === customer.groupId)?.name ??
                  t('customers.business.groupNone')}
              </Text>
            </TableCell>
            <TableCell label={t('customers.table.tier')}>
              <View className="flex-row">
                <TierBadge tier={customer.tier} />
              </View>
            </TableCell>
            <TableCell className="items-end text-right" label={t('customers.table.points')}>
              <Text variant="label" className="font-normal text-right text-foreground" numeric="tabular">
                {customer.points}
              </Text>
            </TableCell>
            <TableCell className="items-end text-right" label={t('customers.table.totalSpent')}>
              <Text variant="label" className="text-right font-bold text-foreground" numeric="tabular">
                {formatVND(customer.totalSpent)}
              </Text>
            </TableCell>
            {showLastOrder ? (
              <TableCell label={t('customers.table.lastOrder')}>
                <Text variant="label" className="font-normal text-muted-foreground" numeric="tabular">
                  {lastOrderLabel(customer.id) ?? t('customers.table.never')}
                </Text>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
