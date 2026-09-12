# POS sell-screen research

Status: v1 · 2026-09-12 · for BeePOS design pass phase 1 · author: design

Four products surveyed: KiotViet and Sapo POS (Vietnamese market leaders, same customer
BeePOS targets), Square POS and Loyverse (international, strong published UX material).
Everything below is sourced; anything the vendor does not publish is marked `unverified`
rather than guessed.

---

## 1. KiotViet (VN, retail/tạp hoá market leader)

**Layout.** Desktop and the D10/D68 terminals use a two-pane sell screen: catalog on the
left, the live invoice on the right. Multiple bills run as tabs across the top; "+" opens a
new bill and the previous one keeps its state, so one cashier can park a customer who
forgot the fish sauce and serve the next in line.
<https://www.kiotviet.vn/cap-nhat-giao-dien-ban-hang/>
The D68 Dual ships a 15.6" staff screen plus a 10.1" customer-facing screen that mirrors
the order, total and promotions.
Phone layout: `unverified` from public docs.

**Tiles.** Two catalog modes. Visual grid shows product image + name + price so the cashier
never memorises a code. Rapid-entry list drops images entirely and is driven by keyboard
and scanner. Columns per row: `unverified`.
<https://www.kiotviet.vn/huong-dan-su-dung-kiotviet/retail-ban-hang/ban-hang/>

**Cart and payment.** The invoice pane carries qty, unit price and line discount as
columns; subtotal and invoice-level discount sit directly under the lines; the payment
block is pinned at the bottom. F8 focuses the amount tendered, F9 completes. Change is
calculated automatically. Methods: cash, card, QR, e-wallets, loyalty points.
<https://www.kiotviet.vn/huong-dan-su-dung-kiotviet/retail-thanh-toan/thanh-toan/>

**Categories.** Product groups are nestable and drag-reorderable by the store, but the sell
screen navigation control (tabs vs tree vs chips) is `unverified`.

**Search/barcode.** One field at the top of the catalog accepts a scan, a product code or a
name. Barcode is the primary input; tapping a tile is the fallback.

**Multiple open orders.** The core pattern: bills are tabs across the top of the sell screen,
`+` opens another, the previous bill keeps its lines with no explicit save step.
<https://www.kiotviet.vn/cap-nhat-giao-dien-ban-hang/> A maximum bill count and what the
close control does are `unverified`.

**Images on tiles.** The visual grid mode leads with the product photo; the rapid-entry list
mode has no images at all. What renders when a product has no photo is `unverified`.

**Under time pressure.** Parked bills as tabs, F8/F9 muscle memory, automatic change,
scanner-first entry, auto-print on completion. Clumsy: two very different catalog modes
means two different mental models, and the F-key set is desktop-only.

---

## 2. Sapo POS (VN)

**Layout.** The sell screen has a configurable quick-action button area along the bottom
that the store drags to match its workflow; branch picker, staff name, zoom level and sync
status sit top right. Several orders run in parallel.
<https://help.sapo.vn/cau-hinh-va-thao-tac-tren-man-hinh-ban-tai-quay>
Responsive behaviour phone vs tablet: `unverified`.

**Tiles.** Grid and list both available; the columns shown are configurable per user. Tile
data includes image, name, type, brand, "Có thể bán" (sellable qty) and "Tồn kho" (total
on hand), so stock is a first-class field, not an afterthought.
<https://help.sapo.vn/quan-ly-danh-sach-san-pham-tren-phan-mem-sapo>
Variants expand inline from a chevron on the parent row.

**Cart and payment.** Payment block sits on the right under the tendered-amount field and
offers preset denominations 100.000 / 200.000 / 500.000 đ. Methods stack until the order
total is reached (split payment). Cash, bank transfer, MoMo, ZaloPay, VNPay QR, points.
<https://help.sapo.vn/thanh-toan-don-hang-tai-man-hinh-ban-hang>

**Search/barcode and hotkeys.** F3 product search, F4 customer search, F10 barcode mode,
F1 pay, F2 tendered amount, F6 order discount, F7 change method, F11 fullscreen.
<https://help.sapo.vn/huong-dan-su-dung-phim-tat-shortcut>
<https://help.sapo.vn/he-thong-phim-chuc-nang-trong-giao-dien-ban-tai-quay-pos>

**Multiple open orders.** Several orders run in parallel and `Alt+2` toggles between them,
which puts order switching in the same hotkey tier as printing and closing.
<https://help.sapo.vn/he-thong-phim-chuc-nang-trong-giao-dien-ban-tai-quay-pos> The on-screen
control for switching is `unverified`.

**Images on tiles.** Product rows and tiles carry an image field alongside name, type, brand
and stock, and the visible columns are user configurable.
<https://help.sapo.vn/quan-ly-danh-sach-san-pham-tren-phan-mem-sapo> Fallback for a product
with no image is `unverified`.

**Under time pressure.** Preset VND denominations remove mental arithmetic in a cash-heavy
market. Deep hotkey map. Clumsy: the hotkey map is large enough to need a cheat sheet, and
a fully user-configurable button area means no two stores look alike, which slows training.

---

## 3. Square POS (US)

**Layout.** Tablet and Register put a visual item grid centre stage with categories and
quick discounts in a layer above the grid; cart and totals live behind a Checkout tab with
an overflow menu for Clear Cart, Add Custom Amount and similar.
<https://squareup.com/au/en/the-bottom-line/inside-square/visual-browse>
<https://squareup.com/help/us/en/article/8238-build-your-customer-s-cart-in-the-square-retail-pos-app>
Phone is single-pane and leans on search rather than category browsing; the grid and
categories are a tablet-and-up affordance.
Square Register is dual screen: 13.27" seller display plus a detachable 7" customer display
that shows the itemised order, tax, discounts and loyalty, total pinned top left.
<https://squareup.com/us/en/hardware/register/specs>

**Tiles.** Image, price and variation count. Tiles are drag-reorderable and the store picks
tile size, colour and image; the grid syncs across every device in the business.

**Cart and payment.** A single Charge action opens the payment review with the total and the
available tender types. Identical lines consolidate into one row with a quantity, and the
cashier can pre-select a quantity before tapping the item.

**Search/barcode.** USB and Bluetooth (HID keyboard mode) scanners, plus camera scanning on
supported Android. Scanning an unknown UPC can create the item.
<https://squareup.com/help/us/en/article/5143-bar-code-scanners-with-square-point-of-sale>
Keyboard shortcuts: `unverified`, Square publishes none.

**Multiple open orders.** Open Tickets: an order is created, named with an optional note,
saved, and completed later; in Square for Retail a saved cart is the same object as an open
ticket, and any logged-in device in the account can pick it up. Tickets split and merge, and
one ticket caps at 500 items.
<https://squareup.com/help/us/en/article/5337-use-open-tickets-with-square>
<https://squareup.com/help/us/en/article/8439-split-and-merge-open-tickets>
This is a named-and-saved model rather than a tab strip: fast to park many, slower to flip
between two.

**Images on tiles.** Images are the default and the tile carries image, price and variation
count; where there is no photo the store sets a flat colour tile instead, so the fallback is
colour plus the name, never an empty frame.
<https://squareup.com/au/en/the-bottom-line/inside-square/visual-browse>

**Under time pressure.** One unmissable Charge button, image-first recognition, categories
and discounts one tap away with no menu nesting, quantity pre-selection. Clumsy: on phone
the grid mostly disappears and the cashier is pushed into search.

---

## 4. Loyverse (international, small retail)

**Layout.** Phone defaults to a one-column list of name + price; Favourites (max 30, synced
store-wide) is reached from an "All items" dropdown, and there is no category browsing on
phone.
<https://help.loyverse.com/help/favorites-on-smartphones>
Tablet offers a settings-level toggle between a 3-column grid (image/colour led) and a
single-column list (name + price), explicitly framed as recognition-mode vs price-checking
mode.
<https://help.loyverse.com/help/home-sale-screen-layouts>

**Tiles.** Grid tiles carry an image or a flat colour plus the name; the list shows name and
price inline. No on-hand quantity on the tile.

**Categories.** Custom pages mix items, categories and discounts, arranged by tap-and-hold
then drag; an alphabetical default page always exists and cannot be edited.
<https://help.loyverse.com/help/how-arrange-sale-screen-loyverse>

**Cart and payment.** Cart lives in the same view; split payment is supported and change due
plus the receipt are pushed to a customer display.
<https://help.loyverse.com/help/how-split-payment-loyverse>

**Search/barcode.** Camera scanning toggled in Settings, external HID scanners on Android.
<https://help.loyverse.com/help/barcodes-scanning-built-device>

**Multiple open orders.** Open Tickets, off by default and enabled in Back Office under
Settings then Features. Once on, several orders are edited and closed independently, tickets
split and merge, and they synchronise across devices in the store in real time.
<https://help.loyverse.com/help/open-tickets>
<https://help.loyverse.com/help/tickets-synchronizations>

**Images on tiles.** Grid tiles show either an image or a flat colour, chosen per item, so a
catalog with no photography still gets a usable grid; list mode drops the visual entirely and
shows name plus price. <https://help.loyverse.com/help/home-sale-screen-layouts>

**Under time pressure.** Colour tiles give recognition without product photography, which
matters for a catalog nobody has photographed. The grid/list toggle respects that scanning
for a product and checking a price are different tasks. Clumsy: 30-favourite cap, no
categories on phone, and the locked alphabetical default page.

---

## Patterns BeePOS adopts

1. **Two-pane on desktop, catalog left, cart right** (KiotViet, Square Register): the
   cashier never loses sight of the running total.
2. **Image-first tiles with a colour fallback** (Square, Loyverse): the photo leads, and an
   item with no photo gets the category colour plus its initials in the same slot, so the
   grid never reflows and never shows an empty frame.
3. **Stock on the tile** (Sapo "Có thể bán"): a grocery cashier needs to know before the
   tap, not after.
4. **Preset cash denominations 50k/100k/200k/500k** (Sapo): removes arithmetic in a
   cash-first market.
5. **One loud pay action carrying the total** (Square Charge): a single unmissable target
   ends the transaction.
6. **Scanner-first single search field** accepting barcode, SKU or name (KiotViet).
7. **Categories as a one-row scroller on phone, wrapped on tablet+** (Square): keeps the
   first product row above the fold.
8. **Split payment that stacks until the total is met** (Sapo, Loyverse): normal for
   part-cash part-transfer in VN.
9. **Desktop F-keys for the three hot actions only** (F3 search, F8 tendered, F9 pay), a
   trimmed KiotViet/Sapo map that fits on one line of help text.
10. **Identical lines consolidate with a qty control** (Square) rather than repeating rows.
11. **Variant shown as a distinct secondary line on the tile** (Sapo's inline variants):
    Coca-Cola exists four times and the size is what tells them apart.
12. **Grid density that keeps the full product name readable** (Loyverse list mode
    reasoning): truncation is the single most expensive error source at the till.
13. **Several open orders as a tab strip** (KiotViet): one cashier serves customers in
    parallel, and tabs make switching one tap with the state of every order visible at once,
    which naming and saving a ticket (Square, Loyverse) does not.
14. **Open orders switchable from the keyboard on web** (Sapo puts order toggling in the
    same hotkey tier as printing): `Alt+1` to `Alt+8` rather than a browser-owned combo.

## Patterns BeePOS rejects

1. **User-draggable tile layouts** (Square, Loyverse, Sapo): no backend to persist it, and
   per-store layouts destroy trainability across a chain.
2. **Two catalog modes, grid and rapid-entry list** (KiotViet): two mental models for one
   task; a single grid plus a fast search field covers both.
3. **A large F-key map** (Sapo, 10+ keys): needs a cheat sheet, and BeePOS is phone and
   tablet first where F-keys do not exist.
4. **Favourites as a separate capped page** (Loyverse, 30 items): categories plus search
   already cover it and it adds a second navigation model.
5. **Named-and-saved tickets, split and merge** (Square, Loyverse): naming every parked bill
   costs a keyboard trip a grocery cashier does not have time for, and split or merge is a
   restaurant problem, not a tạp hoá one.
6. **Customer-facing second screen** (KiotViet D68, Square Register): out of scope for a
   one-codebase prototype with no hardware layer.
