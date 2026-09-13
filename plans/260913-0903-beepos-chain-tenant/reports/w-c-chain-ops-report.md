# W-C · chain operations (phase 6, wave 2)

Status: DONE_WITH_CONCERNS · 2026-09-13 · worker W-C

## The failing reports spec, first

`[wide] reports and settings › custom range` failed because picking "Tuỳ chọn" adds two date
triggers to the reports toolbar, which pushes the whole filter group into W-B's `Bộ lọc` popover
at 1280; the spec then looked for `Từ ngày` in the row it had just left. The spec now goes
through `revealFilter(page, control)`, which opens the popover only when the control it wants is
not on screen and is a no-op on the phone, so one spec still covers both viewports. Every access
goes through it rather than opening the popover once, because pressing anything inside a BeeUI
popover closes it. All four reports cases pass on both projects.

## What landed

**Suppliers.** `Supplier` records with a store of their own (`src/data/supplier-store.ts`), eight
seeded partners (two switched off), and `/inventory/suppliers`: search plus a status filter in the
one toolbar row, the shared stat strip, a table from tablet up and a `ListGroup` on the phone. The
detail screen is the 480 pt form plus the partner's purchase history, which is the reason the
record exists: receipts booked against them, newest first, with the value of each. The goods
receipt form no longer has a free-text supplier field; it picks a record (`Select` from tablet up,
the searchable pushed dialog of the mockup on the phone, with "Thêm nhà cung cấp mới" inside the
flow) and stores `supplierId` with `supplierName` derived from it. The seed's six receipts are
booked against real suppliers, so a history is not empty on first open.

**Store prices.** `effectivePrice(product, storeId, overrides)` in `src/domain/catalog.ts` is the
only rule that decides which price is charged, and it takes either the rows or an index, so the
sell screen can re-price every tile per frame without scanning the rows per tile. The product
detail gained "Giá theo cửa hàng": one row per branch whether or not it prices the product itself,
with the chain price, an override input, the effective price in bold, and a source badge. The
sell screen and the cart now quote the session store's effective price; a booked line keeps the
price at sale time, so a price changed later never rewrites a bill. The seed gives 15 products a
branch price in two of the four shops, so the divergence is visible without typing anything.

**Cash in and out.** `CashMovement` records with their own store, plus a per-movement note kept
beside them (the frozen type has a `reason` and no note, so this follows `useOrderStore`'s
precedent for order notes). `recordCashMovement` writes the record and the audit line together and
tells the caller why it refused rather than doing nothing. One form for both directions and both
devices: a pushed `/pos/shift/cash` on the phone (BeeUI's `Sheet` does not present on iOS) and a
`Dialog` on desktop. The shift screen gained the five-figure strip of the mockup (float, cash
sales, cash in, cash out, expected), the movement table with a "drawer after this movement"
column, and the two actions. `shiftSummary` now takes movements and expected cash is
`float + cash sales + in - out`; `movements` defaults to empty, so every existing caller and test
reads exactly what it read before.

**Z report.** `/pos/shift/z` renders `formatZReportText` verbatim in a monospaced block rather
than laying the same figures out again in views: the paper and the screen cannot disagree because
they are the same string. It shares the receipt's print stylesheet and print path on web and the
receipt's share helper on native. `zReportTotals` is the arithmetic, tested to balance: net is
gross minus this shift's refunds, the payment mix sums to gross, expected is the drawer identity
above, and variance is counted minus expected.

**Audit log.** A closed action vocabulary in `src/domain/audit.ts` (15 actions, 8 object kinds, a
tone per action) so the log can be filtered, counted and coloured; the summary stays a sentence,
because that is what a person reads. `recordAudit` is a plain function, callable from a store
action where no hook may run, and it reads the actor off the session rather than trusting the call
site. Lines are written from POS void, refund and order discount (at checkout, where the order
finally has a code), product and store price changes, stock adjustments and count posting, cash
movements, shift open and close, staff PIN reset and invite, and sign in and sign out.
`/settings/audit` is the read-only screen: desktop table, phone list with the mockup's reversed
order, filters for staff and action, 40 seeded events across three days.

**Nav.** Nhật ký is a nav item pointing at `/settings/audit` and is placed before Settings on
purpose, because `permissionForPath` takes the first item whose href prefixes the path and a
`/settings` entry first would have demanded `settings.manage` for a screen a manager may read.
Settings also links to it. Nhà cung cấp is a sub-route: not in the sidebar, reachable from the
inventory toolbar and from the command palette, which now lists sub-routes as well as areas.

## Type contract

`src/domain/types.ts` was **not** edited: every type this wave needed (`Supplier`, `StorePrice`,
`CashMovement`, `AuditEvent`) was already frozen in it exactly as the plan specifies.

One change to request, for W-A or the coordinator: `GoodsReceipt.supplierId` is still optional and
`supplierName` still exists. Every receipt the app can now create carries a `supplierId`, and so
does every seeded one, so the field can be made required and `supplierName` dropped in favour of a
lookup. It was left alone because the contract is frozen and the file is W-A's. Two call sites
would change (`receipt-detail-screen.tsx` builds it, `receipts-list-screen.tsx` displays it).

## The defect that cost the most: BeeUI `Select`

A `Select` whose option list overflows its 320 pt cap cannot be picked with a mouse at all. The
dropdown opens, the press lands on the option, the hit test returns the option, and the value never
changes; a synthetic `click` on the same node does work, so the scroll container around the list is
swallowing the press. This is not a test artifact: a slow, deliberate mouse press fails the same
way, so a person cannot use these filters either.

It is also not new. Two of the four lists it bites were already shipped: the orders cashier filter
(13 rows) and the product category field (8 rows, one row over the line). Both are fixed here with
the same one-line prop, because a filter that silently refuses to filter is worse than a missing
one. `src/components/select-content-height.ts` is the rule: any list over seven rows tells the
dropdown how tall it needs to be, using the undocumented `maxHeight` prop. Residual limit: BeeUI
clamps that to the window, so a window shorter than the list scrolls again and the defect returns.
Every viewport this app targets (812 pt and up) fits the longest list (16 rows, 648 pt).

Filed as `docs/beeui-audit/findings-24-chain-ops.md` 24-01 (blocker), with 24-02 (the prop is
undocumented), 24-03 (`className` cannot reach the scroller), 24-04 (`TableCell` lays children in
a row), 24-05 (no monospaced text variant for a printable block) and 24-06 (no muted `Badge`).

## Measured

Toolbar band on the screens this wave added or changed, Chromium, sidebar open:

| Width | /inventory | /inventory/suppliers | /settings/audit |
|---|---|---|---|
| 1280 | band 48-105, filters collapsed | band 48-105, inline | band 48-105, inline |
| 1440 | band 48-105, filters collapsed | band 48-105, inline | band 48-105, inline |
| 1920 | band 48-105, inline | band 48-105, inline | band 48-105, inline |

Nothing wraps and nothing clips at any of the three, which is the rule. One regression against
W-B's table, stated plainly: inventory's store-scope filter now collapses at 1440 as well as at
1280, because the Nhà cung cấp action the brief asked for adds about 110 pt to a row that was 22 pt
inside the budget. If the owner would rather have the filter inline at 1440, the lever is that
button: moving Nhà cung cấp into the sidebar (which is where the mockup actually draws it) gives
the width straight back.

## Gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | pass |
| `npm test` | pass, 357 tests in 25 suites (23 new: effective price, cash in a shift, the Z report balance, the audit filter) |
| `npx eslint src app` | 0 errors, 2 warnings, both pre-existing `Array<T>` style warnings outside this scope |
| `npm run qa:e2e` | 31 passed, 3 skipped, 0 failed (includes the fixed reports spec and the new `chain-ops.spec.ts`, 4 cases x 2 viewports) |
| `npx expo export --platform all` | pass (web, ios, android) |
| Screenshots | `docs/design/after/chain-ops/{suppliers,store-prices,cash-movement,z-report,audit}-{375,1440}.png` |

`scripts/qa/e2e/specs/chain-ops.spec.ts` proves each feature by the number it moves: a supplier
created on the list screen is bookable on a receipt and appears in its own purchase history; a
branch price typed on the product detail is the price the sell tile quotes; a 300.000 đ cash-in
raises the drawer the shift expects by exactly that; the Z report renders with the float and the
movement in it; the audit filter narrows 43 events to the seed's 3 voids.

Three existing specs needed updating because a receipt no longer has a free-text supplier field:
`lib/flows.ts` gained `pickSupplier` (combobox from tablet up, dialog on the phone), and
`journey.spec.ts` and `inventory-ops.spec.ts` now pick a seeded partner.

## Concerns

1. **The `Select` defect above has a residual limit.** A browser window shorter than about 660 pt
   puts the audit action filter back into the broken state. There is no app-side fix; BeeUI has to
   stop the scroller eating the press.
2. **Cash movements are not seeded.** The one open seeded shift belongs to a random cashier, not to
   the demo owner, so seeding movements against it would have put figures on a screen the demo
   account cannot open, and seeding against a closed shift would have invented a cash variance in
   history that never happened. The shift screen and the Z report therefore start empty for a fresh
   session and fill as soon as a shift is opened, which is what the E2E and the screenshots do.
3. **The Z sheet prints at 58 mm, not the mockup's 80 mm.** It shares the receipt's print
   stylesheet, which is what the brief asked for, and that stylesheet fixes `@page` at 58 mm. The
   block is 32 columns, so it is complete on the narrower roll; widening it would mean a second
   print path and a second paper size to configure.
4. **A new chain still boots on the seeded catalogue**, and now also on the seeded suppliers,
   branch prices and audit log. This is W-A's concern 2 unchanged: the stores seed themselves from
   `src/data/seed/**`, which is stamped `org-1`. The new stores follow the same pattern as the
   existing ones, so whatever fixes it fixes them together.
5. **`recordAudit` writes nothing while signed out.** That is deliberate (there is no actor to
   name), but it means a failed sign-in attempt is not logged. If that matters for the product,
   it needs an actor-less event shape.

## Files

New: `src/domain/audit.ts`, `src/domain/__tests__/audit.test.ts`,
`src/data/{supplier-store,store-price-store,cash-movement-store,audit-store}.ts`,
`src/data/seed/{suppliers,store-prices,audit}.ts`,
`src/features/suppliers/{supplier-list-screen,supplier-detail-screen}.tsx`,
`src/features/suppliers/components/supplier-picker.tsx`,
`src/features/products/components/store-price-section.tsx`,
`src/features/pos/{cash-movement-screen,z-report-screen}.tsx`,
`src/features/pos/components/{cash-movement-form,cash-movement-dialog}.tsx`,
`src/features/pos/hooks/use-cash-movement.ts`,
`src/features/audit/audit-log-screen.tsx`,
`src/features/settings/components/audit-section.tsx`,
`src/components/select-content-height.ts`, `src/i18n/chain.{vi,en}.ts`,
`app/(app)/inventory/suppliers/{index,new,[id]}.tsx`,
`app/(app)/pos/shift/{index,cash,z}.tsx` (replacing `app/(app)/pos/shift.tsx`),
`app/(app)/settings/audit.tsx`, `scripts/qa/e2e/specs/chain-ops.spec.ts`,
`scripts/qa/e2e/specs/chain-ops-shots._discover.spec.ts`,
`docs/beeui-audit/findings-24-chain-ops.md`.

Changed: `src/domain/{catalog,pos}.ts` (the two pure rules and their tests),
`src/data/{persistence-bootstrap,session-store}.ts` and `src/data/seed/{index,operations}.ts`,
`src/components/{icons,command-palette}.tsx`, `src/components/shell/nav-items.ts`,
`src/features/pos/{pos-screen,shift-screen,checkout-screen}.tsx` and
`src/features/pos/components/{product-card,product-grid}.tsx`,
`src/features/inventory/{receipt-detail-screen,inventory-screen,adjust-stock-dialog,count-detail-screen}.tsx`,
`src/features/products/product-form-screen.tsx`,
`src/features/orders/{hooks/use-order-actions.ts,components/order-filters-bar.tsx}`,
`src/features/staff/{staff-list-screen,staff-detail-screen}.tsx`,
`src/features/settings/settings-screen.tsx`, `src/features/audit/perf-harness-screen.tsx`,
`src/i18n/{index,common.vi,common.en}.ts`, and the E2E helpers and three specs named above.
