/**
 * Hands a CSV document to the platform: a download on web, the share sheet on native.
 *
 * Kept apart from `src/lib/csv.ts` so the formatter stays pure and testable. Every failure
 * path rejects instead of swallowing, because the caller shows a toast and the cashier
 * otherwise waits for a file that never arrives.
 */
import { Platform, Share } from 'react-native';
import { CSV_BOM } from './csv';

/** True when the share sheet was dismissed without choosing a target (native only). */
export interface ExportResult {
  shared: boolean;
}

function downloadOnWeb(filename: string, csv: string): ExportResult {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') {
    throw new Error('File download is not available in this browser');
  }
  // The BOM is what makes Excel read `Nước ngọt` instead of `NÆ°á»›c ngá»t`.
  const blob = new Blob([CSV_BOM + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Safari needs the object URL to outlive the click by a tick before it is revoked.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return { shared: true };
}

/**
 * Saves (web) or shares (native) `csv` under `filename`. Rejects when the platform refuses;
 * resolves with `shared: false` when the user dismissed the native share sheet.
 */
export async function exportCsvFile(filename: string, csv: string): Promise<ExportResult> {
  if (Platform.OS === 'web') return downloadOnWeb(filename, csv);

  // No file system dependency in this prototype: the share sheet takes the document as text,
  // which every mail and chat target accepts. The BOM is web-only, it would show up as a
  // stray character in a message body.
  const result = await Share.share({ message: csv, title: filename });
  return { shared: result.action !== Share.dismissedAction };
}
