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
import type { Cart, CartLine, Discount, PriceSource, VatInvoiceInfo } from '../domain/types';

/**
 * An open order plus the wholesale answers that only exist while it is being rung up.
 *
 * The fields are additive and optional, so a `PosCart` is a `Cart` everywhere the domain
 * takes one, and the persisted `carts` slice carries them without a schema of its own. They
 * are not on `Cart` in `src/domain/types.ts` because a sold order records the same facts as
 * `Order.channel`, `Order.salesRepId` and `Order.vatInvoice`; these are the cart-side drafts.
 */
export interface PosCart extends Cart {
  /** The per-order "Bán sỉ" switch. Absent is the same as off. */
  wholesale?: boolean;
  /** Staff member credited with the sale; defaults to the customer's own rep when attached. */
  salesRepId?: string;
  /** Buyer details as they must appear on the VAT invoice, edited at checkout. */
  vatInvoice?: VatInvoiceInfo;
}

/** What the pricing engine decided for one line, as the cart stores it. */
export interface LinePricing {
  unitPrice: number;
  priceSource: PriceSource;
  promotionId?: string;
}

/** How a product enters the cart when the wholesale unit selector is in play. */
export interface AddLineInput extends LinePricing {
  qty?: number;
  unit?: string;
  unitFactor?: number;
}

interface CartState extends CartSet {
  carts: PosCart[];
  /** Resets every open cart when switching to a different store; no-op if already on it. */
  ensureStore: (storeId: string) => void;
  /** Opens an extra order and activates it. Returns false at the 8-order ceiling. */
  openCart: () => boolean;
  switchCart: (cartId: string) => void;
  /** Closes an order; closing the last one leaves a fresh empty order behind. */
  closeCart: (cartId: string) => void;
  addProduct: (productId: string, unitPrice: number) => void;
  /**
   * Adds a product in a named selling unit at a price the pricing engine resolved. An
   * existing line in the same unit gains quantity; one in a different unit is converted to
   * the new unit rather than being split, so a product never appears twice in one order.
   */
  addPricedProduct: (productId: string, input: AddLineInput) => void;
  setQty: (productId: string, qty: number) => void;
  /** Switches the unit a line is counted in, keeping its quantity in the new unit. */
  setLineUnit: (productId: string, unit: string | undefined, unitFactor: number) => void;
  removeLine: (productId: string) => void;
  setLineDiscount: (productId: string, discount: Discount | undefined) => void;
  setOrderDiscount: (discount: Discount | undefined) => void;
  setCustomer: (customerId: string | undefined) => void;
  setNote: (note: string) => void;
  /** Turns the per-order wholesale switch on or off. */
  setWholesale: (wholesale: boolean) => void;
  setSalesRep: (salesRepId: string | undefined) => void;
  setVatInvoice: (info: VatInvoiceInfo | undefined) => void;
  /**
   * Re-prices every line of the active order through `price`. The state is left untouched
   * when no line moved, so the effect that calls this on every relevant change cannot loop.
   */
  repriceActive: (price: (line: CartLine) => LinePricing | undefined) => void;
  /** Names an open order ("Chị Lan", "Bàn 3"); an empty name goes back to "Đơn N". */
  setLabel: (cartId: string, label: string) => void;
  /**
   * Empties the active order's lines and resets its discount, customer and note. The name
   * survives: "Bàn 3" is still table 3 after the cashier voids what was rung up on it, and
   * a finished sale closes its order outright instead of clearing it. The wholesale switch
   * survives for the same reason: it describes the order, not what is on it.
   */
  clearCart: () => void;
}

/** Replaces the active cart, keeping the `PosCart` fields the domain helper does not know. */
function updateActive(
  state: CartState,
  update: (cart: PosCart) => PosCart,
): Pick<CartState, 'carts'> {
  return {
    carts: state.carts.map((cart) => (cart.id === state.activeCartId ? update(cart) : cart)),
  };
}

/**
 * Open orders are persisted by `persistence-bootstrap.ts` (subscribed from outside this file),
 * so a reload or an app restart restores them; a named order therefore behaves like a parked bill.
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

  addPricedProduct: (productId, input) =>
    set((state) =>
      updateActive(state, (cart) => {
        const qty = input.qty && input.qty > 0 ? input.qty : 1;
        const existing = cart.lines.find((line) => line.productId === productId);
        const sameUnit = existing ? (existing.unit ?? undefined) === (input.unit ?? undefined) : false;
        const nextLine: CartLine = {
          productId,
          qty: existing && sameUnit ? existing.qty + qty : qty,
          unitPrice: input.unitPrice,
          lineDiscount: existing?.lineDiscount,
          unit: input.unit,
          unitFactor: input.unitFactor,
          priceSource: input.priceSource,
          promotionId: input.promotionId,
        };
        return {
          ...cart,
          lines: existing
            ? cart.lines.map((line) => (line.productId === productId ? nextLine : line))
            : [...cart.lines, nextLine],
        };
      }),
    ),

  setQty: (productId, qty) =>
    set((state) =>
      updateActiveCart(state, (cart) => ({ ...cart, lines: setLineQty(cart.lines, productId, qty) })),
    ),

  setLineUnit: (productId, unit, unitFactor) =>
    set((state) =>
      updateActive(state, (cart) => ({
        ...cart,
        lines: cart.lines.map((line) =>
          line.productId === productId ? { ...line, unit, unitFactor } : line,
        ),
      })),
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

  setWholesale: (wholesale) => set((state) => updateActive(state, (cart) => ({ ...cart, wholesale }))),

  setSalesRep: (salesRepId) => set((state) => updateActive(state, (cart) => ({ ...cart, salesRepId }))),

  setVatInvoice: (vatInvoice) => set((state) => updateActive(state, (cart) => ({ ...cart, vatInvoice }))),

  repriceActive: (price) =>
    set((state) => {
      const cart = state.carts.find((item) => item.id === state.activeCartId);
      if (!cart || cart.lines.length === 0) return state;

      let changed = false;
      const lines = cart.lines.map((line) => {
        const next = price(line);
        if (!next) return line;
        if (
          next.unitPrice === line.unitPrice &&
          next.priceSource === line.priceSource &&
          next.promotionId === line.promotionId
        ) {
          return line;
        }
        changed = true;
        return {
          ...line,
          unitPrice: next.unitPrice,
          priceSource: next.priceSource,
          promotionId: next.promotionId,
        };
      });

      // Same references out when nothing moved: the repricing effect runs on every render of
      // the sell screen, and a new array every time would re-render it forever.
      if (!changed) return state;
      return updateActive(state, (item) => ({ ...item, lines }));
    }),

  setLabel: (cartId, label) =>
    set((state) => ({
      ...state,
      carts: state.carts.map((cart) =>
        cart.id === cartId ? { ...cart, label: label.trim() || undefined } : cart,
      ),
    })),

  clearCart: () =>
    set((state) =>
      updateActive(state, (cart) => ({
        id: cart.id,
        ordinal: cart.ordinal,
        label: cart.label,
        storeId: cart.storeId,
        lines: [],
        wholesale: cart.wholesale,
      })),
    ),
}));

/**
 * The order the catalog, cart pane and checkout act on. Screens read this instead of a
 * `state.cart` field, which no longer exists now that several orders can be open at once.
 */
export function useActiveCart(): PosCart {
  return useCartStore(
    (state) => state.carts.find((cart) => cart.id === state.activeCartId) ?? state.carts[0],
  );
}
