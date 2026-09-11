import { IconButton, Input, Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow, Text } from '@beemvp/beeui-ui';
import { formatVND } from '../../domain/money';
import { receiptTotals } from '../../domain/inventory';
import type { GoodsReceiptLine, Product } from '../../domain/types';
import { useT } from '../../i18n';

interface LineEditorTableProps {
  lines: GoodsReceiptLine[];
  products: Map<string, Product>;
  editable: boolean;
  onChange: (lines: GoodsReceiptLine[]) => void;
}

/** Pure table: `editable` shows inline qty/cost inputs and a remove action per row. The
 * caller renders its own "add line" Button beneath this table (a `<button>` cannot be a
 * direct `<table>` child on Web without breaking real table semantics, see Table's docs). */
export function LineEditorTable({ lines, products, editable, onChange }: LineEditorTableProps) {
  const t = useT();
  const totals = receiptTotals(lines);

  function updateLine(index: number, patch: Partial<GoodsReceiptLine>) {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function removeLine(index: number) {
    onChange(lines.filter((_, i) => i !== index));
  }

  return (
    <Table layout="scroll">
      <TableHeader>
        <TableRow>
          <TableHead label={t('products.columns.product')}>{t('products.columns.product')}</TableHead>
          <TableHead label={t('inventory.receipts.lineQty')}>{t('inventory.receipts.lineQty')}</TableHead>
          <TableHead label={t('inventory.receipts.lineUnitCost')}>{t('inventory.receipts.lineUnitCost')}</TableHead>
          <TableHead label={t('inventory.receipts.totalCost')}>{t('inventory.receipts.totalCost')}</TableHead>
          {editable && <TableHead label={t('products.columns.actions')}>{t('products.columns.actions')}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line, index) => (
          <TableRow key={`${line.productId}-${index}`}>
            <TableCell label={t('products.columns.product')}>
              <Text>{products.get(line.productId)?.name ?? line.productId}</Text>
            </TableCell>
            <TableCell label={t('inventory.receipts.lineQty')}>
              {editable ? (
                <Input
                  value={String(line.qty)}
                  onChangeText={(value) => updateLine(index, { qty: Math.max(0, Number(value) || 0) })}
                  keyboardType="numeric"
                />
              ) : (
                <Text>{line.qty}</Text>
              )}
            </TableCell>
            <TableCell label={t('inventory.receipts.lineUnitCost')}>
              {editable ? (
                <Input
                  value={String(line.unitCost)}
                  onChangeText={(value) => updateLine(index, { unitCost: Math.max(0, Number(value) || 0) })}
                  keyboardType="numeric"
                />
              ) : (
                <Text>{formatVND(line.unitCost)}</Text>
              )}
            </TableCell>
            <TableCell label={t('inventory.receipts.totalCost')}>
              <Text>{formatVND(line.qty * line.unitCost)}</Text>
            </TableCell>
            {editable && (
              <TableCell label={t('products.columns.actions')}>
                <IconButton accessibilityLabel={t('products.actionsDelete')} variant="ghost" onPress={() => removeLine(index)}>
                  <Text>x</Text>
                </IconButton>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell label={t('inventory.receipts.totalQty')} colSpan={2}>
            <Text variant="label">{`${t('inventory.receipts.totalQty')}: ${totals.totalQty}`}</Text>
          </TableCell>
          <TableCell label={t('inventory.receipts.totalCost')} colSpan={editable ? 3 : 2}>
            <Text variant="label">{`${t('inventory.receipts.totalCost')}: ${formatVND(totals.totalCost)}`}</Text>
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
