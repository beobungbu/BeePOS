# Findings 14 · Design pass: composing a POS multi-order tab strip (Ambrose, 2026-09-12)

Context: the BeePOS design pass (`docs/design/`) needs a strip of open orders on the sell screen: each tab shows a label, a line count and a total, the active tab carries a close control, a pinned "+" opens a new order, the strip scrolls when it overflows. This is the standard KiotViet / Sapo / Square "open tickets" pattern.

### 14-01 · No BeeUI family composes a closable, scrollable tab strip
- Area: components / composition gap
- Severity: minor (feature gap, not a defect; the app builds its own composite)
- Source consulted: https://beeui.beemvp.com/docs/components/tabs/ , https://beeui.beemvp.com/docs/components/chip/ , https://beeui.beemvp.com/docs/components/segmented-control/
- Expected: one of Tabs, Chip/ChipGroup or SegmentedControl can host a trailing action (close) per item and scroll horizontally, or the docs point to a composition recipe.
- Actual:
  - Tabs: "Press handling is owned by the family: a trigger reaches `onValueChange` only when its tab is not already selected, so pressing the active tab does nothing and a trigger cannot carry its own press handler." `TabsTriggerProps` omits `onPress`. A nested IconButton inside a trigger is undocumented and conflicts with the trigger's own Pressable.
  - Chip / ChipGroup: props are `value`, `selected`, `onSelectedChange`, `selectionMode`; no remove, dismiss, trailing slot or close affordance is documented.
  - SegmentedControl: docs say nothing about overflow or scrolling; the family renders equal-width segments in a fixed row, so 8 items with counts and totals do not fit at 375 pt.
- Repro: try to build the strip in `docs/design/mockups/pos.html` with any of the three families.
- Workaround (BeePOS phase 2): app-owned composite of `ScrollView` + `Pressable` + `Badge` + `IconButton`, keyboard `Alt+1..8`, `Alt+N`, `Alt+W` on web, AlertDialog before closing a non-empty order. See `docs/design/design-direction.md` section 6.
- Suggested fix for BeeUI: either (a) a `trailing` slot on `TabsTrigger` and `Chip` whose press does not bubble into selection, plus a `scrollable` prop on `TabsList`, or (b) a documented pattern page "Closable tabs / open tickets" showing the composition with the existing primitives and the a11y contract (tab role, close button labelled with the tab name).

### Not filed (checked and rejected)
- `llms-tokens.txt` returns 404, but `llms.txt` does not list it, so there is no broken reference. Token values are readable from `@beemvp/beeui-tokens/theme.css`.
- `bg-card` / `bg-accent` used in 4 places of BeePOS are not BeeUI tokens and never were documented; that is a BeePOS worker error, fixed in phase 2.
