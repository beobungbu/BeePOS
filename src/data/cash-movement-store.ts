import { useMemo } from 'react';
import { create } from 'zustand';
import type { CashMovement, CashMovementType } from '../domain/types';
import { movementsInShift } from '../domain/pos';
import { formatVND } from '../domain/money';
import { currentOrgId } from './org-store';
import { recordAudit } from './audit-store';
import { useSessionStore } from './session-store';

/**
 * The four reasons a drawer is opened for something that is not a sale. A closed set rather
 * than free text, because the Z report groups by it and "chi vat", "Chi vặt" and "mua tui"
 * are three groups the person reconciling the till has to merge in their head. The free
 * sentence still exists, as the note beside the reason.
 */
export const CASH_REASONS = ['deposit', 'withdraw', 'petty', 'other'] as const;
export type CashReason = (typeof CASH_REASONS)[number];

export function isCashReason(value: string): value is CashReason {
  return (CASH_REASONS as readonly string[]).includes(value);
}

interface CashMovementState {
  movements: CashMovement[];
  /**
   * Free-text note per movement, keyed by movement id. `CashMovement` carries a `reason` and
   * no note, and the type contract for this phase is frozen, so the note lives beside the
   * record the same way `useOrderStore` keeps its per-order notes.
   */
  notes: Record<string, string>;
  add: (movement: CashMovement, note: string) => void;
}

export const useCashMovementStore = create<CashMovementState>((set) => ({
  movements: [],
  notes: {},

  add: (movement, note) =>
    set((state) => ({
      movements: [movement, ...state.movements],
      notes: note.trim() ? { ...state.notes, [movement.id]: note.trim() } : state.notes,
    })),
}));

export interface CashMovementInput {
  shiftId: string;
  type: CashMovementType;
  /** Whole dong, greater than zero. A zero or negative entry is refused. */
  amount: number;
  reason: CashReason;
  note: string;
  /** Localised reason label, only used for the audit sentence a person reads later. */
  reasonLabel: string;
}

export type CashMovementResult =
  | { ok: true; movement: CashMovement }
  | { ok: false; reason: 'no_session' | 'invalid_amount' };

/**
 * Books one cash movement and logs it.
 *
 * A plain function rather than a store action so the audit line and the record are written
 * together: a drawer entry nobody is named for is the one thing this screen exists to prevent.
 * The caller is told why nothing happened instead of being left to guess at a silent no-op.
 */
export function recordCashMovement(input: CashMovementInput): CashMovementResult {
  const { staff, store } = useSessionStore.getState();
  if (!staff || !store) return { ok: false, reason: 'no_session' };
  if (!Number.isFinite(input.amount) || input.amount <= 0) return { ok: false, reason: 'invalid_amount' };

  const movement: CashMovement = {
    id: `cash-${Date.now()}`,
    orgId: currentOrgId(),
    storeId: store.id,
    shiftId: input.shiftId,
    type: input.type,
    amount: Math.round(input.amount),
    reason: input.reason,
    staffId: staff.id,
    createdAt: new Date(),
  };

  useCashMovementStore.getState().add(movement, input.note);
  recordAudit({
    action: input.type === 'in' ? 'cashIn' : 'cashOut',
    entity: 'cash',
    entityId: movement.id,
    summary: [`${input.reasonLabel} ${formatVND(movement.amount)}`, input.note.trim()]
      .filter(Boolean)
      .join(', '),
  });

  return { ok: true, movement };
}

/** The chain's movements, newest first. */
export function useCashMovements(): CashMovement[] {
  const movements = useCashMovementStore((state) => state.movements);
  const orgId = useSessionStore((state) => state.session?.orgId);
  return useMemo(
    () => (orgId ? movements.filter((movement) => movement.orgId === orgId) : movements),
    [movements, orgId],
  );
}

/** One shift's movements, oldest first, which is the order a drawer is reconciled in. */
export function useShiftCashMovements(shiftId: string | undefined): CashMovement[] {
  const movements = useCashMovements();
  return useMemo(() => {
    if (!shiftId) return [];
    return movementsInShift(shiftId, movements);
  }, [movements, shiftId]);
}

/** The note a movement was saved with, or an empty string. */
export function useCashMovementNotes(): Record<string, string> {
  return useCashMovementStore((state) => state.notes);
}
