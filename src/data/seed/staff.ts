import type { Staff } from '../../domain/types';
import { DEMO_ORG_ID } from './org';
import { stores } from './stores';

const ALL_STORE_IDS = stores.map((store) => store.id);

/**
 * 12 staff across 4 stores: 1 owner (all stores), 4 managers (1 per store), 7 cashiers.
 *
 * Every PIN is different. The lock screen identifies the cashier from the PIN alone (that is
 * what makes "hand the till to the next shift" one gesture), so a shared PIN would hand the
 * till to whoever the array happened to list first.
 */
export const staff: Staff[] = [
  { id: 'staff-1', orgId: DEMO_ORG_ID, name: 'Nguyễn Văn An', role: 'owner', storeIds: ALL_STORE_IDS, pin: '1000' },
  { id: 'staff-2', orgId: DEMO_ORG_ID, name: 'Trần Thị Bình', role: 'manager', storeIds: ['store-1'], pin: '2001' },
  { id: 'staff-3', orgId: DEMO_ORG_ID, name: 'Lê Văn Cường', role: 'manager', storeIds: ['store-2'], pin: '2002' },
  { id: 'staff-4', orgId: DEMO_ORG_ID, name: 'Phạm Thị Dung', role: 'manager', storeIds: ['store-3'], pin: '2003' },
  { id: 'staff-5', orgId: DEMO_ORG_ID, name: 'Hoàng Văn Em', role: 'manager', storeIds: ['store-4'], pin: '2004' },
  { id: 'staff-6', orgId: DEMO_ORG_ID, name: 'Vũ Thị Giang', role: 'cashier', storeIds: ['store-1'], pin: '3001' },
  { id: 'staff-7', orgId: DEMO_ORG_ID, name: 'Đặng Văn Hải', role: 'cashier', storeIds: ['store-1'], pin: '3002' },
  { id: 'staff-8', orgId: DEMO_ORG_ID, name: 'Bùi Thị Hoa', role: 'cashier', storeIds: ['store-2'], pin: '3003' },
  { id: 'staff-9', orgId: DEMO_ORG_ID, name: 'Ngô Văn Khoa', role: 'cashier', storeIds: ['store-2'], pin: '3004' },
  {
    id: 'staff-10',
    orgId: DEMO_ORG_ID,
    name: 'Đỗ Thị Lan',
    role: 'cashier',
    storeIds: ['store-3', 'store-4'],
    pin: '3005',
  },
  { id: 'staff-11', orgId: DEMO_ORG_ID, name: 'Phan Văn Minh', role: 'cashier', storeIds: ['store-3'], pin: '3006' },
  { id: 'staff-12', orgId: DEMO_ORG_ID, name: 'Trịnh Thị Nga', role: 'cashier', storeIds: ['store-4'], pin: '3007' },
];
