/**
 * "Lưu báo giá": the wholesale order a buyer takes away before deciding.
 *
 * A quote is a real order at status `quote`, not a draft in a different table: it is what the
 * lifecycle stepper starts from, it has a code the buyer can quote back, and confirming it is
 * a status move rather than a re-entry. No money is taken and no stock moves, which is why it
 * goes through `submitOrder` on the wholesale branch.
 */

import { useCallback } from 'react';
import type { Order } from '../../../domain/types';
import { useActiveCart, useCartStore } from '../../../data/cart-store';
import { useCatalogStore } from '../../../data/catalog-store';
import { currentCost } from '../../../data/costing-store';
import { useCustomerStore } from '../../../data/customer-store';
import { currentOrgId } from '../../../data/org-store';
import { useOrderStore } from '../../../data/order-store';
import { useSessionStore } from '../../../data/session-store';
import { submitOrder } from '../adapters';
import { buildOrder, vatInvoiceFor } from '../lib/build-order';
import { cartTotalsOf } from '../lib/cart-totals';

/** Saves the active order as a quote and returns it, or `undefined` when it cannot be saved. */
export function useSaveQuote(): () => Order | undefined {
  const cart = useActiveCart();
  const store = useSessionStore((state) => state.store);
  const staff = useSessionStore((state) => state.staff);
  const products = useCatalogStore((state) => state.products);
  const customers = useCustomerStore((state) => state.customers);
  const orders = useOrderStore((state) => state.orders);
  const closeCart = useCartStore((state) => state.closeCart);

  return useCallback(() => {
    if (!store || !staff || cart.lines.length === 0) return undefined;

    const customer = customers.find((item) => item.id === cart.customerId);
    const order = buildOrder({
      cart: { ...cart, vatInvoice: cart.vatInvoice ?? vatInvoiceFor(customer) },
      store,
      orgId: currentOrgId(),
      cashierId: staff.id,
      customer,
      totals: cartTotalsOf(cart, products),
      payments: [],
      status: 'quote',
      existingCodes: orders.filter((item) => item.storeId === store.id).map((item) => item.code),
      costFor: (productId) => {
        const product = products.find((item) => item.id === productId);
        return currentCost(productId, store.id) ?? product?.costPrice ?? 0;
      },
    });

    submitOrder(order);
    closeCart(cart.id);
    return order;
  }, [cart, store, staff, products, customers, orders, closeCart]);
}
