import { useState } from 'react';
import { Button, useToast } from '@beemvp/beeui-ui';
import { useT } from '../i18n';
import { fill } from '../features/orders/lib/fill';
import { csvFilename, toCsv, type CsvValue } from '../lib/csv';
import { exportCsvFile } from '../lib/export-file';

export interface CsvExportData {
  header: string[];
  rows: CsvValue[][];
}

interface CsvExportButtonProps {
  /**
   * Filename stem, looked up as `common.export.<nameKey>`, so the file a Vietnamese cashier
   * saves is `don-hang-20260913.csv` and an English one gets `orders-20260913.csv`.
   */
  nameKey: 'orders' | 'products' | 'inventory';
  /**
   * Builds the document. A function rather than a value because the rows are only needed on
   * press: a thousand-row table would otherwise be formatted on every keystroke in the filter
   * field above it.
   */
  build: () => CsvExportData;
}

/**
 * "Xuất CSV" for the three list screens. Web downloads the file, native opens the share sheet
 * (`src/lib/export-file.ts`), and both report the outcome in a toast, because a silent no-op
 * is indistinguishable from a blocked download.
 */
export function CsvExportButton({ nameKey, build }: CsvExportButtonProps) {
  const t = useT();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function handlePress() {
    if (busy) return;
    setBusy(true);
    try {
      const { header, rows } = build();
      const result = await exportCsvFile(csvFilename(t(`common.export.${nameKey}`)), toCsv(header, rows));
      if (result.shared) {
        toast.show({ title: fill(t('common.export.successToast'), { count: rows.length }), variant: 'success' });
      }
    } catch (error) {
      // The browser can refuse the download (blocked popup, private mode) and the native share
      // sheet can reject; either way the cashier is told instead of waiting for a file.
      console.error('CSV export failed', error);
      toast.show({ title: t('common.export.errorToast'), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      accessibilityLabel={t('common.actions.exportCsv')}
      disabled={busy}
      onPress={handlePress}
      variant="outline"
    >
      {t('common.actions.exportCsv')}
    </Button>
  );
}
