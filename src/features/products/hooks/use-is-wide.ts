import { useWindowDimensions } from 'react-native';

/** Matches the shell's wide/narrow breakpoint (`src/components/shell/app-shell.tsx`). */
const WIDE_BREAKPOINT = 768;

/** True when the viewport is wide enough for the desktop/tablet layout (table, side-by-side forms). */
export function useIsWide(): boolean {
  const { width } = useWindowDimensions();
  return width >= WIDE_BREAKPOINT;
}
