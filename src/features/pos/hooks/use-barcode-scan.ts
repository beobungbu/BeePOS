import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { emptyScanBuffer, scanBuffer, type ScanBuffer } from '../../../domain/pos';
import { isOverlayOpen, isTypingTarget } from '../../../lib/keyboard';

/**
 * A keyboard-wedge scanner is a keyboard: it types the digits of the code in a burst and
 * sends Enter. This hook listens for that burst on the sell screen and hands the finished
 * code to the caller; the rule itself lives in `scanBuffer` (src/domain/pos.ts) so the
 * timing is tested without a DOM.
 *
 * Web only. React Native exposes no global hardware-key event on iOS or Android, so on
 * native the wedge path stays the catalog search field, which a scanner fills and submits
 * exactly like a typist would (see the report for phase 5 W-A).
 */
export function useBarcodeScan(onScan: (code: string) => void, enabled = true): void {
  // Kept in a ref so a burst is not restarted by a re-render between two keystrokes.
  const buffer = useRef<ScanBuffer>(emptyScanBuffer);
  const handler = useRef(onScan);
  // Written after the render that produced it, not during: the listener below only reads it
  // from an event, which is always after the commit.
  useEffect(() => {
    handler.current = onScan;
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) return undefined;

    function onKeyDown(event: KeyboardEvent) {
      // A shortcut (Alt+1, Cmd+K) is never part of a scan, and the digit it carries must
      // not land in the buffer either.
      if (event.ctrlKey || event.metaKey || event.altKey) {
        buffer.current = emptyScanBuffer;
        return;
      }
      // Someone typing in the search field, a dialog field or a note is not scanning: that
      // input has its own submit, and stealing Enter from it would break the form.
      if (isTypingTarget(event.target)) {
        buffer.current = emptyScanBuffer;
        return;
      }
      // A modal is up, so the till is not selling. Without this a scan behind an open dialog
      // would quietly add a line the cashier cannot see.
      if (isOverlayOpen()) {
        buffer.current = emptyScanBuffer;
        return;
      }

      const step = scanBuffer(buffer.current, event.key, performance.now());
      buffer.current = step.buffer;
      if (step.code === undefined) return;

      // The Enter that closed the burst belongs to the scanner, not to whatever control the
      // cashier last pressed.
      event.preventDefault();
      handler.current(step.code);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      buffer.current = emptyScanBuffer;
    };
  }, [enabled]);
}
