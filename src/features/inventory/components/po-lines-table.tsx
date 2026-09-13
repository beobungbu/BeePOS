import {
  Badge,
  IconButton,
  Input,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import { formatVND } from '../../../domain/money';
import type { Product, PurchaseOrderLine } from '../../../domain/types';
import { useT } from '../../../i18n';
import { fill } from '../../orders/lib/fill';
import { lineState, outstandingOf, purchaseOrderTotals } from '../lib/purchase-orders';

type LineStateBadge = 'success' | 'warning' | 'destructive';

const STATE_VARIANT: Record<ReturnType<typeof lineState>, LineStateBadge> = {
  full: 'success',
  partial: 'warning',
  none: 'destructive',
};

interface PoLinesTableProps {
  lines: PurchaseOrderLine[];
  products: Map<string, Product>;
  /** `edit` is the draft form; `receive` books quantities against a sent order. */
  mode: 'edit' | 'receive' | 'read';
  /** Quantities being received now, keyed by product. Only read in `receive` mode. */
  receiveQty?: Record<string, number>;
  onChange?: (lines: PurchaseOrderLine[]) => void;
  onReceiveQtyChange?: (productId: string, qty: number) => void;
}

/**
 * The order's lines, in the three shapes the flow needs: an editable draft, a delivery being
 * booked, and a finished order. `Nhận lần này` is an input rather than a button, because a
 * partial delivery is the normal case and a Receive button can only ever mean "all of it".
 */
export function PoLinesTable({
  lines,
  products,
  mode,
  receiveQty = {},
  onChange,
  onReceiveQtyChange,
}: PoLinesTableProps) {
  const t = useT();
  const totals = purchaseOrderTotals({ lines });
  const editable = mode === 'edit';
  const receiving = mode === 'receive';

  const column = {
    product: t('inventory.purchaseOrders.lineColumns.product'),
    ordered: t('inventory.purchaseOrders.lineColumns.ordered'),
    received: t('inventory.purchaseOrders.lineColumns.received'),
    receiveNow: t('inventory.purchaseOrders.lineColumns.receiveNow'),
    unitCost: t('inventory.purchaseOrders.lineColumns.unitCost'),
    lineTotal: t('inventory.purchaseOrders.lineColumns.lineTotal'),
    status: t('inventory.purchaseOrders.lineColumns.status'),
    actions: t('products.columns.actions'),
  };

  function updateLine(index: number, patch: Partial<PurchaseOrderLine>) {
    onChange?.(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function removeLine(index: number) {
    onChange?.(lines.filter((_, i) => i !== index));
  }

  function stateLabel(line: PurchaseOrderLine): string {
    const state = lineState(line);
    if (state === 'partial') {
      return fill(t('inventory.purchaseOrders.lineState.partial'), { qty: outstandingOf(line) });
    }
    return t(`inventory.purchaseOrders.lineState.${state}`);
  }

  return (
    <Table layout="scroll">
      <TableHeader>
        <TableRow>
          <TableHead label={column.product}>{column.product}</TableHead>
          <TableHead label={column.ordered}>{column.ordered}</TableHead>
          {!editable && <TableHead label={column.received}>{column.received}</TableHead>}
          {receiving && <TableHead label={column.receiveNow}>{column.receiveNow}</TableHead>}
          <TableHead label={column.unitCost}>{column.unitCost}</TableHead>
          <TableHead label={column.lineTotal}>{column.lineTotal}</TableHead>
          {!editable && <TableHead label={column.status}>{column.status}</TableHead>}
          {editable && <TableHead label={column.actions}>{column.actions}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line, index) => {
          const product = products.get(line.productId);
          const name = product?.name ?? line.productId;
          return (
            <TableRow key={`${line.productId}-${index}`}>
              <TableCell label={column.product}>
                <Text variant="label" className="font-semibold">{name}</Text>
                <Text variant="caption" tone="muted">{product?.sku ?? ''}</Text>
              </TableCell>
              <TableCell label={column.ordered}>
                {editable ? (
                  <Input
                    accessibilityLabel={`${column.ordered} ${name}`}
                    value={String(line.qty)}
                    onChangeText={(value) => updateLine(index, { qty: Math.max(0, Number(value) || 0) })}
                    keyboardType="numeric"
                  />
                ) : (
                  <Text variant="label" numeric="tabular" className="w-full text-right">{line.qty}</Text>
                )}
              </TableCell>
              {!editable && (
                <TableCell label={column.received}>
                  <Text variant="label" numeric="tabular" className="w-full text-right">{line.receivedQty}</Text>
                </TableCell>
              )}
              {receiving && (
                <TableCell label={column.receiveNow}>
                  <Input
                    accessibilityLabel={`${column.receiveNow} ${name}`}
                    value={String(receiveQty[line.productId] ?? 0)}
                    onChangeText={(value) =>
                      onReceiveQtyChange?.(
                        line.productId,
                        Math.min(outstandingOf(line), Math.max(0, Number(value) || 0)),
                      )
                    }
                    keyboardType="numeric"
                  />
                </TableCell>
              )}
              <TableCell label={column.unitCost}>
                {editable ? (
                  <Input
                    accessibilityLabel={`${column.unitCost} ${name}`}
                    value={String(line.unitCost)}
                    onChangeText={(value) => updateLine(index, { unitCost: Math.max(0, Number(value) || 0) })}
                    keyboardType="numeric"
                  />
                ) : (
                  <Text variant="label" numeric="tabular" className="w-full text-right">{formatVND(line.unitCost)}</Text>
                )}
              </TableCell>
              <TableCell label={column.lineTotal}>
                <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                  {formatVND(line.qty * line.unitCost)}
                </Text>
              </TableCell>
              {!editable && (
                <TableCell label={column.status}>
                  <Badge variant={STATE_VARIANT[lineState(line)]}>{stateLabel(line)}</Badge>
                </TableCell>
              )}
              {editable && (
                <TableCell label={column.actions}>
                  <IconButton
                    accessibilityLabel={`${t('products.actionsDelete')} ${name}`}
                    variant="ghost"
                    onPress={() => removeLine(index)}
                  >
                    <AppIcon name="trash-2" tone="destructive" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell label={column.ordered} colSpan={2}>
            <Text variant="label">{`${column.ordered}: ${totals.orderedQty}`}</Text>
          </TableCell>
          <TableCell label={column.lineTotal} colSpan={editable ? 3 : receiving ? 5 : 4}>
            <Text variant="label">{`${t('inventory.purchaseOrders.stat.ordered')}: ${formatVND(totals.orderedValue)}`}</Text>
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
