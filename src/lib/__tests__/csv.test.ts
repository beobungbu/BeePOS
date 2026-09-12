import { csvCell, csvFilename, toCsv, CSV_BOM } from '../csv';

describe('csvCell', () => {
  it('leaves a plain cell unquoted', () => {
    expect(csvCell('Bánh Oreo')).toBe('Bánh Oreo');
  });

  it('quotes a comma', () => {
    expect(csvCell('Cầu Giấy, Hà Nội')).toBe('"Cầu Giấy, Hà Nội"');
  });

  it('quotes and doubles an inner quote', () => {
    expect(csvCell('Lốc 6 "lon"')).toBe('"Lốc 6 ""lon"""');
  });

  it('quotes a line break', () => {
    expect(csvCell('dòng 1\ndòng 2')).toBe('"dòng 1\ndòng 2"');
    expect(csvCell('dòng 1\r\ndòng 2')).toBe('"dòng 1\r\ndòng 2"');
  });

  it('quotes edge whitespace that a reader would otherwise drop', () => {
    expect(csvCell(' HN01 ')).toBe('" HN01 "');
  });

  it('writes VND as a plain integer, no grouping and no sign', () => {
    expect(csvCell(158_000)).toBe('158000');
    expect(csvCell(0)).toBe('0');
  });

  it('writes an empty cell for null, undefined and a non-finite number', () => {
    expect(csvCell(null)).toBe('');
    expect(csvCell(undefined)).toBe('');
    expect(csvCell(Number.NaN)).toBe('');
    expect(csvCell(Number.POSITIVE_INFINITY)).toBe('');
  });
});

describe('toCsv', () => {
  it('puts the header first and separates rows with CRLF', () => {
    const csv = toCsv(['Mã đơn', 'Tổng tiền'], [['HD-001', 158_000], ['HD-002', 9_000]]);
    expect(csv).toBe('Mã đơn,Tổng tiền\r\nHD-001,158000\r\nHD-002,9000');
  });

  it('has no trailing newline', () => {
    expect(toCsv(['a'], [['b']]).endsWith('b')).toBe(true);
  });

  it('exports a header-only document when there are no rows', () => {
    expect(toCsv(['a', 'b'], [])).toBe('a,b');
  });
});

describe('CSV_BOM', () => {
  it('is the single UTF-8 marker Excel looks for', () => {
    expect(CSV_BOM).toHaveLength(1);
    expect(CSV_BOM.charCodeAt(0)).toBe(0xfeff);
  });
});

describe('csvFilename', () => {
  it('pads the day and month', () => {
    expect(csvFilename('orders', new Date(2026, 0, 5))).toBe('orders-20260105.csv');
  });
});
