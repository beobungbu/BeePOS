import { Badge, ListGroup, ListItem } from '@beemvp/beeui-ui';
import type { StockStatus } from '../../domain/inventory';
import { useT } from '../../i18n';
import type { StockRow } from './inventory-list-utils';

const STATUS_VARIANT: Record<StockStatus, 'success' | 'warning' | 'destructive'> = {
  ok: 'success',
  low: 'warning',
  out: 'destructive',
};

interface InventoryCardsProps {
  rows: StockRow[];
  showStore: boolean;
  onSelect: (row: StockRow) => void;
}

/** Tapping a row opens the quick-adjust dialog; history stays a table-only action to avoid a
 * second interactive control nested inside the row's own pressable (see findings-02). */
export function InventoryCards({ rows, showStore, onSelect }: InventoryCardsProps) {
  const t = useT();

  function statusLabel(status: StockStatus): string {
    if (status === 'out') return t('inventory.statusOut');
    if (status === 'low') return t('inventory.statusLow');
    return t('inventory.statusOk');
  }

  return (
    <ListGroup>
      {rows.map((row) => (
        <ListItem
          key={`${row.level.productId}-${row.level.storeId}`}
          title={row.product.name}
          description={`${showStore ? `${row.store.name} · ` : ''}${t('inventory.columns.onHand')}: ${row.level.onHand} · ${t('inventory.columns.available')}: ${row.available}`}
          onPress={() => onSelect(row)}
          trailing={<Badge variant={STATUS_VARIANT[row.status]}>{statusLabel(row.status)}</Badge>}
        />
      ))}
    </ListGroup>
  );
}
