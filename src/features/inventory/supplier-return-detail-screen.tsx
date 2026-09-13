import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  Badge,
  Button,
  EmptyState,
  Field,
  IconButton,
  Input,
  KeyboardAwareScreen,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  useToast,
} from '@beemvp/beeui-ui';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { AppIcon } from '../../components/icons';
import { useScreenHeader } from '../../components/shell/screen-header';
import { useCatalogStore } from '../../data/catalog-store';
import { useInventoryStore } from '../../data/inventory-store';
import { useLedgerStore } from '../../data/ledger-store';
import { currentOrgId, useOrgStore } from '../../data/org-store';
import { usePurchasingStore } from '../../data/purchasing-store';
import { useSessionStore } from '../../data/session-store';
import { useSupplierStore } from '../../data/supplier-store';
import { formatVND, sum } from '../../domain/money';
import type { SupplierReturn, SupplierReturnLine } from '../../domain/types';
import { useT } from '../../i18n';
import { formatDate } from '../../lib/datetime';
import { goBackOr } from '../../lib/navigation';
import { fill } from '../orders/lib/fill';
import { SupplierPicker } from '../suppliers/components/supplier-picker';
import { ProductPicker } from './product-picker';

const LIST_ROUTE = '/inventory/supplier-returns';

/** The fixed reason set; stored as a code so a record reads back in the current language. */
const REASONS = ['damaged', 'wrongItem', 'expired', 'overDelivery', 'other'] as const;

/** Minted outside the component: a clock read during render is not idempotent. */
function makeSupplierReturnId(): string {
  return `supplier-return-${Date.now()}`;
}

interface SupplierReturnDetailScreenProps {
  supplierReturnId?: string;
}

export function SupplierReturnDetailScreen({ supplierReturnId }: SupplierReturnDetailScreenProps) {
  const t = useT();
  const toast = useToast();
  const products = useCatalogStore((state) => state.products);
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const currentStore = useSessionStore((state) => state.store);
  const staff = useSessionStore((state) => state.staff);
  const receipts = useInventoryStore((state) => state.goodsReceipts);
  const adjustStock = useInventoryStore((state) => state.adjustStock);
  const supplierReturns = usePurchasingStore((state) => state.supplierReturns);
  const upsertSupplierReturn = usePurchasingStore((state) => state.upsertSupplierReturn);
  const sendSupplierReturn = usePurchasingStore((state) => state.sendSupplierReturn);

  const existing = supplierReturnId
    ? supplierReturns.find((record) => record.id === supplierReturnId)
    : undefined;
  const notFound = Boolean(supplierReturnId) && !existing;
  const isDraft = !existing || existing.status === 'draft';

  const [supplierId, setSupplierId] = useState(existing?.supplierId ?? '');
  // The branches of the chain this device is signed into, not the demo seed: a document
  // must never be bookable to a branch of another chain.
  const allStores = useOrgStore((state) => state.stores);
  const [storeId, setStoreId] = useState(existing?.storeId ?? currentStore?.id ?? allStores[0]?.id ?? '');
  const [receiptId, setReceiptId] = useState(existing?.receiptId ?? '');
  const [lines, setLines] = useState<SupplierReturnLine[]>(existing?.lines ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const supplierName = suppliers.find((supplier) => supplier.id === supplierId)?.name ?? '';
  /** Receipts this partner delivered, newest first: a return normally starts from one. */
  const supplierReceipts = useMemo(
    () =>
      receipts
        .filter((receipt) => receipt.supplierId === supplierId && receipt.status === 'received')
        .slice()
        .reverse(),
    [receipts, supplierId],
  );

  const totalQty = sum(lines.map((line) => line.qty));
  const totalValue = sum(lines.map((line) => line.qty * line.unitCost));
  const canSave = supplierId.length > 0 && lines.length > 0 && lines.every((line) => line.qty > 0);

  useScreenHeader({
    title: t('inventory.supplierReturns.detailTitle'),
    subtitle: supplierName || undefined,
    backTo: LIST_ROUTE,
  });

  const column = {
    product: t('inventory.supplierReturns.lineColumns.product'),
    qty: t('inventory.supplierReturns.lineColumns.qty'),
    unitCost: t('inventory.supplierReturns.lineColumns.unitCost'),
    reason: t('inventory.supplierReturns.lineColumns.reason'),
    lineTotal: t('inventory.supplierReturns.lineColumns.lineTotal'),
    actions: t('products.columns.actions'),
  };

  function updateLine(index: number, patch: Partial<SupplierReturnLine>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  /** Picking a receipt brings its products and their cost across, at quantity zero. */
  function handleReceiptChange(value: string) {
    setReceiptId(value);
    const receipt = receipts.find((entry) => entry.id === value);
    if (!receipt) return;
    setStoreId(receipt.storeId);
    setLines(
      receipt.lines.map((line) => ({
        productId: line.productId,
        qty: 0,
        unitCost: line.unitCost,
        reason: REASONS[0],
      })),
    );
  }

  function buildRecord(status: SupplierReturn['status']): SupplierReturn {
    return {
      id: existing?.id ?? makeSupplierReturnId(),
      orgId: existing?.orgId ?? currentOrgId(),
      storeId,
      supplierId,
      receiptId: receiptId || undefined,
      lines,
      status,
      createdAt: existing?.createdAt ?? new Date(),
    };
  }

  function handleSaveDraft() {
    if (!canSave) return;
    upsertSupplierReturn(buildRecord('draft'));
    toast.show({ title: t('inventory.supplierReturns.savedToast'), variant: 'success' });
    goBackOr(LIST_ROUTE);
  }

  /**
   * Sending states both consequences of the spec at once: the goods leave the branch's stock
   * and the same value comes off what the chain owes the partner.
   */
  function handleSend() {
    if (!canSave) return;
    const record = buildRecord('draft');
    upsertSupplierReturn(record);
    sendSupplierReturn(record.id);

    for (const line of record.lines) {
      adjustStock(line.productId, record.storeId, -line.qty, `supplier-return:${record.id}`);
    }

    // Giấy báo nợ to the supplier: the goods went back, so the payable comes down by their
    // value. The ledger store owns the sign; see `createSupplierDebitNote`.
    useLedgerStore.getState().createSupplierDebitNote({
      orgId: record.orgId,
      storeId: record.storeId,
      supplierId: record.supplierId,
      amount: sum(record.lines.map((line) => line.qty * line.unitCost)),
      staffId: staff?.id ?? '',
      refId: record.id,
    });

    setConfirmOpen(false);
    toast.show({ title: t('inventory.supplierReturns.sentToast'), variant: 'success' });
    goBackOr(LIST_ROUTE);
  }

  if (notFound) {
    return (
      <View className="flex-1 gap-3 p-4">
        <EmptyState title={t('products.noResultsTitle')} description="" />
        <Button variant="outline" onPress={() => goBackOr(LIST_ROUTE)}>
          {t('common.actions.back')}
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAwareScreen contentWidth="lg">
      <View className="gap-4 p-4">
        <View className="flex-row items-center justify-end">
          {existing && (
            <Badge variant={existing.status === 'sent' ? 'success' : 'outline'}>
              {t(`inventory.supplierReturns.status.${existing.status}`)}
            </Badge>
          )}
        </View>

        <SupplierPicker value={supplierId} onChange={setSupplierId} disabled={!isDraft} />

        <Field label={t('inventory.supplierReturns.receiptLabel')} description={t('inventory.supplierReturns.receiptHint')}>
          <Select value={receiptId} onValueChange={handleReceiptChange} disabled={!isDraft}>
            <SelectTrigger accessibilityLabel={t('inventory.supplierReturns.receiptLabel')}>
              <SelectValue placeholder={t('inventory.supplierReturns.receiptNone')} />
            </SelectTrigger>
            <SelectContent>
              {supplierReceipts.map((receipt) => (
                <SelectItem
                  key={receipt.id}
                  value={receipt.id}
                  textValue={`${formatDate(receipt.createdAt)} · ${receipt.lines.length}`}
                >
                  {`${formatDate(receipt.createdAt)} · ${fill(t('inventory.lineCount'), { count: receipt.lines.length })}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label={t('inventory.supplierReturns.storeLabel')} required>
          <Select value={storeId} onValueChange={setStoreId} disabled={!isDraft}>
            <SelectTrigger accessibilityLabel={t('inventory.supplierReturns.storeLabel')}>
              <SelectValue placeholder={t('inventory.supplierReturns.storeLabel')} />
            </SelectTrigger>
            <SelectContent>
              {allStores.map((store) => (
                <SelectItem key={store.id} value={store.id} textValue={store.name}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Table layout="scroll">
          <TableHeader>
            <TableRow>
              <TableHead label={column.product}>{column.product}</TableHead>
              <TableHead label={column.qty}>{column.qty}</TableHead>
              <TableHead label={column.unitCost}>{column.unitCost}</TableHead>
              <TableHead label={column.reason}>{column.reason}</TableHead>
              <TableHead label={column.lineTotal}>{column.lineTotal}</TableHead>
              {isDraft && <TableHead label={column.actions}>{column.actions}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line, index) => {
              const name = productById.get(line.productId)?.name ?? line.productId;
              return (
                <TableRow key={`${line.productId}-${index}`}>
                  <TableCell label={column.product}>
                    <Text variant="label" className="font-semibold">{name}</Text>
                  </TableCell>
                  <TableCell label={column.qty}>
                    {isDraft ? (
                      <Input
                        accessibilityLabel={`${column.qty} ${name}`}
                        value={String(line.qty)}
                        onChangeText={(value) => updateLine(index, { qty: Math.max(0, Number(value) || 0) })}
                        keyboardType="numeric"
                      />
                    ) : (
                      <Text variant="label" numeric="tabular" className="w-full text-right">{line.qty}</Text>
                    )}
                  </TableCell>
                  <TableCell label={column.unitCost}>
                    <Text variant="label" numeric="tabular" className="w-full text-right">
                      {formatVND(line.unitCost)}
                    </Text>
                  </TableCell>
                  <TableCell label={column.reason}>
                    {isDraft ? (
                      <Select value={line.reason} onValueChange={(value) => updateLine(index, { reason: value })}>
                        <SelectTrigger accessibilityLabel={`${column.reason} ${name}`}>
                          <SelectValue placeholder={column.reason} />
                        </SelectTrigger>
                        <SelectContent>
                          {REASONS.map((reason) => (
                            <SelectItem
                              key={reason}
                              value={reason}
                              textValue={t(`inventory.supplierReturns.reason.${reason}`)}
                            >
                              {t(`inventory.supplierReturns.reason.${reason}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Text variant="label">{t(`inventory.supplierReturns.reason.${line.reason}`)}</Text>
                    )}
                  </TableCell>
                  <TableCell label={column.lineTotal}>
                    <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                      {formatVND(line.qty * line.unitCost)}
                    </Text>
                  </TableCell>
                  {isDraft && (
                    <TableCell label={column.actions}>
                      <IconButton
                        accessibilityLabel={`${t('products.actionsDelete')} ${name}`}
                        variant="ghost"
                        onPress={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                      >
                        <AppIcon name="trash-2" tone="destructive" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {isDraft && (
          <Button variant="outline" onPress={() => setPickerOpen(true)}>
            {t('inventory.supplierReturns.addLine')}
          </Button>
        )}

        <View className="flex-row items-center justify-between">
          <Text variant="label" className="font-semibold">{t('inventory.supplierReturns.totalValue')}</Text>
          <Text variant="title" numeric="tabular">{formatVND(totalValue)}</Text>
        </View>

        <View className="gap-1 rounded-lg bg-surface-muted p-4">
          <Text variant="caption" tone="muted">
            {fill(t('inventory.supplierReturns.effectStock'), { qty: totalQty })}
          </Text>
          <Text variant="caption" tone="muted">
            {fill(t('inventory.supplierReturns.effectPayable'), { value: formatVND(totalValue) })}
          </Text>
        </View>

        {isDraft && (
          <View className="flex-row justify-end gap-2">
            <Button variant="outline" onPress={handleSaveDraft} disabled={!canSave}>
              {t('inventory.supplierReturns.saveDraft')}
            </Button>
            <Button onPress={() => setConfirmOpen(true)} disabled={!canSave}>
              {t('inventory.supplierReturns.send')}
            </Button>
          </View>
        )}
      </View>

      <ProductPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        excludeIds={lines.map((line) => line.productId)}
        onPick={(product) => {
          setLines((prev) => [
            ...prev,
            { productId: product.id, qty: 1, unitCost: product.costPrice, reason: REASONS[0] },
          ]);
          setPickerOpen(false);
        }}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('inventory.supplierReturns.sendConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('inventory.supplierReturns.sendConfirmDescription')}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onPress={handleSend}>{t('inventory.supplierReturns.send')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </KeyboardAwareScreen>
  );
}
