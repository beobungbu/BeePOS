import { create } from 'zustand';
import { addOrIncrementLine, setLineQty } from '../domain/pos';
import type { Cart, Discount } from '../domain/types';

function emptyCart(storeId: string): Cart {
  return { id: `cart-${storeId || 'none'}`, storeId, lines: [] };
}

interface CartState {
  cart: Cart;
  /** Resets the cart when switching to a different store; no-op if already on it. */
  ensureStore: (storeId: string) => void;
  addProduct: (productId: string, unitPrice: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeLine: (productId: string) => void;
  setLineDiscount: (productId: string, discount: Discount | undefined) => void;
  setOrderDiscount: (discount: Discount | undefined) => void;
  setCustomer: (customerId: string | undefined) => void;
  setNote: (note: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: emptyCart(''),

  ensureStore: (storeId) => {
    if (get().cart.storeId !== storeId) set({ cart: emptyCart(storeId) });
  },

  addProduct: (productId, unitPrice) =>
    set((state) => ({
      cart: { ...state.cart, lines: addOrIncrementLine(state.cart.lines, productId, unitPrice) },
    })),

  setQty: (productId, qty) =>
    set((state) => ({ cart: { ...state.cart, lines: setLineQty(state.cart.lines, productId, qty) } })),

  removeLine: (productId) =>
    set((state) => ({
      cart: { ...state.cart, lines: state.cart.lines.filter((line) => line.productId !== productId) },
    })),

  setLineDiscount: (productId, discount) =>
    set((state) => ({
      cart: {
        ...state.cart,
        lines: state.cart.lines.map((line) =>
          line.productId === productId ? { ...line, lineDiscount: discount } : line,
        ),
      },
    })),

  setOrderDiscount: (discount) => set((state) => ({ cart: { ...state.cart, discount } })),
  setCustomer: (customerId) => set((state) => ({ cart: { ...state.cart, customerId } })),
  setNote: (note) => set((state) => ({ cart: { ...state.cart, note } })),
  clearCart: () => set((state) => ({ cart: emptyCart(state.cart.storeId) })),
}));
