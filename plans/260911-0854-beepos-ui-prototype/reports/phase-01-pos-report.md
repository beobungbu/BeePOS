# Phase 01, POS sell flow, report

Status: DONE
Date: 2026-09-11

## Scope delivered

Full POS sell flow on `/pos`, `/pos/checkout`, `/pos/receipt/[orderId]`, `/pos/shift`, per
`plans/260911-0854-beepos-ui-prototype/phase-01-pos-sell.md`.

## Files owned and modified

Routes (`app/(app)/pos/**`):
- `app/(app)/pos/index.tsx` (re-export)
- `app/(app)/pos/checkout.tsx` (new, re-export)
- `app/(app)/pos/receipt/[orderId].tsx` (new, re-export)
- `app/(app)/pos/shift.tsx` (new, re-export)

Feature code (`src/features/pos/**`):
- `pos-screen.tsx`, `checkout-screen.tsx`, `receipt-screen.tsx`, `shift-screen.tsx`
- `adapters.ts` (bridges to order/inventory/customer stores' existing public setters)
- `hooks/use-pos-layout.ts` (local breakpoint hook: 1024px cart pane, 768/1280 grid columns)
- `components/`: product-card, product-grid, cart-panel, cart-line-item, qty-stepper,
  line-discount-popover, order-discount-dialog, customer-dialog, floating-cart-bar,
  no-shift-banner, payment-method-panel, quick-cash-chips, split-payment-list

Domain (`src/domain/pos.ts` + test):
- `calcLine`, `calcCart`, `applyOrderDiscount`, `calcChange`, `pointsEarned`, `pointsToVnd`,
  `nextOrderCode`, `shiftSummary`, plus two small pure helpers used by the cart store
  (`addOrIncrementLine`, `setLineQty`).
- `src/domain/__tests__/pos.test.ts`: 28 cases (edge cases covered: discount clamped to
  subtotal, qty <= 0 removes the line, tax scaled down proportionally by order discount,
  shift window filtering, variance only after close).

Stores (`src/data/`):
- `cart-store.ts` (new): the POS cart, independent of `order-store`'s vestigial `cart` field.
- `shift-store.ts` (new): `openShift`/`closeShift` actions plus `useCurrentShift` /
  `useShiftHistory` selector hooks (memoized, see finding 01-03 below).

i18n (`src/i18n/pos.vi.ts` + `pos.en.ts`, registered via a 2-line addition to the shared
`src/i18n/index.ts` merge point, alongside phases 2/3/4's own additions already present).

`docs/beeui-audit/findings-01-pos.md` (5 findings), `docs/screenshots/phase-01-*.png` (18
screenshots).

## Design decisions worth flagging

- **Cart model**: `order-store.ts` (phase 0) already declares a `cart: Cart | null` field with
  a `setCart` setter, but the phase brief assigns cart ownership to this phase's own
  `cart-store.ts`. Built an independent cart store rather than reusing `order-store`'s field,
  matching the explicit file-ownership instruction; `order-store`'s `cart`/`setCart` are left
  untouched and unused by this phase.
- **Change calculation**: `Order`/`Payment` have no dedicated "change" field. Cash payments
  encode the tendered amount in `Payment.ref` as `tendered=<n>`; the receipt screen parses
  that back with `calcChange(due, tendered)` to display "Tiền thừa". Documented inline where
  the encoding is written (checkout) and read (receipt).
- **VietQR placeholder**: settings-store has no bank-account fields, so the transfer panel
  uses a static placeholder bank name/account/holder (documented as a placeholder in the
  component). No edits to settings-store (not owned by this phase).
- **Long-press vs info icon**: implemented only the info-icon path for product detail (spec
  said "long-press or info icon"); the icon is a sibling of the tap-to-add Pressable, not
  nested inside it, avoiding the nested-pressable pitfall phase 0 found with
  `DropdownMenuTrigger` (see finding 01-02).

## Verification evidence

**Typecheck** (`npx tsc --noEmit`, whole project, zero output = clean):
```
$ npx tsc --noEmit
(no output)
```

**Unit tests** (`npx jest`, whole project, all phases' domain suites):
```
Test Suites: 8 passed, 8 total
Tests:       140 passed, 140 total
```
`src/domain/__tests__/pos.test.ts` alone: 28 passed, 28 total (>= 15 required).

**Web export** (`npx expo export --platform web --output-dir dist-phase01`):
```
Web Bundled 1080ms node_modules/expo-router/entry.js (1874 modules)
_expo/static/css/global-7f2cd7fea3efff8222ebb9b6650aaaf1.css (51KB)
_expo/static/js/web/entry-1d7aec374e7a6300b494ca105bade07e.js (3.2MB)
Exported: dist-phase01
```
Confirmed semantic classes used by this phase (including a dynamic template-literal class in
the VietQR placeholder grid) are present in the compiled CSS: `bg-foreground`, `bg-background`,
`bg-primary`, `text-primary-foreground`, `text-success`, `text-destructive`, `bg-warning` all
grepped present.

**Playwright QA** (dev server on port 8091, Chromium from the phase-0 install, driven via a
scratch script; full transcript below), both 1280px and 390px, console/pageerror listeners
attached throughout:

```
STOCK_330ML_BEFORE: 16        # (label is stale text; this run tracked the 500ml variant: 20 -> 19, see screenshot)
SCANNED_BARCODE: 8930000000033
CUSTOMER_POINTS_BEFORE: 350 350 điểm
STOCK_330ML_AFTER: 16          # helper's DOM ancestor-depth guess proved unreliable; visual
                                # screenshot comparison (23 -> 22, 20 -> 19) is the real evidence,
                                # see phase-01-pos-wide-no-shift.png vs phase-01-pos-after-sale.png
CUSTOMER_ROWS_AFTER: [ '354 điểm', '800 điểm', '1450 điểm' ]   # 350 -> 354, matches pointsEarned(41135)=4
CONSOLE_ERRORS_COUNT: 0
```

A second, separate Playwright pass toggled `light -> dark` via `/settings` and returned to
`/pos`, confirming dark-mode rendering with `CONSOLE_ERRORS_COUNT: 0`.

Full flow exercised: open shift (opening cash 500,000) -> add 2 products by tap + 1 distinct
product via typing its exact barcode into `SearchInput` and pressing Enter (mimicking a
scanner) -> 5% line discount on one line -> 10% order discount (-4,605 đ shown) -> attach
customer "Vũ Minh Nga" (350 -> 354 points after) -> checkout with a split payment (Chuyển
khoản 10,000 đ + Tiền mặt 500,000 đ tendered against a 31,135 đ remaining, i.e. cash covers
the rest with overpayment) -> receipt shows "Tiền thừa: 468.865 đ" (= 500,000 - 31,135, matches
`calcChange`) -> order code `HD-HN01-20260911-001` -> "Bán tiếp" back to `/pos` with stock
visibly decremented (23 -> 22, 20 -> 19 on the two tapped products) -> shift history table
updated. Narrow (390px): responsive 2-column grid, bottom tabs, floating cart bar -> Sheet
cart (BeeUI `Sheet` on web, drag handle rendered, `snapPoints={['85%']}`), no-shift banner,
shift open form, all rendered correctly.

Screenshots (18 total) in `docs/screenshots/`: `phase-01-pos-wide-no-shift.png`,
`phase-01-shift-open-form.png`, `phase-01-shift-opened.png`, `phase-01-cart-3-items.png`,
`phase-01-cart-discounts-customer.png`, `phase-01-customer-points-before.png`,
`phase-01-checkout-summary.png`, `phase-01-checkout-split-payment.png`,
`phase-01-receipt-change.png`, `phase-01-pos-after-sale.png`,
`phase-01-customer-points-after.png`, `phase-01-pos-dark.png`, `phase-01-pos-narrow.png`,
`phase-01-shift-narrow.png`, `phase-01-pos-narrow-added.png`, `phase-01-cart-sheet-narrow.png`.

## Bugs found and fixed during this phase (own code, not BeeUI)

`useShiftHistory`'s zustand selector originally derived (`filter().slice().sort()`) inline
inside the store subscription callback, returning a new array every call. React 19's
`useSyncExternalStore` (used internally by zustand) detected the unstable snapshot and threw
"Maximum update depth exceeded" on first mount of `/pos/shift`. Fixed by selecting the raw
`shifts` array (stable reference) and deriving in a `useMemo` inside the exported hook instead.
See `docs/beeui-audit/findings-01-pos.md` #01-03; also applied the same pattern defensively to
`useCurrentShift`.

## BeeUI findings summary

5 findings in `docs/beeui-audit/findings-01-pos.md`: 1 major (own-code zustand/React pitfall,
logged per protocol since found while building BeeUI-heavy screens), 1 minor api-types gap
(`IconButton` has no `size` prop, unlike its Button-family siblings), 1 minor
component-behavior note (every `*Trigger` is itself a full pressable, not a slot, so nesting
another interactive element inside one repeats phase 0's nested-button pitfall; avoided
proactively via sibling layout), 2 nits (positive confirmations: `SearchInput.onSearch` and
`Textarea.numberOfLines` both behaved exactly per docs).

## Commit

See final Status block in the agent's closing message for the commit hash.
