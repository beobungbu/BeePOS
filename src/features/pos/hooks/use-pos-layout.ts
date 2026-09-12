import { useWindowDimensions } from 'react-native';
import { useBreakpoint, type Breakpoint } from '../../../hooks/use-breakpoint';

export interface PosLayout {
  breakpoint: Breakpoint;
  width: number;
  /** Desktop only: the cart is a permanent 380 pt pane instead of the `/pos/cart` route. */
  isCartPaneVisible: boolean;
  /** 3 under 400, 2 from 400 to 767, 4 from 768 up and still 4 beside the cart pane. */
  gridColumns: number;
  /** The 3 column phone grid drops the tile one type step so 2 lines of name still fit. */
  compactTiles: boolean;
  /** Image slot shape: square on phone and tablet, 4 / 3 on desktop to keep four columns. */
  imageAspectRatio: number;
  /** Page gutter: 16 phone, 20 tablet, 24 desktop. */
  gutter: number;
  /** Grid gap: 8 phone, 12 from tablet up. */
  gap: number;
  /** Category chips that fit two wrapped rows before the `+N` chip takes over. */
  chipLimit: number;
  /** Under 400 pt the long search placeholder wraps. */
  shortSearchPlaceholder: boolean;
}

/**
 * POS layout derived from the one breakpoint hook the app has
 * (`docs/design/design-direction.md` section 1). Screens never invent their own thresholds.
 */
export function usePosLayout(): PosLayout {
  const { width } = useWindowDimensions();
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === 'desktop';
  const isPhone = breakpoint === 'phone';

  // Under 400 pt a 2 column grid leaves 3 tiles above the fold; a third column at the small
  // type step puts 6 there, which is what a cashier scans at the till.
  const isNarrowPhone = isPhone && width < 400;

  return {
    breakpoint,
    width,
    isCartPaneVisible: isDesktop,
    gridColumns: isNarrowPhone ? 3 : isPhone ? 2 : 4,
    compactTiles: isNarrowPhone,
    imageAspectRatio: isDesktop ? 4 / 3 : 1,
    gutter: isPhone ? 16 : isDesktop ? 24 : 20,
    gap: isPhone ? 8 : 12,
    chipLimit: isDesktop ? 9 : 7,
    shortSearchPlaceholder: width < 400,
  };
}
