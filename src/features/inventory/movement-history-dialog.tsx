import { Dialog, DialogContent, DialogTitle, Text, Timeline, TimelineItem } from '@beemvp/beeui-ui';
import { useInventoryStore } from '../../data/inventory-store';
import { useT } from '../../i18n';

interface HistoryTarget {
  productId: string;
  storeId: string;
  productName: string;
}

interface MovementHistoryDialogProps {
  target: HistoryTarget | null;
  onClose: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN');
}

export function MovementHistoryDialog({ target, onClose }: MovementHistoryDialogProps) {
  const t = useT();
  const movements = useInventoryStore((state) => state.movements);
  const rows = target
    ? movements.filter((movement) => movement.productId === target.productId && movement.storeId === target.storeId)
    : [];

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>{target ? `${t('inventory.history.title')} · ${target.productName}` : t('inventory.history.title')}</DialogTitle>
        {rows.length === 0 ? (
          <Text tone="muted">{t('inventory.history.empty')}</Text>
        ) : (
          <Timeline>
            {rows.map((movement) => (
              <TimelineItem
                key={movement.id}
                title={`${movement.delta > 0 ? '+' : ''}${movement.delta}`}
                description={movement.reason}
                meta={formatDate(movement.createdAt)}
                status={movement.delta >= 0 ? 'success' : 'destructive'}
              />
            ))}
          </Timeline>
        )}
      </DialogContent>
    </Dialog>
  );
}
