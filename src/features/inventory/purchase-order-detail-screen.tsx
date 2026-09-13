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
  HelperText,
  Input,
  KeyboardAwareScreen,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stepper,
  StepperItem,
  Text,
  useToast,
} from '@beemvp/beeui-ui';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useCatalogStore } from '../../data/catalog-store';
import { applyReceiptCost } from '../../data/costing-store';
import { useInventoryStore } from '../../data/inventory-store';
import { useLotStore } from '../../data/lot-store';
import { currentOrgId } from '../../data/org-store';
import { usePurchasingStore } from '../../data/purchasing-store';
import { stores as allStores } from '../../data/seed';
import { useSessionStore } from '../../data/session-store';
import { useSupplierStore } from '../../data/supplier-store';
import { formatVND } from '../../domain/money';
import type { GoodsReceipt, Lot, PurchaseOrder, PurchaseOrderLine, PurchaseOrderStatus } from '../../domain/types';
import { useScreenHeader } from '../../components/shell/screen-header';
import { StatStrip } from '../../components/stat-strip';
import { useT } from '../../i18n';
import { goBackOr } from '../../lib/navigation';
import { formatDate } from '../../lib/datetime';
import { fill } from '../orders/lib/fill';
import { SupplierPicker } from '../suppliers/components/supplier-picker';
import { PoLinesTable } from './components/po-lines-table';
import { formatExpiryInput, parseExpiryInput } from './lib/lots';
import {
  canReceive,
  defaultReceiveQuantities,
  isEditable,
  nextPurchaseOrderCode,
  outstandingOf,
  purchaseOrderTotals,
} from './lib/purchase-orders';
import { ProductPicker } from './product-picker';

const LIST_ROUTE = '/inventory/purchase-orders';

/** Ids are minted outside the component: a clock read during render is not idempotent. */
function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

/** Where each status sits on the four step strip of the spec. */
const STEP_BY_STATUS: Record<PurchaseOrderStatus, number> = {
  draft: 1,
  sent: 2,
  partial: 3,
  received: 4,
  cancelled: 1,
};

const STATUS_VARIANT: Record<PurchaseOrderStatus, 'outline' | 'primary' | 'warning' | 'success' | 'destructive'> = {
  draft: 'outline',
  sent: 'primary',
  partial: 'warning',
  received: 'success',
  cancelled: 'destructive',
};

/** Lot code and expiry the stock keeper types for one product of one delivery. */
interface LotDraft {
  lotCode: string;
  expiry: string;
}

interface PurchaseOrderDetailScreenProps {
  purchaseOrderId?: string;
}

export function PurchaseOrderDetailScreen({ purchaseOrderId }: PurchaseOrderDetailScreenProps) {
  const t = useT();
  const toast = useToast();
  const products = useCatalogStore((state) => state.products);
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const currentStore = useSessionStore((state) => state.store);

  const purchaseOrders = usePurchasingStore((state) => state.purchaseOrders);
  const upsertPurchaseOrder = usePurchasingStore((state) => state.upsertPurchaseOrder);
  const sendPurchaseOrder = usePurchasingStore((state) => state.sendPurchaseOrder);
  const receivePurchaseOrder = usePurchasingStore((state) => state.receivePurchaseOrder);
  const cancelPurchaseOrder = usePurchasingStore((state) => state.cancelPurchaseOrder);
  const upsertGoodsReceipt = useInventoryStore((state) => state.upsertGoodsReceipt);
  const receiveGoodsReceipt = useInventoryStore((state) => state.receiveGoodsReceipt);
  const upsertLot = useLotStore((state) => state.upsertLot);

  const existing = purchaseOrderId ? purchaseOrders.find((order) => order.id === purchaseOrderId) : undefined;
  const notFound = Boolean(purchaseOrderId) && !existing;

  const [supplierId, setSupplierId] = useState(existing?.supplierId ?? '');
  const [storeId, setStoreId] = useState(existing?.storeId ?? currentStore?.id ?? allStores[0].id);
  const [expected, setExpected] = useState(formatExpiryInput(existing?.expectedAt));
  const [lines, setLines] = useState<PurchaseOrderLine[]>(existing?.lines ?? []);
  const [receiveQty, setReceiveQty] = useState<Record<string, number>>(() =>
    existing ? defaultReceiveQuantities(existing) : {},
  );
  const [lotDrafts, setLotDrafts] = useState<Record<string, LotDraft>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirm, setConfirm] = useState<'send' | 'cancel' | 'receive' | null>(null);

  const editable = isEditable(existing);
  const receiving = Boolean(existing) && canReceive(existing as PurchaseOrder);
  const totals = purchaseOrderTotals(existing ?? { lines });
  const supplierName = suppliers.find((supplier) => supplier.id === supplierId)?.name ?? '';
  const expectedDate = expected.trim().length > 0 ? parseExpiryInput(expected) : undefined;
  const expectedError = expected.trim().length > 0 && !expectedDate
    ? t('inventory.purchaseOrders.expectedInvalid')
    : undefined;
  const canSave = supplierId.length > 0 && lines.length > 0 && lines.every((line) => line.qty > 0) && !expectedError;

  useScreenHeader({
    title: existing?.code ?? t('inventory.purchaseOrders.newOrder'),
    subtitle: existing
      ? [supplierName, existing.expectedAt ? formatDate(existing.expectedAt.toISOString()) : '']
          .filter(Boolean)
          .join(' · ')
      : undefined,
    backTo: LIST_ROUTE,
  });

  /** Products of this delivery that carry lots and need a batch typed in. */
  const lotProducts = useMemo(
    () =>
      (existing?.lines ?? [])
        .filter((line) => (receiveQty[line.productId] ?? 0) > 0 && productById.get(line.productId)?.trackLots)
        .map((line) => line.productId),
    [existing, receiveQty, productById],
  );

  const receiveLines = (existing?.lines ?? [])
    .map((line) => ({ productId: line.productId, qty: Math.min(outstandingOf(line), receiveQty[line.productId] ?? 0) }))
    .filter((line) => line.qty > 0);
  const receiveTotalQty = receiveLines.reduce((total, line) => total + line.qty, 0);
  const receiveValue = receiveLines.reduce((total, line) => {
    const unitCost = existing?.lines.find((entry) => entry.productId === line.productId)?.unitCost ?? 0;
    return total + line.qty * unitCost;
  }, 0);
  const lotError = lotProducts.some((productId) => {
    const draft = lotDrafts[productId];
    if (!draft || draft.lotCode.trim().length === 0) return true;
    return draft.expiry.trim().length > 0 && !parseExpiryInput(draft.expiry);
  });
  const canConfirmReceive = receiveLines.length > 0 && !lotError;

  function buildOrder(status: PurchaseOrderStatus): PurchaseOrder {
    return {
      id: existing?.id ?? makeId('po'),
      orgId: existing?.orgId ?? currentOrgId(),
      storeId,
      supplierId,
      code: existing?.code ?? nextPurchaseOrderCode(purchaseOrders),
      lines,
      status,
      expectedAt: expectedDate,
      createdAt: existing?.createdAt ?? new Date(),
    };
  }

  function handleSaveDraft() {
    if (!canSave) return;
    upsertPurchaseOrder(buildOrder('draft'));
    toast.show({ title: t('inventory.purchaseOrders.savedToast'), variant: 'success' });
    goBackOr(LIST_ROUTE);
  }

  function handleSend() {
    if (!canSave) return;
    const order = buildOrder('draft');
    upsertPurchaseOrder(order);
    sendPurchaseOrder(order.id);
    setConfirm(null);
    toast.show({ title: t('inventory.purchaseOrders.sentToast'), variant: 'success' });
    goBackOr(LIST_ROUTE);
  }

  function handleCancel() {
    if (!existing) return;
    cancelPurchaseOrder(existing.id);
    setConfirm(null);
    toast.show({ title: t('inventory.purchaseOrders.cancelledToast'), variant: 'success' });
    goBackOr(LIST_ROUTE);
  }

  /**
   * Books the delivery: a goods receipt for what arrived, the cost blend that receipt causes,
   * the stock it adds, the lots it creates, and the purchase order's own progress.
   *
   * The cost blend is the money work's `applyReceiptCost`, which reads the on-hand figure from
   * before the delivery whichever side of `receiveGoodsReceipt` it is called from.
   */
  function handleReceive() {
    if (!existing || !canConfirmReceive) return;

    const receipt: GoodsReceipt = {
      id: makeId('receipt'),
      orgId: existing.orgId,
      storeId: existing.storeId,
      supplierId: existing.supplierId,
      lines: receiveLines.map((line) => ({
        productId: line.productId,
        qty: line.qty,
        unitCost: existing.lines.find((entry) => entry.productId === line.productId)?.unitCost ?? 0,
      })),
      status: 'draft',
      createdAt: new Date().toISOString(),
      purchaseOrderId: existing.id,
    };

    upsertGoodsReceipt(receipt);
    // The cost book corrects for whether the receipt has been posted yet and refuses a second
    // pass over the same receipt, so the order of these two calls cannot double count a batch.
    applyReceiptCost(receipt);
    receiveGoodsReceipt(receipt.id);
    receivePurchaseOrder(existing.id, receiveLines);

    for (const productId of lotProducts) {
      const draft = lotDrafts[productId];
      const lot: Lot = {
        id: `lot-${receipt.id}-${productId}`,
        orgId: existing.orgId,
        storeId: existing.storeId,
        productId,
        lotCode: draft.lotCode.trim(),
        expiresAt: parseExpiryInput(draft.expiry),
        onHand: receiveQty[productId] ?? 0,
        receiptId: receipt.id,
      };
      upsertLot(lot);
    }

    setConfirm(null);
    toast.show({ title: t('inventory.purchaseOrders.receivedToast'), variant: 'success' });
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

  const status = existing?.status ?? 'draft';

  return (
    <KeyboardAwareScreen contentWidth="lg">
      <View className="gap-4 p-4">
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <Stepper currentStep={STEP_BY_STATUS[status]}>
            <StepperItem step={1} title={t('inventory.purchaseOrders.status.draft')} />
            <StepperItem step={2} title={t('inventory.purchaseOrders.status.sent')} />
            <StepperItem step={3} title={t('inventory.purchaseOrders.status.partial')} />
            <StepperItem step={4} title={t('inventory.purchaseOrders.status.received')} />
          </Stepper>
          <Badge variant={STATUS_VARIANT[status]}>{t(`inventory.purchaseOrders.status.${status}`)}</Badge>
        </View>

        {existing && (
          <StatStrip
            items={[
              { label: t('inventory.purchaseOrders.stat.ordered'), value: formatVND(totals.orderedValue) },
              { label: t('inventory.purchaseOrders.stat.received'), value: formatVND(totals.receivedValue), tone: 'success' },
              { label: t('inventory.purchaseOrders.stat.outstanding'), value: formatVND(totals.outstandingValue), tone: 'warning' },
              { label: t('inventory.purchaseOrders.stat.units'), value: `${totals.receivedQty} / ${totals.orderedQty}` },
              { label: t('inventory.purchaseOrders.stat.supplier'), value: supplierName },
            ]}
          />
        )}

        {editable && (
          <>
            <SupplierPicker value={supplierId} onChange={setSupplierId} />

            <Field label={t('inventory.purchaseOrders.storeLabel')} required>
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger accessibilityLabel={t('inventory.purchaseOrders.storeLabel')}>
                  <SelectValue placeholder={t('inventory.purchaseOrders.storeLabel')} />
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

            <Field
              label={t('inventory.purchaseOrders.expectedLabel')}
              invalid={Boolean(expectedError)}
              error={expectedError}
            >
              <Input
                accessibilityLabel={t('inventory.purchaseOrders.expectedLabel')}
                value={expected}
                onChangeText={setExpected}
                placeholder={t('inventory.purchaseOrders.expectedPlaceholder')}
              />
            </Field>
          </>
        )}

        <PoLinesTable
          lines={existing?.lines ?? lines}
          products={productById}
          mode={editable ? 'edit' : receiving ? 'receive' : 'read'}
          receiveQty={receiveQty}
          onChange={setLines}
          onReceiveQtyChange={(productId, qty) => setReceiveQty((prev) => ({ ...prev, [productId]: qty }))}
        />

        {editable && (
          <Button variant="outline" onPress={() => setPickerOpen(true)}>
            {t('inventory.purchaseOrders.addLine')}
          </Button>
        )}

        {receiving && lotProducts.length > 0 && (
          <Section title={t('inventory.purchaseOrders.lotSectionTitle')}>
            <View className="gap-4">
              {lotProducts.map((productId) => {
                const draft = lotDrafts[productId] ?? { lotCode: '', expiry: '' };
                const name = productById.get(productId)?.name ?? productId;
                const codeMissing = draft.lotCode.trim().length === 0;
                const expiryInvalid = draft.expiry.trim().length > 0 && !parseExpiryInput(draft.expiry);
                return (
                  <View key={productId} className="gap-2">
                    <Text variant="label" className="font-semibold">{name}</Text>
                    <View className="flex-row gap-2">
                      <View className="flex-1">
                        <Field
                          label={t('inventory.purchaseOrders.lotCodeLabel')}
                          required
                          invalid={codeMissing}
                          error={codeMissing ? t('inventory.purchaseOrders.lotCodeMissing') : undefined}
                        >
                          <Input
                            accessibilityLabel={`${t('inventory.purchaseOrders.lotCodeLabel')} ${name}`}
                            value={draft.lotCode}
                            onChangeText={(value) =>
                              setLotDrafts((prev) => ({ ...prev, [productId]: { ...draft, lotCode: value } }))
                            }
                          />
                        </Field>
                      </View>
                      <View className="flex-1">
                        <Field
                          label={t('inventory.purchaseOrders.lotExpiryLabel')}
                          invalid={expiryInvalid}
                          error={expiryInvalid ? t('inventory.purchaseOrders.lotExpiryInvalid') : undefined}
                        >
                          <Input
                            accessibilityLabel={`${t('inventory.purchaseOrders.lotExpiryLabel')} ${name}`}
                            value={draft.expiry}
                            onChangeText={(value) =>
                              setLotDrafts((prev) => ({ ...prev, [productId]: { ...draft, expiry: value } }))
                            }
                            placeholder={t('inventory.purchaseOrders.lotExpiryPlaceholder')}
                          />
                        </Field>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </Section>
        )}

        {receiving && (
          <View className="gap-1 rounded-lg bg-surface-muted p-4">
            <Text variant="caption" tone="muted">
              {fill(t('inventory.purchaseOrders.receiveSummary'), {
                qty: receiveTotalQty,
                value: formatVND(receiveValue),
              })}
            </Text>
            <Text variant="caption" tone="muted">{t('inventory.purchaseOrders.receivePartialHint')}</Text>
            {receiveLines.length === 0 && (
              <HelperText>{t('inventory.purchaseOrders.noReceiveQty')}</HelperText>
            )}
          </View>
        )}

        <View className="flex-row flex-wrap justify-end gap-2">
          {editable && (
            <Button variant="outline" onPress={handleSaveDraft} disabled={!canSave}>
              {t('inventory.purchaseOrders.saveDraft')}
            </Button>
          )}
          {existing && status !== 'received' && status !== 'cancelled' && (
            <Button variant="outline" onPress={() => setConfirm('cancel')}>
              {t('inventory.purchaseOrders.cancelOrder')}
            </Button>
          )}
          {editable && (
            <Button onPress={() => setConfirm('send')} disabled={!canSave}>
              {t('inventory.purchaseOrders.send')}
            </Button>
          )}
          {receiving && (
            <Button onPress={() => setConfirm('receive')} disabled={!canConfirmReceive}>
              {t('inventory.purchaseOrders.receiveAction')}
            </Button>
          )}
        </View>
      </View>

      <ProductPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        excludeIds={lines.map((line) => line.productId)}
        onPick={(product) => {
          setLines((prev) => [
            ...prev,
            { productId: product.id, qty: 1, receivedQty: 0, unitCost: product.costPrice },
          ]);
          setPickerOpen(false);
        }}
      />

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>
            {confirm === 'receive'
              ? t('inventory.purchaseOrders.receiveConfirmTitle')
              : confirm === 'cancel'
                ? t('inventory.purchaseOrders.cancelConfirmTitle')
                : t('inventory.purchaseOrders.sendConfirmTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {confirm === 'receive'
              ? t('inventory.purchaseOrders.receiveConfirmDescription')
              : confirm === 'cancel'
                ? t('inventory.purchaseOrders.cancelConfirmDescription')
                : t('inventory.purchaseOrders.sendConfirmDescription')}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onPress={confirm === 'receive' ? handleReceive : confirm === 'cancel' ? handleCancel : handleSend}
            >
              {confirm === 'receive'
                ? t('inventory.purchaseOrders.receiveAction')
                : confirm === 'cancel'
                  ? t('inventory.purchaseOrders.cancelOrder')
                  : t('inventory.purchaseOrders.send')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </KeyboardAwareScreen>
  );
}
