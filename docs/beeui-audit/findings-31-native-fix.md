# Findings 31 · from fixing the phase 7 native defects

Worker P7-fix · 2026-09-13 · BeeUI `0.86.2-rc.1` · react-native-web 0.21.2 and iOS 18.6
(iPhone 16 Pro simulator, dev client). Raised while fixing P7-01 to P7-10 from
`plans/260913-1115-beepos-commerce-program/reports/w-n-native-report.md`; the BeePOS side of
each is in `plans/260913-1115-beepos-commerce-program/reports/p7-native-fix-report.md`.

Deduped against `docs/beeui-audit/findings-*.md`: `Table` appears in 05, 19 and 26 (column
widths, density, sticky header) and `SegmentedControl` in 02, 11, 13, 14, 17, 28 and 30; the
entry below is not one of those.

### 31F-01 · `Table layout="stacked"` drops the row grouping
- Area: a11y / component-behavior
- Severity: minor
- Source consulted: https://beeui.beemvp.com/docs/components/table ("Set `'stacked'` to render a
  card/label-value presentation instead, typically driven by the caller's own breakpoint
  decision"; the label-value pairing comes from each `TableHead`'s `label`).
- Expected (per docs): stacked is a *presentation* of the same table. A row is the unit a person
  reads a table by, so the cells of one record should stay grouped as a row however they are
  laid out; the docs say nothing about the semantics changing.
- Actual: in stacked mode the cells of a record are no longer inside a row element. Measured on
  react-native-web at 390 pt on the returns line table: with `layout="scroll"` each line renders
  as a `<tr>` containing the product name and that line's quantity field, so a row-scoped query
  finds both; with `layout="stacked"` the same query finds nothing, and the quantity field of a
  line can no longer be addressed through the line it belongs to.
- Repro:
  ```tsx
  <Table layout="stacked">
    <TableHeader><TableRow><TableHead label="Sản phẩm">Sản phẩm</TableHead>
      <TableHead label="Trả">Trả</TableHead></TableRow></TableHeader>
    <TableBody><TableRow>
      <TableCell label="Sản phẩm"><Text>Bia Saigon</Text></TableCell>
      <TableCell label="Trả"><Input value="0" /></TableCell>
    </TableRow></TableBody>
  </Table>
  ```
  then, on web, `document.querySelectorAll('tr')` -> none, and an end-to-end query of the shape
  `getByRole('row').filter({ hasText: 'Bia Saigon' }).getByRole('textbox')` times out. The same
  query passes against `layout="scroll"`.
- Impact on BeePOS: the returns line table (P7-07) needed a phone layout. `layout="stacked"` was
  the first attempt and was backed out for this: it silently broke the row-scoped steps of an
  existing end-to-end spec, and what a test addresses by row is what a screen reader user reads
  by row. The phone layout is now three columns of a real table instead, with the reason and the
  disposition moved under the product name in the first cell
  (`src/features/returns/return-screen.tsx`).
- Workaround: keep `layout="scroll"` and vary the columns per breakpoint, as above.
- Suggested fix for BeeUI: keep the row element (or an explicit `role="row"`) around each
  record's cells in stacked mode, and state the semantics in the docs either way. A caller
  cannot tell from the prop that the row disappears.
- Evidence: `docs/screenshots/web-p7-fix-07-returns-phone.png` (the three column phone layout
  that replaced it), and the two end-to-end runs in the report named above.

## Confirmed again, already filed

- **30N-01** (`SegmentedControlItem` breaks its label mid-word) reproduces on the **cart line**
  unit selector as well as on the product tile, at full phone width rather than in a 160 pt
  tile: 402 pt, three units, and "thùng 24" still wraps to two lines
  (`docs/screenshots/ios-p7-fix-02-wholesale-cart.png`). No new entry; the same cause.
- **30N-02** (a labelled `Input` stops exposing its value) is why the customer rows of the POS
  picker now carry the phone number as `accessibilityValue` rather than folding it into the
  label: the label is what the row is searched by. Nothing new to report on the component.

## Not a BeeUI problem, recorded so it is not re-filed

The three majors of this pass (P7-02 wholesale cart layout, P7-04 cash-in recording nothing,
P7-05 the unreachable shift screen) were all BeePOS bugs: a flex column that gave its list no
room, a submit button behind the software keyboard on a screen with no keyboard handling, and a
missing entry point. `Table`, `SegmentedControl`, `Input`, `Chip`, `Dialog` and `EmptyState` all
behaved as documented while they were fixed, `EmptyState`'s `action` slot included.
