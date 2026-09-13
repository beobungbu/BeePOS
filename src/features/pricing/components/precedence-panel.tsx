import { View } from 'react-native';
import { Badge, Text } from '@beemvp/beeui-ui';
import type { CustomerGroup } from '../../../domain/types';
import { useT } from '../../../i18n';
import { fill } from '../../orders/lib/fill';

const LEVELS = [
  { key: 'customer', badge: 'badgeCustomer', variant: 'warning' },
  { key: 'tier', badge: 'badgeTier', variant: 'success' },
  { key: 'group', badge: 'badgeGroup', variant: 'outline' },
  { key: 'store', badge: 'badgeStore', variant: 'outline' },
  { key: 'list', badge: 'badgeList', variant: 'outline' },
  { key: 'base', badge: 'badgeBase', variant: 'outline' },
] as const;

/**
 * The precedence list, printed beside the rules rather than left in documentation: "why is
 * this price different" is the first question anyone asks of a price list, and the answer has
 * to be on the same screen as the rules it explains.
 *
 * The groups below it say who is on this list and what their blanket discount is, which is
 * the second question.
 */
export function PrecedencePanel({
  groups,
  customerCountOf,
}: {
  groups: CustomerGroup[];
  customerCountOf: (groupId: string) => number;
}) {
  const t = useT();

  return (
    <View className="gap-5">
      <View className="gap-2">
        <Text variant="label" className="font-semibold text-foreground">
          {t('pricing.precedence.title')}
        </Text>
        {LEVELS.map((level) => (
          <View key={level.key} className="flex-row items-center justify-between gap-3">
            <Text variant="caption" className="min-w-0 shrink text-muted-foreground">
              {t(`pricing.precedence.${level.key}`)}
            </Text>
            <Badge variant={level.variant}>{t(`pricing.precedence.${level.badge}`)}</Badge>
          </View>
        ))}
        <Text variant="caption" className="text-subtle-foreground">
          {t('pricing.precedence.note')}
        </Text>
      </View>

      <View className="gap-2">
        <Text variant="label" className="font-semibold text-foreground">
          {t('pricing.groups.title')}
        </Text>
        {groups.map((group) => (
          <View key={group.id} className="flex-row items-center justify-between gap-3">
            <Text variant="caption" className="min-w-0 shrink text-muted-foreground" numberOfLines={1}>
              {`${group.name} · ${fill(t('pricing.groups.customerCount'), {
                count: customerCountOf(group.id),
              })}`}
            </Text>
            <Text variant="caption" className="font-semibold text-foreground" numeric="tabular">
              {`${group.discountPercent} %`}
            </Text>
          </View>
        ))}
        <Text variant="caption" className="text-subtle-foreground">
          {t('pricing.groups.discountHint')}
        </Text>
      </View>
    </View>
  );
}
