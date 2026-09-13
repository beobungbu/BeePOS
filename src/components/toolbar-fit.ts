/**
 * The measurement rule behind the desktop toolbar (`src/components/toolbar.tsx`). It lives in
 * its own module so the rule can be tested without a renderer, the way every other layout rule
 * in the app is (`src/hooks/use-breakpoint.ts`).
 */

/** Gap between toolbar slots, in points; mirrors the `gap-2` class on the row. */
export const TOOLBAR_GAP = 8;

/**
 * Width the search slot must keep. 240 pt is the narrowest box that still shows its own
 * placeholder, plus 20 pt for the `F3` hint that orders prints beside it. Call sites give the
 * slot `min-w-60 shrink` so the row can take it down to this width before anything collapses.
 */
export const SEARCH_MIN_WIDTH = 260;

export interface ToolbarFit {
  /** Width the row has to lay out in; 0 until the first layout pass. */
  available: number;
  /** Natural width of the secondary filters, measured while they were inline. */
  filtersWidth: number;
  /** Natural width of the pinned slot (0 when the screen pins nothing). */
  pinnedWidth: number;
  /** Natural width of the primary actions (0 when the screen has none). */
  actionsWidth: number;
  /** {@link SEARCH_MIN_WIDTH} when the screen has a search field, 0 when it has none. */
  searchWidth: number;
  gap?: number;
}

/**
 * Whether the secondary filters still fit beside everything that may not move. Returns true
 * while the row is unmeasured so the filters render at least once and can be measured; the
 * caller keeps that measurement while they are collapsed, which is what stops the decision
 * oscillating once the filters have left the row.
 */
export function filtersFitInline({
  available,
  filtersWidth,
  pinnedWidth,
  actionsWidth,
  searchWidth,
  gap = TOOLBAR_GAP,
}: ToolbarFit): boolean {
  if (available <= 0 || filtersWidth <= 0) return true;
  const slots = [searchWidth, pinnedWidth, filtersWidth, actionsWidth].filter((width) => width > 0);
  const total = slots.reduce((sum, width) => sum + width, 0) + gap * (slots.length - 1);
  return total <= available;
}
