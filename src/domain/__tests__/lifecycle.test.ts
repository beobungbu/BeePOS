import type { OrderStatus } from '../types';
import {
  ORDER_TRANSITIONS,
  assertTransition,
  canTransition,
  isOpen,
  isRevenue,
  isTerminal,
  nextStatuses,
} from '../lifecycle';

const ALL_STATUSES = Object.keys(ORDER_TRANSITIONS) as OrderStatus[];

describe('ORDER_TRANSITIONS', () => {
  it('covers every status and only names statuses that exist', () => {
    for (const status of ALL_STATUSES) {
      for (const target of ORDER_TRANSITIONS[status]) {
        expect(ALL_STATUSES).toContain(target);
      }
    }
  });

  it('walks the wholesale lifecycle end to end', () => {
    const path: OrderStatus[] = ['quote', 'confirmed', 'delivering', 'completed', 'paid'];
    for (let i = 0; i < path.length - 1; i += 1) {
      expect(canTransition(path[i], path[i + 1])).toBe(true);
    }
  });

  it('never lets an order go backwards', () => {
    expect(canTransition('confirmed', 'quote')).toBe(false);
    expect(canTransition('delivering', 'confirmed')).toBe(false);
    expect(canTransition('paid', 'completed')).toBe(false);
  });

  it('allows cancelling only before the money is taken', () => {
    expect(canTransition('quote', 'cancelled')).toBe(true);
    expect(canTransition('delivering', 'cancelled')).toBe(true);
    expect(canTransition('paid', 'cancelled')).toBe(false);
  });

  it('treats refunded, void and cancelled as final', () => {
    expect(isTerminal('refunded')).toBe(true);
    expect(isTerminal('void')).toBe(true);
    expect(isTerminal('cancelled')).toBe(true);
    expect(nextStatuses('refunded')).toEqual([]);
  });

  it('lets a partly refunded order be refunded again', () => {
    expect(canTransition('partial_refund', 'partial_refund')).toBe(true);
    expect(canTransition('partial_refund', 'refunded')).toBe(true);
  });
});

describe('assertTransition', () => {
  it('returns the target for a legal move', () => {
    expect(assertTransition('quote', 'confirmed')).toBe('confirmed');
  });

  it('throws on an illegal move', () => {
    expect(() => assertTransition('refunded', 'paid')).toThrow(/cannot become/);
  });
});

describe('open and revenue sets', () => {
  it('counts the wholesale states before settlement as open', () => {
    expect(isOpen('quote')).toBe(true);
    expect(isOpen('completed')).toBe(true);
    expect(isOpen('paid')).toBe(false);
  });

  it('recognises revenue once the goods are with the customer', () => {
    expect(isRevenue('completed')).toBe(true);
    expect(isRevenue('paid')).toBe(true);
    expect(isRevenue('partial_refund')).toBe(true);
    expect(isRevenue('quote')).toBe(false);
    expect(isRevenue('void')).toBe(false);
  });
});
