import { Platform, Share } from 'react-native';

/**
 * Printing and sharing a receipt, the two ways a paper copy leaves this prototype.
 *
 * Web prints through the browser: a print stylesheet hides the app and leaves the receipt
 * block alone at 58 mm, the roll width of the thermal printers these shops own. Native has
 * no printer driver in Expo Go, so it shares the plain-text receipt instead, which lands in
 * Zalo or Messages the way a shop already sends a bill to a customer.
 */

/** The DOM id the receipt block carries so the print stylesheet can single it out. */
export const RECEIPT_PRINT_ID = 'beepos-receipt';

const STYLE_ID = 'beepos-receipt-print-style';

/**
 * `visibility` rather than `display` keeps the receipt's own box intact while erasing the
 * app around it.
 *
 * The `:has()` rule is what makes it print at all: the app renders inside a stack of
 * relative, zero height, clipped flex boxes (the scroll view measures 0 px and hides its
 * overflow), so an absolutely positioned receipt inside it is clipped away to nothing. One
 * selector unpins every ancestor of the receipt, the document roots included, for print
 * only.
 */
const PRINT_CSS = `
@page { size: 58mm auto; margin: 3mm; }
@media print {
  :has(#${RECEIPT_PRINT_ID}) {
    position: static !important;
    overflow: visible !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    transform: none !important;
    background: #fff !important;
  }
  body * { visibility: hidden !important; }
  #${RECEIPT_PRINT_ID}, #${RECEIPT_PRINT_ID} * {
    visibility: visible !important;
    color: #000 !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  /* The rules between the sections are 1 px views filled with the border token, which the
     line above just turned transparent; on paper they have to be ink again. */
  #${RECEIPT_PRINT_ID} [class*="bg-border"] {
    background: #000 !important;
    min-height: 1px !important;
  }
  #${RECEIPT_PRINT_ID} {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 58mm !important;
    max-width: 58mm !important;
    padding: 0 !important;
    border: 0 !important;
  }
}
`;

/** Adds the print stylesheet once per document. No-op off web. */
export function ensurePrintStylesheet(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = PRINT_CSS;
  document.head.appendChild(style);
}

/** Opens the browser print dialog. Returns false when the platform cannot print at all. */
export function printReceipt(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof window.print !== 'function') {
    return false;
  }
  ensurePrintStylesheet();
  window.print();
  return true;
}

export type ShareOutcome = 'shared' | 'dismissed' | 'failed';

/** Hands the plain-text receipt to the OS share sheet. */
export async function shareReceipt(text: string, title: string): Promise<ShareOutcome> {
  try {
    const result = await Share.share({ message: text, title });
    return result.action === Share.dismissedAction ? 'dismissed' : 'shared';
  } catch {
    // The share sheet failing is not a reason to lose the sale that was just paid for, so
    // this is reported to the cashier as a toast rather than thrown at the screen.
    return 'failed';
  }
}
