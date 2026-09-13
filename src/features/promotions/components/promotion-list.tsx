import { Pressable, View } from 'react-native';
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import type { Promotion, Store } from '../../../domain/types';
import {
  promotionScopeLabel,
  promotionStoresLabel,
  promotionTypeLabel,
  promotionWindowLabel,
} from '../lib/promotion-labels';
import { promotionStatus, type PromotionStatus } from '../lib/promotion-status';

/** Status is always a badge with a word, never a bare colour (direction doc section 8). */
const VARIANT_BY_STATUS: Record<PromotionStatus, 'success' | 'warning' | 'secondary' | 'outline'> = {
  active: 'success',
  scheduled: 'warning',
  paused: 'secondary',
  expired: 'outline',
};

interface PromotionListProps {
  promotions: readonly Promotion[];
  stores: readonly Store[];
  now: Date;
  selectedId?: string;
  onSelect: (promotionId: string) => void;
  /** `table` from 768 up, `list` below: a seven column table never scrolls sideways on a phone. */
  layout: 'table' | 'list';
}

export function PromotionList({
  promotions,
  stores,
  now,
  selectedId,
  onSelect,
  layout,
}: PromotionListProps) {
  const t = useT();

  if (promotions.length === 0) {
    return <Text tone="muted">{t('promotions.emptyFiltered')}</Text>;
  }

  if (layout === 'list') {
    return (
      <View className="overflow-hidden rounded-lg border border-border bg-surface">
        {promotions.map((promotion, index) => {
          const status = promotionStatus(promotion, now);
          return (
            <Pressable
              key={promotion.id}
              onPress={() => onSelect(promotion.id)}
              accessibilityRole="button"
              accessibilityLabel={`${promotion.name} · ${promotionTypeLabel(promotion, t)} · ${t(
                `promotions.status.${status}`,
              )}`}
              className={`min-h-touch-target gap-1 px-4 py-3 active:bg-muted ${
                index === 0 ? '' : 'border-t border-border'
              } ${status === 'expired' ? 'opacity-55' : ''}`}
            >
              <View className="flex-row items-center justify-between gap-3">
                <Text variant="label" className="min-w-0 flex-1 font-semibold text-foreground" numberOfLines={1}>
                  {promotion.name}
                </Text>
                <Badge variant={VARIANT_BY_STATUS[status]}>{t(`promotions.status.${status}`)}</Badge>
              </View>
              <Text variant="caption" className="text-muted-foreground" numberOfLines={1}>
                {`${promotionTypeLabel(promotion, t)} · ${promotionScopeLabel(promotion, t)}`}
              </Text>
              <Text variant="caption" className="text-muted-foreground" numberOfLines={1}>
                {`${promotionWindowLabel(promotion)} · ${promotionStoresLabel(promotion, stores, t)}`}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <Table layout="scroll">
      <TableHeader>
        <TableRow>
          <TableHead>{t('promotions.table.name')}</TableHead>
          <TableHead>{t('promotions.table.type')}</TableHead>
          <TableHead>{t('promotions.table.scope')}</TableHead>
          <TableHead>{t('promotions.table.stores')}</TableHead>
          <TableHead>{t('promotions.table.window')}</TableHead>
          <TableHead>{t('promotions.table.stackable')}</TableHead>
          <TableHead>{t('promotions.table.status')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {promotions.map((promotion) => {
          const status = promotionStatus(promotion, now);
          const selected = promotion.id === selectedId;
          return (
            <TableRow
              key={promotion.id}
              selected={selected}
              // Ended programmes stay readable at 55 percent so next season can clone them
              // (commerce spec section B).
              className={status === 'expired' ? 'min-h-12 opacity-55' : 'min-h-12'}
            >
              <TableCell label={t('promotions.table.name')}>
                {/* `TableRow` takes no press handler (BeeUI table API), so the row's control is
                    the name cell, carrying the whole row as its accessible name. */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${promotion.name} · ${promotionTypeLabel(promotion, t)} · ${t(
                    `promotions.status.${status}`,
                  )}`}
                  onPress={() => onSelect(promotion.id)}
                  className="min-h-11 justify-center"
                >
                  <Text variant="label" className="font-semibold text-foreground" numberOfLines={1}>
                    {promotion.name}
                  </Text>
                </Pressable>
              </TableCell>
              <TableCell label={t('promotions.table.type')}>
                <Text variant="label">{promotionTypeLabel(promotion, t)}</Text>
              </TableCell>
              <TableCell label={t('promotions.table.scope')}>
                <Text variant="label">{promotionScopeLabel(promotion, t)}</Text>
              </TableCell>
              <TableCell label={t('promotions.table.stores')}>
                <Text variant="label">{promotionStoresLabel(promotion, stores, t)}</Text>
              </TableCell>
              <TableCell label={t('promotions.table.window')}>
                <Text variant="label" numeric="tabular">
                  {promotionWindowLabel(promotion)}
                </Text>
              </TableCell>
              <TableCell label={t('promotions.table.stackable')}>
                <Badge variant={promotion.stackable ? 'success' : 'outline'}>
                  {promotion.stackable ? t('promotions.stacks.yes') : t('promotions.stacks.no')}
                </Badge>
              </TableCell>
              <TableCell label={t('promotions.table.status')}>
                <Badge variant={VARIANT_BY_STATUS[status]}>{t(`promotions.status.${status}`)}</Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
