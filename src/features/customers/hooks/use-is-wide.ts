import { useWindowDimensions } from 'react-native';

/** Matches the shell's own wide/narrow breakpoint (src/components/shell/app-shell.tsx). */
const WIDE_BREAKPOINT = 768;

export function useIsWide(): boolean {
  const { width } = useWindowDimensions();
  return width >= WIDE_BREAKPOINT;
}
