import type { StoreSettings } from '../../../../domain/types';
import { resolveStoreSettings, type ChainSettings } from '../effective-store-settings';
import { printerNameFor } from '../printers';

const CHAIN: ChainSettings = {
  receiptHeader: 'CHUỖI TẠP HOÁ BEE',
  receiptFooter: 'Cảm ơn quý khách',
  taxRate: 0.08,
  openingHours: '08:00 - 21:00',
  printerName: 'Epson TM-T82 (LAN)',
};

const settings: StoreSettings[] = [
  {
    storeId: 'store-1',
    receiptHeader: 'CHUỖI TẠP HOÁ BEE · HN01',
    taxRate: 0.1,
    printerName: 'Xprinter XP-80C (USB)',
  },
  // A branch that follows the chain on everything, written as an empty row.
  { storeId: 'store-2', receiptHeader: '   ' },
];

describe('resolveStoreSettings', () => {
  it('takes the branch value where it has one', () => {
    const resolved = resolveStoreSettings(settings, 'store-1', CHAIN);
    expect(resolved.receiptHeader).toBe('CHUỖI TẠP HOÁ BEE · HN01');
    expect(resolved.taxRate).toBe(0.1);
    expect(resolved.printerName).toBe('Xprinter XP-80C (USB)');
  });

  it('falls back to the chain for everything the branch left alone', () => {
    const resolved = resolveStoreSettings(settings, 'store-1', CHAIN);
    expect(resolved.receiptFooter).toBe('Cảm ơn quý khách');
    expect(resolved.openingHours).toBe('08:00 - 21:00');
  });

  it('reads a blank field as inherit, never as print nothing', () => {
    const resolved = resolveStoreSettings(settings, 'store-2', CHAIN);
    expect(resolved.receiptHeader).toBe('CHUỖI TẠP HOÁ BEE');
    expect(resolved.overrides).toEqual([]);
  });

  it('follows the chain entirely for a branch with no row at all', () => {
    const resolved = resolveStoreSettings(settings, 'store-9', CHAIN);
    expect(resolved).toMatchObject({
      storeId: 'store-9',
      receiptHeader: CHAIN.receiptHeader,
      taxRate: CHAIN.taxRate,
      overrides: [],
    });
  });

  it('names exactly the fields the branch overrides', () => {
    expect(resolveStoreSettings(settings, 'store-1', CHAIN).overrides).toEqual([
      'receiptHeader',
      'taxRate',
      'printerName',
    ]);
  });

  it('keeps a deliberate zero tax rate as an override', () => {
    const zeroTax = resolveStoreSettings([{ storeId: 's', taxRate: 0 }], 's', CHAIN);
    expect(zeroTax.taxRate).toBe(0);
    expect(zeroTax.overrides).toEqual(['taxRate']);
  });
});

describe('printerNameFor', () => {
  it('names a known printer and nothing else', () => {
    expect(printerNameFor('printer-1')).toBe('Xprinter XP-80C (USB)');
    expect(printerNameFor(null)).toBeUndefined();
    expect(printerNameFor('printer-99')).toBeUndefined();
  });
});
