import { Badge, ListGroup, ListItem, Text, VStack } from '@beemvp/beeui-ui';
import type { StockStatus } from '../../domain/inventory';
import { useT } from '../../i18n';
import type { StockRow } from './inventory-list-utils';

/**
 * `ok` is neutral on purpose: a solid green badge on every healthy row is noise that hides
 * the two rows that need attention (direction doc section 5, the muted normal state).
 */
const STATUS_VARIANT: Record<StockStatus, 'outline' | 'warning' | 'destructive'> = {
  ok: 'outline',
  low: 'warning',
  out: 'destructive',
};

interface InventoryCardsProps {
  rows: StockRow[];
  showStore: boolean;
  onSelect: (row: StockRow) => void;
}

/**
 * Phone rows in the three-line format of the direction doc section 8: name with the
 * available quantity, then SKU and the minimum level, then the state badge. Tapping a row
 * opens the quick-adjust dialog; history stays a table-only action so no second interactive
 * control is nested inside the row's own pressable (see findings-02).
 */
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
          description={`${showStore ? `${row.store.name} · ` : ''}${row.product.sku} · ${t('inventory.columns.minLevel')} ${row.level.minLevel}`}
          onPress={() => onSelect(row)}
          accessibilityLabel={`${row.product.name}, ${t('inventory.columns.available')} ${row.available}, ${statusLabel(row.status)}`}
          trailing={
            <VStack gap="xs" align="end">
              <Text variant="label" numeric="tabular" className="font-bold">
                {row.available}
              </Text>
              <Badge variant={STATUS_VARIANT[row.status]}>{statusLabel(row.status)}</Badge>
            </VStack>
          }
        />
      ))}
    </ListGroup>
  );
}
