import type { AuditEvent } from '../../domain/types';
import type { AuditAction, AuditEntity } from '../../domain/audit';
import { DEMO_ORG_ID } from './org';

/**
 * Forty logged acts across the last three days, so `/settings/audit` opens on a log that is
 * worth filtering rather than on an empty state.
 *
 * The summaries are written the way the mockup writes them: a sentence with the amount and
 * the old value in it, so the reader never has to open the record to learn what happened.
 * Timestamps are absolute rather than "now minus n", because a seed that moves every time the
 * app boots makes two screenshots impossible to compare.
 */
const NOW = new Date('2026-09-13T14:40:00.000Z');

function minutesAgo(minutes: number): Date {
  return new Date(NOW.getTime() - minutes * 60_000);
}

interface EventSeed {
  minutesAgo: number;
  staffId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  summary: string;
  storeId?: string;
}

const EVENTS: EventSeed[] = [
  { minutesAgo: 8, staffId: 'staff-6', action: 'orderVoid', entity: 'order', entityId: 'HD-HN01-20260913-021', summary: 'Huỷ đơn 36.000 đ, lý do: khách đổi ý', storeId: 'store-1' },
  { minutesAgo: 24, staffId: 'staff-6', action: 'cashOut', entity: 'cash', entityId: 'cash-0031', summary: 'Chi vặt 80.000 đ, nước uống cho nhân viên', storeId: 'store-1' },
  { minutesAgo: 42, staffId: 'staff-2', action: 'orderRefund', entity: 'order', entityId: 'HD-HN01-20260913-016', summary: 'Hoàn một phần 42.000 đ, 2 mặt hàng', storeId: 'store-1' },
  { minutesAgo: 68, staffId: 'staff-6', action: 'orderDiscount', entity: 'order', entityId: 'HD-HN01-20260913-014', summary: 'Giảm 5.000 đ trên 86.500 đ', storeId: 'store-1' },
  { minutesAgo: 96, staffId: 'staff-2', action: 'cashOut', entity: 'cash', entityId: 'cash-0030', summary: 'Rút 5.000.000 đ nộp về chuỗi', storeId: 'store-1' },
  { minutesAgo: 130, staffId: 'staff-1', action: 'storePrice', entity: 'product', entityId: 'DU-001', summary: '9.000 đ thành 9.500 đ tại Tạp hoá Long Biên' },
  { minutesAgo: 148, staffId: 'staff-6', action: 'cashOut', entity: 'cash', entityId: 'cash-0029', summary: 'Chi vặt 150.000 đ, mua túi nilon', storeId: 'store-1' },
  { minutesAgo: 162, staffId: 'staff-2', action: 'staffPinReset', entity: 'staff', entityId: 'staff-7', summary: 'Đặt lại PIN cho Đặng Văn Hải' },
  { minutesAgo: 180, staffId: 'staff-1', action: 'staffInvite', entity: 'account', entityId: 'nga@chuoi.vn', summary: 'Mời Trịnh Thị Nga, vai trò Thu ngân, Tạp hoá Hải Châu' },
  { minutesAgo: 200, staffId: 'staff-2', action: 'stockCount', entity: 'stock', entityId: 'count-1', summary: 'Ghi nhận phiếu kiểm kê 9 dòng, lệch -3 đơn vị', storeId: 'store-1' },
  { minutesAgo: 215, staffId: 'staff-6', action: 'cashIn', entity: 'cash', entityId: 'cash-0028', summary: 'Nộp tiền 2.000.000 đ, bổ sung tiền lẻ đầu ca', storeId: 'store-1' },
  { minutesAgo: 230, staffId: 'staff-1', action: 'login', entity: 'session', entityId: 'owner@chuoi.vn', summary: 'Đăng nhập từ web' },
  { minutesAgo: 250, staffId: 'staff-6', action: 'shiftOpen', entity: 'shift', entityId: 'shift-1', summary: 'Mở ca tại Quầy 1, tiền đầu ca 1.500.000 đ', storeId: 'store-1' },
  { minutesAgo: 262, staffId: 'staff-6', action: 'login', entity: 'session', entityId: 'giang@chuoi.vn', summary: 'Đăng nhập từ web' },
  { minutesAgo: 280, staffId: 'staff-7', action: 'shiftClose', entity: 'shift', entityId: 'shift-0', summary: 'Đếm 10.700.000 đ, lệch -50.000 đ', storeId: 'store-1' },
  { minutesAgo: 292, staffId: 'staff-7', action: 'logout', entity: 'session', entityId: 'hai@chuoi.vn', summary: 'Đăng xuất' },
  { minutesAgo: 340, staffId: 'staff-3', action: 'stockAdjust', entity: 'stock', entityId: 'product-12', summary: 'Điều chỉnh tồn -4, hàng vỡ', storeId: 'store-2' },
  { minutesAgo: 372, staffId: 'staff-3', action: 'orderRefund', entity: 'order', entityId: 'HD-HN02-20260913-008', summary: 'Hoàn toàn bộ 128.000 đ, khách trả hàng', storeId: 'store-2' },
  { minutesAgo: 410, staffId: 'staff-1', action: 'productPrice', entity: 'product', entityId: 'DU-005', summary: 'Giá bán 8.500 đ thành 9.000 đ' },
  { minutesAgo: 448, staffId: 'staff-8', action: 'orderDiscount', entity: 'order', entityId: 'HD-HN02-20260913-004', summary: 'Giảm 10% trên 240.000 đ', storeId: 'store-2' },
  { minutesAgo: 500, staffId: 'staff-8', action: 'cashIn', entity: 'cash', entityId: 'cash-0027', summary: 'Nộp tiền 1.000.000 đ, đổi tiền lẻ', storeId: 'store-2' },
  { minutesAgo: 540, staffId: 'staff-3', action: 'login', entity: 'session', entityId: 'cuong@chuoi.vn', summary: 'Đăng nhập từ web' },
  { minutesAgo: 610, staffId: 'staff-4', action: 'stockCount', entity: 'stock', entityId: 'count-3', summary: 'Ghi nhận phiếu kiểm kê 11 dòng, lệch +2 đơn vị', storeId: 'store-3' },
  { minutesAgo: 660, staffId: 'staff-4', action: 'storePrice', entity: 'product', entityId: 'DU-003', summary: '21.000 đ thành 23.500 đ tại Tạp hoá Bình Thạnh' },
  { minutesAgo: 700, staffId: 'staff-10', action: 'orderVoid', entity: 'order', entityId: 'HD-HCM01-20260912-033', summary: 'Huỷ đơn 54.000 đ, lý do: bấm nhầm', storeId: 'store-3' },
  { minutesAgo: 745, staffId: 'staff-10', action: 'cashOut', entity: 'cash', entityId: 'cash-0026', summary: 'Chi vặt 45.000 đ, gửi xe', storeId: 'store-3' },
  { minutesAgo: 800, staffId: 'staff-4', action: 'staffPinReset', entity: 'staff', entityId: 'staff-11', summary: 'Đặt lại PIN cho Phan Văn Minh' },
  { minutesAgo: 860, staffId: 'staff-1', action: 'productPrice', entity: 'product', entityId: 'MI-002', summary: 'Giá bán 4.500 đ thành 5.000 đ' },
  { minutesAgo: 920, staffId: 'staff-11', action: 'shiftOpen', entity: 'shift', entityId: 'shift-2', summary: 'Mở ca tại Quầy 2, tiền đầu ca 800.000 đ', storeId: 'store-3' },
  { minutesAgo: 980, staffId: 'staff-5', action: 'stockAdjust', entity: 'stock', entityId: 'product-31', summary: 'Điều chỉnh tồn +12, nhận bù thiếu', storeId: 'store-4' },
  { minutesAgo: 1040, staffId: 'staff-5', action: 'orderRefund', entity: 'order', entityId: 'HD-DN01-20260912-011', summary: 'Hoàn một phần 26.000 đ, 1 mặt hàng', storeId: 'store-4' },
  { minutesAgo: 1120, staffId: 'staff-12', action: 'cashIn', entity: 'cash', entityId: 'cash-0025', summary: 'Nộp tiền 500.000 đ, chủ chuỗi đưa thêm', storeId: 'store-4' },
  { minutesAgo: 1200, staffId: 'staff-1', action: 'staffInvite', entity: 'account', entityId: 'khoa@chuoi.vn', summary: 'Mời Ngô Văn Khoa, vai trò Thu ngân, Tạp hoá Long Biên' },
  { minutesAgo: 1310, staffId: 'staff-5', action: 'shiftClose', entity: 'shift', entityId: 'shift-3', summary: 'Đếm 4.320.000 đ, khớp dự kiến', storeId: 'store-4' },
  { minutesAgo: 1400, staffId: 'staff-2', action: 'orderDiscount', entity: 'order', entityId: 'HD-HN01-20260912-052', summary: 'Giảm 20.000 đ trên 410.000 đ', storeId: 'store-1' },
  { minutesAgo: 1520, staffId: 'staff-1', action: 'storePrice', entity: 'product', entityId: 'DU-002', summary: '12.000 đ thành 12.500 đ tại Tạp hoá Long Biên' },
  { minutesAgo: 1640, staffId: 'staff-9', action: 'stockAdjust', entity: 'stock', entityId: 'product-7', summary: 'Điều chỉnh tồn -2, hết hạn', storeId: 'store-2' },
  { minutesAgo: 1790, staffId: 'staff-1', action: 'logout', entity: 'session', entityId: 'owner@chuoi.vn', summary: 'Đăng xuất' },
  { minutesAgo: 1920, staffId: 'staff-7', action: 'orderVoid', entity: 'order', entityId: 'HD-HN01-20260912-007', summary: 'Huỷ đơn 18.000 đ, lý do: khách bỏ đi', storeId: 'store-1' },
  { minutesAgo: 2100, staffId: 'staff-2', action: 'login', entity: 'session', entityId: 'binh@chuoi.vn', summary: 'Đăng nhập từ web' },
];

export const auditEvents: AuditEvent[] = EVENTS.map((event, index) => ({
  id: `audit-${String(index + 1).padStart(3, '0')}`,
  orgId: DEMO_ORG_ID,
  storeId: event.storeId,
  staffId: event.staffId,
  action: event.action,
  entity: event.entity,
  entityId: event.entityId,
  summary: event.summary,
  createdAt: minutesAgo(event.minutesAgo),
}));
