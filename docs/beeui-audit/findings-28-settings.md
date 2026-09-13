# Findings 28 · W-S (settings, promotions, reports, notifications)

Phase: `plans/260913-1115-beepos-commerce-program/plan.md`, row G and the promotions plus
loyalty half of row B.
Surface exercised: `IconButton`, `DropdownMenu`/`DropdownMenuContent`/`DropdownMenuItem`,
`AlertDialog` (controlled), `Table`/`TableRow`/`TableCell`, `SegmentedControl`, `Switch`,
`Field`/`Input`/`Textarea`, `Select`, `Badge`, `Section`, `SearchInput`, `useBeeToken`, on
`react-native-web` at 375 and 1440, light theme.

Nothing in the published packages was patched. One new finding; two known issues reproduced on
new surfaces and recorded as confirmations rather than re-filed; one candidate investigated and
rejected as not BeeUI, recorded at the end so the next worker does not re-open it.

### 28-01 · `IconButton` has no way to carry a count, so a notification bell is hand built

- Area: gap
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/components/icon-button/>,
  <https://beeui.beemvp.com/docs/components/badge/>
- Expected (per docs): `IconButton` is the documented control for an icon-only action in a
  header, and `Badge` is the documented way to show a small count. A bell with an unread count
  is the commonest pairing of the two, so some composition of them should be documented, even if
  it is only "wrap both in a `View`".
- Actual: neither component mentions the other. `IconButton` takes no `badge`, `indicator` or
  `count` prop, and dropping a `Badge` inside it lays out as a second child in the button's row,
  pushing the glyph off centre and growing the control past 44 pt. The count has to be a
  positioned sibling of the glyph, which also means the app has to remember to keep it out of
  the accessibility tree (`pointerEvents="none"` plus no accessible name) so a screen reader
  does not announce the number twice: once inside the button's own label and once on its own.
- Repro: `<IconButton accessibilityLabel="Thông báo"><Badge>3</Badge><AppIcon name="bell" /></IconButton>`
  in a 48 pt `AppHeader` trailing slot.
- Workaround: `src/components/shell/notification-bell.tsx` composes the glyph and an absolutely
  positioned `View` inside a fixed 24 pt box, and puts the count in the button's
  `accessibilityLabel` instead of in the badge.
- Suggested fix for BeeUI: an optional `badge?: ReactNode` (or `count?: number`) slot on
  `IconButton` that positions itself and is hidden from assistive tech, or a documented
  composition snippet on the IconButton page.

## Confirmations of already filed issues (not re-filed)

- **[#572](https://github.com/beobungbu/BeeUI/issues/572) · `TableRow` has no press handler.**
  Reproduced on `/promotions` at 1440, where selecting a programme has to load it into the edit
  pane. The row's control ends up being the name cell, so the pressable target is one cell wide
  while the row is the thing that looks clickable, and the row's whole accessible name has to be
  composed onto that one child. Same workaround as the orders and products tables.
- **[#611](https://github.com/beobungbu/BeeUI/issues/611) (comment, finding 24-04) · `TableCell`
  lays its children out in a row.** Reproduced three more times this phase: the branch code over
  the branch name on `/reports/inventory-valuation`, the product name over its SKU and cost on
  `/reports/products`, and the staff name over the order counts on `/reports/staff`. Two `Text`
  children of a cell render side by side and read as one run-on line ("HN01Tạp hoá Cầu Giấy"),
  so each of those cells now wraps its two lines in a `View`. The docs' cell examples are all
  single-child, so this is only discoverable by rendering it.

## Investigated and rejected as not BeeUI

- **A `ScrollView` given an explicit width still took half the free space.** The promotions edit
  pane is 400 pt beside the table, and at 1440 it rendered 800 pt wide, squeezing the seven
  column table to 400. This is `react-native-web`'s `ScrollView` base style (`flexGrow: 1`)
  winning over the width in a flex row, not a BeeUI component: the same happens with a bare
  `ScrollView`. Fixed in app code with `flexGrow: 0, flexShrink: 0` on the pane. Recorded here
  only so the next worker recognises the symptom.
