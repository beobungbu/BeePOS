import type { Customer, CustomerTier } from '../../domain/types';
import { createRng, pick, randInt } from './prng';
import { DEMO_ORG_ID } from './org';

const SEED = 20260911;

const FAMILY_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Vũ', 'Đặng', 'Bùi', 'Đỗ'];
const MIDDLE_NAMES = ['Văn', 'Thị', 'Hữu', 'Ngọc', 'Minh', 'Thanh', 'Quang', 'Đức'];
const GIVEN_NAMES = [
  'An', 'Bình', 'Cường', 'Dung', 'Em', 'Giang', 'Hải', 'Hoa', 'Khoa', 'Lan',
  'Minh', 'Nga', 'Oanh', 'Phúc', 'Quân', 'Sơn', 'Tâm', 'Uyên', 'Việt', 'Yến',
];

function tierFor(totalSpent: number): CustomerTier {
  if (totalSpent >= 20_000_000) return 'platinum';
  if (totalSpent >= 8_000_000) return 'gold';
  if (totalSpent >= 2_000_000) return 'silver';
  return 'bronze';
}

function buildCustomers(): Customer[] {
  const rng = createRng(SEED + 5);
  const customers: Customer[] = [];
  const now = new Date('2026-09-11T00:00:00.000Z');

  for (let i = 1; i <= 40; i += 1) {
    const name = `${pick(rng, FAMILY_NAMES)} ${pick(rng, MIDDLE_NAMES)} ${pick(rng, GIVEN_NAMES)}`;
    const phone = `09${randInt(rng, 10, 99)}${String(randInt(rng, 0, 999999)).padStart(6, '0')}`;
    const totalSpent = randInt(rng, 0, 60) * 500_000;
    const daysAgo = randInt(rng, 5, 720);
    const createdAt = new Date(now.getTime() - daysAgo * 86_400_000).toISOString();

    customers.push({
      id: `customer-${i}`,
      orgId: DEMO_ORG_ID,
      name,
      phone,
      points: Math.floor(totalSpent / 10_000),
      tier: tierFor(totalSpent),
      totalSpent,
      createdAt,
    });
  }
  return customers;
}

export const customers: Customer[] = buildCustomers();
