import { useState } from 'react';
import { View } from 'react-native';
import { Button, EmptyState, Text, Timeline, TimelineItem } from '@beemvp/beeui-ui';
import type { PointMovement, PointMovementKind } from '../../../domain/customers';
import { useT } from '../../../i18n';
import { formatDateTime } from '../../orders/lib/order-presentation';
import { AdjustPointsDialog } from './adjust-points-dialog';

const STATUS_BY_KIND: Record<PointMovementKind, 'success' | 'destructive' | 'default'> = {
  earned: 'success',
  spent: 'destructive',
  adjust: 'default',
};

const LABEL_KEY_BY_KIND: Record<PointMovementKind, string> = {
  earned: 'customers.pointsTab.kindEarned',
  spent: 'customers.pointsTab.kindSpent',
  adjust: 'customers.pointsTab.kindAdjust',
};

export function CustomerPointsTab({
  balance,
  movements,
  onAdjust,
}: {
  balance: number;
  movements: PointMovement[];
  onAdjust: (points: number, reason: string) => void;
}) {
  const t = useT();
  const [dialogOpen, setDialogOpen] = useState(false);

  const sorted = [...movements].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4">
        <View className="gap-0.5">
          <Text className="text-caption text-muted-foreground">{t('customers.pointsTab.balance')}</Text>
          <Text className="text-title font-bold text-foreground" numeric="tabular">
            {balance}
          </Text>
        </View>
        <Button onPress={() => setDialogOpen(true)} variant="outline">
          {t('customers.pointsTab.adjustButton')}
        </Button>
      </View>
      {sorted.length === 0 ? (
        <EmptyState description="" title={t('customers.pointsTab.empty')} />
      ) : (
        <Timeline>
          {sorted.map((movement) => (
            <TimelineItem
              description={movement.note}
              key={movement.id}
              meta={formatDateTime(movement.createdAt)}
              status={STATUS_BY_KIND[movement.kind]}
              title={`${t(LABEL_KEY_BY_KIND[movement.kind])}: ${movement.points > 0 ? '+' : ''}${movement.points}`}
            />
          ))}
        </Timeline>
      )}
      <AdjustPointsDialog onConfirm={onAdjust} onOpenChange={setDialogOpen} open={dialogOpen} />
    </View>
  );
}
