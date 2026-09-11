import { create } from 'zustand';
import type { Cart, Order, Shift } from '../domain/types';
import { orders as seedOrders, shifts as seedShifts } from './seed';

interface OrderState {
  orders: Order[];
  shifts: Shift[];
  cart: Cart | null;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  setCart: (cart: Cart | null) => void;
  addShift: (shift: Shift) => void;
  updateShift: (shift: Shift) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: seedOrders,
  shifts: seedShifts,
  cart: null,

  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),

  updateOrder: (order) =>
    set((state) => ({
      orders: state.orders.map((item) => (item.id === order.id ? order : item)),
    })),

  setCart: (cart) => set({ cart }),

  addShift: (shift) => set((state) => ({ shifts: [shift, ...state.shifts] })),

  updateShift: (shift) =>
    set((state) => ({
      shifts: state.shifts.map((item) => (item.id === shift.id ? shift : item)),
    })),
}));
