# W-R report: wave-2 fixes and the wave-1 code review

Status: DONE
Date: 2026-09-13 · worker: W-R (wave 2) · branch: main (not committed)

The nine follow-ups from `plan.md` are done, the wave-1 diff (`e170aaf..HEAD`, 297 files) has
been read for the categories the brief names, and everything ranked Major or above is fixed.
All five gates are green. Ownership note at the end: W-N and W-E were editing inside `src/`
and `scripts/` at the same time, and one of their files needed a one-line change from me.

## Gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | clean, repo wide |
| `npm test` | 49 suites, 697 tests passed (was 48 / 683) |
| `npx eslint src app` | **0 errors, 0 warnings** (two pre-existing `Array<T>` warnings fixed) |
| `npm run qa:e2e` | 74 passed, 26 skipped, **0 failed**, 6.5 min (port 8131, `--output /tmp/claude-501/pw-wr6`) |
| `npx expo export --platform all` | web + ios + android bundles built |

Two tests failed in an earlier loaded run and pass standalone and in the final run:
`pos-features.spec.ts:68` (a 4 s toast expiring) and `perf.spec.ts` budgets. Three of us were
driving Metro at once; neither is a regression and both are green now.

## Part 1: the nine fixes

### 1. Second org sign-in
The switch was cosmetic. `KEY.org` was **not** org-scoped (`beepos.persist.org`), and
`useOrgStore` always seeded from the demo chain, so switching to `chuoi-demo-2` re-pointed
every *data* key while leaving chain 1's shops, staff and credentials in place; `login` then
resolved the member off `account.staffId`, which can only ever name one chain's staff record.

- `src/data/active-org.ts` (new): the active chain id, read once, with no store imports, so
  the persistence keys, the org store's seed and the login path can all reach it without a
  cycle. `setActiveOrgId` moved here; `persistence-bootstrap.ts` and the two callers follow.
- `src/data/seed/second-org.ts` (new): `Chuỗi Minh Châu` with one shop (`store-d2-1`, MC01),
  one owner staff record (`staff-d2-1`, PIN 1200) and the owner's **same** account row
  (`account-staff-1`, same email, salt and hash) re-stamped for the chain. One person, one
  credential; which staff record it works as is what the membership answers.
- `KEY.org` is now `scoped('org')` and `VERSION.org` is 3.
- `session-store.login` resolves the member through `staffIdForOrg(account, orgId)` and stamps
  the active chain on the session.

Tests: `src/data/__tests__/session-store.test.ts`, three cases (right staff record, only that
chain's tills, an account with no staff record there is turned away). `commerce-settings.spec.ts`
still passes unchanged: `orgDirectory` still reports 4 and 1 shops.

### 2. Receipt line costs vary per receipt
`src/data/seed/operations.ts`: one deterministic drift of -4 % to +5 % per receipt (a supplier
moves a price list, not one line of it), rounded to whole dong. The locked figures in
`commerce-seed.test.ts` are untouched: the receivables and payables seeds carry hard-coded
amounts and never read a receipt line's cost. Two new assertions lock the *new* property, that
receipts are priced off the catalogue cost and that the weighted average actually moves.

### 3. shell-icons folded in
`bell`, `check`, `percent`, `tag`, `wallet` moved into `APP_ICONS`; `ShellIcon` replaced by
`AppIcon` in the six shell files; `src/components/shell/shell-icons.tsx` deleted.

### 4. Supplier return debit note
`createSupplierDebitNote` on the ledger store, with the naming clash documented where it bites:
the paperwork is a giấy báo nợ, but `entrySign` gives `debit_note` **+1**, which on the supplier
side means owing *more*, so a literal `debit_note` would double the payable. The screen's
`typeof addCreditNote === 'function'` guard, its `console.warn` and its
`inventory.supplierReturns.debitNoteUnavailable` string are gone. Balances are pinned in
`src/data/__tests__/ledger-store.test.ts` against `balanceFor`, not against the `kind` string.

### 5. `Organization.taxCode?` and `Customer.billingAddress?`
Both added to `src/domain/types.ts` (contract addendum). The org tax code is seeded
(`0108452317`) and the VAT invoice prints it off the real field; the
`(organization as { taxCode?: string })` cast is gone. `billingAddress` moved off
`CustomerProfileExtra` onto `Customer`, three seeded companies now have a registered office
that differs from their delivery address, and `vatInvoiceFor` addresses the invoice to the
billing address when there is one. `VERSION.customers` bumped to 3.

### 6. Promotions apply on retail orders
`use-wholesale-pricing.ts` no longer passes `promotions: wholesale ? promotions : []`. The
stackable semantics are untouched, and the channel still decides the *base* the promotion comes
off: retail discounts the shelf price, wholesale the contract price. Two new cases in
`src/domain/__tests__/pricing.test.ts` prove both, including that an exclusive offer still wins
alone when it beats the stacked chain.

### 7. `/pos/returns?order=<code>` deep link
The order detail action carries the code. `app/(app)/pos/returns.tsx` reads the param and uses
it as the screen's remount key; `ReturnScreen` takes `orderCode` and resolves it in lazy
`useState` initialisers. No effect and no setState-in-effect: the app area renders through a
`Slot`, so arriving again with a different code would otherwise leave the previous order's
half-built draft on screen.

### 8. `.tmp-shots`
Added to `jest.testPathIgnorePatterns` and to `.gitignore` (W-E added the same ignore line
independently; I removed the duplicate and kept one comment).

### 9. W-I open decisions, decided and implemented
1. **Credit note on an exchange = the net owed back.** `createCreditNote` takes an optional
   amount, defaulting to the goods value; the return screen passes `exchange.refundDue`.
   Crediting the gross handed an on-account buyer the replacement goods for nothing.
2. **PO code shape `PO-<storeCode>-<yyyymmdd>-<seq>`** (`PO-HN01-20260913-001`). The branch is
   in the code because a supplier reads it off the delivery note; the sequence runs per branch
   per day. `nextPurchaseOrderCode` takes a store code, the seed and the lib test follow, and
   one regex in `commerce-inventory.spec.ts` had to follow too (see ownership note).
3. **CSV import stays at `/inventory/import`.** The screen writes stock as well as products, so
   it belongs with stock; the route is already in `SUB_NAV_ITEMS` and guarded.

## Part 2: review of the wave-1 diff, ranked

Severity, then `file:line`, the one-line fix, and whether I applied it.

### High

| # | Where | Problem and fix | State |
|---|---|---|---|
| H1 | `src/data/persistence-bootstrap.ts:106`, `src/data/org-store.ts:70`, `src/data/session-store.ts:96` | The org switch changed nothing an owner could see: unscoped org slice, demo-chain seed, staff off `account.staffId`. Scope the key, seed from `activeOrgId()`, resolve through `OrgMembership`. | **Fixed** |
| H2 | 22 files importing `stores` / `staff` / `organization` from `src/data/seed` | A screen that reads the seed instead of the org store shows chain 1's branches and staff in chain 2. Swap for `useOrgStore((state) => state.stores)`. | **Partly fixed** |
| H3 | `src/features/inventory/supplier-return-detail-screen.tsx:176` | `typeof addCreditNote === 'function'` with a warn-and-toast fallback for a store action that always exists, booking a raw `credit_note` whose name contradicts the paperwork. Named action, no guard. | **Fixed** |
| H4 | `src/lib/csv-import.ts:278`, `src/features/inventory/csv-import-screen.tsx:303` | The one place the app takes a file of unknown size from outside it had no ceiling: every row is validated and rendered. `MAX_IMPORT_ROWS = 5000`, `droppedRows` on the preview, a warning band on the screen. | **Fixed** |
| H5 | `src/features/returns/return-screen.tsx:224` | An exchange credited the gross value of the returned goods, so an on-account buyer kept the replacement for free. Credit `exchange.refundDue`. | **Fixed** |

H2 detail. I fixed the six screens where a document can be **written** to a branch, because
those are the ones that can book a receipt, a count, a transfer, a purchase order, a supplier
return or a stock import to another chain's shop: `purchase-order-detail-screen`,
`supplier-return-detail-screen`, `receipt-detail-screen`, `transfer-detail-screen`,
`count-detail-screen`, `csv-import-screen`. Left, as read-only name lookups, for whoever picks
up the chain-2 polish: `product-stock-table`, `product-lots-section`, `inventory-screen`,
`receipts-list-screen`, `transfers-list-screen`, `counts-list-screen`,
`purchase-orders-list-screen`, `supplier-returns-list-screen`, `expiring-screen`,
`orders-list-screen`, `order-detail-screen`, `vat-invoice-screen`, `cart-panel`,
`customers-list-screen`, `customer-detail-screen`. Each is one import line.

### Medium

| # | Where | Problem and fix | State |
|---|---|---|---|
| M1 | `src/features/reports/category-report-screen.tsx:23`, `src/features/notifications/notifications-screen.tsx:60` | Both memos bake a translated string into their result and then exclude `t` from the deps behind a suppression whose stated reason is wrong: a language switch does not change `notifications` or `period.orders`, so "Khác" and "Hôm nay" kept the old language. Hoist the label; depend on `locale`. | **Fixed** |
| M2 | `src/features/reports/components/period-filter.tsx:33` | `Intl.DateTimeFormat('vi-VN')` pinned the locale on one chip, and read local-time parts off a UTC-anchored custom range, so the chip prints the previous day west of Greenwich. Format from the same UTC parts the calendar wrote. | **Fixed** |
| M3 | `src/features/pricing/screens/price-list-detail-screen.tsx:68` | `products.find` per row *and* inside the sort comparator, so every keystroke walks the catalogue O(n log n) times, behind an exhaustive-deps suppression. Index once into a `Map`. | **Fixed** |
| M4 | `src/features/orders/screens/vat-invoice-screen.tsx:103` | `(organization as { taxCode?: string }).taxCode` widened a type to read a field that did not exist. Add the field. | **Fixed** |
| M5 | `src/data/customer-store.ts:12` | The VAT billing address lived in a store-local `CustomerProfileExtra`, outside the type contract, so the invoice was addressed to the delivery address. Move it onto `Customer`. | **Fixed** |
| M6 | `src/data/active-org.ts:20`, `src/data/persist.ts:271` | **Native org switch cannot work.** The scope is read with `getItemSync`, which only the web storage implements, so a relaunch always comes back on the demo chain while the UI has told the owner otherwise. Needs an async read before the slices are registered (a pre-boot await in `app/_layout.tsx`). Left: `persist.ts` is W-N's this wave. | Left |
| M7 | `src/i18n/reports.*.ts:115`, `src/i18n/money.*.ts:99` | Two dictionaries for the same five aging buckets, already drifted (`1 - 30 ngày` vs `1-30 ngày`). Consolidate onto one namespace. Left: the rename touches strings the E2E asserts on, which is W-E's file this wave. | Left |
| M8 | `app/(app)/audit/index.tsx`, `app/(app)/audit/perf.tsx` | `permissionForPath` resolves nothing for `/audit`, so any signed-in cashier who types the URL gets the component and perf harnesses. One `SUB_NAV_ITEMS` entry at `settings.manage` closes it. Left: `src/features/audit` is W-E's this wave, and the harness routes are what their specs drive. | Left |
| M9 | `src/features/money/screens/receivables-screen.tsx:96` | The five-bucket aging sum is written out by hand rather than reusing `agingTotals`. It cannot reuse it directly (it sums the *filtered* rows), and it is the only caller, so extracting a helper for one call site is the abstraction the brief warns against. | Left |

### Low

| # | Where | Note | State |
|---|---|---|---|
| L1 | `src/features/reports/valuation-report-screen.tsx:236` | `shortDate` (`13/08` for bar labels) is a real second format, not a duplicate, but belongs beside `percentLabel` in `reports/lib/format.ts`. | Left |
| L2 | `src/features/money/screens/cash-book-screen.tsx:148` | Exhaustive-deps suppression for two closures. Unlike M1 the dep array does list every slice they read, so only search *matching* could lag a language switch. | Left |
| L3 | `.gitignore` | Two `.tmp-shots` entries after W-E and I both added one. | **Fixed** |
| L4 | `src/data/seed/operations.ts:66`, `src/features/orders/components/order-list-group.tsx:88` | The two standing `Array<T>` lint warnings. | **Fixed** |

### Categories the brief named that came back clean

- **Concurrency and async ordering.** No in-place mutation of any store array anywhere in
  `src/` (`[...x].sort()` throughout); no store write inside a render; no promise whose
  rejection is unhandled. `handleComplete` in the return screen orders its writes deliberately
  and says why.
- **Effects setting state.** `react-hooks/set-state-in-effect` is on and reports zero. It
  caught my own first attempt at fix 7, which is why that one ended up as a remount key.
- **A11y labels.** All 13 `IconButton` uses carry an `accessibilityLabel`; the period chips
  carry `accessibilityRole="radio"` with `accessibilityState`.
- **Hard-coded strings.** No Vietnamese text node outside the dictionaries. vi/en parity is
  locked by `dictionary-parity.test.ts`, which still passes after I removed two now-dead keys
  from both sides.
- **Permission guards.** Every route under `app/(app)` except the two audit harnesses resolves
  to a permission through `permissionForPath` (checked by enumerating the route tree against
  `NAV_ITEMS` + `SUB_NAV_ITEMS`). `/pos/returns` correctly costs `pos.refund` rather than
  `pos.sell`, because `SUB_NAV_ITEMS` is searched first.
- **Lists without `FlatList`.** Only the POS product grid virtualises, and it is the only list
  that needs to: the report cuts cap rows (`ROW_LIMIT`), the money screens are per party, and
  the perf spec drives 1000 receivables and 500 cash rows inside budget.
- **Data exposure.** The persisted session blanks the PIN and the credential fields. No
  `console.*` call anywhere logs a password, a PIN or a hash.

## Files

Created: `src/data/active-org.ts` · `src/data/seed/second-org.ts` ·
`src/data/__tests__/ledger-store.test.ts` · this report.

Deleted: `src/components/shell/shell-icons.tsx`.

Modified, by area: shell icons (7) · org and session (`active-org`, `org-store`,
`session-store`, `persistence-bootstrap`, `org-switch`, `onboarding-screen`) · seed (`org`,
`customers`, `operations`, `memberships`, `index`, `purchasing`) · types and customers
(`types.ts`, `customer-store`, the four customer form files) · returns (`return-screen`,
`ledger-store`, `app/(app)/pos/returns.tsx`, `order-detail-screen`) · inventory (six write-path
screens, `purchase-orders.ts`, `csv-import.ts`, `csv-import-screen`) · pricing
(`use-wholesale-pricing`, `price-list-detail-screen`) · reports (`category-report-screen`,
`period-filter`) · notifications (`notifications-screen`) · POS (`pos-screen`, `build-order`) ·
i18n (`inventory`, `returns`) · tests (6 files) · `package.json`, `.gitignore`.

## Ownership note

My brief said I was the only worker inside `src/` and `app/`. In practice W-N was editing
`src/data/persist.ts`, `src/features/pos/hooks/use-barcode-scan.ts` and adding `src/native/`,
and W-E was editing `scripts/qa/e2e/**`, `package.json` and `.gitignore`, throughout my window.
Consequences worth knowing:

- I wired `useBarcodeScan`'s new return value into `pos-screen.tsx` at the coordinator's
  request, and did not touch any W-N file.
- I changed **one line** in `scripts/qa/e2e/specs/commerce-inventory.spec.ts:153`: the
  `openLastPurchaseOrder` regex `/^PO\d{6}-\d{3}$/` cannot match the new PO code shape. No
  label in `scripts/qa/e2e/lib/labels.ts` changed.
- M6 and M8 above are left precisely because they sit in files those two own this wave.

## BeeUI findings

None to file. Nothing in this work needed a BeeUI patch or a workaround, so
`docs/beeui-audit/findings-29-review.md` is not created.

## Plan status and recommended next steps

Every row of the "Wave 1 integration follow-ups" section of `plan.md` is done, and both W-I
open-decision items plus the two W-P type additions are closed. I have not edited `plan.md`.
Recommended for the wave-3 integrator:

1. Mark the follow-up list closed and record the three decisions (net credit note, PO code
   shape, CSV route) in the plan's decision log rather than leaving them in a report.
2. Take M6 (native org switch) as a real item or state in the spec that the switch is web-only.
   Today the screen tells a native owner the change applies at the next launch, and it does not.
3. Take M8 (audit harness routes unguarded) with W-E, who owns the specs that drive them.
4. Finish H2 by swapping the remaining 15 seed imports for the org store before the second
   chain is shown to anyone.
5. Re-run `perf.spec.ts` on an otherwise idle machine before reading its numbers; it missed
   budget twice while three workers shared Metro and passes cleanly on its own.

## Unresolved questions

1. Should the second chain seed carry any catalogue at all? It is deliberately empty today, so
   the owner switching into it sees onboarding-shaped screens. If the demo wants it to look
   like a working shop, that is a seed of its own and a wave-3 decision.
2. M7: which of the two aging dictionaries survives? Consolidating means renaming keys the E2E
   asserts on, so it wants W-E in the room.
