/**
 * The money field's text half: digits in state, `200.000 đ` on screen
 * (`docs/design/design-direction.md` sections 5 and 10). Pure, so the editing rules below are
 * covered by tests instead of by a click-through.
 */

import { formatVND } from '../../../domain/money';

/** A dong amount can never need more than this; it also stops a stuck key overflowing the field. */
const MAX_DIGITS = 12;

/** Digits only, without the leading zeros a keypad produces (`0200000` reads as `200000`). */
export function moneyDigits(text: string): string {
  return text
    .replace(/\D/g, '')
    .replace(/^0+(?=\d)/, '')
    .slice(0, MAX_DIGITS);
}

/** What the cashier reads while typing: `200.000 đ`, empty while nothing has been entered. */
export function formatMoneyDraft(digits: string): string {
  return digits === '' ? '' : formatVND(Number(digits));
}

/**
 * The digits a keystroke leaves behind, given what the field held before.
 *
 * Deleting is the one case that needs care: the caret sits after the ` đ` suffix, so the first
 * backspace removes a character that is not a digit and would otherwise appear to do nothing.
 * A shorter text that yields the same digits therefore means "drop the last digit".
 */
export function nextMoneyDigits(current: string, nextText: string): string {
  const digits = moneyDigits(nextText);
  if (digits === current && nextText.length < formatMoneyDraft(current).length) {
    return current.slice(0, -1);
  }
  return digits;
}
