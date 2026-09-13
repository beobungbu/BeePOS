import {
  importableRows,
  mapHeader,
  parseCsvText,
  parseNumberCell,
  parseProductImport,
  productFromRow,
  type CsvImportContext,
} from '../csv-import';
import type { Category, Product } from '../../domain/types';

const categories: Category[] = [
  { id: 'cat-1', orgId: 'org-1', name: 'Đồ uống' },
  { id: 'cat-2', orgId: 'org-1', name: 'Sữa và chế phẩm' },
];

const existing: Product = {
  id: 'product-1',
  orgId: 'org-1',
  sku: 'DU-001',
  barcode: '8935049501015',
  name: 'Nước ngọt Coca-Cola 330ml',
  categoryId: 'cat-1',
  unit: 'lon',
  costPrice: 6500,
  salePrice: 9000,
  taxRate: 0.08,
  isActive: true,
  trackLots: true,
};

const context: CsvImportContext = { products: [existing], categories };

const HEADER = 'sku,name,category,unit,costPrice,salePrice,barcode,stock';

describe('parseCsvText', () => {
  it('splits cells and rows and drops the trailing newline', () => {
    expect(parseCsvText('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('keeps commas, quotes and line breaks inside a quoted cell', () => {
    expect(parseCsvText('a,b\n"x, y","say ""hi""\nagain"')).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"\nagain'],
    ]);
  });

  it('ignores the Excel byte order mark on the first header cell', () => {
    expect(parseCsvText('﻿sku,name\nA,B')[0][0]).toBe('sku');
  });
});

describe('parseNumberCell', () => {
  it('reads a dot as a thousands separator, not a decimal point', () => {
    expect(parseNumberCell('9.000')).toBe(9000);
    expect(parseNumberCell('1.250.000')).toBe(1250000);
  });

  it('reads a plain integer and a negative', () => {
    expect(parseNumberCell('9000')).toBe(9000);
    expect(parseNumberCell('-68000')).toBe(-68000);
  });

  it('refuses text and an empty cell', () => {
    expect(parseNumberCell('abc')).toBeUndefined();
    expect(parseNumberCell('   ')).toBeUndefined();
  });
});

describe('mapHeader', () => {
  it('accepts Vietnamese and English spellings, accented or not', () => {
    const mapped = mapHeader(['SKU', 'Tên sản phẩm', 'Danh mục', 'Giá bán']);
    expect(mapped).toEqual({ sku: 0, name: 1, category: 2, salePrice: 3 });
  });
});

describe('parseProductImport', () => {
  it('refuses a file with no rows', () => {
    expect(parseProductImport('', context).fatal?.code).toBe('emptyFile');
  });

  it('refuses a file missing a required column', () => {
    const preview = parseProductImport('sku,name\nA,B', context);
    expect(preview.fatal?.code).toBe('missingColumns');
    expect(preview.fatal?.params?.columns).toBe('salePrice');
  });

  it('marks a new SKU ok and an existing one a warning that overwrites', () => {
    const preview = parseProductImport(
      `${HEADER}\nDU-009,Nước suối Lavie 500ml,Đồ uống,chai,3500,5500,,24\nDU-001,Coca-Cola 330ml,Đồ uống,lon,6500,9500,,0`,
      context,
    );
    expect(preview.rows[0]).toMatchObject({ line: 2, status: 'ok', action: 'create', stock: 24 });
    expect(preview.rows[1]).toMatchObject({ line: 3, status: 'warning', action: 'update', existingProductId: 'product-1' });
    expect(preview.rows[1].issues.map((issue) => issue.code)).toEqual(['existingSku']);
    expect(preview.totals).toEqual({ total: 2, ok: 1, warning: 1, error: 0, create: 1, update: 1 });
  });

  it('errors on a missing SKU, a non-numeric price and a negative price', () => {
    const preview = parseProductImport(
      `${HEADER}\n,Bánh quy Cosy 132g,Đồ uống,gói,10000,21000,,0\nGV-002,Nước mắm,Đồ uống,chai,40000,-68000,,0\nHP-009,Nước xả,Đồ uống,can,50000,abc,,0`,
      context,
    );
    expect(preview.rows.map((row) => row.issues[0].code)).toEqual([
      'missingSku',
      'negativeSalePrice',
      'invalidSalePrice',
    ]);
    expect(preview.rows.every((row) => row.status === 'error' && row.action === 'skip')).toBe(true);
    expect(importableRows(preview.rows)).toEqual([]);
  });

  it('warns when the category spelling misses and falls back to a real category', () => {
    const preview = parseProductImport(`${HEADER}\nSU-003,Sữa tươi 1L,Sua,hộp,26000,32000,,0`, context);
    const issue = preview.rows[0].issues[0];
    expect(issue).toMatchObject({ code: 'unknownCategory', level: 'warning' });
    expect(issue.params).toEqual({ value: 'Sua', fallback: 'Đồ uống' });
    expect(preview.rows[0].categoryId).toBe('cat-1');
  });

  it('errors on a SKU repeated inside the same file', () => {
    const preview = parseProductImport(
      `${HEADER}\nNEW-1,A,Đồ uống,cái,1,2,,0\nNEW-1,B,Đồ uống,cái,1,2,,0`,
      context,
    );
    expect(preview.rows[0].status).toBe('ok');
    expect(preview.rows[1].issues[0].code).toBe('duplicateSku');
  });

  it('warns on a barcode another product already owns but not on the row keeping its own', () => {
    const preview = parseProductImport(
      `${HEADER}\nNEW-2,B,Đồ uống,cái,1,2,8935049501015,0\nDU-001,Coca,Đồ uống,lon,6500,9000,8935049501015,0`,
      context,
    );
    expect(preview.rows[0].issues.map((issue) => issue.code)).toContain('duplicateBarcode');
    expect(preview.rows[1].issues.map((issue) => issue.code)).toEqual(['existingSku', 'duplicateBarcode']);
  });

  it('warns rather than fails on an unreadable stock cell and imports the row without it', () => {
    const preview = parseProductImport(`${HEADER}\nNEW-3,C,Đồ uống,cái,1,2,,ba muoi`, context);
    expect(preview.rows[0]).toMatchObject({ status: 'warning', action: 'create', stock: undefined });
    expect(preview.rows[0].issues[0].code).toBe('invalidStock');
  });
});

describe('productFromRow', () => {
  it('keeps the fields a price file does not carry', () => {
    const preview = parseProductImport(`${HEADER}\nDU-001,Coca mới,Sữa và chế phẩm,lon,7000,9500,,0`, context);
    const product = productFromRow(preview.rows[0], existing, 'org-1', 'unused');
    expect(product).toMatchObject({
      id: 'product-1',
      name: 'Coca mới',
      categoryId: 'cat-2',
      salePrice: 9500,
      costPrice: 7000,
      taxRate: 0.08,
      trackLots: true,
      barcode: '8935049501015',
    });
  });

  it('creates a new record with the id it was handed', () => {
    const preview = parseProductImport(`${HEADER}\nNEW-9,Mới,Đồ uống,cái,1,2,,0`, context);
    const product = productFromRow(preview.rows[0], undefined, 'org-1', 'product-new');
    expect(product).toMatchObject({ id: 'product-new', orgId: 'org-1', isActive: true, taxRate: 0 });
  });
});
