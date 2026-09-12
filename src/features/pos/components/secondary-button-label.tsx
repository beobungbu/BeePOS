import type { ReactNode } from 'react';
import { ButtonLabel } from '@beemvp/beeui-ui';

/**
 * Label for a Button that has no filled background (outline, ghost, dialog cancel).
 *
 * BeeUI paints those labels `primary-foreground` (#1f2937) in both themes, which is legible
 * on the amber primary fill and all but invisible on `bg-surface` in dark: measured
 * #1f2937 on #121820, a contrast ratio of about 1.1 to 1. Setting `labelClassName` on the
 * button does not help, it is ignored once the children contain a `ButtonLabel`. Filed as a
 * BeeUI finding; until it lands, every unfilled button in POS states its own text colour.
 */
export function SecondaryButtonLabel({ children }: { children: ReactNode }) {
  return <ButtonLabel className="text-foreground">{children}</ButtonLabel>;
}
