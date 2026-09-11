import {
  Button,
  EmptyState,
  Field,
  FormMessage,
  KeyboardAwareScreen,
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
import { router } from 'expo-router';
import { goBackOr } from '../../lib/navigation';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useCatalogStore } from '../../data/catalog-store';
import { useInventoryStore } from '../../data/inventory-store';
import { useSessionStore } from '../../data/session-store';
import { stores as allStores } from '../../data/seed';
import type { GoodsReceiptLine, StockTransfer } from '../../domain/types';
import { useT } from '../../i18n';
import { LineEditorTable } from './line-editor-table';
import { ProductPicker } from './product-picker';

function makeTransferId(): string {
  return `transfer-${Date.now()}`;
}

const STEP_BY_STATUS: Record<StockTransfer['status'], number> = { draft: 1, sent: 2, received: 3 };

interface TransferDetailScreenProps {
  transferId?: string;
}

export function TransferDetailScreen({ transferId }: TransferDetailScreenProps) {
  const t = useT();
  const toast = useToast();
  const products = useCatalogStore((state) => state.products);
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const currentStore = useSessionStore((state) => state.store);
  const transfers = useInventoryStore((state) => state.stockTransfers);
  const upsertStockTransfer = useInventoryStore((state) => state.upsertStockTransfer);
  const sendTransfer = useInventoryStore((state) => state.sendTransfer);
  const receiveTransfer = useInventoryStore((state) => state.receiveTransfer);

  const existing = transferId ? transfers.find((item) => item.id === transferId) : undefined;
  const notFound = Boolean(transferId) && !existing;

  const defaultTo = allStores.find((store) => store.id !== currentStore?.id) ?? allStores[1] ?? allStores[0];
  const [fromStoreId, setFromStoreId] = useState(existing?.fromStoreId ?? currentStore?.id ?? allStores[0].id);
  const [toStoreId, setToStoreId] = useState(existing?.toStoreId ?? defaultTo.id);
  const [lines, setLines] = useState<GoodsReceiptLine[]>(existing?.lines ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);

  const isDraft = !existing || existing.status === 'draft';
  const isSent = existing?.status === 'sent';
  const sameStoreError = fromStoreId === toStoreId;
  const canSave = !sameStoreError && lines.length > 0;

  function buildTransfer(): StockTransfer {
    return {
      id: existing?.id ?? makeTransferId(),
      fromStoreId,
      toStoreId,
      lines,
      status: existing?.status ?? 'draft',
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
  }

  function handleSaveDraft() {
    if (!canSave) return;
    upsertStockTransfer(buildTransfer());
    toast.show({ title: t('products.savedToast'), variant: 'success' });
    goBackOr('/inventory/transfers');
  }

  function handleSend() {
    if (!canSave) return;
    const transfer = buildTransfer();
    upsertStockTransfer(transfer);
    sendTransfer(transfer.id);
    toast.show({ title: t('inventory.transfers.send'), variant: 'success' });
    goBackOr('/inventory/transfers');
  }

  function handleReceive() {
    if (!existing) return;
    receiveTransfer(existing.id);
    toast.show({ title: t('inventory.transfers.receive'), variant: 'success' });
    goBackOr('/inventory/transfers');
  }

  if (notFound) {
    return (
      <View className="flex-1 p-4">
        <EmptyState title={t('products.noResultsTitle')} description="" />
        <Button variant="outline" onPress={() => goBackOr('/inventory/transfers')}>
          {t('common.actions.back')}
        </Button>
      </View>
    );
  }

  const currentStep = existing ? STEP_BY_STATUS[existing.status] : 1;

  return (
    <KeyboardAwareScreen contentWidth="md">
      <View className="gap-4 p-4">
        <Text variant="title">{t('inventory.transfers.detailTitle')}</Text>

        <Stepper currentStep={currentStep}>
          <StepperItem step={1} title={t('inventory.transfers.statusDraft')} />
          <StepperItem step={2} title={t('inventory.transfers.statusSent')} />
          <StepperItem step={3} title={t('inventory.transfers.statusReceived')} />
        </Stepper>

        <Field label={t('inventory.transfers.fromStore')} required invalid={sameStoreError}>
          <Select value={fromStoreId} onValueChange={setFromStoreId} disabled={!isDraft}>
            <SelectTrigger>
              <SelectValue placeholder={t('inventory.transfers.fromStore')} />
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

        <Field label={t('inventory.transfers.toStore')} required invalid={sameStoreError}>
          <Select value={toStoreId} onValueChange={setToStoreId} disabled={!isDraft}>
            <SelectTrigger>
              <SelectValue placeholder={t('inventory.transfers.toStore')} />
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
        {sameStoreError && <FormMessage>{t('inventory.transfers.sameStoreError')}</FormMessage>}

        <LineEditorTable lines={lines} products={productById} editable={isDraft} onChange={setLines} />

        {isDraft && (
          <Button variant="outline" onPress={() => setPickerOpen(true)}>
            {t('inventory.receipts.addLine')}
          </Button>
        )}

        <View className="flex-row justify-end gap-2">
          {isDraft && (
            <>
              <Button variant="outline" onPress={handleSaveDraft} disabled={!canSave}>
                {t('inventory.receipts.saveDraft')}
              </Button>
              <Button onPress={handleSend} disabled={!canSave}>
                {t('inventory.transfers.send')}
              </Button>
            </>
          )}
          {isSent && <Button onPress={handleReceive}>{t('inventory.transfers.receive')}</Button>}
        </View>
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
    </KeyboardAwareScreen>
  );
}
