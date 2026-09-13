/**
 * The price a line is sold at, and the reason it is that price.
 *
 * Precedence, highest first, exactly as the program spec froze it:
 *
 *   1. `customer`        a price rule naming this customer and this product
 *   2. `tier`            a quantity tier on the group's price list (highest `minQty` the qty clears)
 *   3. `group`           the group's price list, flat row (`minQty <= 1`)
 *   4. `group_discount`  the group's blanket `discountPercent` off the store or list price
 *   5. `store`           a branch price override
 *   6. `list`            the catalogue price
 *
 * A customer rule with a `minQty` is still a customer rule: naming the buyer beats naming the
 * quantity, which is what a negotiated contract price means. Promotions are applied on top of
 * whatever won, and can only ever lower the price.
 *
 * Everything here is per base unit. `resolvePrice` multiplies by the unit factor at the end,
 * so a line sold by the case is priced off the same rules as a line sold by the can.
 */

import { roundVND } from './money';
import { unitFactor } from './units';
import type {
  Customer,
  CustomerGroup,
  CustomerTier,
  LoyaltyRule,
  OrderChannel,
  PriceList,
  PriceRule,
  PriceSource,
  Product,
  Promotion,
  StorePrice,
} from './types';

/** Everything the engine needs besides the product and the quantity. */
export interface PricingContext {
  /** Branch the sale happens at; enables store price overrides and store-scoped promotions. */
  storeId?: string;
  /** The buyer, when one is attached. A retail walk-in has none. */
  customer?: Customer | null;
  /** Groups to resolve `customer.groupId` against. */
  groups?: readonly CustomerGroup[];
  priceLists?: readonly PriceList[];
  priceRules?: readonly PriceRule[];
  storePrices?: readonly StorePrice[];
  promotions?: readonly Promotion[];
  /** Moment the price is quoted at; decides which promotions are live. Defaults to now. */
  now?: Date;
  /**
   * `retail` ignores group and customer pricing, so the same buyer can be served over the
   * counter at the shelf price when the wholesale switch is off. Defaults to `wholesale`
   * when a company customer is attached, `retail` otherwise.
   */
  channel?: OrderChannel;
}

export interface PriceResolution {
  /** Price of one selling unit (already multiplied by the unit factor), whole dong. */
  unitPrice: number;
  source: PriceSource;
  /** The promotion that set the price, when one did. First of `promotionIds`. */
  promotionId?: string;
  /** Every promotion applied; more than one only when they are all stackable. */
  promotionIds: string[];
  /** The price before promotions, same unit as `unitPrice`. Lets the UI show a "was" price. */
  basePrice: number;
  /** The catalogue price for the same unit, for the deepest "was" comparison. */
  listPrice: number;
}

/** The base-unit price a source produced, before promotions. */
interface BaseResolution {
  unitPrice: number;
  source: PriceSource;
}

function activePriceListIds(
  group: CustomerGroup | undefined,
  priceLists: readonly PriceList[],
): string[] {
  if (!group?.priceListId) return [];
  const list = priceLists.find((entry) => entry.id === group.priceListId);
  return list && list.isActive ? [list.id] : [];
}

/** The group a customer belongs to, or undefined when they have none. */
export function groupFor(
  customer: Customer | null | undefined,
  groups: readonly CustomerGroup[] = [],
): CustomerGroup | undefined {
  if (!customer?.groupId) return undefined;
  return groups.find((group) => group.id === customer.groupId);
}

/** Rules that name this customer and product directly, cheapest qualifying row first. */
function customerRuleFor(
  rules: readonly PriceRule[],
  customerId: string,
  productId: string,
  baseQty: number,
): PriceRule | undefined {
  const candidates = rules.filter(
    (rule) =>
      rule.customerId === customerId &&
      rule.productId === productId &&
      baseQty >= Math.max(1, rule.minQty),
  );
  if (candidates.length === 0) return undefined;
  // Deepest qualifying tier wins, then the lowest price, so two rows cannot flip on array order.
  return candidates.sort(
    (a, b) => b.minQty - a.minQty || a.unitPrice - b.unitPrice,
  )[0];
}

/** Rows from the group's price list that the quantity clears. */
function listRulesFor(
  rules: readonly PriceRule[],
  listIds: readonly string[],
  productId: string,
  baseQty: number,
): PriceRule[] {
  if (listIds.length === 0) return [];
  return rules.filter(
    (rule) =>
      !rule.customerId &&
      rule.priceListId !== undefined &&
      listIds.includes(rule.priceListId) &&
      rule.productId === productId &&
      baseQty >= Math.max(1, rule.minQty),
  );
}

function storePriceFor(
  storePrices: readonly StorePrice[],
  storeId: string | undefined,
  productId: string,
): number | undefined {
  if (!storeId) return undefined;
  const found = storePrices.find(
    (price) => price.storeId === storeId && price.productId === productId,
  );
  return found?.salePrice;
}

/**
 * The price before promotions, per base unit, and which rule produced it.
 *
 * Exported because the POS tile needs the "Giá sỉ nhóm A" caption before a promotion is
 * folded in, and because it is the half of the engine worth asserting on its own.
 */
export function resolveBasePrice(
  product: Pick<Product, 'id' | 'salePrice' | 'unit' | 'units'>,
  baseQty: number,
  context: PricingContext = {},
): BaseResolution {
  const listPrice = product.salePrice;
  const customer = context.customer ?? undefined;
  const channel =
    context.channel ?? (customer?.type === 'company' ? 'wholesale' : 'retail');
  const rules = context.priceRules ?? [];

  const storePrice = storePriceFor(context.storePrices ?? [], context.storeId, product.id);
  const storeResolution: BaseResolution =
    storePrice !== undefined
      ? { unitPrice: storePrice, source: 'store' }
      : { unitPrice: listPrice, source: 'list' };

  // Over the counter nobody's contract applies: the shelf price is the price.
  if (channel === 'retail' || !customer) return storeResolution;

  // 1. Customer + product.
  const customerRule = customerRuleFor(rules, customer.id, product.id, baseQty);
  if (customerRule) return { unitPrice: customerRule.unitPrice, source: 'customer' };

  const group = groupFor(customer, context.groups ?? []);
  const listIds = activePriceListIds(group, context.priceLists ?? []);
  const listRules = listRulesFor(rules, listIds, product.id, baseQty);

  if (listRules.length > 0) {
    const best = [...listRules].sort((a, b) => b.minQty - a.minQty || a.unitPrice - b.unitPrice)[0];
    // 2. A tier is a list row that asked for more than one unit; 3. a flat row is not.
    return { unitPrice: best.unitPrice, source: best.minQty > 1 ? 'tier' : 'group' };
  }

  // 4. The group's blanket discount, off whichever of store/list price applies. It is its own
  // source rather than another 'group': the cart line has to be able to say "Sỉ nhóm A -5%"
  // and "Giá sỉ nhóm A" differently, since only the first is derived from the shelf price.
  if (group && group.discountPercent > 0) {
    const discounted = storeResolution.unitPrice * (1 - group.discountPercent / 100);
    return { unitPrice: Math.max(0, discounted), source: 'group_discount' };
  }

  // 5 and 6.
  return storeResolution;
}

/** Whether a promotion is live at `now` and in scope for this product, category and store. */
export function promotionApplies(
  promotion: Promotion,
  product: Pick<Product, 'id' | 'categoryId'>,
  storeId: string | undefined,
  now: Date,
): boolean {
  if (!promotion.isActive) return false;
  const at = now.getTime();
  if (at < promotion.startsAt.getTime() || at > promotion.endsAt.getTime()) return false;
  if (promotion.productIds?.length && !promotion.productIds.includes(product.id)) return false;
  if (promotion.categoryIds?.length && !promotion.categoryIds.includes(product.categoryId)) {
    return false;
  }
  if (promotion.storeIds?.length) {
    if (!storeId || !promotion.storeIds.includes(storeId)) return false;
  }
  return true;
}

/**
 * The effective per-unit price after one promotion.
 *
 * `buy_x_get_y` is spread across the line: three units under "buy 2 get 1" cost two units'
 * worth, so the per-unit price is two thirds of the base. Below the threshold nothing changes.
 */
export function applyPromotion(basePrice: number, qty: number, promotion: Promotion): number {
  if (basePrice <= 0 || qty <= 0) return Math.max(0, basePrice);

  if (promotion.type === 'percent') {
    const percent = Math.min(Math.max(promotion.value, 0), 100);
    return Math.max(0, basePrice * (1 - percent / 100));
  }
  if (promotion.type === 'amount') {
    return Math.max(0, basePrice - Math.max(0, promotion.value));
  }

  const buyQty = Math.max(1, Math.floor(promotion.buyQty ?? 0));
  const getQty = Math.max(0, Math.floor(promotion.getQty ?? 0));
  if (getQty === 0) return basePrice;
  const groupSize = buyQty + getQty;
  const freeQty = Math.floor(qty / groupSize) * getQty;
  if (freeQty <= 0) return basePrice;
  return Math.max(0, (basePrice * (qty - freeQty)) / qty);
}

interface PromotionOutcome {
  unitPrice: number;
  promotionIds: string[];
}

/**
 * Folds the live promotions into `basePrice`.
 *
 * Stackable promotions compound, in catalogue order, so two 10% offers give 19% rather than
 * 20%. A non-stackable promotion has to beat that whole chain on its own to be used, and when
 * it does it is used alone. Nothing here may raise a price.
 */
function applyPromotions(
  basePrice: number,
  qty: number,
  promotions: readonly Promotion[],
): PromotionOutcome {
  if (promotions.length === 0) return { unitPrice: basePrice, promotionIds: [] };

  const stackable = promotions.filter((promotion) => promotion.stackable);
  const exclusive = promotions.filter((promotion) => !promotion.stackable);

  let stackedPrice = basePrice;
  const stackedIds: string[] = [];
  for (const promotion of stackable) {
    const next = applyPromotion(stackedPrice, qty, promotion);
    if (next < stackedPrice) {
      stackedPrice = next;
      stackedIds.push(promotion.id);
    }
  }

  let bestExclusive: PromotionOutcome | null = null;
  for (const promotion of exclusive) {
    const next = applyPromotion(basePrice, qty, promotion);
    if (next >= basePrice) continue;
    if (!bestExclusive || next < bestExclusive.unitPrice) {
      bestExclusive = { unitPrice: next, promotionIds: [promotion.id] };
    }
  }

  if (bestExclusive && bestExclusive.unitPrice < stackedPrice) return bestExclusive;
  return { unitPrice: stackedPrice, promotionIds: stackedIds };
}

/**
 * The price of one selling unit of `product` when `qty` of `unit` are bought.
 *
 * `qty` is counted in `unit`; the rules are evaluated against the equivalent base quantity, so
 * one case of 24 clears a "from 20 units" tier. The returned `unitPrice` is per `unit`.
 */
export function resolvePrice(
  product: Product,
  qty: number,
  unit: string | undefined,
  context: PricingContext = {},
): PriceResolution {
  const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;
  const factor = unitFactor(product, unit);
  const baseQty = safeQty * factor;
  const now = context.now ?? new Date();

  const base = resolveBasePrice(product, baseQty, context);

  const live = (context.promotions ?? []).filter((promotion) =>
    promotionApplies(promotion, product, context.storeId, now),
  );
  // Promotions count units, not cases: "buy 2 get 1" on cans means cans.
  const promoted = applyPromotions(base.unitPrice, baseQty, live);

  const source: PriceSource = promoted.promotionIds.length > 0 ? 'promotion' : base.source;

  return {
    unitPrice: roundVND(promoted.unitPrice * factor),
    source,
    promotionId: promoted.promotionIds[0],
    promotionIds: promoted.promotionIds,
    basePrice: roundVND(base.unitPrice * factor),
    listPrice: roundVND(product.salePrice * factor),
  };
}

/**
 * The earn multiplier a tier carries. A rule with no `tierMultiplier`, or one that omits the
 * tier, earns at the plain rate; a non-positive or non-finite multiplier is ignored rather
 * than allowed to zero a customer's points.
 */
export function tierMultiplierFor(rule: LoyaltyRule, tier: CustomerTier): number {
  const multiplier = rule.tierMultiplier?.[tier];
  if (multiplier === undefined || !Number.isFinite(multiplier) || multiplier <= 0) return 1;
  return multiplier;
}

/**
 * Points earned on an amount under a loyalty rule, floored to a whole point:
 * `amount * earnPerVnd * tierMultiplier`.
 */
export function pointsEarnedFor(
  amount: number,
  earnPerVnd: number,
  tierMultiplier = 1,
): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (!Number.isFinite(earnPerVnd) || earnPerVnd <= 0) return 0;
  const multiplier = Number.isFinite(tierMultiplier) && tierMultiplier > 0 ? tierMultiplier : 1;
  return Math.floor(amount * earnPerVnd * multiplier);
}

/** Points a customer of `tier` earns on `amount` under `rule`. */
export function pointsEarnedForTier(
  rule: LoyaltyRule,
  amount: number,
  tier: CustomerTier,
): number {
  return pointsEarnedFor(amount, rule.earnPerVnd, tierMultiplierFor(rule, tier));
}

/** What a number of points is worth in dong under a loyalty rule. */
export function pointsValueFor(points: number, redeemVndPerPoint: number): number {
  if (!Number.isFinite(points) || points <= 0) return 0;
  if (!Number.isFinite(redeemVndPerPoint) || redeemVndPerPoint <= 0) return 0;
  return roundVND(Math.floor(points) * redeemVndPerPoint);
}
