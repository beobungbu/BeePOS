import type { Supplier } from '../../domain/types';
import { DEMO_ORG_ID } from './org';

/**
 * The eight partners the seeded chain buys from, in the shape a Vietnamese grocery deals
 * with: a distributor per region, two national manufacturers and a wet-market wholesaler.
 * Two are switched off so the list has something to filter and the receipt form has a reason
 * to hide a name it would otherwise offer.
 */
export const suppliers: Supplier[] = [
  {
    id: 'supplier-1',
    orgId: DEMO_ORG_ID,
    name: 'Cty TNHH Thực phẩm An Phát',
    phone: '024 3856 7788',
    address: 'Lô 12 KCN Quang Minh, Mê Linh, Hà Nội',
    note: 'Giao thứ 3 và thứ 6 hàng tuần',
    isActive: true,
  },
  {
    id: 'supplier-2',
    orgId: DEMO_ORG_ID,
    name: 'Cty CP Phân phối Miền Bắc',
    phone: '024 3773 1290',
    address: '88 Nguyễn Văn Cừ, Long Biên, Hà Nội',
    note: 'Công nợ 30 ngày',
    isActive: true,
  },
  {
    id: 'supplier-3',
    orgId: DEMO_ORG_ID,
    name: 'NPP Vinamilk Hà Nội',
    phone: '024 3927 3333',
    address: '36 Phạm Hùng, Nam Từ Liêm, Hà Nội',
    note: 'Hàng lạnh, nhận trước 9h sáng',
    isActive: true,
  },
  {
    id: 'supplier-4',
    orgId: DEMO_ORG_ID,
    name: 'Đại lý Sài Gòn Food',
    phone: '028 3910 4455',
    address: '120 Điện Biên Phủ, Bình Thạnh, TP.HCM',
    note: 'Phụ trách hai cửa hàng phía Nam',
    isActive: true,
  },
  {
    id: 'supplier-5',
    orgId: DEMO_ORG_ID,
    name: 'Cty CP Acecook Việt Nam',
    phone: '028 3754 0000',
    address: 'KCN Tân Bình, TP.HCM',
    note: 'Đặt tối thiểu 20 thùng',
    isActive: true,
  },
  {
    id: 'supplier-6',
    orgId: DEMO_ORG_ID,
    name: 'NPP Bánh kẹo Hải Hà',
    phone: '024 3863 2956',
    address: '25 Trương Định, Hai Bà Trưng, Hà Nội',
    isActive: true,
  },
  {
    id: 'supplier-7',
    orgId: DEMO_ORG_ID,
    name: 'Chợ đầu mối Hoà Cường',
    phone: '0236 3624 118',
    address: 'Đường 2 Tháng 9, Hải Châu, Đà Nẵng',
    note: 'Trả tiền mặt theo chuyến',
    isActive: false,
  },
  {
    id: 'supplier-8',
    orgId: DEMO_ORG_ID,
    name: 'Cty TNHH Hoá mỹ phẩm Lan Anh',
    phone: '028 3866 7012',
    address: '54 Cộng Hoà, Tân Bình, TP.HCM',
    note: 'Đã ngừng hợp tác từ tháng 6',
    isActive: false,
  },
];
