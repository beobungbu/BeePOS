import type { Store } from '../../domain/types';

export const stores: Store[] = [
  {
    id: 'store-1',
    code: 'HN01',
    name: 'Tạp hoá Cầu Giấy',
    address: '12 Xuân Thuỷ, Cầu Giấy, Hà Nội',
    phone: '024 3767 1201',
    isActive: true,
  },
  {
    id: 'store-2',
    code: 'HN02',
    name: 'Tạp hoá Long Biên',
    address: '88 Ngọc Lâm, Long Biên, Hà Nội',
    phone: '024 3872 5502',
    isActive: true,
  },
  {
    id: 'store-3',
    code: 'HCM01',
    name: 'Tạp hoá Bình Thạnh',
    address: '45 Xô Viết Nghệ Tĩnh, Bình Thạnh, TP.HCM',
    phone: '028 3899 4103',
    isActive: true,
  },
  {
    id: 'store-4',
    code: 'DN01',
    name: 'Tạp hoá Hải Châu',
    address: '20 Trần Phú, Hải Châu, Đà Nẵng',
    phone: '0236 3821 704',
    isActive: true,
  },
];
