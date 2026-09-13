import { useState } from 'react';
import { Button, useToast } from '@beemvp/beeui-ui';
import { csvFilename, toCsv, type CsvValue } from '../../../lib/csv';
import { exportCsvFile } from '../../../lib/export-file';
import { useT } from '../../../i18n';
import { fill } from '../../orders/lib/fill';

export interface MoneyCsvData {
  header: string[];
  rows: CsvValue[][];
}

/**
 * "Xuất CSV" for the money tables, on the same formatter and file handler as the orders,
 * products and inventory exports (`src/lib/csv.ts`, `src/lib/export-file.ts`).
 *
 * A local button rather than `components/csv-export-button.tsx` only because that one keys its
 * filename off a closed union of three screen names owned by another area; the document,
 * quoting, BOM and share behaviour are the shared ones.
 */
export function MoneyCsvButton({ fileName, build }: { fileName: string; build: () => MoneyCsvData }) {
  const t = useT();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const label = t('money.actions.exportCsv');

  async function handlePress() {
    if (busy) return;
    setBusy(true);
    try {
      const { header, rows } = build();
      const result = await exportCsvFile(csvFilename(fileName), toCsv(header, rows));
      if (result.shared) {
        toast.show({ title: fill(t('money.actions.exportedToast'), { count: rows.length }), variant: 'success' });
      }
    } catch (error) {
      // A blocked download and a dismissed share sheet are both silent otherwise, and a
      // cashier waiting for a file that never lands has no way to tell which happened.
      console.error('money CSV export failed', error);
      toast.show({ title: t('money.actions.exportErrorToast'), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button accessibilityLabel={label} disabled={busy} onPress={handlePress} variant="outline">
      {label}
    </Button>
  );
}
