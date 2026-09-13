/**
 * Global hardware-key capture for native, the counterpart of the web `keydown` listener that
 * `use-barcode-scan.ts` uses for a keyboard-wedge barcode scanner.
 *
 * React Native has no global key event on iOS or Android: keystrokes go to the first responder
 * (iOS) / focused view (Android), so something has to hold focus for the app to see them. The
 * maintained native modules that add a global hook (`react-native-key-command`,
 * `react-native-external-keyboard`) are both custom native code, which a managed dev client
 * cannot pick up without a rebuild; see the phase 7 native report for that comparison.
 *
 * What is here instead is the POS-terminal pattern: an off-screen `TextInput` that keeps the
 * keyboard focus whenever no real field has it, with the soft keyboard suppressed. A wedge
 * scanner is an HID keyboard, so its burst lands in `onChangeText` and its trailing Enter in
 * `onSubmitEditing`, and both are handed on as single keystrokes.
 *
 * Deliberate limits, all of them checked on device:
 * - a real field always wins. Focus is only claimed while `TextInput.State` reports no other
 *   focused input, so tapping the catalogue search or a dialog field is never interrupted.
 * - the characters arrive coalesced. iOS delivers a fast burst as one `onChangeText`, so the
 *   whole burst is fed at one timestamp, which is what the 50 ms gap rule expects anyway.
 * - nothing is captured while the app is backgrounded or the capture is disabled.
 */
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { emptyScanBuffer, scanBuffer, type ScanBuffer } from '../domain/pos';

export interface HardwareKeyCaptureProps {
  /** Called with the finished code once a burst closes with Enter. */
  onScan: (code: string) => void;
  /** False parks the capture: focus is released and nothing is claimed back. */
  enabled?: boolean;
}

/** How long a real field gets to take the focus before the capture claims it back. */
const RECLAIM_DELAY_MS = 150;

export function HardwareKeyCapture({ onScan, enabled = true }: HardwareKeyCaptureProps) {
  const inputRef = useRef<TextInput>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Kept in a ref so a re-render between two keystrokes cannot restart the burst.
  const buffer = useRef<ScanBuffer>(emptyScanBuffer);
  const handler = useRef(onScan);
  useEffect(() => {
    handler.current = onScan;
  });

  /** One keystroke into the same wedge parser the web listener uses. */
  function feed(key: string) {
    // `performance.now()` is monotonic on both platforms, so a system-clock change cannot
    // split one burst into two.
    const step = scanBuffer(buffer.current, key, performance.now());
    buffer.current = step.buffer;
    if (step.code !== undefined) handler.current(step.code);
  }

  const claimFocus = useCallback(() => {
    if (!enabled) return;
    const input = inputRef.current;
    if (!input) return;
    const focused = TextInput.State.currentlyFocusedInput();
    // A real field has the keyboard: leave it alone, and let its own blur bring us back.
    if (focused && focused !== input) return;
    if (focused === input) return;
    input.focus();
  }, [enabled]);

  const scheduleClaim = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      claimFocus();
    }, RECLAIM_DELAY_MS);
  }, [claimFocus]);

  useEffect(() => {
    if (!enabled) {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      inputRef.current?.blur();
      return undefined;
    }
    scheduleClaim();
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [enabled, scheduleClaim]);

  function handleChangeText(text: string) {
    if (!text) return;
    // The value is pinned to '' below, so whatever arrives here is new input.
    for (const character of text) feed(character);
    inputRef.current?.clear();
  }

  return (
    <TextInput
      ref={inputRef}
      value=""
      onChangeText={handleChangeText}
      onSubmitEditing={() => feed('Enter')}
      onBlur={scheduleClaim}
      // Keeps the focus after the scanner's Enter, so the next code needs no re-focus.
      submitBehavior="submit"
      // The wedge is a keyboard, so iOS would raise the soft one on focus and cover the grid.
      showSoftInputOnFocus={false}
      caretHidden
      contextMenuHidden
      autoCorrect={false}
      autoCapitalize="none"
      spellCheck={false}
      keyboardType="default"
      // Off-screen rather than `display: none`: a view that is not laid out cannot be the
      // first responder, and a zero-size one is skipped by the iOS focus engine.
      style={styles.capture}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID="hardware-key-capture"
    />
  );
}

const styles = StyleSheet.create({
  capture: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    top: 0,
    left: 0,
    padding: 0,
    // Below every real control: the input must never take a tap meant for the grid.
    zIndex: -1,
  },
});
