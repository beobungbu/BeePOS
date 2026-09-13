# W-P report: B2B sales at the till, customers and B2B fields, pricing screens, wholesale order lifecycle

Status: DONE
Date: 2026-09-13 · worker: W-P (wave 1) · branch: main (not committed)

Rows A and B of the program checklist are in, minus the promotions and loyalty screens, which
are W-S's. Five gates green. The only thing I could not do inside my file ownership is the nav
row for `/pricing`; the request for W-S is in section 8.

## Gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm test` | 47 suites, 676 tests passed (adds 17: amount-in-words 9, delivery 8) |
| `npx eslint src app` | 0 errors; 2 pre-existing warnings, neither in a file I own |
| `npm run qa:e2e` | 62 passed, 10 skipped, 0 failed (`--output /tmp/claude-501/pw-wp`, port 8121) |
| `npx expo export --platform all` | web + ios + android bundles built |

The perf spec failed once, on the first full run, with 2 frames over budget on the batched
1000-tile grid. Re-run alone it reports `framesOverBudget: 0` on all three passes
(120 / 1000 / 1000 batched, worst frame 83 ms = one dropped frame at 60 Hz, p95 16.8 ms), and
it passed in the final full run too. It is machine contention from four workers building at
once, not the extra wrapper the tile grew; see section 3.

## 1. POS wholesale mode

**The switch is per order.** `PosCart` (in `src/data/cart-store.ts`) extends `Cart` with three
optional fields: `wholesale`, `salesRepId`, `vatInvoice`. They are additive and optional, so a
`PosCart` is a `Cart` everywhere the domain takes one and the persisted `carts` slice carries
them with no schema change (the slice stores whole cart objects, so nothing in
`persistence-bootstrap.ts` had to move). The switch sits at the head of the cart pane, the
order tab wears a `Sỉ` badge, and `clearCart` keeps the switch: it describes the order, not
what is on it.

**Pricing is derived, never guessed.** `useWholesalePricing(cart)` builds the
`PricingContext` from the session, the buyer and the pricing store and exposes `priceOf` and
`explain`; `useCartRepricing(cart)` re-prices the active order whenever the product set, a
quantity, a unit, the buyer or the switch changes. The effect keys on a signature string, not
on the lines array, and `repriceActive` returns the state unchanged when no line moved, so it
cannot loop. Mounted on `/pos`, `/pos/cart` and `/pos/checkout`, so a tier crossed on the way
to payment is priced before anything is tendered.

Retail is deliberately untouched: `channel: 'retail'` makes `resolveBasePrice` return the
store price or the catalogue price, which is exactly `effectivePrice`, and promotions are
passed only for a wholesale order. A retail tile therefore shows the same number it always
did, and `quoteFor` (which walks the rule arrays) is only handed to the grid when the switch
is on.

**Unit selector** on the tile and on the cart line (`UnitSelector`, a `SegmentedControl` over
`unitOptions`). Quantity is entered in the selected unit and stored with `unit` and
`unitFactor`; the cart line writes the conversion out in full, `10 thùng x 24 chai = 240 chai
· 7.000 đ/chai`, and so does the order detail's line list. Scanning now goes through
`findByBarcode`, so a case barcode adds the case, not one piece.

**Price-source label** per `commerce.md` section A: `customer` warning, `tier` success,
`group` / `group_discount` info, `promotion` primary, `manual` outline, and **no badge** for
`store` / `list`, because a label on every line stops the eye finding the lines that are
priced differently. `group` reads "Giá sỉ nhóm Đại lý A" and `group_discount` reads "Sỉ nhóm
Đại lý A -5%", the distinction W-T built the two sources for. The tier badge names the
threshold it cleared ("Bậc 10"), re-derived from the rules rather than threaded out of
`PriceResolution`.

**Minimum order quantity** is a line-level `warning` with the alert glyph and the line stays
in the cart, on the tile as well as on the line.

**Sales rep** is a select in the cart header, defaulted from the customer's own rep when a
company buyer is attached, and written onto `Order.salesRepId` so W-S's sales-by-rep report
can aggregate it.

**VAT** is relabelled rather than recomputed: the existing `calcCart` already adds tax on top
of the line prices, so a wholesale order shows `Tạm tính chưa VAT` and `VAT` as their own
rows (`OrderTotalsPanel wholesale`), and retail keeps `Thuế VAT đã gồm`.

**On account.** `Ghi nợ` is offered only when the order is wholesale, the buyer is a company
and `creditCheck` finds a limit above zero; no limit means no credit. The panel shows the
limit, the current balance, what is left **after** this order and the due date from the
payment term, and the pay button reads `Ghi nợ · 6.771.600 đ`.

It is **not** a `PaymentMethod`. Nothing is tendered, so the order records `payments: []` and
what the buyer owes lives in the ledger: `recordOnAccountInvoice` writes a
`kind: 'invoice', refType: 'order'` `LedgerEntry` stamped with the branch and the due date.
Adding a fifth member to `PaymentMethod` would have meant a frozen-type change and a payment
that never happened. Every wholesale order from the till is booked `status: 'confirmed'`,
channel `wholesale`, and the till lands on the order detail; retail still rings into `paid`
and lands on its receipt.

`Lưu báo giá` on the cart saves the order at `quote`, which is what the lifecycle stepper
starts from.

## 2. Customers and B2B

`CustomerBusinessFields` is one form with two shapes, shared by the add dialog and the detail
screen's Thông tin tab: a segmented control picks `Khách lẻ` or `Công ty`, and only the
company choice reveals tax code, both addresses, contact, group, rep, credit limit and payment
term. Choosing retail **clears** the company fields rather than hiding them, so a buyer moved
back to retail stops being offered `Ghi nợ`.

Customer detail leads with the five numbers of the spec for a company (debt, overdue, limit,
credit left, 90-day sales) and keeps its old three for a retail customer. The new `Công nợ`
tab is the aging table: one row per open invoice from `openInvoices`, days **past due** as a
badge (`Chưa đến hạn` neutral, warning under 30 days, destructive over), the total inside the
table, and the sentence under it that says how the numbers add up. Minh Long reads
52.400.000 / 33.800.000 / 80.000.000 / 27.600.000, matching the mockup to the dong.

The list gains a type badge, a group column, and type and group filters in the toolbar.

## 3. Pricing screens

New feature folder `src/features/pricing/**` and routes `/pricing`, `/pricing/[id]`.

- `/pricing` is two tabs: price lists (with rule count and which groups use each) and customer
  groups (discount and price list), both editable in a dialog.
- `/pricing/[id]` is one row per rule: product, unit, min qty, unit price, **So với giá gốc**
  computed for the reader, and an `Áp dụng cho` badge in the same colours the cart line uses,
  which is what connects the two screens. The precedence list and the groups sit in the side
  pane, because "why is this price different" is the first question anyone asks.
- The rule dialog picks its product with a search box over a capped list of rows, **not** a
  `Select`: a 120-SKU select scrolls at any height, and a scrolling `SelectContent` swallows
  the press (BeeUI 24-01). Noted in `docs/beeui-audit/findings-25-sales.md`.

Permission: `/pricing` is not in `nav-items.ts` (W-S's file), so `permissionForPath` returns
nothing for it and the route guard would let anyone in. Both screens therefore guard
themselves with `can(role, 'catalog.manage')` through `usePricingGuard`, which stays correct
once the nav entry lands.

## 4. Wholesale order lifecycle

The order detail grows a wholesale branch: the stepper `Báo giá → Đã xác nhận → Đang giao →
Hoàn tất` inside the toolbar row, a five-figure stat strip, the per-line delivery progress
table with `Còn lại` in warning colour, and the delivery notes list in the side pane.

`useWholesaleOrderActions` owns the rules that are easy to get wrong:

- Stock leaves the branch when a note is **marked delivered**, not when the order is rung up.
  `submitOrder` skips the stock movement for a wholesale order entirely, and
  `releaseDeliveredStock` books it per note. Retail is unchanged except that it now decrements
  **base** units (`qty * unitFactor`), which is a bug fix: a cased line used to take the number
  of cases off the shelf.
- Raising the first note moves the order to `delivering`; delivering the last outstanding unit
  completes it, so nobody has to press a second button.
- A note can never promise more than is owed: quantities are clamped to the remainder.
- Cancelling always asks why, and the reason is stored on the order note.
- No loyalty points on a wholesale order: a company account already buys at a contract price.

The orders list filter is widened to all nine statuses and gains a channel filter
(`Bán lẻ` / `Bán sỉ`); `filterOrders` is W-T's, so the channel narrowing is applied in the
screen next to it rather than by changing that signature.

**VAT invoice** is a second print path at `/orders/invoice/[id]`: A5 `@page`, its own
stylesheet and DOM id, and native shares it as text. Layout follows 01GTKT (form number,
serial, number, date, seller block, buyer block, ruled table, goods total, VAT, grand total,
amount in words, two signature areas). Unit prices are net of tax and **per base unit**, so
the buyer reconciles line by line against the goods they counted. The amount in words is a
tested pure function (`amount-in-words.ts`): `6.771.600` reads "Sáu triệu bảy trăm bảy mươi
mốt nghìn sáu trăm đồng.", with `lẻ`, `mười lăm`, `mốt` / `tư` / `lăm` after `mươi` and the
empty hundreds group in a non-leading triple all covered. The sheet states plainly that the
serial and number are generated locally and nothing has been issued through an e-invoice
provider.

## 5. What the coordinator asked for at the end

- **`/pos/returns` entry points.** The till reaches it from the cart's action row
  (`Trả / đổi hàng`, beside `Giảm giá đơn` and `Ghi chú`), and the order detail offers it on
  any order that can still be refunded. The shell's `Thêm` sheet and `SUB_NAV_ITEMS` are
  `src/components/shell/**`, which I do not own, so the command palette entry is in section 8
  for W-S. W-I: I would take the `?order=<code>` parameter you offered, so the action from an
  order preselects it instead of landing on an empty search.
- **FEFO tile warning.** `expiringLotsFor(product.id, storeId)` is called from the grid's
  `renderItem` and the tile shows a `destructive` badge for an expired batch and a `warning`
  one for a batch inside the window. It is called **only** for products with `trackLots`: ten
  SKUs carry lots and a thousand-tile grid must not pay for it per frame.

## 6. Files

Created: `src/features/pos/lib/{wholesale,build-order}.ts` ·
`src/features/pos/hooks/{use-wholesale-pricing,use-save-quote}.ts` ·
`src/features/pos/components/{unit-selector,price-source-badge,wholesale-header,vat-invoice-block,on-account-panel}.tsx` ·
`src/features/customers/components/{customer-business-fields,customer-debt-tab}.tsx` ·
`src/features/pricing/**` (2 screens, 4 components, 2 lib files) ·
`src/features/orders/components/{order-lifecycle-stepper,order-wholesale-panel,delivery-note-dialog,cancel-order-dialog}.tsx` ·
`src/features/orders/hooks/use-wholesale-order-actions.ts` ·
`src/features/orders/lib/{delivery,amount-in-words,vat-invoice,invoice-print}.ts` ·
`src/features/orders/screens/vat-invoice-screen.tsx` ·
`src/features/orders/lib/__tests__/{amount-in-words,delivery}.test.ts` ·
`src/i18n/pricing.{vi,en}.ts` · `app/(app)/pricing/{index,[id]}.tsx` ·
`app/(app)/orders/invoice/[id].tsx` ·
`scripts/qa/e2e/specs/commerce-sales.spec.ts` · `docs/beeui-audit/findings-25-sales.md` ·
10 screenshots in `docs/design/after/commerce/`.

Modified: `src/data/{cart-store,order-store,customer-store}.ts` ·
`src/features/pos/{pos-screen,cart-screen,checkout-screen,adapters}.tsx|ts` ·
`src/features/pos/components/{cart-panel,cart-line-item,product-card,product-grid,order-tab-strip,order-totals-panel,payment-method-cards}.tsx` ·
`src/features/customers/**` (list, detail, table, list group, info tab, add dialog) ·
`src/features/orders/{screens/order-detail-screen,screens/orders-list-screen,components/order-filters-bar,components/order-lines-list}.tsx` ·
`src/i18n/{pos,customers,orders}.{vi,en}.ts` · `scripts/qa/e2e/lib/labels.ts` (new `C` block).

Untouched: `src/components/**`, `src/domain/**`, every store that is not one of my three,
`src/data/seed/**`, all BeeUI packages. Nothing committed.

## 7. E2E

`scripts/qa/e2e/specs/commerce-sales.spec.ts`, three tests, both viewports:

1. Switch an order to wholesale, attach Minh Long, see the group label on one SKU and the
   contract label on another, see the minimum-order warning, change the unit to `thùng 24`,
   see the conversion written out and the total multiply, pay `Ghi nợ`, land on the order, and
   find the invoice on the buyer's `Công nợ` tab under the order's own code.
2. Add a price rule on the Đại lý A list and watch the till quote it.
3. Walk `order-w1` from quote to confirmed, raise a delivery note (which moves it to
   delivering) and mark it delivered (which completes it).

## 8. What I need from other workers

1. **W-S, `src/components/shell/nav-items.ts`.** Two rows, both `SUB_NAV_ITEMS` so the command
   palette offers them and `permissionForPath` guards them:
   ```ts
   { id: 'pricing', href: '/pricing', labelKey: 'common.nav.pricing', icon: 'package', primaryOnMobile: false, permission: 'catalog.manage' },
   { id: 'returns', href: '/pos/returns', labelKey: 'returns.entryTitle', icon: 'receipt-text', primaryOnMobile: false, permission: 'pos.sell' },
   ```
   `common.nav.pricing` ("Giá bán" / "Pricing") needs adding to `common.{vi,en}.ts`, which is
   also yours. Until then `/pricing` is reached from the customers toolbar (`Giá bán`, shown
   only with `catalog.manage`), because `src/features/products/**` is not mine and the
   coordinator's suggested products-toolbar action would have been an ownership violation.
2. **W-T, two additive type fields**, both worked around rather than faked:
   - `Organization.taxCode?: string`. A VAT invoice needs the seller's tax code; the chain has
     none, so the row is omitted rather than filled with `organization.code`, which is a slug.
     Inventing a number on a tax document would be worse than leaving the line off.
   - `Customer.billingAddress?: string`. The invoice address and the delivery address differ in
     practice, and `Customer` carries only `deliveryAddress`. The billing one is stored in
     `CustomerProfileExtra` (my store, persisted) meanwhile.
3. **W-I**: the `?order=<code>` parameter on `/pos/returns`, as offered.

## 9. Open questions

None blocking. One judgement call worth a second opinion: promotions are applied by the till
**only** on a wholesale order. The engine supports them at retail and the seed has three live
ones, but turning them on at the counter changes the price of existing retail flows, and the
promotions screens are W-S's. Say the word and it is a one-line change in
`use-wholesale-pricing.ts`.
