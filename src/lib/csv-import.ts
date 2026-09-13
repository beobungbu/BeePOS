/**
 * Reading a product CSV, and deciding what each row would do, without doing any of it.
 *
 * The counterpart of `src/lib/csv.ts`: that module turns rows into a file, this one turns a
 * file back into rows. Pure on purpose, because the screen's whole promise is a preview, and a
 * preview that is computed by a different code path than the import is a preview that can lie.
 *
 * Messages are codes, not sentences. The domain owns no locale (the same rule `notify.ts`
 * follows), so a row carries `{ code, params }` and the import screen looks the copy up in the
 * dictionary. A row persisted in one language and read back in another would otherwise stay in
 * the first.
 */

import type { Category, Product } from '../domain/types';
import { foldText } from './command-search';

/* -------------------------------------------------------------------------- */
/* Grid                                                                        */
/* -------------------------------------------------------------------------- */

/** Prefix Excel writes in front of a UTF-8 file; it is not part of the first header cell. */
const BOM = '﻿';

/**
 * The cell grid of an RFC 4180 document: quoted cells may hold commas, CRLF and doubled
 * quotes, and a trailing newline does not produce a final empty row.
 */
export function parseCsvText(text: string): string[][] {
  const source = text.startsWith(BOM) ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (quoted) {
      if (char !== '"') {
        cell += char;
      } else if (source[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        quoted = false;
      }
      continue;
    }

    if (char === '"' && cell.length === 0) {
      quoted = true;
    } else if (char === ',' || char === ';') {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      // A CRLF is one break, not two.
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  // A file ending in a newline leaves no dangling row; one ending in blank lines leaves rows
  // of a single empty cell, which are not data.
  return rows.filter((entry) => entry.some((value) => value.trim().length > 0));
}

/* -------------------------------------------------------------------------- */
/* Numbers                                                                     */
/* -------------------------------------------------------------------------- */

/** Grouped Vietnamese money as it comes out of a spreadsheet: `9.000`, `1 250 000`. */
const GROUPED = /^-?\d{1,3}([. ]\d{3})+$/;

/**
 * A money or quantity cell as a number, or `undefined` when the cell is not one.
 *
 * `9.000` is nine thousand here, not nine: the dot is this locale's thousands separator, and a
 * catalogue imported as nine dong per bottle is worse than an import that refuses the row.
 */
export function parseNumberCell(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  const cleaned = GROUPED.test(trimmed) ? trimmed.replace(/[. ]/g, '') : trimmed.replace(/[, ]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/* -------------------------------------------------------------------------- */
/* Columns                                                                     */
/* -------------------------------------------------------------------------- */

export type CsvColumn =
  | 'sku'
  | 'name'
  | 'category'
  | 'unit'
  | 'costPrice'
  | 'salePrice'
  | 'barcode'
  | 'stock';

/** Header spellings accepted per column, folded to unaccented lower case before comparison. */
const COLUMN_ALIASES: Record<CsvColumn, readonly string[]> = {
  sku: ['sku', 'ma sku', 'ma san pham'],
  name: ['name', 'ten', 'ten san pham', 'product name'],
  category: ['category', 'danh muc', 'nhom hang'],
  unit: ['unit', 'don vi', 'don vi tinh'],
  costPrice: ['costprice', 'cost price', 'cost', 'gia von'],
  salePrice: ['saleprice', 'sale price', 'price', 'gia ban', 'gia'],
  barcode: ['barcode', 'ma vach'],
  stock: ['stock', 'on hand', 'onhand', 'ton kho', 'ton'],
};

/** Columns a file has to carry; everything else is optional and falls back to a default. */
export const REQUIRED_COLUMNS: readonly CsvColumn[] = ['sku', 'name', 'salePrice'];

/** The header BeePOS writes when the stock keeper downloads the template. */
export const TEMPLATE_HEADER: readonly string[] = [
  'sku',
  'name',
  'category',
  'unit',
  'costPrice',
  'salePrice',
  'barcode',
  'stock',
];

/** Column index per known column name; unknown headers are ignored rather than rejected. */
export function mapHeader(header: readonly string[]): Partial<Record<CsvColumn, number>> {
  const mapped: Partial<Record<CsvColumn, number>> = {};
  header.forEach((cell, index) => {
    const folded = foldText(cell).replace(/_/g, ' ');
    for (const [column, aliases] of Object.entries(COLUMN_ALIASES) as [CsvColumn, readonly string[]][]) {
      if (mapped[column] === undefined && aliases.includes(folded)) mapped[column] = index;
    }
  });
  return mapped;
}

/* -------------------------------------------------------------------------- */
/* Rows                                                                        */
/* -------------------------------------------------------------------------- */

export type CsvIssueCode =
  | 'emptyFile'
  | 'missingColumns'
  | 'missingSku'
  | 'duplicateSku'
  | 'missingName'
  | 'missingSalePrice'
  | 'invalidSalePrice'
  | 'negativeSalePrice'
  | 'invalidCostPrice'
  | 'negativeCostPrice'
  | 'unknownCategory'
  | 'existingSku'
  | 'invalidStock'
  | 'duplicateBarcode';

export type CsvIssueLevel = 'warning' | 'error';

export interface CsvIssue {
  code: CsvIssueCode;
  level: CsvIssueLevel;
  /** Values the dictionary sentence interpolates, e.g. the category spelling that missed. */
  params?: Record<string, string | number>;
}

/** What a row would do to the catalogue. An `error` row is always `skip`. */
export type CsvRowAction = 'create' | 'update' | 'skip';
export type CsvRowStatus = 'ok' | 'warning' | 'error';

export interface CsvImportRow {
  /** 1-based line in the file, header included, so it matches what a spreadsheet shows. */
  line: number;
  sku: string;
  name: string;
  /** Category as the file spelled it, kept for the "did not match" message. */
  categoryInput: string;
  /** Category the row will actually be written against. */
  categoryId: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  barcode: string;
  /** On-hand quantity to set at the target store, when the file carried one. */
  stock?: number;
  /** The product this row overwrites, when the SKU is already in the catalogue. */
  existingProductId?: string;
  status: CsvRowStatus;
  action: CsvRowAction;
  issues: CsvIssue[];
}

export interface CsvImportTotals {
  total: number;
  ok: number;
  warning: number;
  error: number;
  create: number;
  update: number;
}

export interface CsvImportPreview {
  rows: CsvImportRow[];
  totals: CsvImportTotals;
  /** Set when the file could not be read at all; `rows` is then empty. */
  fatal?: CsvIssue;
}

export interface CsvImportContext {
  products: readonly Product[];
  categories: readonly Category[];
  /** Unit written when the file carries no unit column. */
  defaultUnit?: string;
}

const EMPTY_TOTALS: CsvImportTotals = { total: 0, ok: 0, warning: 0, error: 0, create: 0, update: 0 };

function cellAt(row: readonly string[], index: number | undefined): string {
  return index === undefined ? '' : (row[index] ?? '').trim();
}

/** Worst level among the issues: one error outranks any number of warnings. */
function statusOf(issues: readonly CsvIssue[]): CsvRowStatus {
  if (issues.some((issue) => issue.level === 'error')) return 'error';
  return issues.length > 0 ? 'warning' : 'ok';
}

/**
 * Reads a product CSV against the current catalogue and says, row by row, what would happen.
 *
 * Nothing is written and nothing is thrown: a file with no header, no rows or the wrong columns
 * comes back as a `fatal` issue, and every per-row problem stays on its row, where the spec
 * puts the cause and the consequence next to the data that caused it.
 */
export function parseProductImport(text: string, context: CsvImportContext): CsvImportPreview {
  const grid = parseCsvText(text);
  if (grid.length < 2) {
    return { rows: [], totals: EMPTY_TOTALS, fatal: { code: 'emptyFile', level: 'error' } };
  }

  const columns = mapHeader(grid[0]);
  const missing = REQUIRED_COLUMNS.filter((column) => columns[column] === undefined);
  if (missing.length > 0) {
    return {
      rows: [],
      totals: EMPTY_TOTALS,
      fatal: { code: 'missingColumns', level: 'error', params: { columns: missing.join(', ') } },
    };
  }

  const bySku = new Map(context.products.map((product) => [foldText(product.sku), product]));
  const categoryByName = new Map(context.categories.map((category) => [foldText(category.name), category]));
  const fallbackCategoryId = context.categories[0]?.id ?? '';
  const defaultUnit = context.defaultUnit ?? 'cái';
  const seenSku = new Set<string>();
  const seenBarcode = new Set<string>();
  // Codes already in the catalogue, minus the products this file is about to overwrite: a row
  // that keeps its own product's barcode is not a clash with itself.
  const catalogueBarcodes = new Map<string, string>();
  for (const product of context.products) {
    for (const code of [product.barcode, ...(product.barcodes ?? [])]) {
      if (code) catalogueBarcodes.set(code.trim(), product.id);
    }
  }

  const rows: CsvImportRow[] = grid.slice(1).map((cells, index) => {
    const line = index + 2;
    const issues: CsvIssue[] = [];

    const sku = cellAt(cells, columns.sku);
    const name = cellAt(cells, columns.name);
    const categoryInput = cellAt(cells, columns.category);
    const barcode = cellAt(cells, columns.barcode);
    const unitCell = cellAt(cells, columns.unit);
    const saleCell = cellAt(cells, columns.salePrice);
    const costCell = cellAt(cells, columns.costPrice);
    const stockCell = cellAt(cells, columns.stock);

    const foldedSku = foldText(sku);
    const existing = foldedSku ? bySku.get(foldedSku) : undefined;

    if (sku.length === 0) {
      issues.push({ code: 'missingSku', level: 'error' });
    } else if (seenSku.has(foldedSku)) {
      issues.push({ code: 'duplicateSku', level: 'error', params: { sku } });
    } else {
      seenSku.add(foldedSku);
      if (existing) issues.push({ code: 'existingSku', level: 'warning', params: { sku } });
    }

    if (name.length === 0) issues.push({ code: 'missingName', level: 'error' });

    const salePrice = parseNumberCell(saleCell);
    if (saleCell.length === 0) {
      issues.push({ code: 'missingSalePrice', level: 'error' });
    } else if (salePrice === undefined) {
      issues.push({ code: 'invalidSalePrice', level: 'error', params: { value: saleCell } });
    } else if (salePrice < 0) {
      issues.push({ code: 'negativeSalePrice', level: 'error', params: { value: saleCell } });
    }

    const costPrice = parseNumberCell(costCell);
    if (costCell.length > 0 && costPrice === undefined) {
      issues.push({ code: 'invalidCostPrice', level: 'error', params: { value: costCell } });
    } else if (costPrice !== undefined && costPrice < 0) {
      issues.push({ code: 'negativeCostPrice', level: 'error', params: { value: costCell } });
    }

    const matchedCategory = categoryInput ? categoryByName.get(foldText(categoryInput)) : undefined;
    const categoryId = matchedCategory?.id ?? existing?.categoryId ?? fallbackCategoryId;
    if (categoryInput.length > 0 && !matchedCategory) {
      issues.push({
        code: 'unknownCategory',
        level: 'warning',
        params: {
          value: categoryInput,
          fallback: context.categories.find((entry) => entry.id === categoryId)?.name ?? '',
        },
      });
    }

    const stock = parseNumberCell(stockCell);
    if (stockCell.length > 0 && (stock === undefined || stock < 0)) {
      issues.push({ code: 'invalidStock', level: 'warning', params: { value: stockCell } });
    }

    if (barcode.length > 0) {
      const ownerId = catalogueBarcodes.get(barcode);
      const clashesInFile = seenBarcode.has(barcode);
      if (clashesInFile || (ownerId !== undefined && ownerId !== existing?.id)) {
        issues.push({ code: 'duplicateBarcode', level: 'warning', params: { value: barcode } });
      }
      seenBarcode.add(barcode);
    }

    const status = statusOf(issues);
    const action: CsvRowAction = status === 'error' ? 'skip' : existing ? 'update' : 'create';

    return {
      line,
      sku,
      name,
      categoryInput,
      categoryId,
      unit: unitCell || existing?.unit || defaultUnit,
      costPrice: costPrice ?? existing?.costPrice ?? 0,
      salePrice: salePrice ?? 0,
      barcode,
      stock: stock !== undefined && stock >= 0 ? stock : undefined,
      existingProductId: existing?.id,
      status,
      action,
      issues,
    };
  });

  return { rows, totals: totalsOf(rows) };
}

/** The five counters the toolbar chips and the stat strip show. */
export function totalsOf(rows: readonly CsvImportRow[]): CsvImportTotals {
  return {
    total: rows.length,
    ok: rows.filter((row) => row.status === 'ok').length,
    warning: rows.filter((row) => row.status === 'warning').length,
    error: rows.filter((row) => row.status === 'error').length,
    create: rows.filter((row) => row.action === 'create').length,
    update: rows.filter((row) => row.action === 'update').length,
  };
}

/** Rows that will actually be written: the number the primary button counts. */
export function importableRows(rows: readonly CsvImportRow[]): CsvImportRow[] {
  return rows.filter((row) => row.action !== 'skip');
}

/**
 * The product record a row produces. `existing` keeps everything the file does not carry
 * (image, variants, units, lot flag), because a CSV of prices is not a reason to lose them.
 */
export function productFromRow(row: CsvImportRow, existing: Product | undefined, orgId: string, id: string): Product {
  return {
    ...(existing ?? {}),
    id: existing?.id ?? id,
    orgId: existing?.orgId ?? orgId,
    sku: row.sku,
    barcode: row.barcode || existing?.barcode || '',
    name: row.name,
    categoryId: row.categoryId,
    unit: row.unit,
    costPrice: row.costPrice,
    salePrice: row.salePrice,
    taxRate: existing?.taxRate ?? 0,
    isActive: existing?.isActive ?? true,
  };
}
