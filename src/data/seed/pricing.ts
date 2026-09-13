/**
 * Customer groups, price lists, price rules, promotions and the loyalty rule.
 *
 * Three groups, because that is the shape of a Vietnamese grocery that also sells on: walk-ins
 * at the shelf price, and two tiers of đại lý on a contract. Each agent tier has its own price
 * list with quantity tiers on the fast movers, so the precedence chain
 * (customer > tier > list > group discount > store > list price) has a real row at every level
 * and a reviewer can see each source win on the POS tile.
 */

import type {
  CustomerGroup,
  LoyaltyRule,
  PriceList,
  PriceRule,
  Promotion,
} from '../../domain/types';
import { TIER_THRESHOLDS } from '../../domain/customers';
import { DEMO_ORG_ID } from './org';
import { products } from './products';
import { daysAgo, daysAhead, roundToLabel } from './clock';

export const RETAIL_GROUP_ID = 'group-retail';
export const AGENT_A_GROUP_ID = 'group-agent-a';
export const AGENT_B_GROUP_ID = 'group-agent-b';

export const AGENT_A_PRICE_LIST_ID = 'pricelist-agent-a';
export const AGENT_B_PRICE_LIST_ID = 'pricelist-agent-b';

export const priceLists: PriceList[] = [
  { id: AGENT_A_PRICE_LIST_ID, orgId: DEMO_ORG_ID, name: 'Bảng giá Đại lý A', isActive: true },
  { id: AGENT_B_PRICE_LIST_ID, orgId: DEMO_ORG_ID, name: 'Bảng giá Đại lý B', isActive: true },
];

export const customerGroups: CustomerGroup[] = [
  { id: RETAIL_GROUP_ID, orgId: DEMO_ORG_ID, name: 'Lẻ', discountPercent: 0 },
  {
    id: AGENT_A_GROUP_ID,
    orgId: DEMO_ORG_ID,
    name: 'Đại lý A',
    discountPercent: 5,
    priceListId: AGENT_A_PRICE_LIST_ID,
  },
  {
    id: AGENT_B_GROUP_ID,
    orgId: DEMO_ORG_ID,
    name: 'Đại lý B',
    discountPercent: 8,
    priceListId: AGENT_B_PRICE_LIST_ID,
  },
];

/**
 * How far below the catalogue price each list sits, per quantity tier. A deeper tier is always
 * cheaper than the one below it, so a quantity that clears two rows can only ever get the
 * better price and the tier test cannot pass by accident.
 */
const LIST_TIERS: Record<string, { minQty: number; multiplier: number }[]> = {
  [AGENT_A_PRICE_LIST_ID]: [
    { minQty: 1, multiplier: 0.92 },
    { minQty: 10, multiplier: 0.88 },
    { minQty: 50, multiplier: 0.84 },
  ],
  [AGENT_B_PRICE_LIST_ID]: [
    { minQty: 1, multiplier: 0.89 },
    { minQty: 20, multiplier: 0.83 },
  ],
};

/** Fast movers the agents actually buy by the case; the lists only price these. */
const LIST_PRODUCT_IDS: Record<string, string[]> = {
  [AGENT_A_PRICE_LIST_ID]: [
    'product-1',
    'product-2',
    'product-5',
    'product-13',
    'product-21',
    'product-22',
    'product-41',
    'product-61',
  ],
  // Overlaps A deliberately: the same SKU has to be priced differently for two groups.
  [AGENT_B_PRICE_LIST_ID]: [
    'product-1',
    'product-2',
    'product-13',
    'product-41',
    'product-61',
    'product-81',
    'product-101',
    'product-102',
  ],
};

/** Only the first three products of each list carry the deeper tiers; the rest are flat. */
const TIERED_PRODUCT_COUNT = 3;

const productById = new Map(products.map((product) => [product.id, product]));

function buildListRules(): PriceRule[] {
  const rules: PriceRule[] = [];

  for (const list of priceLists) {
    const tiers = LIST_TIERS[list.id];
    const productIds = LIST_PRODUCT_IDS[list.id];

    productIds.forEach((productId, index) => {
      const product = productById.get(productId);
      if (!product) return;
      const applicable = index < TIERED_PRODUCT_COUNT ? tiers : tiers.slice(0, 1);

      for (const tier of applicable) {
        rules.push({
          id: `rule-${list.id}-${productId}-q${tier.minQty}`,
          orgId: DEMO_ORG_ID,
          priceListId: list.id,
          productId,
          minQty: tier.minQty,
          unitPrice: roundToLabel(product.salePrice * tier.multiplier),
        });
      }
    });
  }

  return rules;
}

/**
 * Prices negotiated with one buyer, which beat every list. Kept to four so the screens have a
 * short, readable table, and pointed at customers the company seed creates.
 */
const CUSTOMER_RULES: { customerId: string; productId: string; minQty: number; multiplier: number }[] = [
  { customerId: 'customer-41', productId: 'product-1', minQty: 1, multiplier: 0.8 },
  { customerId: 'customer-41', productId: 'product-13', minQty: 1, multiplier: 0.82 },
  { customerId: 'customer-42', productId: 'product-1', minQty: 1, multiplier: 0.78 },
  { customerId: 'customer-45', productId: 'product-41', minQty: 1, multiplier: 0.81 },
];

function buildCustomerRules(): PriceRule[] {
  return CUSTOMER_RULES.flatMap((rule) => {
    const product = productById.get(rule.productId);
    if (!product) return [];
    return [
      {
        id: `rule-customer-${rule.customerId}-${rule.productId}`,
        orgId: DEMO_ORG_ID,
        customerId: rule.customerId,
        productId: rule.productId,
        minQty: rule.minQty,
        unitPrice: roundToLabel(product.salePrice * rule.multiplier),
      },
    ];
  });
}

export const priceRules: PriceRule[] = [...buildListRules(), ...buildCustomerRules()];

/**
 * Four promotions covering every shape the engine has to handle: a live percent discount, a
 * buy-2-get-1 on a single SKU, a flat amount off one category at two branches, and one that
 * ended last month so the "not applied" path is visible without editing dates.
 *
 * Only the percent offer is stackable; the rest have to win on their own.
 */
export const promotions: Promotion[] = [
  // The offer the POS mockup shows on a wholesale line, badged "KM Tết -10%".
  {
    id: 'promo-1',
    orgId: DEMO_ORG_ID,
    name: 'KM Tết sữa Vinamilk',
    type: 'percent',
    value: 10,
    productIds: ['product-21', 'product-22', 'product-23', 'product-24'],
    startsAt: daysAgo(7),
    endsAt: daysAhead(14),
    isActive: true,
    stackable: true,
  },
  {
    id: 'promo-2',
    orgId: DEMO_ORG_ID,
    name: 'Mua 2 tặng 1 mì Hảo Hảo',
    type: 'buy_x_get_y',
    value: 0,
    buyQty: 2,
    getQty: 1,
    productIds: ['product-81'],
    startsAt: daysAgo(3),
    endsAt: daysAhead(11),
    isActive: true,
    stackable: false,
  },
  {
    id: 'promo-3',
    orgId: DEMO_ORG_ID,
    name: 'Giảm 5.000 đ hoá phẩm tại Hà Nội',
    type: 'amount',
    value: 5000,
    categoryIds: ['cat-7'],
    storeIds: ['store-1', 'store-2'],
    startsAt: daysAgo(10),
    endsAt: daysAhead(20),
    isActive: true,
    stackable: false,
  },
  {
    id: 'promo-4',
    orgId: DEMO_ORG_ID,
    name: 'Khuyến mãi hè (đã kết thúc)',
    type: 'percent',
    value: 15,
    categoryIds: ['cat-5'],
    startsAt: daysAgo(90),
    endsAt: daysAgo(40),
    isActive: true,
    stackable: true,
  },
];

/**
 * The loyalty maths, pulled out of the constants in `src/domain/pos.ts` so the settings screen
 * has something to edit. The values match what the seeded customers' points were computed
 * with: one point per 10.000 đ, each point worth 1.000 đ back.
 */
export const loyaltyRule: LoyaltyRule = {
  orgId: DEMO_ORG_ID,
  earnPerVnd: 1 / 10_000,
  redeemVndPerPoint: 1000,
  tierThresholds: TIER_THRESHOLDS,
  // A tier is worth something or it is only a badge. Bronze earns the plain rate, so the
  // seeded customers' existing point balances stay reproducible from their spend.
  tierMultiplier: { bronze: 1, silver: 1.2, gold: 1.5, platinum: 2 },
};
