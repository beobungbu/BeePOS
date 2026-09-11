import type { Staff } from '../../domain/types';
import { stores } from './stores';

const ALL_STORE_IDS = stores.map((store) => store.id);
const MOCK_PIN = '1234';

/** 12 staff across 4 stores: 1 owner (all stores), 4 managers (1 per store), 7 cashiers. */
export const staff: Staff[] = [
  { id: 'staff-1', name: 'Nguyễn Văn An', role: 'owner', storeIds: ALL_STORE_IDS, pin: MOCK_PIN },
  { id: 'staff-2', name: 'Trần Thị Bình', role: 'manager', storeIds: ['store-1'], pin: MOCK_PIN },
  { id: 'staff-3', name: 'Lê Văn Cường', role: 'manager', storeIds: ['store-2'], pin: MOCK_PIN },
  { id: 'staff-4', name: 'Phạm Thị Dung', role: 'manager', storeIds: ['store-3'], pin: MOCK_PIN },
  { id: 'staff-5', name: 'Hoàng Văn Em', role: 'manager', storeIds: ['store-4'], pin: MOCK_PIN },
  { id: 'staff-6', name: 'Vũ Thị Giang', role: 'cashier', storeIds: ['store-1'], pin: MOCK_PIN },
  { id: 'staff-7', name: 'Đặng Văn Hải', role: 'cashier', storeIds: ['store-1'], pin: MOCK_PIN },
  { id: 'staff-8', name: 'Bùi Thị Hoa', role: 'cashier', storeIds: ['store-2'], pin: MOCK_PIN },
  { id: 'staff-9', name: 'Ngô Văn Khoa', role: 'cashier', storeIds: ['store-2'], pin: MOCK_PIN },
  {
    id: 'staff-10',
    name: 'Đỗ Thị Lan',
    role: 'cashier',
    storeIds: ['store-3', 'store-4'],
    pin: MOCK_PIN,
  },
  { id: 'staff-11', name: 'Phan Văn Minh', role: 'cashier', storeIds: ['store-3'], pin: MOCK_PIN },
  { id: 'staff-12', name: 'Trịnh Thị Nga', role: 'cashier', storeIds: ['store-4'], pin: MOCK_PIN },
];
