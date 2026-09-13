/**
 * What the price list table prints about a rule: how far it sits below the catalogue price,
 * and which of the precedence levels it is.
 *
 * The percentage is computed here rather than left to the reader, because the person setting
 * a price needs to know how much they are giving away and nobody does that arithmetic in
 * their head thirty rows at a time.
 */

import type { PriceRule, Product } from '../../../domain/types';

type Translate = (key: string) => string;

/** `-13,3 %` against the catalogue price; `undefined` when the product has no price to compare. */
export function vsBasePercent(unitPrice: number, product: Product | undefined): number | undefined {
  if (!product || product.salePrice <= 0) return undefined;
  return Math.round(((unitPrice - product.salePrice) / product.salePrice) * 1000) / 10;
}

/** Vietnamese decimal comma, with an explicit sign: `-13,3 %`, `+4,0 %`, `0 %`. */
export function formatPercentDelta(value: number): string {
  if (value === 0) return '0 %';
  const sign = value > 0 ? '+' : '-';
  return `${sign}${Math.abs(value).toFixed(1).replace('.', ',')} %`;
}

export type RuleScopeVariant = 'warning' | 'success' | 'outline';

export interface RuleScope {
  label: string;
  variant: RuleScopeVariant;
}

/**
 * The `Áp dụng cho` badge, in the same colours the POS cart line uses for the matching price
 * source, so the two screens connect: a customer rule is `warning` ("Riêng"), a quantity tier
 * is `success` ("Bậc"), and a flat list row is the neutral outline.
 */
export function ruleScope(t: Translate, rule: PriceRule, customerName?: string): RuleScope {
  if (rule.customerId) {
    const who = customerName ?? rule.customerId;
    return { label: `${t('pricing.rules.customerPrefix')} ${who}`, variant: 'warning' };
  }
  if (rule.minQty > 1) {
    return { label: `${t('pricing.rules.tierPrefix')} ${rule.minQty}`, variant: 'success' };
  }
  return { label: t('pricing.rules.wholeList'), variant: 'outline' };
}

/** Rules of one list, grouped by product and then by tier, which is the order they read in. */
export function sortRules(rules: readonly PriceRule[], nameOf: (productId: string) => string): PriceRule[] {
  return [...rules].sort(
    (a, b) => nameOf(a.productId).localeCompare(nameOf(b.productId)) || a.minQty - b.minQty,
  );
}
