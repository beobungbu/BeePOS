# W-M report: money (cash book, receivables, payables, debt summary, banks) and cost

Status: DONE_WITH_CONCERNS
Date: 2026-09-13 · worker: W-M (wave 1) · branch: main (not committed)

Rows C and D of the program are built, plus the credit note half of row E. Five money screens
live under `/money`, the cost history component is exported for the product detail, and the four
API names other workers were told to call all exist. My own gates are green; two of the shared
gates carry failures that are not mine (listed under Gates).

## 1. API other workers must call (exact names)

### W-I, goods receipt confirm (cost side of row C)

```ts
import { useCostingStore } from '../../data/costing-store';
useCostingStore.getState().applyReceipt(receipt);          // the call you were told to make
```

`applyReceipt(receipt, onHandFor?)` now takes **one argument**. Notes that matter:

- **Order does not matter.** Call it before or after `receiveGoodsReceipt(receipt.id)`. With no
  resolver passed it reads `useInventoryStore` and, when the receipt already reads `received`,
  subtracts the receipt's own quantities back out, so the weighted average is always blended
  against the stock that was there *before* the delivery.
- **Calling twice is a no-op.** A receipt that already has a `source: 'receipt'` cost row with
  its id writes nothing and returns `[]`, so a double-tapped confirm cannot blend one delivery
  in twice.
- It returns `CostUpdate[]` (`{ productId, storeId, previousCost, unitCost, qty }`), which is
  what you want if you show a toast or write an audit line.
- A plain-function form exists for screens that hold no hook:
  `import { applyReceiptCost } from '../../data/costing-store'; applyReceiptCost(receipt);`

### W-I, return flow (credit note, row E)

```ts
import { useLedgerStore } from '../../data/ledger-store';
useLedgerStore.getState().createCreditNote(customerId, returnRecord);   // -> LedgerEntry | null
```

Takes the `ReturnRecord` you just wrote and nothing else: org, branch, staff, amount
(`record.refundAmount`) and `createdAt` all come off the record, and the entry is booked
`kind: 'credit_note'`, `refType: 'return'`, `refId: record.id`. Returns `null` for a
non-positive amount. It lowers the customer's receivable balance immediately, so the
`/money/receivables` aging and the customer detail debt block both move without any other call.

### W-I, product detail "Giá vốn" tab (one line)

```tsx
import { ProductCostHistory } from '../money/components/product-cost-history';
// inside the tab body, nothing else needed:
<ProductCostHistory productId={product.id} />
```

It takes only the product id: it owns its own branch selector, stat strip, seven column table,
formula panel and the cost-snapshot panel. It is already reachable on its own route at
`/money/cost/<productId>`, which is what my E2E asserts, so the tab insertion can land later
without breaking anything.

### W-S, gross profit from the snapshot (row C)

```ts
import { productGrossProfit, grossProfitTotals, lineRevenue, lineBaseQty, marginPercentOf }
  from '../money/lib/gross-profit';

const rows = productGrossProfit(ordersYouCountAsRevenue);   // ProductProfitRow[], best profit first
const totals = grossProfitTotals(rows);                     // { revenue, cogs, profit, marginPercent }
```

`ProductProfitRow` is `{ productId, qty, revenue, cogs, profit, marginPercent }`. Cost comes from
`lineCogs(line)` in `src/domain/costing.ts`, i.e. `unitCostSnapshot`, never the catalogue cost, so
a later delivery cannot rewrite an old month's margin. `qty` is in **base units**, so a case line
and a single line of the same SKU add up. There is deliberately no status filter inside: you pass
the orders you count as revenue, so the reports screen keeps one definition of "sold".

Please **do not** use `reports.grossProfit(orders, products)` for the product profit cut: it
multiplies quantity by `Product.costPrice` and is exactly the bug row C exists to fix.

### W-S, nav entry (the one thing I need from you)

`common.nav.money` is already in `src/i18n/common.vi.ts` / `.en.ts` (you added it; I removed my
duplicate). Please add to `NAV_ITEMS` in `src/components/shell/nav-items.ts`, after `reports`:

```ts
{ id: 'money', href: '/money', labelKey: 'common.nav.money', icon: '<your icon>',
  primaryOnMobile: false, permission: 'reports.store' },
```

`reports.store` is the permission the screens themselves enforce (see section 3), so the nav item
and the in-screen gate agree. Until the item lands, `/money` is reached by URL; it redirects to
`/money/cashbook`. Your current sidebar already shows `Tiền`, so this may be done.

### Anyone, other ledger actions now on `useLedgerStore`

```ts
settle(input)           // input gained `invoiceEntryId?: string`: allocate to one named invoice
deposit(input)          // { orgId, storeId, amount, bankAccountId, staffId, createdAt? } -> CashBookEntry | null
addManualNote(input)    // { ..., kind: 'credit_note' | 'debit_note' } -> LedgerEntry | null
createCreditNote(customerId, record)
makeBankAccountId()     // exported helper
```

`settle` still writes the ledger payment and the cash-book row in one update. With
`invoiceEntryId` set it stamps that id on the payment's `refId`, which `openInvoices` honours
exactly, so the allocation the collection dialog previews is the allocation the aging table
shows afterwards.

## 2. What was built

| Route | Screen | Notes |
|---|---|---|
| `/money` | redirect | opens on the cash book |
| `/money/cashbook` | `cash-book-screen.tsx` | per store, across shifts, running balance, store / period / kind filters, search, CSV, `Nộp ngân hàng` |
| `/money/receivables` | `receivables-screen.tsx` | aging 0-30-60-90 by **days overdue**, totals row, collection dialog, credit / debit note dialog, CSV |
| `/money/payables` | `payables-screen.tsx` | same shape reversed, due-date countdown badge, payment dialog, CSV |
| `/money/debts` | `debt-summary-screen.tsx` | chain aging both sides plus a per store table through `entriesForStore` |
| `/money/banks` | `bank-accounts-screen.tsx` | list plus add / edit dialog |
| `/money/cost/[productId]` | `product-cost-screen.tsx` | hosts `ProductCostHistory` on its own route |

Dialogs: `settlement-dialog.tsx` (one component for collection and supplier payment, because the
spec asks for one shape), `deposit-dialog.tsx`, `ledger-note-dialog.tsx`, plus `money-nav.tsx`,
`money-screen.tsx` (gate + gutter + tab row) and `money-csv-button.tsx`.

Pure helpers, all tested: `lib/cash-book.ts`, `lib/allocation.ts`, `lib/cost-history-rows.ts`,
`lib/gross-profit.ts`.

## 3. Decisions worth knowing

1. **The cash book is the drawer, so a bank-settled collection is not in it.** The spec says a
   transfer "never touches the drawer". `affectsDrawer(entry)` keeps `deposit` (the notes really
   did leave the till) and drops any other row carrying a `bankAccountId`. A caption under the
   table says so, because a manager who collected 20 triệu by transfer and cannot find it in the
   cash book would otherwise assume the app lost it.
2. **Opening balance, not just a period total.** The stat strip is `Đầu kỳ / Tổng thu / Tổng chi /
   Số dư sổ sách` and the running balance starts from everything before the filtered range, so a
   filtered day still reconciles against a physical count.
3. **The money area enforces `reports.store` itself.** `/money` has no nav item yet, so
   `permissionForPath` cannot cost it and the route guard would let a cashier in. `MoneyScreen`
   checks `useCan('reports.store')` and shows an explanation instead of a blank table. When W-S
   adds the nav item with the same permission the two agree; the in-screen gate stays as the
   belt to the route guard's braces.
4. **The allocation preview and the ledger use one rule.** `allocatePayment` mirrors
   `openInvoices` (named invoice first, then oldest due first). A dialog that promises one
   allocation and a ledger that books another is worse than no preview at all.
5. **The cost table recovers "tồn trước" only where it is sound.** `CostHistory` stores the
   answer, not the arithmetic, so on-hand-before is solved back out of the weighted average
   (`onHandBeforeFromAverages`). Where the two averages are within a dong, or the result is not a
   plausible quantity, the cell reads `chưa có` rather than printing a fabricated number into a
   table whose whole purpose is being checkable.
6. **The cost table opens on the current branch, not the chain.** Chain scope interleaves rows
   from four shops and "the average before this row" only means anything inside one of them. The
   chain view is still one select away, with its own heading.
7. **No `src/components/**`, `src/domain/**`, other features or stores were edited.** The CSV
   button is a local one (`money-csv-button.tsx`) on the shared `src/lib/csv.ts` and
   `src/lib/export-file.ts`, because `components/csv-export-button.tsx` keys its filename off a
   closed union of three screen names owned by another area.

## 4. Change requests for other owners

1. **W-T / coordinator, seed inconsistency in `src/data/seed/cost-history.ts`.** The generator
   blends receipts at `Math.round(product.costPrice * 1.04)` while the receipt **lines** carry
   the plain `costPrice`. The document and the cost ledger therefore disagree: a row can read
   "nhập 45 lon ở 6.500 đ, BQ trước 6.500 đ, BQ sau 6.672 đ", which does not add up on any
   reading. It is only the seed (a receipt confirmed through `applyReceipt` is consistent,
   because `receiptCostUpdates` uses `line.unitCost`). Fix is one line: nudge the **receipt line**
   cost instead of the incoming cost. Until then the cost table shows `chưa có` in `Tồn trước` on
   seeded receipt rows and prints a warning caption
   (`money.cost.formulaUnrecoverable`) naming the reason. I did not touch the seed: it is yours.
2. **W-S, nav item** as in section 1.
3. **W-S, `reports.tab.debt`** overlaps my `/money/debts`. Mine is the operational ledger (row
   opens a collection), yours is the report cut. Worth a line in one of them pointing at the
   other so the two debt screens do not read as a duplicate.
4. **Domain, no change requested.** `ledger.ts`, `costing.ts` and `returns.ts` covered everything
   rows C, D and E needed.

## 5. Gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **0 errors in my files.** 5 errors remain repo-wide, all in wave-1 peers' files: `src/features/inventory/supplier-return-detail-screen.tsx`, `src/features/notifications/lib/notification-presentation.ts`, `src/features/returns/lib/__tests__/return-draft.test.ts`, `src/lib/__tests__/csv-import.test.ts` (W-I, W-S) |
| `npm test` | 42 suites, 612 tests passed, including my 5 suites / 35 tests |
| `npx eslint src app` | **0 errors in my files.** 6 errors + 3 warnings repo-wide, all in W-P / W-S files (`features/pricing/*`, `features/promotions/*`, `features/pos/*`, `features/customers/*`, `features/orders/*`, `data/seed/operations.ts`) |
| `npm run qa:e2e` | 38 passed, 3 skipped, 1 failed. The failure is `perf.spec.ts` "1000 products through a batched grid", worst frame 133 ms, on a machine running four workers' builds at once. Unrelated to `/money`; my 8 money tests (4 specs x 2 viewports) passed inside the same run and pass on their own |
| `npx expo export --platform all` | web + android + ios bundles built |

Screenshots at 375 and 1440 in `docs/design/after/commerce/`: `cash-book`, `receivables`,
`collection-dialog`, `payables`, `cost-history`. Captured by
`scripts/qa/e2e/specs/commerce-money-shots._discover.spec.ts` (outside the gate, `_discover`).

BeeUI findings: `docs/beeui-audit/findings-26-money.md` (26-01 `SelectValue` has no empty state,
26-02 `Badge variant="outline"` reads as a text input). No package was patched.

## 6. Files

Created: `src/features/money/**` (5 screens, 6 components, 4 libs, 5 test suites) ·
`app/(app)/money/{index,cashbook,receivables,payables,debts,banks}.tsx` and
`app/(app)/money/cost/[productId].tsx` · `src/i18n/money.{vi,en}.ts` ·
`scripts/qa/e2e/specs/commerce-money.spec.ts` ·
`scripts/qa/e2e/specs/commerce-money-shots._discover.spec.ts` ·
`docs/beeui-audit/findings-26-money.md` · `docs/design/after/commerce/*-{375,1440}.png` (10 files).

Modified: `src/data/ledger-store.ts` (`invoiceEntryId`, `deposit`, `addManualNote`,
`createCreditNote`, `makeBankAccountId`) · `src/data/costing-store.ts` (optional resolver,
idempotency, `onHandBeforeReceipt`, `applyReceiptCost`).

Untouched: `src/components/**`, `src/domain/**`, `src/data/seed/**`, every other feature and
store, `src/components/shell/nav-items.ts`, `src/i18n/index.ts`, all BeeUI packages.
Nothing committed.

## 7. Open questions

None blocking. The one thing I would like a decision on is change request 1 (the seed's 1.04
nudge): it is a data defect rather than a UI one, and it is the only reason the flagship cost
table cannot show `Tồn trước` on seeded rows.
