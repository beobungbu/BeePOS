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

/** True for `Cmd+K` on macOS and `Ctrl+K` elsewhere, and only when no other modifier is held. */
export function isCommandPaletteChord(event: KeyboardEvent): boolean {
  if (event.key !== 'k' && event.key !== 'K') return false;
  if (event.altKey || event.shiftKey) return false;
  return event.metaKey !== event.ctrlKey;
}
