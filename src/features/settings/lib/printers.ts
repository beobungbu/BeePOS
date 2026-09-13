/**
 * The printers the demo offers. One list, because two screens name them: the chain's default
 * in Settings and the per-branch override on a store's page, and a branch that named a printer
 * the chain list does not have would print to nothing.
 */

export interface PrinterOption {
  id: string;
  name: string;
}

export const PRINTERS: PrinterOption[] = [
  { id: 'printer-1', name: 'Xprinter XP-80C (USB)' },
  { id: 'printer-2', name: 'Epson TM-T82 (LAN)' },
  { id: 'printer-3', name: 'HPRT TP806L (Bluetooth)' },
];

/** The printer's name, or `undefined` when nothing is selected or the id is unknown. */
export function printerNameFor(printerId: string | null | undefined): string | undefined {
  if (!printerId) return undefined;
  return PRINTERS.find((printer) => printer.id === printerId)?.name;
}
