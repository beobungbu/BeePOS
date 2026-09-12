import { useBreakpoint } from '../hooks/use-breakpoint';

/**
 * Row floor for the admin tables on a pointer screen: 48 pt instead of the 56 pt comfortable
 * default (`plans/260912-1054-beepos-design-pass/phase-04-desktop-density.md`, decision 7).
 *
 * BeeUI exposes no per-table density prop: `Table`, `TableRow`, `TableCell` and `TableHead`
 * take `className`, `layout`, `selected`, `colSpan`, `label` and the sort props, and nothing
 * else (https://beeui.beemvp.com/docs/components/table/). The density guide's
 * `applyDensity(uniwind, theme, mode)` is the only other lever and it is global and
 * three-valued (compact 44, comfortable 56, spacious 64), so using it here would shrink the
 * phone list rows too and still not land on 48. The floor is therefore a class on the row.
 *
 * Rows whose primary cell folds a second value under the first (the order code over its time,
 * the product name over its SKU) stay taller than the floor on purpose: the fold is a
 * direction-doc rule (section 8) and a floor cannot shrink content.
 */
export function useTableRowClass(): string {
  return useBreakpoint() === 'desktop' ? 'min-h-12' : '';
}
