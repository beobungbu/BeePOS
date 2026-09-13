# Findings 25 · W-P (sales: wholesale POS, customers and B2B, pricing screens, order lifecycle)

Phase: `plans/260913-1115-beepos-commerce-program/plan.md`, rows A and B.
Surface exercised: `Switch`, `SegmentedControl`/`SegmentedControlItem`, `Badge`,
`Select`/`SelectTrigger`/`SelectValue`/`SelectContent`, `Dialog`/`DialogFooter`,
`AlertDialog`, `Field`, `Input`, `Textarea`, `SearchInput`, `Tabs`, `Table` family,
`ListGroup`/`ListItem`, `EmptyState`, `Button`/`ButtonLabel`, on `react-native-web` at 375
and 1440, light theme.

Nothing in the published packages was patched. One new finding; two defects already on file
were hit again on new surfaces and are recorded as confirmations rather than new numbers, and
two candidates were investigated and rejected as not-BeeUI.

### 25-01 · `SegmentedControl` gives its `radiogroup` no accessible name, and the docs imply it does

- Area: accessibility / docs
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/components/segmented-control/>
- Expected (per docs): the props table lists `children`, `className`, `disabled`,
  `onValueChange` and `value`, and the accessibility section states that the family sets
  "`accessibilityLabel`, `checked`, `disabled`" itself, "not by the caller". A reader of that
  sentence concludes the group is named for them and writes the documented snippet.
- Actual: the rendered group is `<div role="radiogroup">` with no `aria-label`. Only the
  individual segments are named (each by its own text), so a screen reader announces
  "radio group" with no indication of what is being chosen. With several controls on one
  screen (one unit selector per catalogue tile and one per cart line, plus the customer type
  control on the customer form) they are indistinguishable from one another.
- Repro: `/pos` with the `Bán sỉ` switch on, inspect the first `[role="radiogroup"]`:
  `aria-label` is null with the documented snippet.
- Workaround: pass `accessibilityLabel` anyway. It is not in the props table but it typechecks
  (inherited from `View`) and it does reach the group:
  `aria-label="Đơn vị Nước ngọt Coca-Cola 330ml"`. Applied in
  `src/features/pos/components/unit-selector.tsx`; the customer type control in
  `src/features/customers/components/customer-business-fields.tsx` is named by its `Field`
  instead.
- Suggested fix for BeeUI: either document `accessibilityLabel` on `SegmentedControlProps`
  (it already works), or correct the accessibility note, which currently tells the caller the
  opposite of what the component does. Every existing BeePOS usage predating this phase
  (`settings/components/appearance-section.tsx`, `products/product-toolbar.tsx`) is unnamed
  for exactly this reason.

### Confirmations of findings already on file

- **24-01, `SelectContent` swallows the press once the list scrolls.** Hit again with the
  product picker of the price-rule dialog: a catalogue select is 120 rows, which scrolls at
  any `maxHeight`, so the option cannot be picked at all. Not re-filed. The workaround here is
  not `selectContentHeight` (nothing makes 120 rows fit a window) but dropping the `Select`
  entirely for a `SearchInput` over a capped list of pressable rows, the shape the till's
  customer picker already uses (`src/features/pricing/components/price-rule-dialog.tsx`).
  This raises 24-01's severity in practice: for long lists the component is unusable rather
  than awkward.
- **18-w-c, `ButtonLabel` paints `text-primary-foreground` whatever the variant.** Hit again
  on every outline button added this phase; `SecondaryButtonLabel` remains the workaround.

### Investigated and rejected as not BeeUI

- **A width class on a `ScrollView` does not size the column.** `<ScrollView className="w-[340px]">`
  as a side pane took half the row instead of 340 pt. This is `react-native-web` applying the
  class to the scroller's content wrapper, not a BeeUI component: wrapping the scroller in a
  `<View className="w-[340px]">` fixes it, which is the shape the sell screen's cart pane
  already used (`src/features/pricing/screens/price-list-detail-screen.tsx`).
- **`setState` inside an effect to re-seed a dialog from its props.** Flagged by
  `react-hooks/set-state-in-effect`, not by anything BeeUI does; the dialogs now adjust state
  on the open transition during render, which is the React-documented pattern.
