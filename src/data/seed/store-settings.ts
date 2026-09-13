/**
 * Per-branch overrides of the chain defaults.
 *
 * Only two of the four branches have any, on purpose: the settings screen has to render both
 * "this shop has its own" and "this shop follows the chain", and a seed where every row is
 * filled in never shows the second. Every field is optional, so a branch overriding only its
 * printer keeps the chain's receipt text.
 */

import type { StoreSettings } from '../../domain/types';

export const storeSettings: StoreSettings[] = [
  {
    storeId: 'store-1',
    receiptHeader: 'Tạp hoá Cầu Giấy',
    receiptFooter: 'Đổi trả trong 3 ngày, giữ hoá đơn',
    taxRate: 0.08,
    openingHours: '06:30 - 22:00 hàng ngày',
    printerName: 'Xprinter XP-58 (Quầy 1)',
  },
  {
    storeId: 'store-2',
    // No receipt header: this branch prints the chain's.
    receiptFooter: 'Giao hàng miễn phí trong bán kính 3 km',
    openingHours: '07:00 - 21:30, nghỉ mùng 1 Tết',
    printerName: 'Gprinter GP-58MBIII',
  },
];
