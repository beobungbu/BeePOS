# Findings 26 · W-M (money: cash book, receivables, payables, debt summary, cost history)

Phase: `plans/260913-1115-beepos-commerce-program/plan.md`, rows C and D.
Surface exercised: `Table`/`TableRow`/`TableHead`/`TableCell`, `Select`/`SelectTrigger`/
`SelectValue`, `Dialog`/`DialogFooter`, `Field`, `Badge`, `ListItem`, `SegmentedControl`,
`EmptyState`, on `react-native-web` at 375 and 1440, light theme.

Nothing in the published packages was patched. Each entry names the workaround that is in app
code today. Two candidates were investigated and rejected as not-BeeUI; they are recorded at the
end so the next worker does not re-open them.

### 26-01 · `SelectValue` renders nothing at all when the bound value is the empty string

- Area: dx / bug
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/components/select/>
- Expected (per docs): the documented usage is `<SelectTrigger><SelectValue /></SelectTrigger>`,
  which is what every existing BeePOS screen writes. A select that has not been chosen yet is
  the normal first state of a form field, so the trigger should show something.
- Actual: with `value=""` the trigger paints an empty box the same height as an `Input`. There is
  no built-in "choose one" affordance and no visual difference between "nothing selected yet"
  and "selected an option whose label is blank". The accessible name of the trigger is then the
  `accessibilityLabel` alone, so a screen reader announces the field with no value and no hint
  that a choice is outstanding.
- Repro: `/money/receivables`, open `Thu nợ`, switch `Hình thức` to `Chuyển khoản`: the
  `Tài khoản nhận` select is blank until an account is picked. Same on `/money/cashbook` ->
  `Nộp ngân hàng`, and on the credit note dialog's customer select.
- Workaround: pass `placeholder` explicitly on every select that can start empty
  (`src/features/money/components/{settlement-dialog,deposit-dialog,ledger-note-dialog}.tsx`).
  The prop exists and types cleanly; it is simply not in the documented snippet.
- Suggested fix for BeeUI: either default `placeholder` to something, or show the documented
  empty state in the Select docs so the plain `<SelectValue />` snippet is not copied into forms
  that start unset. Worth noting that the pre-existing BeePOS selects only survive this because
  they are always constructed with a value already chosen.

### 26-02 · `Badge variant="outline"` is visually indistinguishable from a disabled text input

- Area: design
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/components/badge/>
- Expected (per docs): a badge is a compact status marker; `outline` is the neutral variant used
  where `success` / `warning` / `destructive` would over-state the case.
- Actual: at 1440 the outline badge renders as a wide, low-contrast rounded rectangle with input
  sized padding. Placed in a table cell next to money columns it reads as an empty form field
  rather than as a status word: in `docs/design/after/commerce/cost-history-1440.png` the
  `Tồn đầu kỳ` badge looks like a disabled `Input` holding the text. The filled variants
  (`success` on `Phiếu nhập` in the same column) do not have the problem, so within one column
  two rows look like two different kinds of control.
- Repro: `/money/cost/product-1` (source column), `/money/payables` (status column, rows that are
  not overdue), `/money/cashbook` (kind column, `Bán hàng` rows).
- Workaround: none applied. The badge still carries a word, so the meaning is not lost and the
  direction doc's rule ("status is always a badge with a word, never a bare colour dot") holds.
  Left as is rather than swapping in a bespoke pill, which would fork the badge vocabulary.
- Suggested fix for BeeUI: tighten the outline variant's horizontal padding and darken its border
  to `border-border-strong`, so it reads as a marker rather than as a field.

### Investigated and rejected

- **Horizontal `ScrollView` claiming free height inside a flex column.** The money area's tab row
  left a ~150 pt gap under itself. This is `react-native-web`'s flex default on `ScrollView`, not
  a BeeUI component: fixed with `style={{ flexGrow: 0, flexShrink: 0 }}` in
  `src/features/money/components/money-nav.tsx`. No finding filed.
- **No way to mark a totals row inside `Table`.** `TableRow` does accept `className` and
  `TableFooter` is exported, so the tinted totals row of the mockups is one class
  (`bg-surface-muted`) and needs no workaround. Verified by compiling both forms. No finding
  filed.
