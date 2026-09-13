/**
 * Customer returns and the write-off log.
 *
 * Together because a damaged return is a write-off: recording one without the other is how a
 * stock figure stops reconciling, so `recordReturn` books both in a single update.
 */

import { create } from 'zustand';
import type { ReturnRecord, WriteOff } from '../domain/types';
import { writeOffsForReturn } from '../domain/returns';
import { returnRecords as seedReturns, writeOffs as seedWriteOffs } from './seed';

interface ReturnsState {
  returns: ReturnRecord[];
  writeOffs: WriteOff[];
  /**
   * Stores a return and the write-off rows its damaged lines produce. Adjusting stock for the
   * restocked lines stays with the caller, which is the only place that knows the store's
   * inventory actions.
   */
  recordReturn: (record: ReturnRecord) => WriteOff[];
  addWriteOff: (writeOff: WriteOff) => void;
  removeWriteOff: (writeOffId: string) => void;
}

export const useReturnsStore = create<ReturnsState>((set) => ({
  returns: seedReturns,
  writeOffs: seedWriteOffs,

  recordReturn: (record) => {
    const produced = writeOffsForReturn(record.lines, {
      orgId: record.orgId,
      storeId: record.storeId,
      staffId: record.staffId,
      returnId: record.id,
      createdAt: record.createdAt,
    });
    set((state) => ({
      returns: [record, ...state.returns],
      writeOffs: [...produced, ...state.writeOffs],
    }));
    return produced;
  },

  addWriteOff: (writeOff) => set((state) => ({ writeOffs: [writeOff, ...state.writeOffs] })),

  removeWriteOff: (writeOffId) =>
    set((state) => ({ writeOffs: state.writeOffs.filter((entry) => entry.id !== writeOffId) })),
}));

/** Returns booked against one order, newest first. */
export function returnsForOrder(returns: ReturnRecord[], orderId: string): ReturnRecord[] {
  return returns
    .filter((record) => record.orderId === orderId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
