/**
 * Customer groups, price lists and their rules, promotions and the loyalty rule.
 *
 * One store rather than four because they are one decision: what a given buyer pays. A screen
 * that edits a group almost always has to look at the list it points at, and splitting them
 * would put a cross-store read in every one of those screens.
 */

import { create } from 'zustand';
import type {
  CustomerGroup,
  LoyaltyRule,
  PriceList,
  PriceRule,
  Product,
  Promotion,
} from '../domain/types';
import {
  resolvePrice,
  type PriceResolution,
  type PricingContext,
} from '../domain/pricing';
import {
  customerGroups as seedCustomerGroups,
  loyaltyRule as seedLoyaltyRule,
  priceLists as seedPriceLists,
  priceRules as seedPriceRules,
  promotions as seedPromotions,
} from './seed';
import { activeOrgId } from './active-org';
import { demoSeed } from './chain-seed';

interface PricingState {
  customerGroups: CustomerGroup[];
  priceLists: PriceList[];
  priceRules: PriceRule[];
  promotions: Promotion[];
  loyaltyRule: LoyaltyRule;
  upsertCustomerGroup: (group: CustomerGroup) => void;
  removeCustomerGroup: (groupId: string) => void;
  upsertPriceList: (list: PriceList) => void;
  setPriceListActive: (priceListId: string, isActive: boolean) => void;
  upsertPriceRule: (rule: PriceRule) => void;
  removePriceRule: (ruleId: string) => void;
  upsertPromotion: (promotion: Promotion) => void;
  setPromotionActive: (promotionId: string, isActive: boolean) => void;
  removePromotion: (promotionId: string) => void;
  setLoyaltyRule: (rule: LoyaltyRule) => void;
}

function upsertBy<T extends { id: string }>(list: T[], item: T): T[] {
  const exists = list.some((entry) => entry.id === item.id);
  return exists ? list.map((entry) => (entry.id === item.id ? item : entry)) : [...list, item];
}

/**
 * What a chain starts charging with: the demo shop's groups, lists, rules and campaigns, or
 * none of them.
 *
 * The loyalty rule is the exception and is kept: it is a setting rather than data, every till
 * needs one to award a point, and the Settings form edits it from the first day. It is stamped
 * with the chain that is running so the rule a new chain edits is its own.
 */
export function pricingSeedForActiveOrg(): Pick<
  PricingState,
  'customerGroups' | 'priceLists' | 'priceRules' | 'promotions' | 'loyaltyRule'
> {
  return {
    customerGroups: demoSeed(seedCustomerGroups, []),
    priceLists: demoSeed(seedPriceLists, []),
    priceRules: demoSeed(seedPriceRules, []),
    promotions: demoSeed(seedPromotions, []),
    loyaltyRule: demoSeed(seedLoyaltyRule, { ...seedLoyaltyRule, orgId: activeOrgId() }),
  };
}

export const usePricingStore = create<PricingState>((set) => ({
  ...pricingSeedForActiveOrg(),

  upsertCustomerGroup: (group) =>
    set((state) => ({ customerGroups: upsertBy(state.customerGroups, group) })),

  removeCustomerGroup: (groupId) =>
    set((state) => ({
      customerGroups: state.customerGroups.filter((group) => group.id !== groupId),
    })),

  upsertPriceList: (list) => set((state) => ({ priceLists: upsertBy(state.priceLists, list) })),

  setPriceListActive: (priceListId, isActive) =>
    set((state) => ({
      priceLists: state.priceLists.map((list) =>
        list.id === priceListId ? { ...list, isActive } : list,
      ),
    })),

  upsertPriceRule: (rule) => set((state) => ({ priceRules: upsertBy(state.priceRules, rule) })),

  removePriceRule: (ruleId) =>
    set((state) => ({ priceRules: state.priceRules.filter((rule) => rule.id !== ruleId) })),

  upsertPromotion: (promotion) =>
    set((state) => ({ promotions: upsertBy(state.promotions, promotion) })),

  setPromotionActive: (promotionId, isActive) =>
    set((state) => ({
      promotions: state.promotions.map((promotion) =>
        promotion.id === promotionId ? { ...promotion, isActive } : promotion,
      ),
    })),

  removePromotion: (promotionId) =>
    set((state) => ({
      promotions: state.promotions.filter((promotion) => promotion.id !== promotionId),
    })),

  setLoyaltyRule: (loyaltyRule) => set({ loyaltyRule }),
}));

/**
 * Prices a line against the store's current rules. The caller still supplies the buyer, the
 * branch and the branch prices, because those live in other stores and a selector that reached
 * into them would make this module depend on all of them.
 */
export function priceFor(
  product: Product,
  qty: number,
  unit: string | undefined,
  context: Omit<PricingContext, 'groups' | 'priceLists' | 'priceRules' | 'promotions'>,
): PriceResolution {
  const { customerGroups, priceLists, priceRules, promotions } = usePricingStore.getState();
  return resolvePrice(product, qty, unit, {
    ...context,
    groups: customerGroups,
    priceLists,
    priceRules,
    promotions,
  });
}

/** The rules attached to one price list, cheapest tier first. */
export function rulesForPriceList(rules: PriceRule[], priceListId: string): PriceRule[] {
  return rules
    .filter((rule) => rule.priceListId === priceListId)
    .sort((a, b) => a.productId.localeCompare(b.productId) || a.minQty - b.minQty);
}

/** The rules negotiated with one customer. */
export function rulesForCustomer(rules: PriceRule[], customerId: string): PriceRule[] {
  return rules
    .filter((rule) => rule.customerId === customerId)
    .sort((a, b) => a.productId.localeCompare(b.productId) || a.minQty - b.minQty);
}
