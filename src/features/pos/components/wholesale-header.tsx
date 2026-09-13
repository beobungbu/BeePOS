import { View } from 'react-native';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Text,
} from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import { selectContentHeight } from '../../../components/select-content-height';
import { groupFor } from '../../../domain/pricing';
import type { Customer, CustomerGroup, Staff } from '../../../domain/types';
import { useT } from '../../../i18n';

interface WholesaleHeaderProps {
  wholesale: boolean;
  onToggle: (next: boolean) => void;
  customer: Customer | undefined;
  groups: CustomerGroup[];
  reps: Staff[];
  salesRepId: string | undefined;
  onSalesRepChange: (staffId: string | undefined) => void;
}

const UNASSIGNED = 'none';

/**
 * The "Bán sỉ" switch and the buyer it applies to, at the head of the cart pane.
 *
 * The switch is per order, so it sits with the order rather than in settings: a cashier
 * flips between a retail bill and a wholesale one inside a single shift, and the order tab
 * carries the matching `Sỉ` badge so the two are never confused.
 *
 * The buyer line states the three facts a seller is asked about at the counter: which group
 * prices this order, who is credited with it, and how long the buyer has to pay.
 */
export function WholesaleHeader({
  wholesale,
  onToggle,
  customer,
  groups,
  reps,
  salesRepId,
  onSalesRepChange,
}: WholesaleHeaderProps) {
  const t = useT();
  const group = groupFor(customer, groups);

  const buyerLine = customer
    ? [
        group?.name,
        customer.paymentTermDays
          ? `${t('pos.wholesale.term')} ${customer.paymentTermDays} ${t('pos.wholesale.termDays')}`
          : undefined,
      ]
        .filter(Boolean)
        .join(' · ')
    : t('pos.wholesale.noCustomer');

  return (
    <View className="gap-2 border-b border-border px-4 py-2.5">
      <View className="flex-row items-center gap-2">
        <Text variant="label" className="flex-1 font-semibold text-foreground">
          {t('pos.wholesale.toggle')}
        </Text>
        <Switch
          accessibilityLabel={t('pos.wholesale.toggle')}
          value={wholesale}
          onValueChange={onToggle}
        />
      </View>

      {wholesale ? (
        <>
          <View className="flex-row items-start gap-2">
            <AppIcon name="users-round" size={18} tone="muted-foreground" />
            <View className="min-w-0 flex-1 gap-0.5">
              <Text variant="label" className="font-semibold text-foreground" numberOfLines={1}>
                {customer?.name ?? t('pos.cart.customerDefault')}
              </Text>
              <Text variant="caption" className="text-muted-foreground" numberOfLines={2}>
                {customer && customer.type !== 'company' ? t('pos.wholesale.retailCustomer') : buyerLine}
              </Text>
            </View>
          </View>

          <Select
            value={salesRepId ?? UNASSIGNED}
            onValueChange={(value) => onSalesRepChange(value === UNASSIGNED ? undefined : value)}
          >
            <SelectTrigger accessibilityLabel={t('pos.wholesale.salesRep')}>
              <SelectValue placeholder={t('pos.wholesale.salesRepNone')} />
            </SelectTrigger>
            <SelectContent maxHeight={selectContentHeight(reps.length + 1)}>
              <SelectItem value={UNASSIGNED}>{t('pos.wholesale.salesRepNone')}</SelectItem>
              {reps.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      ) : null}
    </View>
  );
}
