import { createElement, useEffect, useRef, type ReactElement } from 'react';
import { Platform } from 'react-native';
import { emptyScanBuffer, scanBuffer, type ScanBuffer } from '../../../domain/pos';
import { isOverlayOpen, isTypingTarget } from '../../../lib/keyboard';
import { HardwareKeyCapture } from '../../../native/hardware-key-capture';

/**
 * A keyboard-wedge scanner is a keyboard: it types the digits of the code in a burst and
 * sends Enter. This hook listens for that burst and hands the finished code to the caller;
 * the rule itself lives in `scanBuffer` (src/domain/pos.ts) so the timing is tested without
 * a DOM.
 *
 * Web listens at the window. Native has no global key event, so the hook returns the capture
 * element that holds the keyboard focus instead (`src/native/hardware-key-capture.tsx`), and
 * the sell screen has to render it:
 *
 * ```tsx
 * const scanCapture = useBarcodeScan(handleScan);
 * ...
 * {scanCapture}
 * ```
 *
 * The return value is `null` on web, so rendering it is harmless there.
 */
export function useBarcodeScan(onScan: (code: string) => void, enabled = true): ReactElement | null {
  // Kept in a ref so a burst is not restarted by a re-render between two keystrokes.
  const buffer = useRef<ScanBuffer>(emptyScanBuffer);
  const handler = useRef(onScan);
  // Written after the render that produced it, not during: the listeners below only read it
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

  if (Platform.OS === 'web') return null;
  return createElement(HardwareKeyCapture, { onScan, enabled });
}
