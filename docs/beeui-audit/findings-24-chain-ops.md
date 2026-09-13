# BeeUI findings · phase 6 wave 2 (chain operations)

Worker W-C, 2026-09-13. Screens: suppliers, per-store prices, cash in/out during a shift, the
end of day Z report, the audit log. Package set `@beemvp/beeui-*@0.86.2-rc.1`.

### 24-01 · A `Select` whose option list scrolls cannot be picked with a mouse
- Area: component-behavior
- Severity: blocker
- Source consulted: https://beeui.beemvp.com/docs/components/select/ ; `@beemvp/beeui-ui@0.86.2-rc.1`
- Expected (per docs): `SelectContent` caps itself and scrolls when there are more options than
  fit; picking an option sets the value. Nothing on the page says a long list behaves differently.
- Actual: as soon as the list overflows `maxHeight` (default 320 pt, so from about eight 40 pt
  rows), a mouse press on an option does nothing at all. The dropdown stays open, the value never
  changes, and nothing is logged. A synthetic `click` event on the same node (bypassing the
  pointer sequence) does set the value, so the press is being swallowed by the scroll container
  around the list, not by an overlay: a hit test at the option's centre returns the option itself.
- Repro:
  ```tsx
  <Select value={v} onValueChange={setV}>
    <SelectTrigger><SelectValue /></SelectTrigger>
    <SelectContent>{sixteenOptions}</SelectContent>   {/* click any option: nothing happens */}
  </Select>
  ```
- Workaround: tell the dropdown how tall it needs to be so it never scrolls, via the undocumented
  `maxHeight` prop. `src/components/select-content-height.ts` returns `rows * 40 + 8` for any list
  over seven rows; the audit log's staff (13 rows) and action (16 rows) filters, the orders cashier
  filter (13 rows) and the product category field (8 rows) all pass it.
  `scrollViewProps={{ keyboardShouldPersistTaps: 'always' }}` does **not** help. The workaround has
  a residual limit: BeeUI clamps `maxHeight` to the window, so a window shorter than the list
  scrolls again and the defect returns. Every viewport this app targets (812 pt and up) fits the
  longest list.
- Suggested fix for BeeUI: the option rows inside the content `ScrollView` must not lose the press
  when the view is scrollable. This is the classic RN responder hand-off; on web a `click` fallback
  on the item, or `onStartShouldSetResponderCapture` returning false on the scroller, would do it.
  Two of the four selects this bit were already in the shipped app before this phase, so the defect
  has been silently breaking filters wherever a chain has more than seven staff.

### 24-02 · `maxHeight` on `SelectContent` is not in the documentation
- Area: docs-public
- Severity: major
- Source consulted: https://beeui.beemvp.com/docs/components/select/
- Expected (per docs): the props table lists what `SelectContent` takes.
- Actual: the page documents `align`, `placement` and the slot structure, but not `maxHeight` or
  `scrollViewProps`, which are the only two ways to influence the list's height and its scroller.
  Both exist in the published types. Finding 24-01 has no workaround at all without `maxHeight`,
  and the only way to discover it was to read the shipped `.d.ts`.
- Repro: search the Select page for "maxHeight"; no match.
- Workaround: read `dist/typescript/module/index.d.ts`.
- Suggested fix for BeeUI: document both props, and say what the default cap is (320).

### 24-03 · `className` on `SelectContent` cannot reach the scroller
- Area: api-types
- Severity: minor
- Source consulted: https://beeui.beemvp.com/docs/components/select/
- Expected (per docs): `className` styles the dropdown, so `max-h-[520px]` would raise its cap.
- Actual: the class lands on the outer surface view, while the height that matters is an inline
  `maxHeight` on both that view and the inner `ScrollView`, computed from the `maxHeight` prop. The
  inline style wins, so the class silently does nothing and the list still scrolls at 320.
- Repro: `<SelectContent className="max-h-[520px]">` with twenty options; the box stays 310 pt.
- Workaround: use the `maxHeight` prop.
- Suggested fix for BeeUI: either let the class win (drop the inline default when a class is given)
  or say in the docs that the height is prop-driven only.

### 24-04 · `TableCell` lays its children in a row, with no note in the docs
- Area: docs-public
- Severity: minor
- Source consulted: https://beeui.beemvp.com/docs/guides/table/
- Expected (per docs): the guide's examples put one value per cell, so nothing suggests a
  direction; a title over a caption is the commonest cell in this app.
- Actual: two `Text` children of one `TableCell` render side by side, so `HN01` and
  `Tạp hoá Cầu Giấy` come out as `HN01Tạp hoá Cầu Giấy` with no separator. Three screens hit this.
- Repro: `<TableCell><Text>HN01</Text><Text>Tạp hoá Cầu Giấy</Text></TableCell>`
- Workaround: wrap the pair in a `View` per cell.
- Suggested fix for BeeUI: show a two-line cell in the table guide, or expose the row direction as
  a prop on `TableCell`.

### 24-05 · No monospaced text variant, so a printable block sets its own font family
- Area: gap
- Severity: minor
- Source consulted: https://beeui.beemvp.com/docs/components/text/
- Expected (per docs): `variant` covers the type scale the design system owns.
- Actual: there is no monospaced step. A receipt or a Z report has to align columns, which is the
  one thing a proportional face cannot do, so the Z sheet passes `fontFamily` through `style` and
  picks the platform family itself (`Menlo` on iOS, `monospace` elsewhere).
- Repro: render `formatZReportText(...)` in a `Text`; every column edge is ragged.
- Workaround: `style={{ fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) }}`.
- Suggested fix for BeeUI: a `mono` variant (or a `numeric="tabular"` sibling for whole blocks),
  since every POS built on BeeUI will print a receipt.

### 24-06 · `Badge` has no neutral-but-outlined "informational" tone that reads in dark
- Area: component-behavior
- Severity: nit
- Source consulted: https://beeui.beemvp.com/docs/components/badge/
- Expected (per docs): `variant="outline"` is the neutral state badge.
- Actual: it is the only neutral option, so a table that needs "chain price" (neutral) beside
  "store price" (notable) has one outline and one warning, and the neutral one is very quiet
  against `bg-surface` in dark. Not wrong, but the pair reads as "one badge and one blank".
- Repro: the source column of `src/features/products/components/store-price-section.tsx`.
- Workaround: kept `outline`; the row is still readable because the effective price is bold.
- Suggested fix for BeeUI: a `muted` badge variant with a filled, low-contrast background.
