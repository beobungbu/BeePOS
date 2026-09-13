/**
 * How tall a `Select` dropdown has to be told to be.
 *
 * BeeUI caps `SelectContent` at 320 pt and puts the options in a `ScrollView`. The moment that
 * list scrolls, the scroll container swallows the mouse press and the option cannot be picked
 * at all, by a person or by a test: the dropdown opens, the press lands on the row, and the
 * value never changes (`docs/beeui-audit/findings-24-chain-ops.md`, 24-01, measured on the
 * audit log's sixteen-action filter). Any list longer than seven rows therefore says how tall
 * it needs to be, and BeeUI still clamps that to the window.
 *
 * The residual limit is a window shorter than the list: there the dropdown scrolls again and
 * the defect is back. Every viewport this app is built for (812 pt and up) fits the longest
 * list in it.
 */

/** Height of one option row in BeeUI's `Select`, measured in Chromium on the dev build. */
const OPTION_HEIGHT = 40;
/** Vertical padding `SelectContent` puts around the list. */
const CONTENT_PADDING = 8;

/** Rows that fit inside BeeUI's default 320 pt cap; a shorter list needs no override. */
export const SELECT_SCROLL_THRESHOLD = 7;

/**
 * `maxHeight` for a `SelectContent` holding `optionCount` rows, counting any "all" row.
 * Returns undefined for a list that already fits, so a short select keeps BeeUI's default.
 */
export function selectContentHeight(optionCount: number): number | undefined {
  if (optionCount <= SELECT_SCROLL_THRESHOLD) return undefined;
  return optionCount * OPTION_HEIGHT + CONTENT_PADDING;
}
