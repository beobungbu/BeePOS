# W-T foundation report: types, seed, domain core, stores

Status: DONE
Date: 2026-09-13 · worker: W-T (wave 0) · branch: main (not committed)

The type contract is applied, the seed is in, seven pure domain modules and eight new stores
exist with persistence slices, and all five gates are green. Wave 1 can start.

## Gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm test` | 33 suites, 528 tests passed (was 25 / 357) |
| `npx eslint src app` | 0 errors, 2 warnings (both pre-existing, not mine) |
| `npm run qa:e2e` | 31 passed, 3 skipped, 4.3 min (`--output /tmp/claude-501/pw-wt`) |
| `npx expo export --platform all` | web + android + ios bundles built |

## 1. Coordinator decisions of 2026-09-13, all applied

1. **The five `orders.status.*` keys are in**, vi and en, so no row renders a raw key. The
   lifecycle words are `quote / confirmed / delivering / completed / cancelled`; `void` keeps its
   existing "Đã huỷ" and `cancelled` is "Đã huỷ đơn", because a bill rung up in error and an
   order that never went ahead are different things. The parity test passes.
   `order-status-badge.tsx` maps all nine statuses to a variant; `order-filters-bar.tsx`'s
   `STATUS_OPTIONS` is still the retail four, so the filter dropdown is unchanged and W-P can
   widen it when the wholesale list screens land.
2. **`LedgerEntry.storeId?: string`** is in (contract change accepted). Entries derived from a
   document take that document's branch (a wholesale invoice takes the order's, a supplier bill
   takes the receipt's); hand-placed invoices and collections fall back to `store-1`, since the
   seed has no session. `useLedgerStore.settle()` and `addCreditNote()` stamp the branch from
   `input.storeId` onto the ledger entry as well as the cash-book row. Read it with
   `entriesForStore(entries, storeId)`, which composes with every existing reader
   (`balances(entriesForStore(entries, storeId), 'customer')`) rather than adding an argument to
   each of them: most screens want the chain figure and only the branch debt report wants this.
3. **Notifications expose kind and params, not just a string.** `AppNotification` gained
   `params?: Record<string, string | number>` and `templateKey?: string`; `title`/`body` stay as
   a rendered fallback. `TEMPLATE_KEYS_BY_KIND` maps each `NotificationKind` to the template
   variants it can produce (only `low_stock` has two: `lowStock` and `outOfStock`), and
   `renderNotification(notification, template)` re-renders a stored row against a template the
   UI just looked up. W-S should render from `kind` + `templateKey` + `params` and ignore the
   stored strings; a row persisted in Vietnamese and read back after a language switch would
   otherwise stay Vietnamese forever.

## 2. Type contract: applied, with three deviations

`src/domain/types.ts` carries the frozen contract. Deviations, all additive:

1. **`CartLine` vs `OrderLine`.** The contract says an order line has `unitCostSnapshot: number`
   and `priceSource` required. A cart line cannot: `addOrIncrementLine(lines, productId,
   unitPrice)` knows neither. So the five new fields are **optional on `CartLine`**, and
   `OrderLine extends CartLine` narrows `unitCostSnapshot` and `priceSource` to required.
   `Order.lines` is `OrderLine[]`. The one place that crosses the boundary is
   `toOrderLines(lines, costFor)` in `src/domain/pos.ts`, called from checkout.
2. **`OrgSummary`** (`{ id, code, name, storeCount }`) is new and not in the contract.
   Persistence is namespaced per chain, so an org switcher cannot read a second `Organization`
   out of the slice it is about to switch away from; it needs a flat directory. Seeded as
   `orgDirectory`, stored in `useOrgSettingsStore`.
3. **`GoodsReceipt.purchaseOrderId?`** added so a receipt raised from a PO can be traced back.
   W-I owns that flow; the field is there and unused.

Coordinator clarifications, both applied:

- `PriceSource` is now `'customer' | 'tier' | 'group' | 'group_discount' | 'store' | 'list' |
  'promotion' | 'manual'`. `group` is a flat price-list row; `group_discount` is the group's
  blanket percentage off the store or list price. These are different captions on the cart line
  ("Giá sỉ nhóm A" vs "Sỉ nhóm A -5%"), which is why they are different values.
- `LoyaltyRule.tierMultiplier?: Record<CustomerTier, number>`, default 1 per tier.
  `pointsEarnedForTier(rule, amount, tier)` is the function to call.

Migration defaults used everywhere: `channel: 'retail'`, `type: 'retail'`, `priceSource: 'list'`,
`unitCostSnapshot = product.costPrice` (existing orders) or the weighted-average cost at sale
time (new orders, via `currentCost(productId, storeId)`).

`GoodsReceipt.supplierId` is now required and `supplierName` is gone. Both receipt screens read
the name off the `Supplier` record instead, so renaming a partner no longer leaves a stale name
frozen on its history.

## 3. Domain modules (all pure, no React, no store imports)

### `src/domain/pricing.ts`
```ts
resolvePrice(product: Product, qty: number, unit: string|undefined, ctx?: PricingContext): PriceResolution
resolveBasePrice(product, baseQty: number, ctx?): { unitPrice: number; source: PriceSource }
promotionApplies(promotion, product, storeId: string|undefined, now: Date): boolean
applyPromotion(basePrice: number, qty: number, promotion: Promotion): number
groupFor(customer, groups): CustomerGroup | undefined
tierMultiplierFor(rule: LoyaltyRule, tier: CustomerTier): number
pointsEarnedFor(amount, earnPerVnd, tierMultiplier?): number
pointsEarnedForTier(rule: LoyaltyRule, amount: number, tier: CustomerTier): number
pointsValueFor(points: number, redeemVndPerPoint: number): number

interface PricingContext { storeId?; customer?; groups?; priceLists?; priceRules?;
                           storePrices?; promotions?; now?; channel? }
interface PriceResolution { unitPrice; source; promotionId?; promotionIds: string[];
                            basePrice; listPrice }
```
Notes W-P will care about:
- `qty` is counted in `unit`; rules are evaluated against `qty * unitFactor`, so one case of 24
  clears a "from 20 units" tier. `unitPrice` comes back **per `unit`**.
- `channel` defaults to `wholesale` when a company customer is attached, `retail` otherwise.
  `retail` ignores group and customer pricing entirely, which is what the "Bán sỉ" switch turns.
- `basePrice` is the pre-promotion price and `listPrice` the catalogue price, both in the same
  unit, so the tile can show a struck-through "was".
- Stackable promotions **compound** (two 10% offers give 19%, not 20%). A non-stackable
  promotion must beat that whole chain on its own, and then applies alone. `promotionIds` is the
  full set; `promotionId` is the first of it.
- `buy_x_get_y` is spread across the line: 3 units under buy-2-get-1 price at two units' worth.

### `src/domain/costing.ts`
```ts
weightedAverageCost(current: CostLot, incoming: CostLot): number       // CostLot = { qty, unitCost }
receiptCostUpdates({ receipt, onHandFor, costFor }): CostUpdate[]
costHistoryFromReceipt(receipt, updates, at?): CostHistory[]
latestCost(history, productId, storeId?): number | undefined
costSnapshotFor(product, history?, storeId?): number
costHistoryFor(history, productId, storeId?): CostHistory[]
lineCogs(line: OrderLine): number
cogsFor(order): number
grossProfitFor(order): number
grossMarginPercent(order): number                                      // one decimal place
inventoryValuation(levels, products, history?): number
```
A branch cost row beats a chain-wide one even when the chain row is newer. Gross profit reads
`unitCostSnapshot`, never the product's current cost, so a later receipt cannot rewrite an old
order's margin.

### `src/domain/ledger.ts`
```ts
entrySign(entry): 1 | -1                    // invoice/debit_note +1, payment/credit_note -1
signedAmount(entry): number
entriesFor(entries, party, partyId): LedgerEntry[]
balanceFor(entries, party, partyId): number
balances(entries, party, now?): PartyBalance[]     // { party, partyId, balance, overdue, oldestDueDate?, entryCount }
entriesForStore(entries, storeId): LedgerEntry[]   // compose with any reader above
openInvoices(entries, party, partyId): OpenInvoice[]  // { entry, dueDate?, amount, openAmount }
daysOverdue(dueDate, now?): number
agingBucketFor(days): 'current'|'d1to30'|'d31to60'|'d61to90'|'over90'
agingFor(entries, party, partyId, now?): Aging
agingTotals(entries, party, now?): Aging
overdueParties(entries, party, now?): PartyBalance[]
creditCheck(customer, entries, amount): CreditCheck   // { allowed, balance, limit, available, projected }
dueDateFor(createdAt: Date, paymentTermDays?): Date | undefined
```
One table serves both sides; on the supplier side "owes us" reads as "we owe them".
**Payment allocation:** a payment whose `refId` names an invoice entry id settles that invoice
exactly; anything left over, and any payment that names nothing, is applied oldest-due-first.
That is what a collection screen should write when the cashier picks an invoice.
**No credit limit means no credit** (`creditCheck` refuses when `creditLimit` is 0 or absent).

### `src/domain/returns.ts`
```ts
returnPlan({ order, requestLines, priorReturns? }): ReturnPlanResult
remainingReturnableQty(order, priorReturns, productId): number
returnedQty(priorReturns, orderId, productId): number
dispositionSplit(lines): { restockQty, damagedQty, restockValue, damagedValue }
netExchangeAmount(returnValue, replacementValue): ExchangeResult   // { net, amountDue, refundDue, ... }
writeOffsForReturn(lines, { orgId, storeId, staffId, returnId, createdAt? }): WriteOff[]
writeOffValue(writeOffs, costFor): number
```
`ReturnPlanResult` carries `lines`, `refundAmount`, `restockLines`, `damagedLines`.
`refundAmount` is the **goods value** at the price the line was sold (after its line discount).
Order-level discount and tax are deliberately not redistributed here: `src/domain/orders.ts`
`refundPlan` already owns that proportional split for money, and a second nearly-identical
version is how two screens end up disagreeing about what a customer is owed. Net an exchange
through `netExchangeAmount`; the cashier either takes money or gives it, never both.

### `src/domain/units.ts`
```ts
unitOptions(product): UnitConversion[]        // base unit first, no duplicates
unitFactor(product, unit?): number            // unknown unit falls back to 1
toBaseQty(product, qty, unit?) / fromBaseQty(product, baseQty, unit?)
unitPriceFor(product, basePrice, unit?): number
meetsMinOrderQty(product, baseQty): boolean
findByBarcode(products, code): BarcodeMatch | undefined   // { product, unit, factor }
barcodesOf(product): string[]
```
`findByBarcode` searches `barcode`, `barcodes[]` and every `units[].barcode`, trims whitespace a
wedge scanner adds, and returns the **unit and factor** the code belongs to, so scanning a case
adds the whole case.

### `src/domain/notify.ts`
```ts
buildNotifications(input: NotificationInput): AppNotification[]
renderNotification(notification, template): NotificationTemplate   // re-render from params
TEMPLATE_KEYS_BY_KIND: Record<NotificationKind, readonly NotificationTemplateKey[]>
lowStockNotifications / expiringLotNotifications / unclosedShiftNotifications /
overdueReceivableNotifications / poAwaitingNotifications   (same signature)
mergeNotifications(existing, computed): AppNotification[]
unreadCount(notifications): number
fillTemplate(template, values): string
EXPIRY_WARNING_DAYS = 30 · UNCLOSED_SHIFT_HOURS = 16
```
Ids are derived from the subject (`notif-low-stock-<storeId>-<productId>`,
`notif-expiring-lot-<lotId>`, `notif-shift-open-<shiftId>`, `notif-overdue-<customerId>`,
`notif-po-<poId>`), so re-running is idempotent and `mergeNotifications` keeps `readAt` and the
original `createdAt` while dropping rows that no longer apply. The domain owns no locale: copy
comes in as `NotificationLabels` templates with `{token}` placeholders. W-S should swap
`SEED_NOTIFICATION_LABELS` for dictionary lookups.

### `src/domain/lifecycle.ts`
```ts
ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]>
canTransition(from, to) / nextStatuses(from) / isTerminal / isOpen / isRevenue
assertTransition(from, to): OrderStatus     // throws on an illegal move
OPEN_ORDER_STATUSES = quote, confirmed, delivering, completed
REVENUE_ORDER_STATUSES = completed, paid, partial_refund
```
```
quote          -> confirmed, cancelled
confirmed      -> delivering, completed, paid, cancelled
delivering     -> completed, cancelled
completed      -> paid, partial_refund, refunded
paid           -> partial_refund, refunded, void
partial_refund -> partial_refund, refunded
refunded / void / cancelled -> terminal
```
`useOrderStore.setOrderStatus(orderId, status)` goes through `assertTransition`, so a screen
wired to the wrong button throws in development instead of writing an impossible status.

## 4. Stores and persistence

Eight new stores, each with its own persisted slice and version in
`src/data/persistence-bootstrap.ts`. `resetDemoData()` covers all of them (it iterates the same
`entries` array). Versions bumped on existing slices: `orders` 1→2 (cost snapshot, channel,
delivery notes), `customers` 1→2 (type + B2B fields), `catalog` 1→2 (units, barcodes,
minOrderQty, trackLots). A stale slice is dropped, not merged, so no migration code is needed.

| Store | Key suffix | State | Selected actions |
|---|---|---|---|
| `usePricingStore` | `pricing` | `customerGroups, priceLists, priceRules, promotions, loyaltyRule` | `upsertCustomerGroup`, `upsertPriceList`, `setPriceListActive`, `upsertPriceRule`, `removePriceRule`, `upsertPromotion`, `setPromotionActive`, `setLoyaltyRule` |
| `useLedgerStore` | `ledger` | `entries, bankAccounts, cashBook` | `settle(input) -> LedgerEntry\|null`, `addCreditNote(input)`, `addEntry`, `addCashBookEntry`, `upsertBankAccount` |
| `useCostingStore` | `costing` | `history` | `applyReceipt(receipt, onHandFor) -> CostUpdate[]`, `addCostHistory` |
| `useReturnsStore` | `returns` | `returns, writeOffs` | `recordReturn(record) -> WriteOff[]`, `addWriteOff` |
| `usePurchasingStore` | `purchasing` | `purchaseOrders, supplierReturns` | `sendPurchaseOrder`, `receivePurchaseOrder(id, lines)`, `cancelPurchaseOrder`, `upsertSupplierReturn`, `sendSupplierReturn` |
| `useLotStore` | `lots` | `lots` | `upsertLot`, `consumeLot`, `removeLot` |
| `useOrgSettingsStore` | `org-settings` | `storeSettings, memberships, orgDirectory` | `setStoreSettings(storeId, patch)`, `addMembership` |
| `useNotificationStore` | `notifications` | `notifications` | `refresh(input)`, `markRead`, `markAllRead`, `dismiss` |

Helpers worth knowing: `priceFor(product, qty, unit, ctx)` (pricing-store, fills groups/lists/
rules/promotions from state), `currentCost(productId, storeId?)`, `balanceOf(party, partyId)`,
`cashBookForStore`, `cashBookNet`, `fefoLots`, `expiringLots`, `statusAfterReceive`,
`outstandingQty`, `settingsForStore`, `effectiveSetting`, `orgsForMember`,
`useUnreadNotificationCount()`.

`useLedgerStore.settle()` writes the ledger payment **and** the cash-book row in one update, so
a collection cannot land in one and not the other. `useReturnsStore.recordReturn()` writes the
return and the write-offs its damaged lines produce; adjusting stock for the **restocked** lines
stays with the caller, since only the screen knows the inventory action to fire.

`useOrderStore` gained `deliveryNotes`, `upsertDeliveryNote`, `markDelivered`, `setOrderStatus`,
plus `deliveryNotesForOrder(notes, orderId)` and `deliveredQtyByProduct(notes, orderId)` (the
latter is what "partially delivered" means).

## 5. Seed ids you can rely on

All exported from `src/data/seed`. Deterministic from the existing mulberry32 prng, anchored to
`SEED_NOW = 2026-09-11T09:00:00Z` (`daysAgo` / `daysAhead` / `roundToLabel` exported too).
`src/data/__tests__/commerce-seed.test.ts` locks every figure below; if you need one changed,
change it there and tell me rather than silently editing a generator.

**Groups / price lists** — `group-retail` (Lẻ 0%), `group-agent-a` (Đại lý A 5% →
`pricelist-agent-a`), `group-agent-b` (Đại lý B 8% → `pricelist-agent-b`).
29 price rules: tiers at qty 1/10/50 on list A, 1/20 on list B, deeper tier always cheaper;
4 customer-specific rules (`rule-customer-<customerId>-<productId>`).

**Promotions** — `promo-1` "KM Tết sữa Vinamilk" (percent 10, products 21-24, stackable),
`promo-2` "Mua 2 tặng 1 mì Hảo Hảo" (buy 2 get 1, `product-81`, exclusive), `promo-3` amount
5.000 đ off cat-7 at store-1/2 (exclusive), `promo-4` expired. Loyalty: 1 point per 10.000 đ,
1.000 đ per point, tier multipliers bronze 1 / silver 1.2 / gold 1.5 / platinum 2.

**Customers** — 52 total. `customer-1..40` retail (`type: 'retail'`, `groupId: group-retail`);
`customer-41..52` company, every one with tax code, delivery address, sales rep, credit limit and
payment term. `customer-52` has a **zero credit limit** for the refusal path.

`customer-41` is **Cty TNHH Thương mại Minh Long** and matches
`docs/design/mockups/commerce-sales.html` to the dong:

| | |
|---|---|
| tax code | `0106847221` · phone `0913452118` · rep `staff-7` (Đặng Văn Hải) |
| group / limit / term | Đại lý A · 80.000.000 đ · 30 days |
| open invoices | `ledger-ar-mlong-1` 19.400.000 · `ledger-ar-mlong-2` 22.400.000 less an **allocated** 8.000.000 payment = 14.400.000 · `ledger-ar-mlong-3` 18.600.000 |
| balance / overdue / available | **52.400.000** / **33.800.000** / **27.600.000** |

**Catalogue** — 120 SKUs unchanged. 20 carry selling units and a `minOrderQty`:
`product-1, 7, 13, 19, 25, 31, 37, 43, 49, 55, 61, 67, 73, 79, 85, 91, 97, 103, 109, 115`
(alternating `lốc` 6 + `thùng` 24, or `thùng` 12; the case unit has its own 894-prefixed
barcode). The first 10 of those also carry a second SKU barcode (895-prefixed). Every barcode in
the catalogue is unique across SKU codes, extra codes and case codes.
10 SKUs have `trackLots`: `product-21..25` (sữa Vinamilk) and `product-81..85` (mì).

**Lots** — 60 (`lot-<productId>-<storeId>-<1|2|3>`) at store-1 and store-2, three batches each:
one already expired, one inside the 30-day window, one well ahead.

**Orders** — 300 retail (unchanged ids `order-1..300`, now `channel: 'retail'`, every line with
`unitCostSnapshot` and `priceSource: 'list'`) plus 10 wholesale `order-w1..w10`, codes
`DH<yyyymmdd>-NNN`, two in each of quote / confirmed / delivering / completed / paid, priced by
the case with `unit`, `unitFactor` and `priceSource: 'group'`. Delivery notes
`delivery-order-wN-1|2`; one `delivering` order is split into a delivered note and a pending one.

**Money** — `bank-1` Vietcombank, `bank-2` Techcombank. Ledger: 6 customers owing
(`customer-41..44` hand-placed, `customer-47/48` from completed wholesale orders), 2+ overdue
across different aging buckets; 4 suppliers owed (`supplier-1..4`), 2 overdue. Cash book: 120
rows derived from cash payments on orders, refunds, shift deposits and the seeded collections
(`sale`, `refund`, `deposit`, `collection`, `supplier_payment` all present).
Cost history: 145 rows = one `seed` opening row per product plus one `receipt` row per line of
every received goods receipt, blended through `weightedAverageCost`.

**Purchasing** — `po-1..po-5`, one per status in order draft / sent / partial / received /
cancelled; the partial one has one line complete and the rest short. `supplier-return-1` (draft),
`supplier-return-2` (sent).

**Returns** — `return-1..3` (plain restock, mixed restock+damaged, exchange) priced through
`returnPlan`; `writeoff-return-N-M` for every damaged line.

**Settings / org** — `storeSettings` for `store-1` and `store-2` only (store-2 deliberately has
no receipt header, so "follows the chain" is visible). `memberships` gives every staff member the
demo chain and the owner (`account-staff-1`) a second one, `SECOND_ORG_ID = 'chuoi-demo-2'`
(Chuỗi Minh Châu, 1 store, staff `staff-d2-1`). `orgDirectory` lists both.
Switching calls the existing `setActiveOrgId(orgId)` and reloads; the target chain starts from
empty storage because keys are namespaced per chain.

**Notifications** — 8 rows from `buildNotifications` at `limitPerRule: 2`, covering low stock,
expiring lots, an unclosed shift, overdue receivables and a PO awaiting receipt. The last two are
marked read so the unread badge is not simply the list length.

## 6. Files

Created: `src/domain/{pricing,costing,ledger,returns,units,notify,lifecycle}.ts` ·
`src/domain/__tests__/{pricing,costing,ledger,returns,units,notify,lifecycle}.test.ts` ·
`src/data/{pricing,ledger,costing,returns,purchasing,lot,org-settings,notification}-store.ts` ·
`src/data/__tests__/commerce-seed.test.ts` ·
`src/data/seed/{clock,pricing,lots,cost-history,money,purchasing,returns,store-settings,memberships,notifications}.ts`

Modified: `src/domain/types.ts` · `src/domain/pos.ts` (`toOrderLines`) ·
`src/data/seed/{index,products,customers,orders,operations}.ts` ·
`src/data/{order-store,customer-store,persistence-bootstrap}.ts` ·
`src/features/pos/checkout-screen.tsx` ·
`src/features/inventory/{receipts-list-screen,receipt-detail-screen}.tsx` ·
`src/features/orders/components/order-status-badge.tsx` ·
`src/i18n/orders.vi.ts` · `src/i18n/orders.en.ts` (the five lifecycle status labels) ·
`src/features/customers/screens/customers-list-screen.tsx` ·
test fixtures in `src/domain/__tests__/{orders,reports,pos,customers}.test.ts` and
`src/features/orders/lib/__tests__/order-presentation.test.ts`.

Untouched: every other `src/i18n/*` dictionary, all BeeUI packages, `docs/design/*`.
Nothing committed.

## Open questions

None blocking. All three items raised in the first pass were decided by the coordinator and are
implemented above. One thing for W-S to be aware of rather than to decide: `NotificationLabels`
is still a template struct passed into `buildNotifications`, because the domain owns no locale.
Wire the dictionary in at the call site and pass the looked-up templates; `TEMPLATE_KEYS_BY_KIND`
gives you the key list to build that dictionary section from.
