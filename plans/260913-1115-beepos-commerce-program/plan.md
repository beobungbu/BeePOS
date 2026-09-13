# BeePOS commerce program (phase 7): everything discussed on 2026-09-13, nothing left out

Status: wave 0 DONE (commit e170aaf), wave 1 IN PROGRESS (W-P, W-M, W-I, W-S launched 12:10) · 2026-09-13 12:10 · owner: Ambrose
Owner instruction: "lập hết các cái đã trao đổi để làm, không được thiếu gì". B2B mode is the hybrid the owner was offered (same app, per-order "Bán sỉ" switch); pure-B2B was not chosen, so hybrid is the working assumption.

## Scope checklist (source: chat 2026-09-13 09:03 to 11:15 and `docs/chain-multitenant-gap-analysis.md` P2/P3)
| # | Area | Items | Wave / worker |
|---|---|---|---|
| A | B2B hybrid sales | customer type retail / company (tax code, delivery address, contact, group, sales rep, credit limit, payment terms); per-order "Bán sỉ" switch; unit conversions (thùng / lốc / lẻ) with case entry; min order qty; order lifecycle quote → confirmed → delivering → completed (+ cancelled) with delivery notes and partial delivery; on-account payment ("Ghi nợ") checked against credit limit; VAT invoice info and VAT invoice print template; sales rep on customer and order; sales-by-rep report | 1 / W-P |
| B | Pricing model | customer groups; general discount % per group; price lists: by group, by customer + product, quantity tiers; precedence customer-product > qty tier > group > store > list, shown on the POS tile and cart line ("Giá sỉ nhóm A"); promotions (percent / amount / buy X get Y, by product or category, by store, time window, auto-applied, stackable flag); loyalty rules configurable (earn rate, redeem rate, tier thresholds) | 1 / W-P (promotions + loyalty: W-S) |
| C | Cost | weighted-average cost recomputed on receipt confirm; COGS snapshot per order line at sale; gross profit reports use the snapshot; cost history per product | 1 / W-M |
| D | Money | cash book per store across shifts (all in/out, sales cash, bank deposits), bank accounts, receivables ledger (invoices on account, partial collections, aging 0-30-60-90, overdue), payables ledger (supplier receipts on credit, payments to supplier), collection and payment screens, debt on customer and supplier detail | 1 / W-M |
| E | Returns and exchanges | return reasons; disposition restock vs damaged (damaged goes to a write-off log, not stock); exchange in one transaction (return lines + new lines, net payment or refund); B2B delivered-goods return creating a credit note against receivables; supplier returns | 1 / W-I (POS exchange UI) + W-M (credit note) |
| F | Inventory 2 | purchase orders (draft → sent → received into a receipt, partial receive); supplier returns; CSV import for products and stock with validation preview; lots and expiry (optional per product, FEFO pick warning, expiring report); multiple barcodes per product; damaged write-off | 1 / W-I |
| G | Settings and reports | per-store settings (receipt header/footer, tax, opening hours, printer name); account with several orgs and org switch; notification center (low stock, expiring lots, unclosed shift, overdue receivables, PO awaiting receive); reports by category, by hour, product gross profit, inventory valuation history, debt summary | 1 / W-S |
| H | Follow-ups from phase 6 | `GoodsReceipt.supplierId` required; inventory toolbar 1440 collapse (move Nhà cung cấp to the sidebar); seed cash movements; flaky wide reports custom-range spec; iOS smoke of login / lock / cashier switch / Z share | 0 / W-T (types, seed) · 2 / W-E, W-N |
| I | Earlier open items | native hardware barcode capture (spike a maintained key-event module; fall back to documenting); AppState flush of AsyncStorage on native; VoiceOver / TalkBack trait pass; D-08 expo-router dev warning tracked upstream | 2 / W-N |
| J | Quality | mockups before screens (designer, wave 0); code review after wave 1; E2E for every new flow; perf harness re-run; dark sweep of new screens; BeeUI findings filed per batch; morning report | 0, 2, 3 |

## Type contract (frozen: W-T has landed, others request changes via report)

Applied as written in `src/domain/types.ts`, with three additive deviations recorded in
`reports/w-t-foundation-report.md` section 2: the five new line fields are optional on
`CartLine` and required on `OrderLine extends CartLine` (`Order.lines: OrderLine[]`);
`OrgSummary` is new, for the org switcher; `GoodsReceipt.purchaseOrderId?` is new.
`PriceSource` carries the six precedence levels plus `promotion` and `manual`, and
`LoyaltyRule` carries `tierMultiplier?`, both per the 2026-09-13 clarification.
```ts
// customers and B2B
export type CustomerType = 'retail' | 'company';
export interface CustomerGroup { id: string; orgId: string; name: string; discountPercent: number; priceListId?: string }
export interface Customer { /* existing */ type: CustomerType; groupId?: string; taxCode?: string; companyName?: string; contactName?: string; deliveryAddress?: string; salesRepId?: string; creditLimit?: number; paymentTermDays?: number }
// pricing
export interface PriceList { id: string; orgId: string; name: string; isActive: boolean }
export interface PriceRule { id: string; orgId: string; priceListId?: string; customerId?: string; productId: string; minQty: number; unitPrice: number }
export type PromotionType = 'percent' | 'amount' | 'buy_x_get_y';
export interface Promotion { id: string; orgId: string; name: string; type: PromotionType; value: number; buyQty?: number; getQty?: number; productIds?: string[]; categoryIds?: string[]; storeIds?: string[]; startsAt: Date; endsAt: Date; isActive: boolean; stackable: boolean }
export interface LoyaltyRule { orgId: string; earnPerVnd: number; redeemVndPerPoint: number; tierThresholds: Record<Exclude<CustomerTier, 'bronze'>, number> }
export interface UnitConversion { unit: string; factor: number; barcode?: string }   // on Product: units?: UnitConversion[]; barcodes?: string[]; minOrderQty?: number; trackLots?: boolean
// orders and delivery
export type OrderChannel = 'retail' | 'wholesale';
export type OrderStatus = 'quote' | 'confirmed' | 'delivering' | 'completed' | 'paid' | 'refunded' | 'partial_refund' | 'void' | 'cancelled';
export interface OrderLine { /* existing CartLine + */ unitCostSnapshot: number; unit?: string; unitFactor?: number; promotionId?: string; priceSource: 'list' | 'store' | 'group' | 'tier' | 'customer' | 'promotion' | 'manual' }
export interface Order { /* existing */ channel: OrderChannel; salesRepId?: string; dueDate?: Date; vatInvoice?: { buyerName: string; taxCode: string; address: string; email?: string }; deliveryAddress?: string }
export interface DeliveryNote { id: string; orgId: string; orderId: string; lines: { productId: string; qty: number }[]; status: 'pending' | 'delivered'; deliveredAt?: Date }
// money
export type LedgerParty = 'customer' | 'supplier';
export interface LedgerEntry { id: string; orgId: string; party: LedgerParty; partyId: string; kind: 'invoice' | 'payment' | 'credit_note' | 'debit_note'; refType: 'order' | 'receipt' | 'return' | 'manual'; refId?: string; amount: number; dueDate?: Date; createdAt: Date; note?: string }
export interface BankAccount { id: string; orgId: string; name: string; number: string; bank: string }
export interface CashBookEntry { id: string; orgId: string; storeId: string; kind: 'sale' | 'refund' | 'in' | 'out' | 'deposit' | 'collection' | 'supplier_payment'; amount: number; refId?: string; bankAccountId?: string; staffId: string; createdAt: Date }
export interface CostHistory { productId: string; storeId?: string; unitCost: number; source: 'receipt' | 'manual' | 'seed'; refId?: string; createdAt: Date }
// returns
export type ReturnDisposition = 'restock' | 'damaged';
export interface ReturnRecord { id: string; orgId: string; storeId: string; orderId: string; lines: { productId: string; qty: number; reason: string; disposition: ReturnDisposition; unitPrice: number }[]; refundAmount: number; exchangeOrderId?: string; creditNoteId?: string; staffId: string; createdAt: Date }
export interface WriteOff { id: string; orgId: string; storeId: string; productId: string; qty: number; reason: string; refId?: string; staffId: string; createdAt: Date }
// inventory 2
export type PurchaseOrderStatus = 'draft' | 'sent' | 'partial' | 'received' | 'cancelled';
export interface PurchaseOrder { id: string; orgId: string; storeId: string; supplierId: string; code: string; lines: { productId: string; qty: number; receivedQty: number; unitCost: number }[]; status: PurchaseOrderStatus; expectedAt?: Date; createdAt: Date }
export interface SupplierReturn { id: string; orgId: string; storeId: string; supplierId: string; receiptId?: string; lines: { productId: string; qty: number; unitCost: number; reason: string }[]; status: 'draft' | 'sent'; createdAt: Date }
export interface Lot { id: string; orgId: string; storeId: string; productId: string; lotCode: string; expiresAt?: Date; onHand: number; receiptId?: string }
// settings and notifications
export interface StoreSettings { storeId: string; receiptHeader?: string; receiptFooter?: string; taxRate?: number; openingHours?: string; printerName?: string }
export interface OrgMembership { userId: string; orgId: string; staffId: string }
export type NotificationKind = 'low_stock' | 'expiring_lot' | 'shift_open' | 'overdue_receivable' | 'po_awaiting';
export interface AppNotification { id: string; orgId: string; storeId?: string; kind: NotificationKind; title: string; body: string; refType?: string; refId?: string; readAt?: Date; createdAt: Date }
```

## Waves
| Wave | Worker | Scope | Status |
|---|---|---|---|
| 0 | designer (DONE) | mockups `commerce.html`: POS wholesale mode (switch, unit selector, price source label, on-account pay), customer company form + group, price list and price rule screens, promotions, receivables and collection, cash book, PO and receive, returns / exchange at POS, lots and expiry, CSV import preview, notification center, org switch; phone 375 + desktop 1440 | IN PROGRESS |
| 0 | W-T types + seed + domain core | apply the contract; migrate existing data (channel retail, priceSource list, unitCostSnapshot from costPrice); seed groups, price lists, rules, promotions, bank accounts, ledgers with a few open receivables and payables, POs, lots for 10 products, notifications; pure domain: `pricing.ts` (precedence engine), `costing.ts` (weighted average), `ledger.ts` (balances, aging), `returns.ts` (net exchange), `notify.ts`; persistence slices; `GoodsReceipt.supplierId` required; tests | DONE · [report](reports/w-t-foundation-report.md) |
| 1 | W-P sales + pricing | A + B (except promotions/loyalty screens) | IN PROGRESS |
| 1 | W-M money + cost | C + D + credit notes for E | IN PROGRESS |
| 1 | W-I inventory 2 + returns UI | E (POS return/exchange, supplier returns) + F | IN PROGRESS |
| 1 | W-S settings, promotions, reports, notifications | B promotions + loyalty, G | DONE · [report](reports/w-s-settings-reports-report.md) |
| 2 | W-R review · W-E E2E + perf · W-N native (iOS smoke, hardware scanner spike, AppState flush, VoiceOver) | J, H, I | PENDING |
| 3 | integrator | gates, dark sweep, deploy, BeeUI batches, report | PENDING |

## Acceptance (program)
- Every checklist row has a screen or a documented reason it is not there.
- Pricing precedence proven by domain tests and one E2E per source.
- Money balances: cash book, receivables and payables reconcile to orders / receipts / returns in tests.
- Returns: restock changes stock, damaged does not, exchange nets correctly, credit note reduces the customer balance.
- All gates green: tsc, jest, eslint, qa:e2e, export all; production E2E green after deploy.

## Wave 1 integration follow-ups (collected 2026-09-13 14:30, for wave 2 W-R)
- Second org sign-in: seed a Store, Staff and UserAccount for `chuoi-demo-2`; `session-store.login` must resolve staff through OrgMembership for the active org, not `account.staffId` (W-S finding).
- Seed receipt line costs vary slightly per receipt so the weighted average and the valuation curve move (W-S); the cost seed already uses the line cost (integrator fix 14:05).
- Fold `src/components/shell/shell-icons.tsx` glyphs into `src/components/icons.tsx` (W-S deviation).
- Supplier return books a `credit_note` with party supplier because `debit_note` sign is +1 in `entrySign`; either rename to a named `createSupplierDebitNote` or document (W-I).
- `/pos/returns` gated on `pos.refund` (W-S choice, accepted).
- Delete any `.tmp-shots/` scratch specs; add `.tmp-shots` to jest ignore so a peer's scratch cannot break `npm test`.
- W-I open decisions: credit-note amount on an exchange (net vs gross), PO code shape, CSV import route placement.
