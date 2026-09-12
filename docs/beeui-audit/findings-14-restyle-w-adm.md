# Findings 14 · Restyle 2B, W-ADM (products, inventory, reports, stores, staff, settings) · 2026-09-12

Context: sub-phase 2B of the design pass restyles the admin screens to
`docs/design/design-direction.md`. Public sources only: <https://beeui.beemvp.com/docs/> and
`@beemvp/beeui-*@0.86.2-rc.1`. Ids start at 14-20 so the three 2B workers, who write their own
files at the same time, cannot collide (2A used 14-01 to 14-04).

### 14-20 · The documented chart token path `colors.chart-series-1` is not a `BeeTokenPath`
- Area: api-types
- Severity: major
- Source consulted: <https://beeui.beemvp.com/docs/reference/tokens/> ("Token Path Format:
  `colors.chart-{token-name}`", "CSS Variable Format: `--chart-{token-name}`")
- Expected (per docs): `useBeeToken('colors.chart-series-1')` resolves the first chart series
  colour, the same way `useBeeToken('colors.primary')` resolves the brand colour.
- Actual: it does not compile. `error TS2345: Argument of type '"colors.chart-series-1"' is
  not assignable to parameter of type 'BeeTokenPath'`. The path the installed type accepts is
  `chart.series-1` (and `chart.highlight`), a different namespace shape from every other
  colour, which is `colors.<name>`. Nothing on the docs site says `chart.` and the union is
  too large for the compiler to print, so the working path is only findable by guessing.
- Repro: `useBeeToken('colors.chart-series-1')` fails; `useBeeToken('chart.series-1')` passes.
- Workaround: `src/features/products/components/product-thumb.tsx` and
  `src/features/reports/components/revenue-bar-chart.tsx` use `chart.series-1`, with a comment
  so the next reader does not "fix" it back to the documented form.
- Suggested fix for BeeUI: either accept both paths, or correct the tokens reference page to
  say `chart.<name>`. A second worker in this same repo burned the same guess
  (`charts.series-1`), so the cost is being paid more than once.

### 14-21 · A money column cannot be right aligned through the documented `className` escape hatch alone
- Area: component-behavior
- Severity: major
- Source consulted: <https://beeui.beemvp.com/docs/components/table/> (TableCell / TableHead
  props: `children`, `className`, `colSpan`, `label`; no alignment prop, className described
  as the "escape hatch for source-owned and application work")
- Expected: `<TableCell className="items-end">` right aligns the cell's content, the way
  `items-end` does on every other BeeUI layout element, so a table of amounts can follow the
  universal convention of right aligned numerics.
- Actual: it changes nothing on web. `TableCell` renders a `<td>` in `layout="scroll"`, and
  `align-items` has no effect on the text flow inside a table cell, so the numbers stay left
  aligned. The combination that works on both platforms is `className="items-end text-right"`:
  `text-right` for web (inherited `text-align`), `items-end` for native flex children. Neither
  the Table page nor the tokens page mentions this, and the docs' own statement that the
  escape hatch exists implies the single class is enough.
- Repro: `<TableCell className="items-end"><Text numeric="tabular">23</Text></TableCell>` in a
  `layout="scroll"` table on web renders left aligned; adding `text-right` fixes it.
- Workaround: every numeric cell and head in `src/features/{products,inventory,reports}` uses
  `className="items-end text-right"`.
- Suggested fix for BeeUI: an `align="start" | "end"` prop on `TableHead` and `TableCell` that
  sets both. Right aligned amounts are not a niche style, they are the default for currency in
  every table this family will ever be used in.

### 14-22 · A `Badge` placed directly in a `TableCell` stretches to the column width
- Area: component-behavior
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/components/badge/>,
  <https://beeui.beemvp.com/docs/components/table/>
- Expected: a badge is a pill that hugs its text wherever it is placed, the way it does inside
  a `ListItem`'s `trailing` slot.
- Actual: as a direct child of `TableCell` it fills the whole column, so `Đủ hàng` renders as a
  110 pt green slab on every row and the status column reads as a colour bar rather than a set
  of labels. `self-start` does not help on web, since the cell is a `<td>` and the badge is a
  block level child.
- Repro: `<TableCell><Badge variant="success">Đủ hàng</Badge></TableCell>`, at any width.
- Workaround: wrap it, `<View className="flex-row"><Badge .../></View>`, which makes the cell's
  child a flex row so the badge sizes to its content. Used in `product-table.tsx` and
  `inventory-table.tsx`.
- Suggested fix for BeeUI: have `TableCell` render its children inside a flex row by default,
  or document the wrapper next to the `Badge` example in the Table page's status column recipe.

### 14-23 · No family member is a scrolling page container, so every long screen hand rolls one
- Area: gap
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/components/screen/> ("Base application
  surface with semantic background and optional spacing; owns no safe-area or scroll behavior")
- Expected: a `Screen` + `SafeArea` page composes into something scrollable, or the docs point
  at the member that does.
- Actual: the docs are accurate, so this is a gap and not a defect: `Screen` does not scroll,
  `SafeArea` does not scroll, and `KeyboardAwareScreen` is scoped to forms with focused inputs.
  The result is that the settings, reports, stores and staff screens in this app all rendered
  clipped at the viewport with no way to reach the last group, and each one now carries its own
  `react-native` `ScrollView` plus a comment explaining why. Four identical fixes in one phase.
- Repro: render nine `Section`s inside `<Screen><SafeArea><VStack>` at 375 x 812; everything
  past `Hoá đơn` is unreachable.
- Workaround: `<ScrollView className="flex-1">` inside `SafeArea` on each screen.
- Suggested fix for BeeUI: a `scroll` prop on `Screen`, or a documented `ScrollScreen` member.
  A base surface that silently truncates its own content is the kind of thing a design system
  should own once rather than let each app rediscover.
