# E2E coverage of the phase-7 commerce checklist, 2026-09-13

Source of the rows: `plans/260913-1115-beepos-commerce-program/plan.md`, the scope checklist A
to G. Every sub-item of every row is below with the test that proves it, or with the reason
there is no E2E test for it. Nothing is left as "uncovered" without one or the other.

Specs referenced (`scripts/qa/e2e/specs/`):

| Short name | File | Tests |
|---|---|---|
| journey | `journey.spec.ts` | 1 x 4 locale/theme, both viewports |
| sales | `commerce-sales.spec.ts` | 3 |
| money | `commerce-money.spec.ts` | 4 |
| inventory | `commerce-inventory.spec.ts` | 7 |
| settings | `commerce-settings.spec.ts` | 5 |
| **coverage** | `commerce-coverage.spec.ts` | **14** (all 14 assert since wave 3 closed B6b) |
| **reconciliation** | `commerce-reconciliation.spec.ts` | **1, new here** |
| perf | `perf.spec.ts` | 1 test, 6 measurements |
| chain-ops, pos-features, inventory-ops, multi-order, persistence, reports-settings, customer-from-pos, shortcuts | phase 5 and 6 | 11 |

## A. B2B hybrid sales

| # | Item | Covered by | Notes |
|---|---|---|---|
| A1 | customer type retail / company, with tax code, delivery address, contact, group, sales rep, credit limit, payment terms | **coverage** "a company customer is created with its tax code and credit limit"; sales 1 (the seeded company buys) | The form is asserted through the two fields that change behaviour later: the tax code the VAT invoice prints and the limit the `Ghi nợ` check reads |
| A2 | per-order "Bán sỉ" switch | sales 1; **reconciliation** | |
| A3 | unit conversions (thùng / lốc / lẻ) with case entry | sales 1 (`thùng 24`, "1 thùng x 24", the total multiplies) | |
| A4 | minimum order qty | sales 1 ("Tối thiểu 24" warning, line stays in the cart) | |
| A5 | lifecycle quote → confirmed → delivering → completed | sales 3 (whole walk); **coverage** delivery-note test | |
| A5b | lifecycle → cancelled, with a reason | **coverage** delivery-note test, last step (`order-w4`) | |
| A6 | delivery notes and **partial** delivery | **coverage** "a delivery note for part of an order leaves the rest outstanding, then completes it" | sales 3 delivers in full; this one ships one unit, checks `Còn lại`, then closes the order with a second note |
| A7 | on-account payment checked against the credit limit | sales 1 (`Ghi nợ`, "Còn được nợ sau đơn này"); **reconciliation** | The **refusal** path (`customer-52`, zero limit) has no E2E test: it is a pure predicate and is covered by `creditCheck` in `src/domain/__tests__/ledger.test.ts`. An E2E would assert the absence of a control, which passes for the wrong reason as easily as the right one |
| A8 | VAT invoice info and print template | **coverage** "the VAT invoice prints the buyer block, the totals and the amount in words"; sales 1 (the VAT block at checkout) | |
| A9 | sales rep on customer and order | **coverage** A1 test (the rep field is part of the company form); report below | The rep *select* in the cart header is not asserted on its own; what it feeds is |
| A10 | sales-by-rep report | **coverage** "the report cuts render" (`/reports/staff`) | |

## B. Pricing model

| # | Item | Covered by | Notes |
|---|---|---|---|
| B1 | customer groups | sales 2 (`/pricing`, `Nhóm khách` tab and the Đại lý A list); **coverage** A1 (a buyer is filed into a group) | Editing a group in its dialog is not asserted; the group's *effect* is, on the cart line |
| B2 | general discount % per group | sales 1 (`Giá sỉ nhóm …` badge) | The `group_discount` variant ("Sỉ nhóm A -5%") is covered by `src/domain/__tests__/pricing.test.ts`; the seed prices Minh Long off a flat group row, so the badge on screen is the `group` one |
| B3 | price lists by group, by customer + product, quantity tiers | sales 1 (group and contract labels on two SKUs), sales 2 (a new rule quoted at the till) | Quantity tiers are proven in `pricing.test.ts` (a case of 24 clears a "from 20" tier); no E2E adds a tier and crosses it |
| B4 | precedence, shown on the POS tile and the cart line | sales 1 and 2; perf case 3 measures the tile with the badge on | |
| B5 | promotions: percent / amount / buy X get Y, by product or category, by store, time window, stackable | settings 1 (create one, it lands with a status) | The three types and the scope rules are covered by `promotion-status` and `pricing` unit tests |
| B6 | promotions **auto-applied** | **coverage** "a live promotion prices a retail cart line" | W-R turned promotions on at the counter, and the cart line for a Vinamilk SKU is charged 6.300 đ against a 7.000 đ shelf price |
| B6b | …and quoted on the tile | **coverage** "and the sell tile quotes the promotion the cart will charge" | Closed in wave 3: `pos-screen.tsx` hands `ProductGrid` its `quoteFor` on both channels, so the tile prices through the engine the cart is repriced through and wears the promotion badge. The test asserts the tile is **not** at the shelf price and is at the promotion price |
| B7 | loyalty rules configurable (earn rate, redeem rate, tier thresholds) | settings 2 (the earn rate is edited and its worked example follows) | |
| B8 | loyalty earning at the till | **coverage** "a sale earns the customer loyalty points" | **Gap recorded in the test:** the till awards `pointsEarned(total)` from `src/domain/pos.ts` (a fixed point per 10.000 đ). `LoyaltyRule.earnPerVnd` and `tierMultiplier` are never read by `src/features/pos/adapters.ts`, so the Settings form and the counter disagree. The test asserts what the till does today and says in a comment what it becomes when the rule is wired in |

## C. Cost

| # | Item | Covered by |
|---|---|---|
| C1 | weighted-average cost recomputed on receipt confirm | inventory 1 (a PO received at 9.999 đ moves the average) |
| C2 | COGS snapshot per order line at sale | money 4 ("Giá vốn chốt khi bán") |
| C3 | gross profit reports use the snapshot | **coverage** report cuts (`/reports/products`), money 4 |
| C4 | cost history per product | money 4 (`/money/cost/product-1`, the formula panel) |

## D. Money

| # | Item | Covered by | Notes |
|---|---|---|---|
| D1 | cash book per store across shifts | money 3; **reconciliation** | |
| D2 | sales cash and bank deposits in the cash book | money 3 (a deposit lowers the drawer) | **Gap:** a cash *sale* rung up after the seed never reaches the cash book, and neither does a till cash-in: those are written to `cash-movement-store` (the phase-6 shift ledger) while the money area reads `ledger-store.cashBook`. The reconciliation spec asserts the split explicitly and names it |
| D3 | bank accounts | money 3 (a deposit picks Vietcombank) | `/money/banks` add / edit is not walked; the account it creates is what the deposit dialog offers, which is asserted |
| D4 | receivables ledger, invoices on account | sales 1, **reconciliation** | |
| D5 | partial collections | money 1; **reconciliation** | |
| D6 | aging 0-30-60-90 and overdue | money 1 (the overdue figure falls when the oldest invoice is paid); customer debt tab in sales 1 | |
| D7 | payables: payments to supplier | money 2; **reconciliation**; **coverage** supplier return (a credit note lowers the payable) | |
| D8 | payables: **supplier receipts on credit** | **no test — no screen** | Confirming a goods receipt writes no ledger entry: nothing under `src/features/inventory/**` calls `useLedgerStore`, and the payables screen has no note dialog, so every supplier invoice in the app comes from the seed. Raised as a finding in `reports/w-e-e2e-perf-report.md`; the reconciliation spec uses the seeded bills as its opening balance and says why |
| D9 | collection and payment screens | money 1 and 2; **reconciliation** | |
| D10 | debt on the customer detail | sales 1 (`Công nợ` tab, the invoice appears under the order's own code) | |
| D11 | debt on the supplier detail | **no test** | The supplier detail's debt block is a read of the same `balanceOf` the payables screen renders, which D7 asserts through a document that moves it |
| D12 | debt summary per store | **coverage** report cuts (`/money/debts`, the per-branch table and its totals row) | |

## E. Returns and exchanges

| # | Item | Covered by |
|---|---|---|
| E1 | return reasons | inventory 4 and 5, **coverage** credit-note test (reason chips per line) |
| E2 | disposition restock vs damaged, damaged into the write-off log | inventory 4 (stock unchanged, the log carries the row) |
| E3 | exchange in one transaction, net payment or refund | inventory 5 (return value, exchange value and `Thu thêm` agree) |
| E4 | B2B delivered-goods return raising a credit note against receivables | **coverage** "a return against an on-account order issues a credit note, not cash" |
| E5 | supplier returns | **coverage** "a supplier return sent to the partner lowers what the chain owes them" |

## F. Inventory 2

| # | Item | Covered by | Notes |
|---|---|---|---|
| F1 | purchase orders draft → sent → received, partial receive | inventory 1 | |
| F2 | supplier returns | **coverage** supplier-return test | |
| F3 | CSV import for products and stock, validation preview | inventory 3 (three rows, one refused, two imported) | |
| F4 | CSV **template** download | **coverage** "the CSV import offers a template file to fill in" | The file is read back in the test and has to carry the header row the parser maps |
| F5 | lots and expiry, optional per product | inventory 6 (the lots section of `product-21`) | |
| F6 | FEFO pick warning on the sell tile | **coverage** "the sell tile warns about a batch that has gone out of date"; perf case 3 measures its cost | |
| F7 | expiring report | inventory 4 (the screen), **coverage** write-off test | |
| F8 | multiple barcodes per product | inventory 2 (a second code added on the form scans at the till) | |
| F9 | damaged write-off | inventory 4 (from a return), **coverage** "an expiring lot written off …" (from the expiring screen) | |

## G. Settings and reports

| # | Item | Covered by | Notes |
|---|---|---|---|
| G1 | per-store settings: receipt header / footer, tax, opening hours, printer | settings 4 (the header is saved against the branch and read back; the override badge counts it) | One field of the five is driven; they share one form and one `setStoreSettings` call |
| G2 | account with several orgs, org switch | settings 5 (the switch re-points the storage scope and drops the session) | |
| G3 | org switch → **sign in to the second chain** | **coverage** "signing in after an org switch lands in the second chain" | W-R seeded `chuoi-demo-2` with a store, a staff row, a register and the owner's credential, and `login` now resolves the staff record through `OrgMembership`. The test signs in after the switch and asserts the till is standing in Minh Châu Quận 7 with none of the demo chain's branches on screen. The chain has one branch, so the store picker is skipped and the register is what comes up |
| G4 | notification centre: read, mark all read | settings 3 | |
| G5 | notification **generated by an event** (low stock) | **coverage** "stock driven under its minimum raises a low-stock notification" | The shelf is emptied through the inventory adjust dialog and the runner raises the row |
| G6 | the other four notification kinds (expiring lots, unclosed shift, overdue receivables, PO awaiting) | settings 3 (all five kinds are in the seeded list the screen renders and marks read) | Their rules are unit-tested in `src/domain/__tests__/notify.test.ts`; only low stock is driven end to end, because it is the one an operator can cause in one action |
| G7 | reports by category | **coverage** report cuts (`/reports/category`) | |
| G8 | reports by hour | **coverage** report cuts (`/reports/hours`) | |
| G9 | product gross profit | **coverage** report cuts (`/reports/products`) | |
| G10 | inventory valuation history | **coverage** report cuts (`/reports/inventory-valuation`: the weekly series, the per-branch comparison and the current figure) | |
| G11 | debt summary | **coverage** report cuts (`/money/debts`) and D12 | |

## Program acceptance

| Acceptance line (plan) | Where it is proved |
|---|---|
| every checklist row has a screen or a documented reason | this file |
| pricing precedence proven by domain tests and one E2E per source | `pricing.test.ts` for all six sources; E2E for `group` and `customer` (sales 1), `manual` (journey line discount), `store` (chain-ops 2). `tier`, `list` and `promotion` are domain-only, stated in B3 and B6 |
| money balances: cash book, receivables and payables reconcile | **`commerce-reconciliation.spec.ts`**, with the cash-book split of D2 named in it |
| returns: restock changes stock, damaged does not, exchange nets, credit note reduces the balance | inventory 4, inventory 5, **coverage** credit-note test |
| E2E for every new flow, perf harness re-run | this file and `docs/qa/perf-260913.md` |

## Open gaps, in one list

All four are **closed** in wave 3 (`reports/wave3-gaps-report.md`); the text below is what was
found and what now proves it.

1. ~~**A supplier bill on credit cannot be raised in the app** (D8).~~ Confirming a goods
   receipt now offers "Trả ngay" or "Ghi nợ", and a receipt already confirmed without a bill
   carries a "Ghi nhận công nợ" action. Proven by the reconciliation spec (payables up by the
   bill) and by `src/data/__tests__/supplier-invoice.test.ts`.
2. ~~**The cash book does not see live till cash** (D2).~~ Every cash sale, cash refund, drawer
   movement and hand-over at close goes through `useLedgerStore.postCashBook`, keyed by the
   document so it cannot be booked twice. The reconciliation spec asserts the cash book and the
   Z report figure for figure; `src/data/__tests__/cash-book-reconciliation.test.ts` does the
   same at the store level.
3. ~~**The loyalty rule does not reach the counter** (B8).~~ The till, the checkout preview and
   the receipt all award `amount x earnPerVnd x tierMultiplier[tier]` from the active
   `LoyaltyRule`, and redeem at `redeemVndPerPoint`. The coverage spec also asserts the receipt
   prints what the sale awarded; the rate and the multipliers are moved in
   `src/features/pos/lib/__tests__/loyalty.test.ts`.
4. ~~**A retail tile quotes the shelf price while the cart charges the promotion** (B6b).~~ The
   grid is given `quoteFor` on both channels, memoised through
   `src/features/pos/lib/price-cache.ts` so the retail grid does not pay for it per commit.
