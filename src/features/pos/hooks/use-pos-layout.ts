import { useWindowDimensions } from 'react-native';

/** Cart-pane breakpoint: a persistent right pane appears at >= 1024px, per product-spec. */
const CART_PANE_BREAKPOINT = 1024;

/** Product grid column-count breakpoints, per product-spec (2 / 4 / 5 columns). */
const GRID_BREAKPOINT_MD = 768;
const GRID_BREAKPOINT_LG = 1280;

export interface PosLayout {
  width: number;
  /** True when the cart renders as a persistent right pane instead of a sheet. */
  isCartPaneVisible: boolean;
  /** Product grid column count for the current width. */
  gridColumns: number;
}

export function usePosLayout(): PosLayout {
  const { width } = useWindowDimensions();
  const gridColumns = width >= GRID_BREAKPOINT_LG ? 5 : width >= GRID_BREAKPOINT_MD ? 4 : 2;
  return { width, isCartPaneVisible: width >= CART_PANE_BREAKPOINT, gridColumns };
}
