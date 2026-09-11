import { create } from 'zustand';
import type { Customer } from '../domain/types';
import { customers as seedCustomers } from './seed';

interface CustomerState {
  customers: Customer[];
  upsertCustomer: (customer: Customer) => void;
  addPoints: (customerId: string, points: number, spent: number) => void;
}

export const useCustomerStore = create<CustomerState>((set) => ({
  customers: seedCustomers,

  upsertCustomer: (customer) =>
    set((state) => {
      const exists = state.customers.some((item) => item.id === customer.id);
      return {
        customers: exists
          ? state.customers.map((item) => (item.id === customer.id ? customer : item))
          : [...state.customers, customer],
      };
    }),

  addPoints: (customerId, points, spent) =>
    set((state) => ({
      customers: state.customers.map((item) =>
        item.id === customerId
          ? { ...item, points: item.points + points, totalSpent: item.totalSpent + spent }
          : item,
      ),
    })),
}));
