import { create } from 'zustand';
import {
  activeCartOf,
  addOrIncrementLine,
  closeCart as closeCartIn,
  initialCartSet,
  openCart as openCartIn,
  setLineQty,
  switchCart as switchCartIn,
  updateActiveCart,
  type CartSet,
} from '../domain/pos';
import type { Cart, Discount } from '../domain/types';

interface CartState extends CartSet {
  /** Resets every open cart when switching to a different store; no-op if already on it. */
  ensureStore: (storeId: string) => void;
  /** Opens an extra order and activates it. Returns false at the 8-order ceiling. */
  openCart: () => boolean;
  switchCart: (cartId: string) => void;
  /** Closes an order; closing the last one leaves a fresh empty order behind. */
  closeCart: (cartId: string) => void;
  addProduct: (productId: string, unitPrice: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeLine: (productId: string) => void;
  setLineDiscount: (productId: string, discount: Discount | undefined) => void;
  setOrderDiscount: (discount: Discount | undefined) => void;
  setCustomer: (customerId: string | undefined) => void;
  setNote: (note: string) => void;
  /** Empties the active order's lines and resets its discount, customer and note. */
  clearCart: () => void;
}

/**
 * Open orders live here only: a reload discards them, which matches the prototype scope in
 * `docs/product-spec.md`. Nothing in the UI may imply a parked bill survives a reload.
 */
export const useCartStore = create<CartState>((set, get) => ({
  ...initialCartSet(''),

  ensureStore: (storeId) => {
    if (activeCartOf(get()).storeId !== storeId) set(initialCartSet(storeId));
  },

  openCart: () => {
    const state = get();
    const next = openCartIn(state, activeCartOf(state).storeId);
    if (!next) return false;
    set(next);
    return true;
  },

  switchCart: (cartId) => set((state) => switchCartIn(state, cartId)),

  closeCart: (cartId) => set((state) => closeCartIn(state, cartId)),

  addProduct: (productId, unitPrice) =>
    set((state) =>
      updateActiveCart(state, (cart) => ({
        ...cart,
        lines: addOrIncrementLine(cart.lines, productId, unitPrice),
      })),
    ),

  setQty: (productId, qty) =>
    set((state) =>
      updateActiveCart(state, (cart) => ({ ...cart, lines: setLineQty(cart.lines, productId, qty) })),
    ),

  removeLine: (productId) =>
    set((state) =>
      updateActiveCart(state, (cart) => ({
        ...cart,
        lines: cart.lines.filter((line) => line.productId !== productId),
      })),
    ),

  setLineDiscount: (productId, discount) =>
    set((state) =>
      updateActiveCart(state, (cart) => ({
        ...cart,
        lines: cart.lines.map((line) =>
          line.productId === productId ? { ...line, lineDiscount: discount } : line,
        ),
      })),
    ),

  setOrderDiscount: (discount) => set((state) => updateActiveCart(state, (cart) => ({ ...cart, discount }))),

  setCustomer: (customerId) => set((state) => updateActiveCart(state, (cart) => ({ ...cart, customerId }))),

  setNote: (note) => set((state) => updateActiveCart(state, (cart) => ({ ...cart, note }))),

  clearCart: () =>
    set((state) =>
      updateActiveCart(state, (cart) => ({
        id: cart.id,
        ordinal: cart.ordinal,
        storeId: cart.storeId,
        lines: [],
      })),
    ),
}));

/**
 * The order the catalog, cart pane and checkout act on. Screens read this instead of a
 * `state.cart` field, which no longer exists now that several orders can be open at once.
 */
export function useActiveCart(): Cart {
  return useCartStore((state) => activeCartOf(state));
}
