/**
 * Parks the hardware-scanner capture while a dialog with a field of its own is on screen.
 *
 * On native there is no global key event, so the sell screen keeps an off-screen input holding
 * the keyboard focus (`src/native/hardware-key-capture.tsx`). It releases the focus to a real
 * field, but it claims it back 150 ms later, which is exactly long enough to take the focus
 * off a dialog that opens with no field focused yet: the order rename, the order discount and
 * the customer search all lose the first characters typed into them (W-N question 3).
 *
 * So the dialogs say when they are up, and the sell screen parks the capture while any of them
 * is. A count rather than a flag, because two overlays can be open at once (the customer
 * picker over the cart sheet) and the first one to close must not un-park the capture under
 * the second.
 *
 * The web listener guards itself with `isOverlayOpen()` on the DOM and does not need this; the
 * flag costs it nothing, because a scan behind a dialog was already refused there.
 */

import { useEffect } from 'react';
import { create } from 'zustand';

interface CaptureLockState {
  /** How many dialogs are currently holding the capture off. */
  holders: number;
  hold: () => void;
  release: () => void;
}

export const useCaptureLockStore = create<CaptureLockState>((set) => ({
  holders: 0,
  hold: () => set((state) => ({ holders: state.holders + 1 })),
  release: () => set((state) => ({ holders: Math.max(0, state.holders - 1) })),
}));

/**
 * Holds the scanner capture off while `active`, and releases it on unmount.
 *
 * Call it from the dialog itself with its own open flag: a dialog that is unmounted while open
 * (the screen is navigated away from) still releases, because the cleanup runs either way.
 */
export function useHoldScanCapture(active: boolean): void {
  useEffect(() => {
    if (!active) return undefined;
    const { hold, release } = useCaptureLockStore.getState();
    hold();
    return release;
  }, [active]);
}

/** True while any dialog is holding the capture off. */
export function useScanCaptureLocked(): boolean {
  return useCaptureLockStore((state) => state.holders > 0);
}
