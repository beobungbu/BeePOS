import { useWindowDimensions } from 'react-native';
import { useBreakpoint, type Breakpoint } from '../../../hooks/use-breakpoint';

export interface PosLayout {
  breakpoint: Breakpoint;
  width: number;
  /** Desktop only: the cart is a permanent 380 pt pane instead of the `/pos/cart` route. */
  isCartPaneVisible: boolean;
  /** 2 at phone, 4 from 768 up, and still 4 at desktop beside the cart pane. */
  gridColumns: number;
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

  return {
    breakpoint,
    width,
    isCartPaneVisible: isDesktop,
    gridColumns: isPhone ? 2 : 4,
    imageAspectRatio: isDesktop ? 4 / 3 : 1,
    gutter: isPhone ? 16 : isDesktop ? 24 : 20,
    gap: isPhone ? 8 : 12,
    chipLimit: isDesktop ? 9 : 7,
    shortSearchPlaceholder: width < 400,
  };
}
