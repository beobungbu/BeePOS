/**
 * The bridge between the open order and `src/domain/pricing.ts`.
 *
 * Two jobs. `useWholesalePricing()` builds the context the engine needs out of the session,
 * the buyer and the pricing store, and prices one product on demand (the catalogue tile).
 * `useCartRepricing()` keeps the lines of the active order honest: a quantity that clears a
 * tier, a buyer who is attached mid-order or the wholesale switch being flipped all change
 * what the line costs, and a cart that still shows the old figure is a cart that bills it.
 */

import { useEffect, useMemo } from 'react';
import { groupFor, resolvePrice, type PriceResolution } from '../../../domain/pricing';
import { unitFactor } from '../../../domain/units';
import type {
  CartLine,
  Customer,
  CustomerGroup,
  OrderChannel,
  Product,
} from '../../../domain/types';
import { useCartStore, type PosCart } from '../../../data/cart-store';
import { useCatalogStore } from '../../../data/catalog-store';
import { useCustomerStore } from '../../../data/customer-store';
import { usePricingStore } from '../../../data/pricing-store';
import { useSessionStore } from '../../../data/session-store';
import { useStorePrices } from '../../../data/store-price-store';

/** Everything the cart line's price-source label needs beyond the source itself. */
export interface PriceExplanation {
  resolution: PriceResolution;
  /** The buyer's group, for "Giá sỉ nhóm Đại lý A". */
  group?: CustomerGroup;
  /** The quantity threshold the winning tier asked for, for "Bậc 10+". */
  minQty?: number;
  /** The promotion that set the price, by its own name. */
  promotionName?: string;
}

export interface WholesalePricing {
  /** True when this order is on the "Bán sỉ" switch. */
  wholesale: boolean;
  /** The buyer attached to the order, if any. */
  customer: Customer | undefined;
  /** Price of one `unit` of `product` when `qty` of them are bought on this order. */
  priceOf: (product: Product, qty: number, unit: string | undefined) => PriceResolution;
  /** The same, plus the words the price-source label needs. */
  explain: (product: Product, qty: number, unit: string | undefined) => PriceExplanation;
}

/**
 * The channel the engine prices at. The switch is the whole answer: a company buyer served
 * over the counter with the switch off pays the shelf price, which is what "per order, not
 * per app" means.
 */
function channelOf(wholesale: boolean): OrderChannel {
  return wholesale ? 'wholesale' : 'retail';
}

export function useWholesalePricing(cart: PosCart): WholesalePricing {
  const storeId = useSessionStore((state) => state.store?.id);
  const customers = useCustomerStore((state) => state.customers);
  const groups = usePricingStore((state) => state.customerGroups);
  const priceLists = usePricingStore((state) => state.priceLists);
  const priceRules = usePricingStore((state) => state.priceRules);
  const promotions = usePricingStore((state) => state.promotions);
  const storePrices = useStorePrices();

  const wholesale = cart.wholesale === true;
  const customer = useMemo(
    () => customers.find((item) => item.id === cart.customerId),
    [customers, cart.customerId],
  );

  const priceOf = useMemo(() => {
    return (product: Product, qty: number, unit: string | undefined): PriceResolution =>
      resolvePrice(product, qty, unit, {
        storeId,
        customer: wholesale ? customer : undefined,
        groups,
        priceLists,
        priceRules,
        storePrices,
        // Promotions run at the counter as well as on a wholesale order: a campaign the owner
        // set up is a shop-wide offer, and a walk-in who is refused it at the till while a
        // company buyer gets it is a promotion nobody can explain. What the wholesale switch
        // still decides is the *base* price the promotion comes off, through `channel`:
        // retail discounts the shelf price, wholesale discounts the contract price.
        promotions,
        channel: channelOf(wholesale),
      });
  }, [storeId, wholesale, customer, groups, priceLists, priceRules, storePrices, promotions]);

  const explain = useMemo(() => {
    return (product: Product, qty: number, unit: string | undefined): PriceExplanation => {
      const resolution = priceOf(product, qty, unit);
      const group = wholesale ? groupFor(customer, groups) : undefined;

      let minQty: number | undefined;
      if (resolution.source === 'tier' && group?.priceListId) {
        const baseQty = Math.max(1, qty) * unitFactor(product, unit);
        // The deepest tier the quantity clears is the one the engine used; re-deriving it here
        // is cheaper than threading the winning rule out through `PriceResolution`.
        minQty = priceRules
          .filter(
            (rule) =>
              !rule.customerId &&
              rule.priceListId === group.priceListId &&
              rule.productId === product.id &&
              rule.minQty <= baseQty,
          )
          .reduce<number | undefined>(
            (best, rule) => (best === undefined || rule.minQty > best ? rule.minQty : best),
            undefined,
          );
      }

      const promotionName =
        resolution.promotionId !== undefined
          ? promotions.find((item) => item.id === resolution.promotionId)?.name
          : undefined;

      return { resolution, group, minQty, promotionName };
    };
  }, [priceOf, wholesale, customer, groups, priceRules, promotions]);

  return { wholesale, customer, priceOf, explain };
}

/**
 * Re-prices the active order whenever an input to the price changes.
 *
 * The dependency is a signature string rather than the cart object: the lines array changes
 * identity on every quantity press, and the effect only has to run when a product, a
 * quantity, a unit, the buyer or the switch actually moved.
 */
export function useCartRepricing(cart: PosCart): void {
  const products = useCatalogStore((state) => state.products);
  const repriceActive = useCartStore((state) => state.repriceActive);
  const { priceOf } = useWholesalePricing(cart);

  const signature = [
    cart.id,
    cart.wholesale ? '1' : '0',
    cart.customerId ?? '',
    cart.lines.map((line) => `${line.productId}:${line.qty}:${line.unit ?? ''}`).join(','),
  ].join('|');

  useEffect(() => {
    repriceActive((line: CartLine) => {
      const product = products.find((item) => item.id === line.productId);
      if (!product) return undefined;
      const resolution = priceOf(product, line.qty, line.unit);
      return {
        unitPrice: resolution.unitPrice,
        priceSource: resolution.source,
        promotionId: resolution.promotionId,
      };
    });
    // `signature` stands in for the lines array, which changes identity on every render.
  }, [signature, products, priceOf, repriceActive]);
}

/** Base units per selling unit, for the caller that has a product and a unit name. */
export function factorOf(product: Product, unit: string | undefined): number {
  return unitFactor(product, unit);
}
