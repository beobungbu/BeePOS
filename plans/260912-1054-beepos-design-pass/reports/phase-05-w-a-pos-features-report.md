# Phase 5 · W-A · POS features

Worker: W-A · date: 2026-09-13 · Metro port 8101 · status: DONE_WITH_CONCERNS (one scoped
limitation on item 1, one cross-worker note, both below).

## What shipped

### 1. Keyboard-wedge barcode scanner
- Pure state machine `scanBuffer(state, key, at)` in `src/domain/pos.ts` with
  `SCAN_MAX_GAP_MS = 50`, `SCAN_MIN_LENGTH = 8`, `emptyScanBuffer`. Digits closer together
  than 50 ms accumulate, a slower keystroke starts a new burst, Enter emits a buffer of 8+
  digits, any other key cancels. 7 unit tests (fast burst, 8 digit floor, human typing speed,
  burst restart, cancel on a letter, late Enter).
- `src/features/pos/hooks/use-barcode-scan.ts` binds it to `window` on the sell screen. It
  ignores the burst when a modifier is held, when focus is in `input`/`textarea`/`select`/
  contenteditable, or when any dialog is open (a scan behind a modal would add a line the
  cashier cannot see), so the search field, the note textarea and every dialog keep their own
  behaviour. It calls `preventDefault()` on the Enter that closes a scan.
- `pos-screen.tsx` looks the code up in the active catalog: a hit adds one unit through the
  existing add path, a miss shows a **warning** toast whose description is the code itself
  (`docs/design/after/features/barcode-toast-1280.png`).

### 2. Customer quick-add
- `validateCustomerDraft` + `normalisePhone` in `src/features/pos/lib/customer-draft.ts`
  (name required, 9 to 11 digits, unique by digits-only comparison so `090 123 4567` and
  `0901234567` are the same customer). 6 unit tests.
- `customer-dialog.tsx` gained a second mode behind "Thêm khách mới": name + phone in
  `Field` wrappers (so both are reachable by accessible name), an inline error line, Huỷ /
  Lưu khách hàng. It prefills the name from whatever was typed in the search box. On save it
  creates the customer, attaches it to the active order and toasts.
- **Store action added**: `createCustomer({name, phone}): Customer` in
  `src/data/customer-store.ts` (the store only had `upsertCustomer`, which makes the caller
  mint the id, the points, the tier and the timestamp). It mints a `customer-<n>` id that
  collides with neither the seed nor an earlier quick-add, and returns the record.
  W-B: this is an append-only addition to that file, the existing actions are untouched.

### 3. Naming an order
- `Cart.label?: string` in `src/domain/types.ts` (a 3 line addition to one interface; that
  file is in nobody's ownership list and the field was required by the task).
- `setLabel(cartId, label)` in `src/data/cart-store.ts`; an empty string clears back to
  "Đơn N". `clearCart` now keeps the label on purpose: "Bàn 3" is still table 3 after the
  lines are voided, and a finished sale closes its order rather than clearing it.
- `cartLabel(t, cart)` in `src/features/pos/lib/order-label.ts` is the single place that
  decides the visible name; the tab strip, cart pane header, cart route header, cart bar,
  checkout badge, the "bán tiếp" hint and the close confirmation all read it.
- Gesture: double press (web and native, timed at 320 ms rather than a web-only
  `onDoubleClick`) or long press, both opening a small Dialog "Đặt tên đơn".
- **Added `Alt+R`** as the keyboard route into the same dialog: a double click and a long
  press are both unreachable from a keyboard, so without it the feature had no accessible
  path. It is not in the direction doc's shortcut list, so W-C's shortcut help dialog does
  not list it yet.

### 4. Order discount presets
`order-discount-dialog.tsx` grew a "Mức giảm nhanh" row above the free input: chips 5%, 10%,
20% set type + value in one press, "Số tiền" switches the dialog to dong and clears the
field. The percent/amount `SegmentedControl`, the free input and the reason textarea are
unchanged, so the journey spec's path through this dialog still works.

### 5. Receipt: print on web, share on native
- `formatReceiptText` in `src/domain/pos.ts`: a 32 column (58 mm) monospaced receipt, with
  `RECEIPT_WIDTH`, name wrapping, right flush amounts and a signed discount. Every label is
  passed in, so the domain stays locale free. 5 unit tests including a width invariant over
  every row.
- `src/features/pos/lib/receipt-print.ts`: `ensurePrintStylesheet()`, `printReceipt()`,
  `shareReceipt()`. The receipt block carries `nativeID="beepos-receipt"`; the print
  stylesheet hides the rest of the app, forces the block to 58 mm black on white and, via
  one `:has(#beepos-receipt)` rule, unpins every ancestor. That rule is load bearing: the app
  renders inside relative, zero height, overflow-hidden flex boxes and without it the print
  output is a blank page (verified: it was blank before the rule, correct after).
- The screen shows one control, the one that is real on the platform: "In hoá đơn" on web
  (`window.print()`, success/failure toast), "Chia sẻ" on native (`Share.share` of the plain
  text, with the rejection handled and toasted). The two placeholder toasts that used to
  pretend both worked are gone.

### 6. E2E
`scripts/qa/e2e/specs/pos-features.spec.ts` (new file, wide project only; `lib/` and
`journey.spec.ts` untouched): wedge scan of an unknown code then a known one via
`page.keyboard.type(..., {delay: 0})` + Enter, quick-add with a rejected short phone then a
valid one, double click rename, the 10% preset, and the receipt with its print control
screenshotted under `emulateMedia({media: 'print'})`. It ends on `expect(errors).toEqual([])`.

## Files

Modified: `src/domain/pos.ts` (+180), `src/domain/__tests__/pos.test.ts` (+120),
`src/domain/types.ts` (+5), `src/data/cart-store.ts` (+18), `src/data/customer-store.ts`
(+27), `src/i18n/pos.vi.ts` / `pos.en.ts` (+19 keys each), `src/features/pos/pos-screen.tsx`,
`receipt-screen.tsx`, `cart-screen.tsx`, `checkout-screen.tsx`,
`components/{order-tab-strip,customer-dialog,order-discount-dialog,cart-panel}.tsx`,
`lib/order-label.ts`.
New: `src/features/pos/hooks/use-barcode-scan.ts`, `src/features/pos/lib/customer-draft.ts`,
`src/features/pos/lib/receipt-print.ts`,
`src/features/pos/lib/__tests__/customer-draft.test.ts`,
`scripts/qa/e2e/specs/pos-features.spec.ts`.
Screenshots: `docs/design/after/features/{barcode-toast,customer-quick-add,
order-tab-renamed,order-discount-presets,receipt-print}-1280.png`.

Not touched: any file owned by W-B or W-C, `scripts/qa/e2e/lib/*`, `journey.spec.ts`,
`src/components/**`, BeeUI packages.

## Gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm test` | 20 suites, 276 tests, green (18 of them new) |
| `npm run qa:e2e` | journey 8/8 plus `pos-features` green, 1 skipped (narrow, by design) |
| `npx expo export --platform all` | web 5.4 MB, ios 7.3 MB, android 7.5 MB, no errors |

The e2e was run against the worker's own Metro (`BEEPOS_E2E_BASEURL=http://localhost:8101`)
so three workers' suites do not fight over port 8099. One run had a flaky
`browserContext.close: ENOENT ... trace` on `journey en light`; the immediate re-run was 9/9,
so it is a Playwright trace-artifact race, not the app.

## Concerns and notes for the integrator

1. **Native wedge scanning is not implemented, by decision.** React Native exposes no global
   hardware-key event on iOS or Android, so the only JS-level option is an always-focused
   hidden `TextInput`, which fights the on-screen keyboard and steals focus from the search
   field and every dialog. On native the wedge path therefore stays the catalog search field
   (a scanner types into it and submits, which already worked). A real fix is a small native
   key-event module, which is out of scope for a prototype on Expo Go. The hook is web-gated
   and says so in its comment.
2. **`package.json` / `package-lock.json` touched briefly, then restored.** Running
   `npm run lint` turned out to run `expo lint`, which is not configured in this repo: it
   installed `eslint` + `eslint-config-expo` into devDependencies and wrote `eslint.config.js`
   before failing. Both dependency lines were removed, `eslint.config.js` was deleted, and
   `npm install --package-lock-only` regenerated the lock, which now contains zero eslint
   entries and keeps W-B's `@react-native-async-storage/async-storage`. `git diff package.json`
   is W-B's line only. **There is still no working lint script in this repo**; the phase gates
   do not include one, so it was left that way rather than adopted unilaterally.
3. **`Alt+R`** (rename the active order) is a new shortcut, not in
   `docs/design/design-direction.md` section 6 and not in W-C's shortcut help dialog.
4. **`src/domain/types.ts`** was edited (one optional field on `Cart`) although it appears in
   no worker's ownership list. If phase 0 owns it, this is the one line to re-approve.
5. `docs/design/after/features/receipt-print-1280.png` has a small dark square in the bottom
   left: Expo's dev-server error overlay lives in a shadow root, so `body *` in the print
   stylesheet cannot reach it. It does not exist in `expo export` output, and the stylesheet
   was deliberately not given a rule targeting a dev tool's id.
6. `src/features/customers/screens/customers-list-screen.tsx` (W-C's) still mints customers
   inline with `customer-${Date.now()}`; it could now call `createCustomer` from the store
   instead. Left alone, it is outside this block's ownership.

## Unresolved questions

- Should `Alt+R` join the documented shortcut set (direction doc section 6 plus W-C's help
  dialog), or should renaming stay gesture-only?
- With W-B's persistence in place, a named order now survives a reload. The direction doc
  says nothing may imply a parked bill is saved; a persisted name is closer to a parked bill
  than the ordinal was. Worth a product call before this ships beyond the prototype.
