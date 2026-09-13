# Wave 3 gap report: the seven product gaps from W-E, W-N and the P7 fix worker

Status: DONE · 2026-09-13, 18:10 to 19:55 · worker: wave-3 gaps · branch `main`, **not committed**

Input: `plan.md` "Wave 2 product gaps from W-E", `reports/w-e-e2e-perf-report.md` section 5,
`reports/w-t-foundation-report.md` sections 3 and 5, `reports/p7-native-fix-report.md`
section 7. All seven are closed, each with a test, and the two that change what a screen does
also move an E2E.

## 1. FIXED / LEFT

| # | Gap | State | What landed |
|---|---|---|---|
| 1 | No screen raises a supplier bill on credit (D8) | **FIXED** | The goods receipt carries a payment choice before it is confirmed: **Trả ngay** posts a `supplier_payment` cash-book row, **Ghi nợ** raises an AP `LedgerEntry` due on the partner's terms. A receipt already received without either carries a **Ghi nhận công nợ** action. `Supplier.paymentTermDays` is new, on the form and seeded for four partners. |
| 2 | The cash book never sees live till cash (D2) | **FIXED** | One helper, `useLedgerStore.postCashBook`, idempotent on a `ref`. Cash sales (`submitOrder`), cash refunds (order refund and the POS return), drawer in/out (`recordCashMovement`), the hand-over at close (`closeShift`) and the existing settlements and deposits all go through it. The Z report and the cash book are asserted figure for figure. |
| 3 | The till ignores `LoyaltyRule` (B8) | **FIXED** | `amount x earnPerVnd x tierMultiplier[tier]` from the active rule, redeeming at `redeemVndPerPoint`, in the till, the checkout preview and the receipt. The receipt prints "Điểm tích luỹ +N" on screen and on the 32 column roll. |
| 4 | A retail tile quotes the shelf price while the cart charges the promotion (B6b) | **FIXED** | `pos-screen.tsx` hands `ProductGrid` its `quoteFor` on both channels, and adds the line at the engine's price on both. The promotion badge is on the tile; a shelf or branch price still wears none. |
| 5 | The wholesale grid re-prices every visible tile per commit | **FIXED** | `src/features/pos/lib/price-cache.ts`: a memo keyed on branch, channel, buyer, group, product, unit and quantity, dropped whole when the pricing, branch-price, catalogue or customer store changes, and per minute so a promotion window cannot go stale. Both wholesale perf cases meet the frame budget and `perf.spec.ts` holds them to it. |
| 6 | A non-demo chain inherits the demo chain's data | **FIXED** | Every seeded slice goes through `demoSeed(seed, empty)` and exports an `xSeedForActiveOrg()` the bootstrap re-applies: orders, shifts, refunds, delivery notes, customers, point history, suppliers, branch prices, groups, price lists, price rules, promotions, ledger, banks, cash book, cost history, returns, write-offs, POs, supplier returns, lots, store settings, notifications, the audit log and cash movements. |
| 7 | The native scanner keeps the focus behind a non-form modal | **FIXED** | `src/features/pos/lib/capture-lock.ts`: the order rename, the discount dialog and the customer picker hold a counter while open, and the sell screen passes `enabled={!locked}` into `useBarcodeScan`, which already took the flag. |

Nothing from the brief is left. What is **not** done, and was not asked for, is in section 6.

## 2. The cash book, in detail

`postCashBook({ orgId, storeId, kind, amount, ref, staffId, createdAt })` mints the row id from
the ref (`cash-<ref>`) and returns the existing row rather than writing a second one. The refs
are the documents themselves: `order-<id>`, the refund record id, `return-<id>`, the cash
movement id, `shift-close-<id>`, the payment entry id. So a screen that re-runs its side
effects, or a worker that calls the same path from two places, cannot double the drawer.

**The hand-over at close is a product decision worth reviewing**: closing a shift books a
`deposit` row for `countedCash - openingCash`, floored at zero, with no bank account named. The
reasoning is that the float stays in the till for the next shift and the rest leaves it, so the
cash book's running balance after a close is the float rather than the day's takings; the
deposit screen books the second leg when the money reaches the bank. It is deliberately **not**
a `TILL_KIND`, so it does not move the four figures the Z report of the shift that just closed
prints.

`tillCashTotals(entries, storeId, start?, end?)` in `src/features/money/lib/cash-book.ts` is the
reconciliation: the four kinds a till books itself (`sale`, `refund`, `in`, `out`), which is
exactly what a Z report accounts for. A collection, a supplier payment and a deposit are branch
money and are excluded, which is why the Z report never knew about them.

## 3. Gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | clean (repo) and clean for `scripts/qa/e2e/tsconfig.json` |
| `npm test` | **57 suites, 741 tests passed** (was 52 / 706: 5 new suites, 35 new tests) |
| `npx eslint src app` | **0 errors, 0 warnings** |
| `npx eslint scripts/qa/e2e` | 0 errors, 0 warnings |
| `npm run qa:e2e` | **79 passed, 25 skipped, 0 failed, 6.3 min** (port 8137, `--output /tmp/claude-501/pw-gaps`) |
| `npx expo export --platform all` | 0 errors, web 6.1 MB + iOS 8.2 MB + Android 8.4 MB bundles written |

The suite was 78 passed / 26 skipped before this pass: the skip that became an assertion is
W-E's "and the sell tile quotes the promotion the cart will charge", which was written to start
asserting the day gap 4 was closed and did exactly that.

## 4. Perf

Same harness, same machine, same two-worker contention, measured twice: alone, and with the
journey and coverage specs running beside it.

| Case | Rows | First row | p95 | Worst | Frames > 100 ms | Before (W-E) |
|---|---|---|---|---|---|---|
| shipped catalogue | 120 | 66 to 95 ms | 16.8 ms | 83 ms | 0 | 0 |
| shipped grid | 1000 | 67 to 75 ms | 33.2 to 33.4 ms | 83 to 183 ms | 0 to 2 | 0 to 1 |
| **wholesale tile** | 120 | 66 to 81 ms | **16.8 ms** | 83 ms | **0** | 0 to 6, p95 to 33.3 |
| **wholesale tile** | 1000 | 76 to 103 ms | **33.2 ms** | 83 to 167 ms | **0 to 1** | 0 to 7, p95 to 33.4 |
| receivables table | 1000 | 424 to 534 ms | 16.8 ms | 33 to 50 ms | 0 | 0 |
| cash book table | 500 | 311 to 537 ms | 16.7 ms | 17 ms | 0 | 0 |

The wholesale cases now behave like the retail ones at the same row count, which is the claim:
at 1000 tiles both spend up to one frame over the budget on a busy machine, and that frame is
the windowed grid's own cost, not the price engine's. `perf.spec.ts` holds both to
`budgetChecks`; `WHOLESALE_FRAME_CEILING_MS`, `WHOLESALE_FRAMES_OVER_CEILING`,
`WHOLESALE_P95_CEILING_MS`, `wholesaleCeilingChecks` and `noteIfOverBudget` are deleted.

**One honest caveat about the first reading.** The harness priced its tiles by calling
`resolvePrice` directly, so the memo would not have been measured at all: it now goes through
`cachedResolvePrice`, the same call the sell screen makes, and the numbers above are from after
that change. A run of the old harness on this machine while idle also showed zero frames over
budget, which is exactly what W-E recorded ("none at all on an idle one"), so the contended run
is the one that carries the claim.

## 5. Tests added

| File | Cases | What it pins |
|---|---|---|
| `src/data/__tests__/cash-book-reconciliation.test.ts` | 6 | a cash sale, a cash-in and a cash-out become drawer rows; the cash book and `zReportTotals` agree figure for figure; one row per document however often the sale is submitted; a sale that took no cash books nothing; the hand-over at close leaves the float and does not move the till figures; another branch is untouched |
| `src/data/__tests__/supplier-invoice.test.ts` | 8 | the bill lands on the payables against its receipt, carries the partner's due date or none, is raised once however many screens ask, is refused at zero, and is paid down like any other bill; a receipt paid at the door moves the drawer and leaves the payables alone |
| `src/features/pos/lib/__tests__/loyalty.test.ts` | 11 | earn rate, tier multiplier, a changed rate, redeem rate (including a zero rate), the net of a bill that earned and spent, and the receipt figure; plus three that put a finished sale through the stores and read the buyer's balance back |
| `src/features/pos/lib/__tests__/price-cache.test.ts` | 6 | the second identical question is the same object; quantity, unit and branch are all in the key; a promotion edit and a branch price both empty the cache |
| `src/data/__tests__/chain-seed-scope.test.ts` | 4 | 28 seeded slices are non-empty for the demo chain and empty for `chuoi-demo-2`; a new chain still gets a loyalty rule stamped with its own id; memberships and the chain directory are deliberately kept |

## 6. E2E moved

- **`commerce-reconciliation.spec.ts`** now raises seven documents instead of five. New steps: a
  goods receipt taken on credit (payables up by the bill read off the screen), a retail cash
  sale (the drawer and the cash book both up by it), and a final step that reads the Z roll and
  asserts `Bán tiền mặt`, `Thu khác` and `Dự kiến` against the till and the cash book. The
  cash-book closing assertion is now `opening + collected - paid + cashSale + cashIn`; the
  comment that said the cash-in is deliberately missing is gone, because it no longer is.
- **`commerce-coverage.spec.ts`**: the tile-quote test lost its skip and asserts the tile is not
  at the shelf price; the loyalty test asserts the receipt prints the points; the second-chain
  test walks the new chain's POS, orders, customers, receivables, payables, cash book and
  notification centre and finds every one of them empty.
- **`perf.spec.ts`**: the wholesale cases hold the budget, as above.

## 7. Files

New (8): `src/features/pos/lib/loyalty.ts`, `src/features/pos/lib/price-cache.ts`,
`src/features/pos/lib/capture-lock.ts`, the five test files above, plus
`docs/beeui-audit/findings-32-gaps.md`.

Modified (46: 43 under `src/` and `scripts/`, plus two QA docs and the plan): `src/data/ledger-store.ts` (postCashBook, createSupplierInvoice, the per-chain
seed), `cash-movement-store.ts`, `shift-store.ts`, `persistence-bootstrap.ts` (`applyChainSeed`),
`chain-seed.ts` (`demoSeed`) and the twelve seeded stores; `src/data/seed/suppliers.ts`;
`src/domain/types.ts` (`Supplier.paymentTermDays`), `src/domain/pos.ts` (the receipt roll's
points line); `features/pos/adapters.ts`, `pos-screen.tsx`, `checkout-screen.tsx`,
`receipt-screen.tsx`, `hooks/use-wholesale-pricing.ts`, three dialogs;
`features/inventory/receipt-detail-screen.tsx`; `features/suppliers/supplier-detail-screen.tsx`;
`features/orders/hooks/use-order-actions.ts`; `features/returns/return-screen.tsx`;
`features/money/lib/cash-book.ts`; `features/audit/perf-harness-screen.tsx`; six i18n files (vi
and en key for key); three E2E specs; `docs/qa/perf-260913.md`,
`docs/qa/e2e-coverage-260913.md`, `plan.md`.

Untouched: every BeeUI package (nothing patched), `app/**`, `scripts/qa/e2e/lib/**`,
`playwright.config.ts`.

## 8. Decisions a reviewer should look at

1. **The hand-over at close** (section 2) is the one figure invented rather than read off a
   screen: `countedCash - openingCash`. If the shop banks the float too, it becomes
   `countedCash`.
2. **The receipt prints the points off the point movement**, not by re-running the rule: the
   sale itself can promote the buyer a tier, and a receipt that recomputes would print points
   the sale did not award. `addPoints` therefore takes an `orderId` and stamps the movement.
3. **The loyalty rule survives a new chain** while every other seeded slice does not: a till
   with no rule cannot award a point. It is re-stamped with the active chain's id.
4. **The retail tile adds through the engine** (`addPricedProduct`), not through
   `effectivePrice`. The cart was already repriced through the engine on both channels, so this
   only removes the disagreement; the line now also carries `priceSource: 'promotion'` and the
   promotion id on a retail sale, which is what the cart badge reads.
5. **A goods receipt defaults to "Ghi nợ" when the partner has terms** and to "Trả ngay" when
   they do not. The choice is on the form, above the confirm, rather than inside the confirm
   dialog, so it is visible before the button is pressed.

## 9. Open questions

1. The chain scope test is at the data level (28 slices) plus the second-chain E2E, which walks
   six screens of the new chain. The jest **render** test (`org-scoped-reads.test.tsx`) was left
   as it was: extending it to a POS screen needs a BeeUI stub for `EmptyState`, `Button` and
   `expo-router`, and the browser already asserts the same thing against the real screens.
   Say if the jest renderer version is wanted anyway.
2. `domain/customers.tierFor(totalSpent)` still reads its own `TIER_THRESHOLDS` constant rather
   than `LoyaltyRule.tierThresholds`, so the owner can edit the thresholds in Settings and a
   buyer's tier will not follow (the earn rate and the multipliers do). Out of this brief (the brief names the earn and redeem rates), one
   line to change, and it moves seeded customers' tiers, so it wants a decision rather than a
   quiet fix.
3. Android is still unverified for the scanner capture lock: the flag is platform-independent,
   but only the iOS capture was measured (by the P7 worker, on device).
