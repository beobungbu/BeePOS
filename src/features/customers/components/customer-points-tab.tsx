import { useState } from 'react';
import { Button, EmptyState, HStack, Text, Timeline, TimelineItem, VStack } from '@beemvp/beeui-ui';
import type { PointMovement, PointMovementKind } from '../../../domain/customers';
import { useT } from '../../../i18n';
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
    <VStack className="gap-4">
      <HStack className="items-center justify-between">
        <VStack>
          <Text tone="muted">{t('customers.pointsTab.balance')}</Text>
          <Text variant="heading">{balance}</Text>
        </VStack>
        <Button onPress={() => setDialogOpen(true)} variant="outline">
          {t('customers.pointsTab.adjustButton')}
        </Button>
      </HStack>
      {sorted.length === 0 ? (
        <EmptyState description={t('customers.pointsTab.empty')} title={t('customers.pointsTab.empty')} />
      ) : (
        <Timeline>
          {sorted.map((movement) => (
            <TimelineItem
              description={movement.note}
              key={movement.id}
              meta={new Date(movement.createdAt).toLocaleString('vi-VN')}
              status={STATUS_BY_KIND[movement.kind]}
              title={`${t(LABEL_KEY_BY_KIND[movement.kind])}: ${movement.points > 0 ? '+' : ''}${movement.points}`}
            />
          ))}
        </Timeline>
      )}
      <AdjustPointsDialog onConfirm={onAdjust} onOpenChange={setDialogOpen} open={dialogOpen} />
    </VStack>
  );
}
