/**
 * Which app-level overlay is open: the command palette (`Cmd/Ctrl+K`) or the shortcut help
 * (`?`). A store rather than state in `AppShell` because both the header button and a global
 * key listener open the same dialog, and only one of the two may be on screen at a time.
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { isCommandPaletteChord, isTypingTarget } from '../../lib/keyboard';

export type ShellOverlay = 'palette' | 'shortcuts' | null;

interface ShellOverlayState {
  overlay: ShellOverlay;
  openOverlay: (overlay: Exclude<ShellOverlay, null>) => void;
  closeOverlay: () => void;
}

export const useShellOverlayStore = create<ShellOverlayState>((set) => ({
  overlay: null,
  openOverlay: (overlay) => set({ overlay }),
  closeOverlay: () => set({ overlay: null }),
}));

export function openCommandPalette(): void {
  useShellOverlayStore.getState().openOverlay('palette');
}

/**
 * `Cmd/Ctrl+K` opens the palette and `?` opens the shortcut help, on web only and never while
 * the cashier is typing. `Cmd+K` is taken back from the browser (Chrome focuses the address
 * bar) deliberately: inside an installed POS the palette is what that chord means.
 */
export function useOverlayShortcuts(): void {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      if (isCommandPaletteChord(event)) {
        event.preventDefault();
        useShellOverlayStore.getState().openOverlay('palette');
        return;
      }
      // `?` is Shift+/ on most layouts, so the character is what identifies it, not the code.
      if (event.key === '?' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        useShellOverlayStore.getState().openOverlay('shortcuts');
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
}
