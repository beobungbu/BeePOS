import {
  Badge,
  Button,
  Chip,
  ChipGroup,
  EmptyState,
  Field,
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
  Textarea,
  useToast,
} from '@beemvp/beeui-ui';
import { useMemo, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useScreenHeader } from '../../components/shell/screen-header';
import { StatStrip } from '../../components/stat-strip';
import { useCatalogStore } from '../../data/catalog-store';
import { useInventoryStore } from '../../data/inventory-store';
import { currentOrgId } from '../../data/org-store';
import { stores as allStores } from '../../data/seed';
import { useSessionStore } from '../../data/session-store';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useT } from '../../i18n';
import { csvFilename, toCsv } from '../../lib/csv';
import {
  importableRows,
  parseProductImport,
  productFromRow,
  TEMPLATE_HEADER,
  type CsvImportPreview,
  type CsvImportRow,
  type CsvIssue,
  type CsvRowStatus,
} from '../../lib/csv-import';
import { exportCsvFile } from '../../lib/export-file';
import { fill } from '../orders/lib/fill';

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'p-6' } as const;

/**
 * The very light row tints of the spec (5 to 8 percent), so the text on them still passes AA.
 * `ok` gets none: a preview where every valid row is coloured is a preview where nothing is.
 */
const ROW_TINT: Record<CsvRowStatus, string> = {
  ok: '',
  warning: 'bg-warning/10',
  error: 'bg-destructive/10',
};

/** Minted outside the component: a clock read during render is not idempotent. */
function makeImportedProductId(index: number): string {
  return `product-import-${Date.now()}-${index}`;
}

const STATUS_VARIANT: Record<CsvRowStatus, 'success' | 'warning' | 'destructive'> = {
  ok: 'success',
  warning: 'warning',
  error: 'destructive',
};

type RowFilter = 'all' | CsvRowStatus;

const EMPTY_PREVIEW: CsvImportPreview = {
  rows: [],
  totals: { total: 0, ok: 0, warning: 0, error: 0, create: 0, update: 0 },
};

/**
 * Three sample rows, so the downloaded template shows the shape rather than only naming it.
 */
const TEMPLATE_ROWS = [
  ['DU-001', 'Nước ngọt Coca-Cola 330ml', 'Đồ uống', 'lon', 6500, 9000, '8935049501015', 120],
  ['DU-002', 'Nước suối Lavie 500ml', 'Đồ uống', 'chai', 3500, 5500, '', 80],
  ['MI-001', 'Mì Hảo Hảo tôm chua cay 75g', 'Mì và thực phẩm ăn liền', 'gói', 3200, 4500, '', 240],
];

export function CsvImportScreen() {
  const t = useT();
  const toast = useToast();
  const breakpoint = useBreakpoint();
  const isWide = breakpoint !== 'phone';
  const products = useCatalogStore((state) => state.products);
  const categories = useCatalogStore((state) => state.categories);
  const upsertProduct = useCatalogStore((state) => state.upsertProduct);
  const setStockLevel = useInventoryStore((state) => state.setStockLevel);
  const currentStore = useSessionStore((state) => state.store);

  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<CsvImportPreview>(EMPTY_PREVIEW);
  const [filter, setFilter] = useState<RowFilter>('all');
  const [storeId, setStoreId] = useState(currentStore?.id ?? allStores[0].id);

  const context = useMemo(() => ({ products, categories }), [products, categories]);
  const visibleRows = preview.rows.filter((row) => filter === 'all' || row.status === filter);
  const toImport = importableRows(preview.rows);

  useScreenHeader({
    title: t('inventory.import.title'),
    subtitle: [fileName, fill(t('inventory.import.subtitle'), { count: preview.totals.total })]
      .filter(Boolean)
      .join(' · '),
    backTo: '/inventory',
  });

  function issueText(issue: CsvIssue): string {
    return fill(t(`inventory.import.issue.${issue.code}`), issue.params ?? {});
  }

  function handleParse(source: string = text) {
    setPreview(parseProductImport(source, context));
    setFilter('all');
  }

  /**
   * Web only: the browser's own file picker, read as text and handed to the same parser the
   * paste box uses. Native has no document to hang an input off, so it keeps the paste box,
   * which is also what the QA suite drives.
   */
  function handlePickFile() {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      file
        .text()
        .then((content) => {
          setFileName(file.name);
          setText(content);
          handleParse(content);
        })
        .catch((error: unknown) => {
          // A file the browser refuses to read is a file the stock keeper has to be told about;
          // a silent no-op looks exactly like an empty file.
          console.error('CSV file read failed', error);
          toast.show({ title: t('common.export.errorToast'), variant: 'destructive' });
        });
    };
    input.click();
  }

  async function handleTemplate() {
    try {
      await exportCsvFile(
        csvFilename(t('common.export.products')),
        toCsv([...TEMPLATE_HEADER], TEMPLATE_ROWS),
      );
    } catch (error) {
      console.error('CSV template export failed', error);
      toast.show({ title: t('common.export.errorToast'), variant: 'destructive' });
    }
  }

  /**
   * Writes what the preview promised and nothing else: error rows were never in `toImport`,
   * and a row's stock is only touched when the file actually carried a readable quantity.
   */
  function handleApply() {
    if (toImport.length === 0) return;
    const orgId = currentOrgId();
    const byId = new Map(products.map((product) => [product.id, product]));

    toImport.forEach((row, index) => {
      const existing = row.existingProductId ? byId.get(row.existingProductId) : undefined;
      const product = productFromRow(row, existing, orgId, makeImportedProductId(index));
      upsertProduct(product);
      if (row.stock !== undefined) setStockLevel(product.id, storeId, row.stock, 'import');
    });

    toast.show({ title: fill(t('inventory.import.appliedToast'), { count: toImport.length }), variant: 'success' });
    setPreview(parseProductImport(text, { products: useCatalogStore.getState().products, categories }));
  }

  const column = {
    line: t('inventory.import.columns.line'),
    sku: t('inventory.import.columns.sku'),
    name: t('inventory.import.columns.name'),
    category: t('inventory.import.columns.category'),
    salePrice: t('inventory.import.columns.salePrice'),
    result: t('inventory.import.columns.result'),
  };

  function rowMessage(row: CsvImportRow): string {
    if (row.issues.length === 0) return t('inventory.import.resultOkMessage');
    return row.issues.map(issueText).join(' · ');
  }

  return (
    <ScrollView className="flex-1">
      <View className={`flex-1 gap-4 ${GUTTER[breakpoint]}`}>
        <Text variant="caption" tone="muted">{t('inventory.import.howTo')}</Text>

        <View className="flex-row flex-wrap items-center gap-2">
          {Platform.OS === 'web' && (
            <Button variant="outline" onPress={handlePickFile}>
              {fileName ? t('inventory.import.changeFile') : t('inventory.import.pickFile')}
            </Button>
          )}
          <Button variant="outline" onPress={handleTemplate}>
            {t('inventory.import.template')}
          </Button>
        </View>

        <Field label={t('inventory.import.pasteLabel')}>
          <Textarea
            accessibilityLabel={t('inventory.import.pasteLabel')}
            value={text}
            onChangeText={setText}
            placeholder={t('inventory.import.pastePlaceholder')}
          />
        </Field>

        <View className={isWide ? 'w-72' : ''}>
          <Field label={t('inventory.import.storeLabel')} description={t('inventory.import.storeHint')}>
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger accessibilityLabel={t('inventory.import.storeLabel')}>
                <SelectValue placeholder={t('inventory.import.storeLabel')} />
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
        </View>

        <View className="flex-row flex-wrap items-center gap-2">
          <Button variant="outline" onPress={() => handleParse()} disabled={text.trim().length === 0}>
            {t('inventory.import.parseButton')}
          </Button>
          <Button onPress={handleApply} disabled={toImport.length === 0}>
            {toImport.length === 0
              ? t('inventory.import.applyDisabled')
              : fill(t('inventory.import.applyButton'), { count: toImport.length })}
          </Button>
        </View>

        {preview.fatal && (
          <View className="rounded-lg bg-destructive/10 p-4">
            <Text variant="label" className="text-destructive">{issueText(preview.fatal)}</Text>
          </View>
        )}

        {preview.rows.length === 0 ? (
          <EmptyState
            title={t('inventory.import.emptyPreview')}
            description={t('inventory.import.emptyPreviewDescription')}
          />
        ) : (
          <>
            <ChipGroup
              className="flex-row flex-wrap gap-2"
              selectionMode="single"
              value={filter}
              onValueChange={(value) => setFilter((value as RowFilter) || 'all')}
            >
              <Chip value="all">{fill(t('inventory.import.filter.all'), { count: preview.totals.total })}</Chip>
              <Chip value="ok">{fill(t('inventory.import.filter.ok'), { count: preview.totals.ok })}</Chip>
              <Chip value="warning">{fill(t('inventory.import.filter.warning'), { count: preview.totals.warning })}</Chip>
              <Chip value="error">{fill(t('inventory.import.filter.error'), { count: preview.totals.error })}</Chip>
            </ChipGroup>

            <StatStrip
              items={[
                { label: t('inventory.import.stat.total'), value: String(preview.totals.total) },
                { label: t('inventory.import.stat.create'), value: String(preview.totals.create), tone: 'success' },
                { label: t('inventory.import.stat.update'), value: String(preview.totals.update), tone: 'warning' },
                { label: t('inventory.import.stat.skip'), value: String(preview.totals.error), tone: 'destructive' },
              ]}
            />

            <Table layout="scroll">
              <TableHeader>
                <TableRow>
                  <TableHead label={column.line}>{column.line}</TableHead>
                  <TableHead label={column.sku}>{column.sku}</TableHead>
                  <TableHead label={column.name}>{column.name}</TableHead>
                  <TableHead label={column.category}>{column.category}</TableHead>
                  <TableHead label={column.salePrice}>{column.salePrice}</TableHead>
                  <TableHead label={column.result}>{column.result}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((row) => (
                  <TableRow key={row.line} className={ROW_TINT[row.status]}>
                    <TableCell label={column.line}>
                      <Text variant="caption" tone="muted" numeric="tabular">{row.line}</Text>
                    </TableCell>
                    <TableCell label={column.sku}>
                      <Text variant="caption" tone="muted" numeric="tabular">{row.sku}</Text>
                    </TableCell>
                    <TableCell label={column.name}>
                      <Text variant="label" className="font-semibold">{row.name}</Text>
                    </TableCell>
                    <TableCell label={column.category}>
                      <Text variant="label">{row.categoryInput}</Text>
                    </TableCell>
                    <TableCell label={column.salePrice}>
                      <Text variant="label" numeric="tabular" className="w-full text-right">{row.salePrice}</Text>
                    </TableCell>
                    <TableCell label={column.result}>
                      <View className="flex-row flex-wrap items-center gap-2">
                        <Badge variant={STATUS_VARIANT[row.status]}>{t(`inventory.import.result.${row.status}`)}</Badge>
                        <Text variant="caption" tone="muted">{rowMessage(row)}</Text>
                      </View>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </View>
    </ScrollView>
  );
}
