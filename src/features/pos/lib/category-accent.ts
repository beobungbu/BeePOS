/**
 * Category decoration for the product image slot and the cart thumbnail: the five chart
 * tokens of `docs/design/design-direction.md` section 2, read through BeeUI's runtime token
 * reader so both themes are covered without a conditional colour in app code.
 *
 * Accent is decoration only. It is always paired with the product name, never the sole
 * carrier of meaning, and every caller falls back to `bg-muted` when a token is unreadable.
 */

import { useBeeToken } from '@beemvp/beeui-ui';

export interface CategoryAccent {
  /** Resolved accent colour, or undefined when the token did not resolve to a colour. */
  color?: string;
  /** The same accent at roughly 8 percent, for the image slot and thumbnail background. */
  tint?: string;
}

function asColor(value: string | number): string | undefined {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : undefined;
}

/** Stable index into the palette: `cat-3` maps to slot 2, anything else hashes its characters. */
function paletteIndex(categoryId: string, size: number): number {
  const numeric = /^cat-(\d+)$/.exec(categoryId);
  if (numeric) return (Number(numeric[1]) - 1) % size;
  let hash = 0;
  for (let i = 0; i < categoryId.length; i += 1) hash = (hash + categoryId.charCodeAt(i)) % size;
  return hash;
}

export function useCategoryAccent(categoryId: string): CategoryAccent {
  const palette = [
    useBeeToken('chart.series-1'),
    useBeeToken('chart.series-2'),
    useBeeToken('chart.series-3'),
    useBeeToken('chart.series-4'),
    useBeeToken('chart.highlight'),
  ];

  const color = asColor(palette[paletteIndex(categoryId, palette.length)]);
  return { color, tint: color ? `${color}14` : undefined };
}

/** Product initials for the monogram fallback, at most two letters ("Phô mai..." to "PM"). */
export function monogramOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const letters = words.slice(0, 2).map((word) => word.charAt(0));
  return letters.join('').toUpperCase();
}
