/**
 * The three layout bands the design direction defines (`docs/design/design-direction.md`,
 * section 1). Everything responsive in the app derives from this hook so a screen never
 * invents its own width threshold.
 */

import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'phone' | 'tablet' | 'desktop';

/** Rail replaces the bottom tab bar from this width up. */
export const TABLET_MIN_WIDTH = 768;
/** Sidebar replaces the rail, and POS gains its persistent cart pane, from this width up. */
export const DESKTOP_MIN_WIDTH = 1280;

/** Pure form of {@link useBreakpoint}, so layout rules stay testable without a renderer. */
export function breakpointForWidth(width: number): Breakpoint {
  if (width >= DESKTOP_MIN_WIDTH) return 'desktop';
  if (width >= TABLET_MIN_WIDTH) return 'tablet';
  return 'phone';
}

/** Current layout band: `phone` under 768, `tablet` 768 to 1279, `desktop` from 1280. */
export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  return breakpointForWidth(width);
}
