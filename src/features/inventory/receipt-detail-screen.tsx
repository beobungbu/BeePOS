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
  Input,
  KeyboardAwareScreen,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  useToast,
} from '@beemvp/beeui-ui';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useCatalogStore } from '../../data/catalog-store';
import { useInventoryStore } from '../../data/inventory-store';
import { useSessionStore } from '../../data/session-store';
import { stores as allStores } from '../../data/seed';
import type { GoodsReceipt, GoodsReceiptLine } from '../../domain/types';
import { useT } from '../../i18n';
import { LineEditorTable } from './line-editor-table';
import { ProductPicker } from './product-picker';

function makeReceiptId(): string {
  return `receipt-${Date.now()}`;
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

  const existing = receiptId ? receipts.find((item) => item.id === receiptId) : undefined;
  const notFound = Boolean(receiptId) && !existing;

  const [supplierName, setSupplierName] = useState(existing?.supplierName ?? '');
  const [storeId, setStoreId] = useState(existing?.storeId ?? currentStore?.id ?? allStores[0].id);
  const [lines, setLines] = useState<GoodsReceiptLine[]>(existing?.lines ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isReceived = existing?.status === 'received';
  const canSave = supplierName.trim().length > 0 && lines.length > 0;

  function buildReceipt(status: GoodsReceipt['status']): GoodsReceipt {
    return {
      id: existing?.id ?? makeReceiptId(),
      storeId,
      supplierName: supplierName.trim(),
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
    router.back();
  }

  function handleConfirmReceive() {
    const receipt = buildReceipt('draft');
    upsertGoodsReceipt(receipt);
    receiveGoodsReceipt(receipt.id);
    setConfirmOpen(false);
    toast.show({ title: t('inventory.receipts.confirmReceive'), variant: 'success' });
    router.back();
  }

  if (notFound) {
    return (
      <View className="flex-1 p-4">
        <EmptyState title={t('products.noResultsTitle')} description="" />
        <Button variant="outline" onPress={() => router.back()}>
          {t('common.actions.back')}
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAwareScreen contentWidth="md">
      <View className="gap-4 p-4">
        <View className="flex-row items-center justify-between">
          <Text variant="title">{t('inventory.receipts.detailTitle')}</Text>
          {existing && (
            <Badge variant={isReceived ? 'success' : 'outline'}>
              {isReceived ? t('inventory.receipts.statusReceived') : t('inventory.receipts.statusDraft')}
            </Badge>
          )}
        </View>

        <Field label={t('inventory.receipts.supplierLabel')} required>
          <Input value={supplierName} onChangeText={setSupplierName} editable={!isReceived} />
        </Field>

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

        {!isReceived && (
          <Button variant="outline" onPress={() => setPickerOpen(true)}>
            {t('inventory.receipts.addLine')}
          </Button>
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
