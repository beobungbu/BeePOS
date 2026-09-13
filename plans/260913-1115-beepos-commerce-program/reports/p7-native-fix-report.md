# P7 native defect fix · P7-01 to P7-10 plus the two product decisions

Worker P7-fix · 2026-09-13, 16:19 to 18:05 · nothing committed.
Input: `reports/w-n-native-report.md` section 6. Device: iPhone 16 Pro, iOS 18.6 (402 x 874 pt),
the dev client W-N left installed, Metro on 8136. Web on 8135.

Driver note: the macOS session was **unlocked** this time
(`CGSessionCopyCurrentDictionary` has no `ScreenIsLocked` key), so Maestro was not needed and
would not have run anyway (no Java runtime on this machine). The simulator was driven with
CGEvent taps mapped through the Simulator window's accessibility frame plus
`xcrun simctl io screenshot` / `openurl` (`scratchpad/simdrive.py`), which gives real taps,
real scrolls and the software keyboard.

## 1. FIXED / LEFT

| id | severity | state | what was done |
|---|---|---|---|
| P7-01 | minor | **FIXED** | `AuthLayout` scrolls and clears the keyboard, so login (and forgot-password, change-password, the store and till pickers, which share the frame) can be submitted with the keyboard up. Proven on device: `ios-p7-fix-01-login-keyboard.png`. |
| P7-02 | **major** | **FIXED** | Wholesale cart lines are editable on a phone again: the unit selector and the stepper are reachable and the totals stay pinned. Proven on device, including a `+` tap that took the line to 2 x 9.000: `ios-p7-fix-02-wholesale-cart.png`. |
| P7-03 | minor | **FIXED** | The four form screens (shift, cash, checkout, auth) use one `FormScrollView` with `keyboardShouldPersistTaps="handled"`: the first tap now presses the button instead of only dismissing the keyboard. |
| P7-04 | **major** | **FIXED** | Root cause below. A single tap with the keyboard up now records: `ios-p7-fix-04a-cash-submit-above-keyboard.png`, `ios-p7-fix-04b-cash-recorded.png` (Thu khác 1.000.000 -> 1.500.000, 2 -> 3 giao dịch, két 1.513.200 -> 2.013.200). Covered by a store test (6 cases) and a new phone-and-desktop E2E. |
| P7-05 | **major** | **FIXED** | Two standing entries: a shift chip in the POS header strip on phone and tablet (`ios-p7-fix-05-shift-chip.png`) and "Ca làm việc" in the Thêm menu (`ios-p7-fix-05b-more-menu-shift.png`, and it navigates). Desktop keeps its existing path. |
| P7-06 | minor | **FIXED** | One `openShiftOn(shifts, storeId, registerId)` in `domain/pos.ts` answers "is a shift open on this till". The register picker and the sell screen both read it, and a shift held by another cashier is now named on the sell screen ("Ca của {name} từ {time}") instead of being reported as "Chưa mở ca". |
| P7-07 | minor | **FIXED** | The returns line table is three columns under 768 (product with its reason and disposition, quantity, amount). Measured at 390: **0 controls outside the viewport**, was the "Xử lý" control at x 387-443. `web-p7-fix-07-returns-phone.png`. |
| P7-08 | minor · a11y | **FIXED** | The Z report roll carries a composed label: order count, revenue, discount, refunds, net, each method that moved, float, cash sales, cash in, cash out, expected, counted, variance. Built from the same `zReportTotals` the roll prints, so the two cannot drift. |
| P7-09 | nit · a11y | **FIXED** | `PinDots` is one element with `accessibilityValue` "2 trên 4 chữ số" (vi) / "2 of 4 digits" (en). How many digits, never which. |
| P7-10 | nit · a11y | **FIXED** | Cart quantity carries `accessibilityLabel` "Số lượng"; customer rows carry the phone number as `accessibilityValue` (see the note in section 4). |
| decision 1 | product | **DONE** | A chain that is not the demo chain starts with an empty catalogue and empty stock, and the POS and products screens offer "Nhập sản phẩm từ CSV" -> `/inventory/import` and "Thêm sản phẩm" -> `/products/new`. `web-p7-fix-empty-chain-pos.png`. |
| decision 2 | product | **DONE** | `setActiveOrgId()` is `async` and awaits its write; `switchOrg()` awaits it before the session is dropped, and the avatar menu navigates in the `.then`. |

Nothing from the ten is left open. What is left, and is **not** part of this brief, is in section 6.

## 2. P7-04: what it actually was

The store was never the problem. Three measurements, in this order:

1. **Store level.** Signed in, opened a shift, called `recordCashMovement` and read it back
   through `movementsInShift` and `shiftSummary`: recorded, correct chain, correct shift,
   `cashIn` 500.000, `expectedCash` 1.000.000. The path W-N suspected is sound.
2. **Web, phone viewport (390).** The pushed `/pos/shift/cash` route, filled and submitted with
   Playwright: "Thu khác +500.000 đ, 1 giao dịch". Sound there too.
3. **Device.** Cash-in of 500.000 taken **from the quick-amount chip** (no keyboard): recorded.
   The same cash-in **typed into the amount field**: the numeric keypad covers the bottom half
   of the screen, the record button is entirely behind it, the screen does not scroll, and
   `keyboardShouldPersistTaps` defaults to `never`, so a tap aimed at the button lands on a
   keyboard key and a tap that does reach the scroll view is spent dismissing the keyboard.

So P7-04 is P7-01 and P7-03 on the screen where they cost money: the till accepts an amount,
shows the drawer it is about to hold, and has no reachable way to commit it. That also explains
the "form clears as if it had worked" symptom, which is what a driver reports when it taps a
covered element and the screen is then re-entered.

The fix is `src/components/form-scroll-view.tsx`, used by the cash, shift, checkout and auth
screens. It uses `automaticallyAdjustKeyboardInsets` rather than a `KeyboardAvoidingView`:
measured on the device, a `KeyboardAvoidingView` here under-corrects by exactly the height of
the shell above it (safe-area inset plus store header), because its `onLayout` frame is relative
to its parent while the keyboard frame is in screen coordinates. That is the
`keyboardVerticalOffset` every screen would otherwise have to pass and keep correct; UIKit
already knows the answer.

**One real store defect did come out of writing the test**: `cash-${Date.now()}` gave two
movements booked in the same millisecond the same id, and the note, the running drawer figure
and the row key are all keyed by it. Now `cash-<count>-<ms>`, as `inventory-store` already did.

## 3. Why the existing E2E passed, and what was added

`commerce-reconciliation.spec.ts` does assert the drawer (`before + CASH_IN`), and it is right
to. It could not see P7-04 for two reasons: it is skipped unless `project.name === 'wide'`, and
on desktop the cash sheet is a **dialog over the shift screen**, not the pushed
`/pos/shift/cash` route a phone gets. The phone route had no coverage at all.

Added `scripts/qa/e2e/specs/shift-cash.spec.ts` (new file; `scripts/qa/e2e/**` belongs to W-E,
so nothing there was edited). It runs on **both** projects, books a cash-in and a cash-out
through whichever shape the viewport gets, and asserts four things each time: Thu khác, Chi
khác, the transaction count, and the expected drawer, plus that both figures reach the Z report
roll. It passes on narrow and wide. It does **not** reproduce the native cause (the web has no
software keyboard); what it pins is the phone route's submit path.

## 4. Two judgement calls worth reviewing

- **P7-07 is not `layout="stacked"`.** That was the first attempt and was backed out: measured
  on web, a line's quantity field is then no longer inside a row element, which silently broke
  the row-scoped steps of `commerce-inventory.spec.ts` at the phone frame and takes the same
  grouping away from a screen reader. Filed as 31F-01. The phone layout is a real three column
  table instead.
- **P7-10, customer rows.** The phone number is announced through `accessibilityValue`, not by
  folding it into the label. Composing it into the label changes the row's accessible **name**,
  which is what the picker is searched by on screen and in three existing specs. iOS VoiceOver
  reads label then value, so the reported gap is closed where it was reported; on the web the
  value is less reliably announced, which is the cost of keeping the name stable.
- **P7-06 keeps `useCurrentShift()` as the cashier's own shift.** Cash movements, the Z report
  and closing still belong to the shift the cashier opened. Only the *statement* on the sell
  screen became register-scoped, because that is the one the register picker contradicted.
  Making `useCurrentShift()` register-scoped instead would hand every session the seeded open
  shift on Quầy 1 at Cầu Giấy and change what a dozen specs measure; that is a product decision,
  not a defect fix.

## 5. Files

New: `src/components/form-scroll-view.tsx`, `src/features/pos/components/shift-chip.tsx`,
`src/data/chain-seed.ts`, `src/data/__tests__/cash-movement-store.test.ts`,
`scripts/qa/e2e/specs/shift-cash.spec.ts`, `docs/beeui-audit/findings-31-native-fix.md`,
eight screenshots.

Modified (30): the four form screens and `auth-layout`; `cart-panel`, `product-grid`,
`qty-stepper`, `customer-dialog`, `pos-screen`, `shift-screen`, `z-report-screen`,
`cash-movement-screen`, `checkout-screen`; `return-screen`; `select-register-screen`,
`pin-pad`; `domain/pos.ts`, `data/shift-store.ts`, `data/cash-movement-store.ts`,
`data/catalog-store.ts`, `data/inventory-store.ts`, `data/persistence-bootstrap.ts`,
`data/active-org.ts`, `features/settings/lib/org-switch.ts`; `components/icons.tsx` (a `clock`
icon), `shell/nav-items.ts`, `shell/more-sheet.tsx`, `shell/shell-header.tsx`;
`products/product-list-screen.tsx`; four i18n files, vi and en key for key.

The E2E suite also rewrote its own evidence screenshots under `docs/design/after/**` and
`docs/screenshots/e2e-*`, as it does on every run.

## 6. Gates

| gate | result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm test` | 52 suites, **706** tests passed (6 new) |
| `npx eslint src app` | 0 errors, 0 warnings |
| `npm run qa:e2e` | **78 passed**, 26 skipped, 0 failed (5.7 min); was 76 before, plus the two new ones |
| `npx expo export --platform all` | 0 errors, web + iOS + Android bundles written |

The first full E2E run of this pass had 6 failures, all mine and all fixed before the run above:
five from the customer-row label change and one from `layout="stacked"`, both in section 4. The
run quoted here is the one after the last source edit.

## 7. Left open (not in this brief)

1. A non-demo chain still inherits the demo chain's **orders, customers, suppliers, price lists
   and the 14 unread notifications**. Only the catalogue and stock were in scope. The
   notification bell reads "9+" in an empty chain, which is the visible half of it.
2. Android is unverified: no device in this pass. The keyboard fix is iOS-only by construction
   (Android resizes the window itself); `FormScrollView` says so.
3. The native scanner still needs `enabled={false}` while a non-form modal is open (W-N's
   question 3). Untouched: it is `pos-screen.tsx`'s call and was not in this brief.
4. `keyboardDismissMode="interactive"` is on the form screens. It is the iOS convention, but it
   means a downward drag on the cash sheet pushes the keyboard away; worth a look on a real
   device by someone who will use it all day.

## 8. Machine state

Simulator booted, app on the demo chain at HN01 / Quầy 1, unlocked, shift open with three cash
movements (drawer 2.013.200 đ) and a two-line wholesale order parked. **"Connect Hardware
Keyboard" was turned off** to get the software keyboard and has been turned back on. Metro on
8136 and the web dev server on 8135 are both still up. `dist/` holds a fresh export. Nothing
committed.
