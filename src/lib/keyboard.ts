/**
 * Web keyboard helpers shared by every app-level shortcut (`[`, `Cmd/Ctrl+K`, `?`).
 *
 * One copy because the rule they all need is the same: a key is a shortcut only when the
 * cashier is not typing. Native has no hardware key to bind, so callers guard on
 * `Platform.OS === 'web'` before installing a listener.
 */

/** True when the event came from a field, where the key is a character and not a shortcut. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element || typeof element.tagName !== 'string') return false;
  if (element.isContentEditable) return true;
  return /^(input|textarea|select)$/i.test(element.tagName);
}

/**
 * True while a modal is on screen. A shortcut that mutates the till (open an order, close
 * one, switch tabs, scan a line) must not fire behind a dialog: the cashier cannot see what
 * changed, and the dialog they are answering may be about the very record that moved.
 */
export function isOverlayOpen(): boolean {
  if (typeof document === 'undefined') return false;
  return document.querySelector('[role="dialog"],[role="alertdialog"]') !== null;
}

/** True for `Cmd+K` on macOS and `Ctrl+K` elsewhere, and only when no other modifier is held. */
export function isCommandPaletteChord(event: KeyboardEvent): boolean {
  if (event.key !== 'k' && event.key !== 'K') return false;
  if (event.altKey || event.shiftKey) return false;
  return event.metaKey !== event.ctrlKey;
}
