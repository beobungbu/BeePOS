import { create } from 'zustand';
import type { Customer } from '../domain/types';
import { tierFor, type PointMovement } from '../domain/customers';
import { customers as seedCustomers, orders as seedOrders } from './seed';
import { buildSeedRefunds } from '../features/orders/lib/seed-refunds';
import { buildSeedPointHistory } from '../features/customers/lib/seed-point-history';
import { currentOrgId } from './org-store';

const seedRefunds = buildSeedRefunds(seedOrders);

/** Fields the Customer add/edit screens collect that have no place on `Customer` itself. */
export interface CustomerProfileExtra {
  birthday?: string;
  note?: string;
}

interface CustomerState {
  customers: Customer[];
  pointHistory: PointMovement[];
  /** Keyed by customerId. `Customer` (src/domain/types.ts, phase-0-owned) has no birthday/note fields. */
  profileExtras: Record<string, CustomerProfileExtra>;
  upsertCustomer: (customer: Customer) => void;
  /**
   * Creates a customer from the two fields a cashier can collect at the till and returns it,
   * so the caller can attach it to the order it was typed for. The id is minted here because
   * a new customer has no server to mint one.
   */
  createCustomer: (input: { name: string; phone: string }) => Customer;
  setProfileExtra: (customerId: string, extra: CustomerProfileExtra) => void;
  addPoints: (customerId: string, points: number, spent: number) => void;
  /** Manager-driven manual adjustment: records a movement and updates points only. */
  addPointMovement: (movement: PointMovement) => void;
  /** Refund-driven deduction: records a movement and updates both points and totalSpent. */
  refundCustomer: (params: {
    customerId: string;
    points: number;
    spent: number;
    note: string;
    createdAt: string;
    orderId: string;
  }) => void;
  removeCustomer: (customerId: string) => void;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: seedCustomers,
  pointHistory: buildSeedPointHistory(seedCustomers, seedOrders, seedRefunds),
  profileExtras: {},

  upsertCustomer: (customer) =>
    set((state) => {
      const exists = state.customers.some((item) => item.id === customer.id);
      return {
        customers: exists
          ? state.customers.map((item) => (item.id === customer.id ? customer : item))
          : [...state.customers, customer],
      };
    }),

  createCustomer: ({ name, phone }) => {
    // Ids stay unique against both the seed ("customer-7") and earlier quick-adds.
    const taken = new Set(get().customers.map((item) => item.id));
    let sequence = get().customers.length + 1;
    while (taken.has(`customer-${sequence}`)) sequence += 1;

    const customer: Customer = {
      id: `customer-${sequence}`,
      orgId: currentOrgId(),
      name: name.trim(),
      phone: phone.trim(),
      points: 0,
      tier: tierFor(0),
      totalSpent: 0,
      createdAt: new Date().toISOString(),
      // A name and a phone typed at the till is a walk-in; the company fields are collected
      // on the customer form, never mid-sale.
      type: 'retail',
    };
    set((state) => ({ customers: [...state.customers, customer] }));
    return customer;
  },

  setProfileExtra: (customerId, extra) =>
    set((state) => ({
      profileExtras: { ...state.profileExtras, [customerId]: { ...state.profileExtras[customerId], ...extra } },
    })),

  addPoints: (customerId, points, spent) =>
    set((state) => ({
      customers: state.customers.map((item) =>
        item.id === customerId
          ? {
              ...item,
              points: item.points + points,
              totalSpent: item.totalSpent + spent,
              tier: tierFor(item.totalSpent + spent),
            }
          : item,
      ),
      pointHistory:
        points === 0
          ? state.pointHistory
          : [
              ...state.pointHistory,
              {
                id: `pm-earn-${customerId}-${Date.now()}`,
                customerId,
                kind: 'earned' as const,
                points,
                note: 'Tích điểm từ đơn hàng',
                createdAt: new Date().toISOString(),
              },
            ],
    })),

  addPointMovement: (movement) =>
    set((state) => ({
      pointHistory: [...state.pointHistory, movement],
      customers: state.customers.map((item) =>
        item.id === movement.customerId ? { ...item, points: item.points + movement.points } : item,
      ),
    })),

  refundCustomer: ({ customerId, points, spent, note, createdAt, orderId }) =>
    set((state) => ({
      pointHistory: [
        ...state.pointHistory,
        {
          id: `pm-refund-${orderId}-${createdAt}`,
          customerId,
          kind: 'adjust' as const,
          points: -points,
          note,
          createdAt,
          orderId,
        },
      ],
      customers: state.customers.map((item) =>
        item.id === customerId
          ? {
              ...item,
              points: item.points - points,
              totalSpent: item.totalSpent - spent,
              tier: tierFor(item.totalSpent - spent),
            }
          : item,
      ),
    })),

  removeCustomer: (customerId) =>
    set((state) => ({ customers: state.customers.filter((item) => item.id !== customerId) })),
}));
