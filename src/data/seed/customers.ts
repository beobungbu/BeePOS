import type { Customer, CustomerTier } from '../../domain/types';
import { createRng, pick, randInt } from './prng';
import { DEMO_ORG_ID } from './org';
import { AGENT_A_GROUP_ID, AGENT_B_GROUP_ID, RETAIL_GROUP_ID } from './pricing';

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
      type: 'retail',
      groupId: RETAIL_GROUP_ID,
    });
  }
  return customers;
}

/**
 * The twelve companies the chain sells to on account: `customer-41` through `customer-52`,
 * numbered straight on from the retail accounts so no id is ever reused.
 *
 * Every one carries what a Vietnamese wholesale buyer actually needs on file: a mã số thuế for
 * the VAT invoice, a delivery address that is not the shop, the rep who owns the account, a
 * credit limit and a payment term. Six of them carry an open balance in the ledger seed, two
 * of those past due, and one (`customer-52`) is deliberately left with a zero credit limit so
 * the "cannot put this on account" path has a subject.
 */
const COMPANY_SEEDS: {
  companyName: string;
  contactName: string;
  deliveryAddress: string;
  /**
   * The registered office the VAT invoice is addressed to, set only where it differs from the
   * delivery address. Three of the twelve have one, so the invoice screen has both cases.
   */
  billingAddress?: string;
  groupId: string;
  salesRepId: string;
  creditLimit: number;
  paymentTermDays: number;
  /** Set where a mockup names the exact value the screens are drawn against. */
  taxCode?: string;
  phone?: string;
}[] = [
  // The account every commerce mockup is drawn around; its tax code, phone, rep, limit and
  // term are the ones printed in `docs/design/mockups/commerce-sales.html`.
  { companyName: 'Cty TNHH Thương mại Minh Long', contactName: 'Nguyễn Minh Long', deliveryAddress: '145 Cầu Giấy, Hà Nội', billingAddress: 'Tầng 4, 88 Láng Hạ, Đống Đa, Hà Nội', groupId: AGENT_A_GROUP_ID, salesRepId: 'staff-7', creditLimit: 80_000_000, paymentTermDays: 30, taxCode: '0106847221', phone: '0913452118' },
  { companyName: 'Cty CP Siêu thị Bình Minh', contactName: 'Trần Bình Minh', deliveryAddress: '27 Nguyễn Văn Cừ, Long Biên, Hà Nội', groupId: AGENT_A_GROUP_ID, salesRepId: 'staff-3', creditLimit: 120_000_000, paymentTermDays: 45 },
  { companyName: 'Nhà hàng Sen Vàng', contactName: 'Lê Thị Sen', deliveryAddress: '9 Trần Duy Hưng, Cầu Giấy, Hà Nội', groupId: AGENT_B_GROUP_ID, salesRepId: 'staff-2', creditLimit: 40_000_000, paymentTermDays: 15 },
  { companyName: 'Cty TNHH Suất ăn Công nghiệp Tân Á', contactName: 'Phạm Tân', deliveryAddress: 'KCN Sài Đồng, Long Biên, Hà Nội', billingAddress: '12 Ngô Quyền, Hoàn Kiếm, Hà Nội', groupId: AGENT_A_GROUP_ID, salesRepId: 'staff-3', creditLimit: 200_000_000, paymentTermDays: 45 },
  { companyName: 'Chuỗi cà phê Gió Mới', contactName: 'Hoàng Gió', deliveryAddress: '58 Xô Viết Nghệ Tĩnh, Bình Thạnh, TP.HCM', billingAddress: '215 Nguyễn Thị Minh Khai, Quận 1, TP.HCM', groupId: AGENT_B_GROUP_ID, salesRepId: 'staff-4', creditLimit: 60_000_000, paymentTermDays: 30 },
  { companyName: 'Cty TNHH Dịch vụ Trường Phát', contactName: 'Vũ Trường Phát', deliveryAddress: '112 Điện Biên Phủ, Bình Thạnh, TP.HCM', groupId: AGENT_A_GROUP_ID, salesRepId: 'staff-4', creditLimit: 90_000_000, paymentTermDays: 30 },
  { companyName: 'Trường Mầm non Hoa Sữa', contactName: 'Đặng Thị Hoa', deliveryAddress: '4 Trần Phú, Hải Châu, Đà Nẵng', groupId: AGENT_B_GROUP_ID, salesRepId: 'staff-5', creditLimit: 25_000_000, paymentTermDays: 15 },
  { companyName: 'Cty CP Du lịch Biển Đông', contactName: 'Bùi Hải Đăng', deliveryAddress: '77 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng', groupId: AGENT_B_GROUP_ID, salesRepId: 'staff-5', creditLimit: 70_000_000, paymentTermDays: 30 },
  { companyName: 'Tạp hoá Bảy Hiền', contactName: 'Đỗ Văn Bảy', deliveryAddress: '301 Cộng Hoà, Tân Bình, TP.HCM', groupId: AGENT_A_GROUP_ID, salesRepId: 'staff-4', creditLimit: 35_000_000, paymentTermDays: 15 },
  { companyName: 'Cty TNHH Bếp ăn Hoà Bình', contactName: 'Ngô Hoà', deliveryAddress: 'Lô C2 KCN Quang Minh, Mê Linh, Hà Nội', groupId: AGENT_A_GROUP_ID, salesRepId: 'staff-2', creditLimit: 150_000_000, paymentTermDays: 45 },
  { companyName: 'Khách sạn Thăng Long', contactName: 'Phan Thăng', deliveryAddress: '21 Ngọc Lâm, Long Biên, Hà Nội', groupId: AGENT_B_GROUP_ID, salesRepId: 'staff-3', creditLimit: 50_000_000, paymentTermDays: 30 },
  { companyName: 'Cty TNHH Vận tải Nam Tiến', contactName: 'Trịnh Nam', deliveryAddress: '18 Xuân Thuỷ, Cầu Giấy, Hà Nội', groupId: AGENT_B_GROUP_ID, salesRepId: 'staff-2', creditLimit: 0, paymentTermDays: 0 },
];

/** First company id; the screens and the ledger seed both count from it. */
export const FIRST_COMPANY_CUSTOMER_INDEX = 41;

function buildCompanyCustomers(): Customer[] {
  const rng = createRng(SEED + 25);
  const now = new Date('2026-09-11T00:00:00.000Z');

  return COMPANY_SEEDS.map((company, index) => {
    const sequence = FIRST_COMPANY_CUSTOMER_INDEX + index;
    const totalSpent = randInt(rng, 40, 400) * 1_000_000;
    const daysSince = randInt(rng, 90, 900);

    return {
      id: `customer-${sequence}`,
      orgId: DEMO_ORG_ID,
      name: company.companyName,
      phone: company.phone ?? `09${randInt(rng, 10, 99)}${String(randInt(rng, 0, 999999)).padStart(6, '0')}`,
      points: Math.floor(totalSpent / 10_000),
      tier: tierFor(totalSpent),
      totalSpent,
      createdAt: new Date(now.getTime() - daysSince * 86_400_000).toISOString(),
      type: 'company' as const,
      groupId: company.groupId,
      // 10-digit mã số thuế, formed from the sequence so it is stable and obviously fake.
      taxCode: company.taxCode ?? `01${String(23_400_000 + sequence * 7).padStart(8, '0')}`.slice(0, 10),
      companyName: company.companyName,
      contactName: company.contactName,
      deliveryAddress: company.deliveryAddress,
      // Absent means the invoice is addressed where the goods go; the screens fall back.
      billingAddress: company.billingAddress,
      salesRepId: company.salesRepId,
      creditLimit: company.creditLimit,
      paymentTermDays: company.paymentTermDays,
    };
  });
}

export const companyCustomers: Customer[] = buildCompanyCustomers();

export const customers: Customer[] = [...buildCustomers(), ...companyCustomers];
