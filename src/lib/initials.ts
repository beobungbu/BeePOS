/**
 * Avatar fallback initials: the first and last word of a name ("Vũ Thị Giang" reads "VG").
 *
 * One copy for the whole app. The shell avatar, the store picker and the three customer
 * surfaces each grew their own, and the two implementations disagreed on a blank name.
 *
 * Not the same rule as `monogramOf` in `src/lib/category-accent.ts`, which takes the first
 * *two* words: a product is "Phô mai lát" to "PM", a person is first name to family name.
 */
export function initialsOf(name: string | undefined): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0][0] ?? '';
  const last = words.length > 1 ? words[words.length - 1][0] ?? '' : '';
  return `${first}${last}`.toUpperCase();
}
