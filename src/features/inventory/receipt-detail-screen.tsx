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
  KeyboardAwareScreen,
  SegmentedControl,
  SegmentedControlItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  useToast,
} from '@beemvp/beeui-ui';
import { goBackOr } from '../../lib/navigation';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useCatalogStore } from '../../data/catalog-store';
import { applyReceiptCost } from '../../data/costing-store';
import { useInventoryStore } from '../../data/inventory-store';
import { supplierInvoiceId, useLedgerStore } from '../../data/ledger-store';
import { useSessionStore } from '../../data/session-store';
import { useSupplierStore } from '../../data/supplier-store';
import { dueDateFor } from '../../domain/ledger';
import { formatVND } from '../../domain/money';
import type { GoodsReceipt, GoodsReceiptLine } from '../../domain/types';
import { useT } from '../../i18n';
import { fill } from '../orders/lib/fill';
import { formatDate } from '../../lib/datetime';
import { useScreenHeader } from '../../components/shell/screen-header';
import { LineEditorTable } from './line-editor-table';
import { ProductPicker } from './product-picker';
import { currentOrgId, useOrgStore } from '../../data/org-store';
import { SupplierPicker } from '../suppliers/components/supplier-picker';

function makeReceiptId(): string {
  return `receipt-${Date.now()}`;
}

/** How a receipt is settled with the partner: money now, or a bill on their terms. */
type ReceiptPayment = 'paid' | 'credit';

/** What the goods on a receipt cost, which is what the partner bills for. */
function receiptValue(lines: readonly GoodsReceiptLine[]): number {
  return lines.reduce((total, line) => total + Math.max(0, line.qty) * Math.max(0, line.unitCost), 0);
}

/** Cash-book key of the payment a receipt settled on the spot. */
function receiptPaymentRef(receiptId: string): string {
  return `receipt-${receiptId}`;
}

interface ReceiptDetailScreenProps {
  receiptId?: string;
}

export function ReceiptDetailScreen({ receiptId }: ReceiptDetailScreenProps) {
  const t = useT();
  const toast = useToast();
  const products = useCatalogStore((state) => state.products);
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const currentStore = useSessionStore((state) => state.store);
  const receipts = useInventoryStore((state) => state.goodsReceipts);
  const upsertGoodsReceipt = useInventoryStore((state) => state.upsertGoodsReceipt);
  const receiveGoodsReceipt = useInventoryStore((state) => state.receiveGoodsReceipt);
  const staff = useSessionStore((state) => state.staff);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const ledgerEntries = useLedgerStore((state) => state.entries);
  const cashBook = useLedgerStore((state) => state.cashBook);

  const existing = receiptId ? receipts.find((item) => item.id === receiptId) : undefined;
  const notFound = Boolean(receiptId) && !existing;

  const [supplierId, setSupplierId] = useState(existing?.supplierId ?? '');
  // The branches of the chain this device is signed into, not the demo seed: a document
  // must never be bookable to a branch of another chain.
  const allStores = useOrgStore((state) => state.stores);
  const [storeId, setStoreId] = useState(existing?.storeId ?? currentStore?.id ?? allStores[0]?.id ?? '');
  const [lines, setLines] = useState<GoodsReceiptLine[]>(existing?.lines ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [debtOpen, setDebtOpen] = useState(false);
  /** Null while the choice follows the partner's terms; set once the buyer overrides it. */
  const [paymentOverride, setPaymentOverride] = useState<ReceiptPayment | null>(null);

  const supplier = suppliers.find((item) => item.id === supplierId);
  // A partner who gives terms is normally billed on them, so that is the offered default; one
  // who gives none is paid at the door. Either way the choice is on screen before the goods
  // are taken in, because it is the difference between money leaving the till and a debt.
  const payment: ReceiptPayment = paymentOverride ?? (supplier?.paymentTermDays ? 'credit' : 'paid');
  const total = receiptValue(lines);
  const dueDate = dueDateFor(new Date(), supplier?.paymentTermDays);

  // What this receipt has already been settled with, if anything. Both are keyed by the
  // receipt, so this is the same question the two store actions refuse a second time.
  const hasBill = existing
    ? ledgerEntries.some((entry) => entry.id === supplierInvoiceId(existing.id))
    : false;
  const hasPayment = existing
    ? cashBook.some((entry) => entry.id === `cash-${receiptPaymentRef(existing.id)}`)
    : false;

  const isReceived = existing?.status === 'received';
  // The receipt stores the supplier id only and the name is read back off the partner record:
  // a partner whose name is spelled two ways is a partner whose purchase history is split in two.
  const canSave = supplierId.length > 0 && lines.length > 0;

  // Pushed route: the shell header names the screen and carries the way back to the list.
  useScreenHeader({ title: t('inventory.receipts.detailTitle'), backTo: '/inventory/receipts' });

  function buildReceipt(status: GoodsReceipt['status']): GoodsReceipt {
    return {
      id: existing?.id ?? makeReceiptId(),
      orgId: currentOrgId(),
      storeId,
      supplierId,
      lines,
      status,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
  }

  function handleSaveDraft() {
    if (!canSave) return;
    const receipt = buildReceipt('draft');
    upsertGoodsReceipt(receipt);
    toast.show({ title: t('products.savedToast'), variant: 'success' });
    goBackOr('/inventory/receipts');
  }

  /**
   * Books what the delivery costs the chain: either money out of the branch drawer now, or a
   * bill on the partner's terms that the payables screen can then collect against.
   *
   * Both store calls are keyed by the receipt and refuse a second pass, so confirming twice,
   * or confirming and then using the payables action on the same receipt, still leaves one
   * bill and one payment.
   */
  function settleReceipt(receipt: GoodsReceipt, choice: ReceiptPayment): void {
    const amount = receiptValue(receipt.lines);
    if (amount <= 0) return;

    if (choice === 'credit') {
      useLedgerStore.getState().createSupplierInvoice({
        orgId: receipt.orgId,
        storeId: receipt.storeId,
        supplierId: receipt.supplierId,
        amount,
        receiptId: receipt.id,
        dueDate: dueDateFor(new Date(receipt.createdAt), supplier?.paymentTermDays),
        note: supplier?.name,
      });
      return;
    }

    useLedgerStore.getState().postCashBook({
      orgId: receipt.orgId,
      storeId: receipt.storeId,
      kind: 'supplier_payment',
      amount,
      ref: receiptPaymentRef(receipt.id),
      refId: receipt.id,
      staffId: staff?.id ?? '',
    });
  }

  function handleConfirmReceive() {
    const receipt = buildReceipt('draft');
    upsertGoodsReceipt(receipt);
    // Confirming a delivery is also a cost event: the money work blends it into the weighted
    // average. It refuses a second pass over the same receipt, so this cannot double count.
    applyReceiptCost(receipt);
    receiveGoodsReceipt(receipt.id);
    settleReceipt(receipt, payment);
    setConfirmOpen(false);
    toast.show({
      title:
        payment === 'credit'
          ? t('inventory.receipts.payment.debtToast')
          : t('inventory.receipts.payment.paidToast'),
      variant: 'success',
    });
    goBackOr('/inventory/receipts');
  }

  /** The bill a receipt confirmed before this existed never got; raised from the detail screen. */
  function handleRecordDebt() {
    if (!existing) return;
    settleReceipt(existing, 'credit');
    setDebtOpen(false);
    toast.show({ title: t('inventory.receipts.payment.debtToast'), variant: 'success' });
  }

  if (notFound) {
    return (
      <View className="flex-1 p-4">
        <EmptyState title={t('products.noResultsTitle')} description="" />
        <Button variant="outline" onPress={() => goBackOr('/inventory/receipts')}>
          {t('common.actions.back')}
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAwareScreen contentWidth="md">
      <View className="gap-4 p-4">
        <View className="flex-row items-center justify-end">
          {existing && (
            <Badge variant={isReceived ? 'success' : 'outline'}>
              {isReceived ? t('inventory.receipts.statusReceived') : t('inventory.receipts.statusDraft')}
            </Badge>
          )}
        </View>

        <SupplierPicker value={supplierId} onChange={setSupplierId} disabled={isReceived} />

        <Field label={t('inventory.receipts.storeLabel')} required>
          <Select value={storeId} onValueChange={setStoreId} disabled={isReceived}>
            <SelectTrigger>
              <SelectValue placeholder={t('inventory.receipts.storeLabel')} />
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

        <LineEditorTable lines={lines} products={productById} editable={!isReceived} onChange={setLines} />

        {isReceived && existing ? (
          <View className="gap-1.5 rounded-md bg-surface-muted p-3">
            <Text variant="caption" className="text-muted-foreground">
              {hasBill || hasPayment
                ? t('inventory.receipts.payment.alreadyRecorded')
                : t('inventory.receipts.payment.recordDebtDescription')}
            </Text>
            {hasBill || hasPayment ? null : (
              <View className="flex-row justify-end">
                <Button variant="outline" onPress={() => setDebtOpen(true)}>
                  {t('inventory.receipts.payment.recordDebt')}
                </Button>
              </View>
            )}
          </View>
        ) : null}

        {!isReceived && (
          <Button variant="outline" onPress={() => setPickerOpen(true)}>
            {t('inventory.receipts.addLine')}
          </Button>
        )}

        {!isReceived && (
          <Field label={t('inventory.receipts.payment.label')}>
            <View className="gap-1.5">
              <SegmentedControl
                value={payment}
                onValueChange={(value) => setPaymentOverride(value as ReceiptPayment)}
                accessibilityLabel={t('inventory.receipts.payment.label')}
              >
                <SegmentedControlItem value="paid">
                  {t('inventory.receipts.payment.paidNow')}
                </SegmentedControlItem>
                <SegmentedControlItem value="credit">
                  {t('inventory.receipts.payment.onCredit')}
                </SegmentedControlItem>
              </SegmentedControl>
              <Text variant="caption" className="text-muted-foreground">
                {payment === 'paid'
                  ? t('inventory.receipts.payment.paidNowNote')
                  : dueDate && supplier?.paymentTermDays
                    ? fill(t('inventory.receipts.payment.dueNote'), {
                        date: formatDate(dueDate.toISOString()),
                        days: supplier.paymentTermDays,
                      })
                    : t('inventory.receipts.payment.noTermNote')}
              </Text>
              <View className="flex-row items-center justify-between">
                <Text variant="caption" className="text-muted-foreground">
                  {t('inventory.receipts.payment.amount')}
                </Text>
                <Text variant="label" numeric="tabular" className="font-semibold text-foreground">
                  {formatVND(total)}
                </Text>
              </View>
            </View>
          </Field>
        )}

        {!isReceived && (
          <View className="flex-row justify-end gap-2">
            <Button variant="outline" onPress={handleSaveDraft} disabled={!canSave}>
              {t('inventory.receipts.saveDraft')}
            </Button>
            <Button onPress={() => setConfirmOpen(true)} disabled={!canSave}>
              {t('inventory.receipts.confirmReceive')}
            </Button>
          </View>
        )}
      </View>

      <ProductPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        excludeIds={lines.map((line) => line.productId)}
        onPick={(product) => {
          setLines((prev) => [...prev, { productId: product.id, qty: 1, unitCost: product.costPrice }]);
          setPickerOpen(false);
        }}
      />

      <AlertDialog open={debtOpen} onOpenChange={setDebtOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('inventory.receipts.payment.recordDebt')}</AlertDialogTitle>
          <AlertDialogDescription>
            {`${t('inventory.receipts.payment.amount')}: ${formatVND(total)}`}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onPress={handleRecordDebt}>
              {t('inventory.receipts.payment.recordDebt')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('inventory.receipts.receiveConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('inventory.receipts.receiveConfirmDescription')}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onPress={handleConfirmReceive}>{t('inventory.receipts.confirmReceive')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </KeyboardAwareScreen>
  );
}
