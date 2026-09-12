/**
 * Ranking for the command palette (`Cmd/Ctrl+K`). Pure so the ordering can be tested without a
 * renderer: the palette component only turns the ranked list into rows.
 *
 * Vietnamese is the default locale, so a query is folded to unaccented lowercase before it is
 * compared: a cashier typing `coca` must reach `Nước ngọt Coca-Cola`, and typing `nuoc` must
 * reach it too. `đ` is folded to `d` by hand because it carries no combining mark for NFD to
 * split off.
 */

export type CommandGroup = 'screens' | 'products' | 'orders' | 'customers';

export interface CommandItem {
  id: string;
  group: CommandGroup;
  /** Shown as the row's first line and matched with the highest weight. */
  title: string;
  /** Shown muted under the title, and matched at a lower weight. */
  subtitle?: string;
  /** Matched but never shown: SKU, barcode, phone number. */
  keywords?: string;
  /** Route the row opens. */
  href: string;
}

/** Lowercase, unaccented form used on both sides of every comparison. */
export function foldText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/** Query split into the tokens that must all match, in folded form. */
export function queryTokens(query: string): string[] {
  return foldText(query).split(/\s+/).filter(Boolean);
}

const TITLE_PREFIX = 100;
const TITLE_WORD_PREFIX = 70;
const TITLE_SUBSTRING = 40;
const OTHER_PREFIX = 25;
const OTHER_SUBSTRING = 10;

function fieldScore(haystack: string, token: string, prefix: number, wordPrefix: number, substring: number): number {
  if (!haystack) return 0;
  const at = haystack.indexOf(token);
  if (at < 0) return 0;
  if (at === 0) return prefix;
  // A hit right after a separator reads as "the word starts with this", which is what a
  // cashier means by typing `cola`; a hit inside a word is a weaker match.
  if (/[\s\-.,/(]/.test(haystack[at - 1])) return wordPrefix;
  return substring;
}

/**
 * How well one item answers the query, or `null` when a token matches nothing at all. Every
 * token has to land somewhere, so `coca 330` narrows instead of widening.
 */
export function scoreCommand(item: CommandItem, tokens: string[]): number | null {
  if (tokens.length === 0) return 0;

  const title = foldText(item.title);
  const other = foldText([item.subtitle, item.keywords].filter(Boolean).join(' '));

  let total = 0;
  for (const token of tokens) {
    const best = Math.max(
      fieldScore(title, token, TITLE_PREFIX, TITLE_WORD_PREFIX, TITLE_SUBSTRING),
      fieldScore(other, token, OTHER_PREFIX, OTHER_PREFIX, OTHER_SUBSTRING),
    );
    if (best === 0) return null;
    total += best;
  }
  return total;
}

/**
 * The items that match, best first. An empty query keeps the caller's order, which is how the
 * palette opens on the nine screens rather than on an arbitrary product.
 */
export function rankCommands(items: CommandItem[], query: string, limit = 30): CommandItem[] {
  const tokens = queryTokens(query);
  if (tokens.length === 0) return items.slice(0, limit);

  return items
    .map((item, index) => ({ item, index, score: scoreCommand(item, tokens) }))
    .filter((entry): entry is { item: CommandItem; index: number; score: number } => entry.score !== null)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // A shorter title containing the same hit is the more exact answer; input order breaks
      // the remaining ties so the list never reshuffles between two equal renders.
      if (a.item.title.length !== b.item.title.length) return a.item.title.length - b.item.title.length;
      return a.index - b.index;
    })
    .slice(0, limit)
    .map((entry) => entry.item);
}

/**
 * Keeps at most `max` rows per group while preserving the ranked order, so one group with 200
 * hits cannot push the others off screen.
 */
export function capPerGroup(items: CommandItem[], max: number): CommandItem[] {
  const seen = new Map<CommandGroup, number>();
  return items.filter((item) => {
    const count = seen.get(item.group) ?? 0;
    if (count >= max) return false;
    seen.set(item.group, count + 1);
    return true;
  });
}

/** The ranked rows split into the palette's four sections, empty groups dropped. */
export function groupCommands(items: CommandItem[]): { group: CommandGroup; items: CommandItem[] }[] {
  const order: CommandGroup[] = ['screens', 'products', 'orders', 'customers'];
  return order
    .map((group) => ({ group, items: items.filter((item) => item.group === group) }))
    .filter((section) => section.items.length > 0);
}
