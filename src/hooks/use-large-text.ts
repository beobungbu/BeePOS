/**
 * "The user asked for big text."
 *
 * From this scale up a phone row no longer holds a label under an icon or an amount next to a
 * verb, so the bottom tab bar goes icon only (`docs/beeui-audit/findings-13-native-keyboard-fontscale.md`)
 * and the checkout CTA drops the amount from its one clamped line. Both read the threshold
 * here so they can never disagree about what "large" means.
 */

import { useWindowDimensions } from 'react-native';

export const LARGE_TEXT_FONT_SCALE = 1.3;

/** True when the user's text size is at or past the point where labels stop fitting. */
export function useLargeText(): boolean {
  return useWindowDimensions().fontScale >= LARGE_TEXT_FONT_SCALE;
}
