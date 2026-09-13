import { Platform, Share } from 'react-native';

/**
 * The second print path.
 *
 * The retail receipt and the Z report are 80 mm monospace on a thermal roll; a VAT invoice is
 * A5 on an office printer, with the normal font and a ruled table, and the printer for it is
 * chosen separately in store settings. Sharing the same stylesheet would put a legal document
 * on a till roll, so this is its own module with its own page size.
 *
 * Native has no printer driver in Expo Go, so it shares the invoice as text, which is what a
 * shop already does when it sends a bill over Zalo.
 */

/** The DOM id the invoice sheet carries so the print stylesheet can single it out. */
export const INVOICE_PRINT_ID = 'beepos-vat-invoice';

const STYLE_ID = 'beepos-invoice-print-style';

/**
 * Same shape as the receipt stylesheet and for the same reason: the app renders inside a
 * stack of relative, zero-height, clipped flex boxes, so an absolutely positioned sheet
 * inside it is clipped away to nothing unless every ancestor is unpinned for print.
 */
const PRINT_CSS = `
@page { size: A5; margin: 10mm; }
@media print {
  :has(#${INVOICE_PRINT_ID}) {
    position: static !important;
    overflow: visible !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    transform: none !important;
    background: #fff !important;
  }
  body * { visibility: hidden !important; }
  #${INVOICE_PRINT_ID}, #${INVOICE_PRINT_ID} * {
    visibility: visible !important;
    color: #000 !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  /* The rules between the blocks are 1 px views filled with a border token, which the line
     above just turned transparent; on paper they have to be ink again. */
  #${INVOICE_PRINT_ID} [class*="bg-border"] {
    background: #000 !important;
    min-height: 1px !important;
  }
  #${INVOICE_PRINT_ID} {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 128mm !important;
    max-width: 128mm !important;
    border: 0 !important;
    padding: 0 !important;
  }
}
`;

/** Adds the A5 print stylesheet once per document. No-op off web. */
export function ensureInvoiceStylesheet(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = PRINT_CSS;
  document.head.appendChild(style);
}

/** Opens the browser print dialog on the A5 sheet. False when the platform cannot print. */
export function printInvoice(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof window.print !== 'function') {
    return false;
  }
  ensureInvoiceStylesheet();
  window.print();
  return true;
}

export type ShareOutcome = 'shared' | 'dismissed' | 'failed';

/** Hands the invoice text to the OS share sheet, the native substitute for a printer. */
export async function shareInvoice(text: string, title: string): Promise<ShareOutcome> {
  try {
    const result = await Share.share({ message: text, title });
    return result.action === Share.dismissedAction ? 'dismissed' : 'shared';
  } catch {
    // A share sheet that fails is not a reason to lose the invoice; the screen says so in a
    // toast instead of throwing at the reader.
    return 'failed';
  }
}
