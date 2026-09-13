/**
 * The figures and the identifiers a VAT invoice prints, derived from the order.
 *
 * The serial and the number are generated locally. The prototype says so on the screen rather
 * than implying an issued e-invoice, which would be a claim about a tax filing that is not
 * true (`docs/design/specs/commerce.md` section A).
 */

import { formatVND } from '../../../domain/money';
import type { Order, Product, VatInvoiceInfo } from '../../../domain/types';
import { baseQtyOf } from '../../pos/lib/wholesale';
import { amountInWordsVnd } from './amount-in-words';

/** The 01GTKT form number this layout follows. */
export const INVOICE_FORM_NO = '01GTKT0/001';

/**
 * Invoice serial: `1C<yy>TBE`, the shape a Vietnamese serial takes (form digit, invoice type
 * letter, two year digits, three issuer letters).
 */
export function invoiceSerial(at: Date): string {
  return `1C${String(at.getFullYear()).slice(-2)}TBE`;
}

/**
 * Invoice number, derived from the order code so the same order always prints the same
 * number. Locally generated, seven digits, as the disclaimer on the screen states.
 */
export function invoiceNumber(order: Order): string {
  const digits = order.code.replace(/\D/g, '');
  const tail = digits.slice(-7) || '0';
  return tail.padStart(7, '0');
}

export interface InvoiceLine {
  index: number;
  name: string;
  /** Base unit, because the invoice prices per piece so the buyer can reconcile line by line. */
  unit: string;
  qty: number;
  /** Net of tax, per base unit. */
  unitPrice: number;
  amount: number;
}

export interface InvoiceFigures {
  lines: InvoiceLine[];
  goodsTotal: number;
  taxTotal: number;
  grandTotal: number;
  /** Weighted VAT rate as a whole percentage, for the "Thuế suất GTGT 10 %" line. */
  taxRatePercent: number;
  amountInWords: string;
}

/**
 * Every figure on the sheet.
 *
 * Quantities and unit prices are in base units even when the order was taken by the case: the
 * buyer reconciles the invoice against the goods they counted, and those are pieces.
 */
export function invoiceFigures(order: Order, products: readonly Product[]): InvoiceFigures {
  const lines: InvoiceLine[] = order.lines.map((line, index) => {
    const product = products.find((item) => item.id === line.productId);
    const qty = baseQtyOf(line);
    const amount = Math.round(line.unitPrice * line.qty);
    return {
      index: index + 1,
      name: product?.name ?? line.productId,
      unit: product?.unit ?? '',
      qty,
      unitPrice: qty > 0 ? Math.round(amount / qty) : amount,
      amount,
    };
  });

  const goodsTotal = order.subtotal - order.discountTotal;
  const taxTotal = order.taxTotal;
  const grandTotal = order.total;
  const taxRatePercent = goodsTotal > 0 ? Math.round((taxTotal / goodsTotal) * 100) : 0;

  return {
    lines,
    goodsTotal,
    taxTotal,
    grandTotal,
    taxRatePercent,
    amountInWords: amountInWordsVnd(grandTotal),
  };
}

export interface InvoiceTextLabels {
  heading: string;
  serial: string;
  number: string;
  seller: string;
  buyerName: string;
  taxCode: string;
  goodsTotal: string;
  tax: string;
  grandTotal: string;
  inWords: string;
}

/**
 * The invoice as plain text, which is what native shares instead of printing. Every visible
 * word is passed in so this stays locale-free.
 */
export function formatInvoiceText(input: {
  order: Order;
  figures: InvoiceFigures;
  buyer: VatInvoiceInfo | undefined;
  sellerName: string;
  serial: string;
  number: string;
  labels: InvoiceTextLabels;
}): string {
  const { figures, labels } = input;
  const rows: string[] = [
    labels.heading,
    `${labels.serial}: ${input.serial}  ${labels.number}: ${input.number}`,
    `${labels.seller}: ${input.sellerName}`,
    `${labels.buyerName}: ${input.buyer?.buyerName ?? ''}`,
    `${labels.taxCode}: ${input.buyer?.taxCode ?? ''}`,
    '',
  ];

  for (const line of figures.lines) {
    rows.push(`${line.index}. ${line.name}`);
    rows.push(`   ${line.qty} ${line.unit} x ${formatVND(line.unitPrice)} = ${formatVND(line.amount)}`);
  }

  rows.push(
    '',
    `${labels.goodsTotal}: ${formatVND(figures.goodsTotal)}`,
    `${labels.tax}: ${formatVND(figures.taxTotal)}`,
    `${labels.grandTotal}: ${formatVND(figures.grandTotal)}`,
    `${labels.inWords}: ${figures.amountInWords}`,
  );

  return rows.join('\n');
}
