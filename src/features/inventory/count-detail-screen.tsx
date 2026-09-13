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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  useToast,
} from '@beemvp/beeui-ui';
import { goBackOr } from '../../lib/navigation';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useCatalogStore } from '../../data/catalog-store';
import { useInventoryStore } from '../../data/inventory-store';
import { useSessionStore } from '../../data/session-store';
import { stores as allStores } from '../../data/seed';
import { countVariance } from '../../domain/inventory';
import type { StockCount, StockCountLine } from '../../domain/types';
import { useT } from '../../i18n';
import { useScreenHeader } from '../../components/shell/screen-header';
import { currentOrgId } from '../../data/org-store';
import { fill } from '../orders/lib/fill';
import { recordAudit } from '../../data/audit-store';

function makeCountId(): string {
  return `count-${Date.now()}`;
}

interface CountDetailScreenProps {
  countId?: string;
}

export function CountDetailScreen({ countId }: CountDetailScreenProps) {
  const t = useT();
  const toast = useToast();
  const products = useCatalogStore((state) => state.products);
  const categories = useCatalogStore((state) => state.categories);
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const currentStore = useSessionStore((state) => state.store);
  const stockLevels = useInventoryStore((state) => state.stockLevels);
  const counts = useInventoryStore((state) => state.stockCounts);
  const upsertStockCount = useInventoryStore((state) => state.upsertStockCount);
  const postStockCount = useInventoryStore((state) => state.postStockCount);

  const existing = countId ? counts.find((item) => item.id === countId) : undefined;
  const notFound = Boolean(countId) && !existing;

  const [storeId, setStoreId] = useState(existing?.storeId ?? currentStore?.id ?? allStores[0].id);
  const [categoryId, setCategoryId] = useState<string>('all');
  const [lines, setLines] = useState<StockCountLine[]>(existing?.lines ?? []);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isDraft = !existing || existing.status === 'draft';
  const isPosted = existing?.status === 'posted';

  // Pushed route: the shell header names the screen and carries the way back to the list.
  useScreenHeader({ title: t('inventory.counts.detailTitle'), backTo: '/inventory/counts' });

  function updateCounted(index: number, value: number) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, counted: Math.max(0, value) } : line)));
  }

  function handleGenerateLines() {
    const generated = stockLevels
      .filter((level) => level.storeId === storeId)
      .filter((level) => categoryId === 'all' || productById.get(level.productId)?.categoryId === categoryId)
      .map((level) => ({ productId: level.productId, expected: level.onHand, counted: level.onHand }));
    setLines(generated);
  }

  function buildCount(status: StockCount['status']): StockCount {
    return {
      id: existing?.id ?? makeCountId(),
      orgId: currentOrgId(),
      storeId,
      lines,
      status,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
  }

  function handleSaveDraft() {
    if (lines.length === 0) return;
    upsertStockCount(buildCount('draft'));
    toast.show({ title: t('products.savedToast'), variant: 'success' });
    goBackOr('/inventory/counts');
  }

  function handlePost() {
    const count = buildCount('draft');
    upsertStockCount(count);
    postStockCount(count.id);
    recordAudit({
      action: 'stockCount',
      entity: 'stock',
      entityId: count.id,
      storeId: count.storeId,
      summary: fill(t('chain.audit.summary.stockCount'), {
        count: count.lines.length,
        variance: count.lines.reduce((total, line) => total + countVariance(line), 0),
      }),
    });
    setConfirmOpen(false);
    toast.show({ title: t('inventory.counts.post'), variant: 'success' });
    goBackOr('/inventory/counts');
  }

  if (notFound) {
    return (
      <View className="flex-1 p-4">
        <EmptyState title={t('products.noResultsTitle')} description="" />
        <Button variant="outline" onPress={() => goBackOr('/inventory/counts')}>
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
            <Badge variant={isPosted ? 'success' : 'outline'}>
              {isPosted ? t('inventory.counts.statusPosted') : t('inventory.counts.statusDraft')}
            </Badge>
          )}
        </View>

        <Field label={t('inventory.counts.scopeStore')} required>
          <Select value={storeId} onValueChange={setStoreId} disabled={!isDraft}>
            <SelectTrigger>
              <SelectValue placeholder={t('inventory.counts.scopeStore')} />
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

        {isDraft && !existing && (
          <Field label={t('inventory.counts.scopeCategory')}>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder={t('products.categoryAll')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" textValue={t('products.categoryAll')}>
                  {t('products.categoryAll')}
                </SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id} textValue={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        {isDraft && !existing && (
          <Button variant="outline" onPress={handleGenerateLines}>
            {t('inventory.counts.generate')}
          </Button>
        )}

        {lines.length > 0 && (
          <Table layout="scroll">
            <TableHeader>
              <TableRow>
                <TableHead label={t('products.columns.product')}>{t('products.columns.product')}</TableHead>
                <TableHead label={t('inventory.counts.expected')}>{t('inventory.counts.expected')}</TableHead>
                <TableHead label={t('inventory.counts.counted')}>{t('inventory.counts.counted')}</TableHead>
                <TableHead label={t('inventory.counts.variance')}>{t('inventory.counts.variance')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line, index) => {
                const variance = countVariance(line);
                return (
                  <TableRow key={line.productId}>
                    <TableCell label={t('products.columns.product')}>
                      <Text variant="label" className="font-semibold">{productById.get(line.productId)?.name ?? line.productId}</Text>
                    </TableCell>
                    <TableCell label={t('inventory.counts.expected')}>
                      <Text variant="label" tone="muted" numeric="tabular" className="w-full text-right">{line.expected}</Text>
                    </TableCell>
                    <TableCell label={t('inventory.counts.counted')}>
                      {isDraft ? (
                        <Input
                          value={String(line.counted)}
                          onChangeText={(value) => updateCounted(index, Number(value) || 0)}
                          keyboardType="numeric"
                        />
                      ) : (
                        <Text variant="label" numeric="tabular" className="w-full text-right font-bold">{line.counted}</Text>
                      )}
                    </TableCell>
                    <TableCell label={t('inventory.counts.variance')}>
                      <Badge variant={variance === 0 ? 'outline' : variance > 0 ? 'success' : 'destructive'}>
                        {variance > 0 ? `+${variance}` : variance}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {isDraft && lines.length > 0 && (
          <View className="flex-row justify-end gap-2">
            <Button variant="outline" onPress={handleSaveDraft}>
              {t('inventory.receipts.saveDraft')}
            </Button>
            <Button onPress={() => setConfirmOpen(true)}>{t('inventory.counts.post')}</Button>
          </View>
        )}
      </View>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('inventory.counts.postConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('inventory.counts.postConfirmDescription')}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onPress={handlePost}>{t('inventory.counts.post')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </KeyboardAwareScreen>
  );
}
