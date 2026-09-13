# Commerce specs: B2B, pricing, money, returns, inventory 2

Part of the BeePOS design system. Foundations (breakpoints, tokens, icons, type, density,
dark mode, copy) live in [`../design-direction.md`](../design-direction.md); this file holds
the commerce specs. Mockups: `mockups/commerce-sales.html`, `mockups/commerce-ops.html`.
Scope and type contract: `plans/260913-1115-beepos-commerce-program/plan.md`.

## A. Wholesale mode at POS

**The switch is per order, not per app.** `Bán sỉ` sits at the top of the cart pane and the
order tab carries a `Sỉ` badge, because a cashier flips between a retail order and a
wholesale order inside one shift. Turning it on applies the customer's price list, shows unit
conversion, enables `Ghi nợ`, and splits VAT onto its own line.

**Unit selector.** A `segmented-control` on the tile and on the cart line edit screen:
`thùng 24` / `lốc 6` / `lẻ`. The cart line always writes the conversion out in full,
`10 thùng x 24 lon = 240 lon`, so the seller and the buyer read the same number. A barcode
maps to one unit, so scanning a case barcode adds 24, not 1.

**Price source label.** Every cart line carries a small label naming where its price came
from, coloured by source: `series-1` tint for a price list or group (`Giá sỉ nhóm A`),
`success` tint for a quantity tier (`Bậc 10+`), `highlight` tint for a promotion
(`KM Tết -10%`), `muted` for `Sửa tay`. No label means the product's base price. The same
colours are used in the price list screen's `Áp dụng cho` column so the two screens connect.

**Precedence**, highest first: customer plus product, quantity tier, customer group, store
price, price list, base price. Promotions apply last, on top of the chosen price, and only
promotions flagged stackable combine.

**Minimum order quantity** is a line level warning in `warning`, not a blocker: it says
`Tối thiểu 5 túi cho đơn sỉ` under the line and leaves the line in the cart. The order can
still be saved as a quote.

**On account.** `Ghi nợ` appears only when the customer is a company with credit left. The
payment block shows credit limit, current debt, and the amount still available **after** this
order, plus the due date computed from the payment term. The pay button reads
`Ghi nợ · 6.771.600 đ`.

**VAT invoice block** sits above the pay button: buyer name, tax code, an edit affordance.
Wholesale orders show VAT as its own line because a VAT invoice requires it; retail orders keep
tax inside the price.

**The printed VAT invoice is a second print path.** The retail receipt and the Z report are
80 mm monospace; the VAT invoice is A5 on an office printer, so it uses the normal font and a
ruled table, and the printer is chosen separately in store settings. Layout follows the
familiar 01GTKT shape: form number, serial and invoice number and date; seller block with name,
tax code, address and bank account; buyer block with contact name, company, tax code, address
and payment terms; a ruled line table with STT, description, unit, quantity, unit price and
amount; then goods total, VAT rate and VAT amount, grand total; the amount in Vietnamese words;
and two signature areas. Unit prices on the invoice are net of tax and equal the wholesale
prices applied at POS, so the buyer can reconcile line by line. The prototype states plainly
that the serial and number are locally generated and nothing has been issued through an
e-invoice provider.

## B. Customers, groups and pricing screens

Customer form is one form with two shapes: a `segmented-control` picks `Khách lẻ` or
`Công ty`, and the company choice reveals tax code, invoice address, delivery address,
contact, group, sales rep, credit limit and payment term. Billing address and delivery
address are separate fields because in practice they differ.

Customer detail leads with five numbers in the stat strip: debt, overdue, credit limit,
credit left, 90 day sales. The aging table lists every open invoice with days overdue as a
badge (`Chưa đến hạn` neutral, `23 ngày` warning, `57 ngày` destructive) and a total row
inside the table. A one line sentence under the table states how the numbers add up.

Price list detail is one row per rule, so a product with three quantity tiers is three rows,
and carries a `So với giá gốc` percentage computed for the reader. The precedence list and
the customer groups sit in a side pane next to it, because "why is this price different" is
the first question anyone asks.

Promotions are a list plus an edit pane on one screen. `Cộng dồn` is its own column, since
stacking is the main cause of wrong prices. Ended promotions stay visible at 55 percent
opacity so they can be cloned next season. Loyalty rules are four blocks: earn, redeem,
an optional per tier multiplier (`tierMultiplier`, default 1 for every tier, drawn as
`x 1,0 / x 1,2 / x 1,5 / x 2,0`), and tier thresholds. Every numeric field carries a worked
example in real money, including the multiplier: a 250.000 đ order for a gold customer earns
`25 x 1,5 = 37` points, rounded down.

## C. Cost and valuation

**Weighted average, recomputed on every confirmed receipt.** The cost history table on the
product detail shows seven columns so the reader can check each step: date, source, quantity
received, unit cost, on hand before, average before, average after. The formula and two worked
examples with real numbers sit directly under the table, not in separate documentation:
`BQ sau = (tồn trước x BQ trước + SL nhập x giá nhập) / (tồn trước + SL nhập)`.

A manual adjustment sets the cost directly rather than averaging, so it carries its own
`warning` badge and always writes an audit event. Source badges: `Tồn đầu kỳ` neutral,
`Phiếu nhập` success, `Điều chỉnh tay` warning.

**Profit uses the snapshot, not today's cost.** Every order line stores the unit cost at the
moment of sale, and the gross profit report reads that stored number. The product detail says
so explicitly and shows the reconciliation (`96 x 6.500 = 624.000 đ`) against the report.

**Margin warning.** The stat strip carries margin at retail price and at the wholesale tier
price; a tier that drops the margin under 15 percent gets a `warning` panel naming both
numbers.

**Inventory valuation history** is a separate report: a horizontal bar per weekly snapshot for
the chain total with the current point in `primary`, plus a per store table of current value,
value 30 days ago, change and percentage, with a totals row. Value is at average cost, never
at sale price, and the report says so. It also says out loud that an increase is not
automatically good, since it usually means a delivery just landed. Slow moving stock is a stat,
defined as not sold in 60 days, valued at cost.

## D. Money

**Cash book** is per store and runs across shifts; it is a manager's screen, not a cashier's.
Retail sales are aggregated into one row per span of a shift with a `Gộp giao dịch bán lẻ`
chip that expands them. Columns: time, kind badge, description, staff, in, out, running
balance. In and out are separate columns so the eye can follow direction, and the running
balance is what makes a cash count traceable.

**Receivables and payables share one shape**, only the direction of money changes. Aging
columns are **days overdue**, not invoice age: `Chưa đến hạn`, `1-30`, `31-60`, `61-90`,
`Trên 90`, then the total, with a totals row inside the table. A `0 đ` cell is
`text-subtle-foreground`, never blank, so the eye keeps its column.

**Collection and payment dialogs** allocate against the oldest invoice first, show the
allocation line by line, and state the balance after the transaction. Cash goes to the store
cash book; a transfer goes to a bank account and never touches the drawer. Quick chips offer
`Thu hết`, the overdue amount, and a round number.

## E. Returns and exchange

One transaction: returned lines on the left, exchange lines in the right pane, one net number
at the bottom. Disposition is a **per line** decision, `Nhập lại kho` in `success` or
`Hàng hỏng` in `destructive`; damaged goods go to the write off log and never back to stock.
Reason is a chip from a fixed set plus `Khác`. Unselected lines stay visible at 60 percent
with quantity 0 so the cashier can see the whole original order.

Net amount is `giá trị hàng đổi` minus `giá trị hàng trả`. Negative means refund; positive
means the customer pays the difference. For a company customer who bought on account the
button becomes `Phát hành phiếu giảm trừ`, which writes a credit note against receivables
instead of opening the drawer.

Supplier returns always start from a goods receipt, so cost and reason are already known, and
they state both consequences: stock down, payable down.

## F. Inventory 2

**Purchase orders** step `Nháp` to `Đã gửi` to `Nhận một phần` to `Đã nhận`, with the stepper
inside the 56 pt toolbar rather than on its own row. `Nhận lần này` is an editable quantity
per line, not a single Receive button, because partial delivery is the normal case. Line
status is a badge (`Đủ`, `Còn 240`, `Chưa về`) so nobody has to subtract.

**Lots and expiry** are opt in per product. The expiring report sorts by nearest expiry, which
is the order the stockroom must work in, and grades three ways: expired `destructive`, under
15 days `warning`, otherwise neutral. POS picks the earliest expiry first and blocks a lot
that has expired. The two real exits, write off and clearance promotion, are the toolbar
actions.

**Multiple barcodes** are a list on the product form, each bound to a unit with its factor.
Exactly one is `Chính` and cannot be deleted.

**CSV import** never imports before a preview. Three row states with very light tints (5 to 8
percent so text still passes AA): ok, warning, error. Every problem row states the cause and
the consequence on the row itself, not in a summary box. The primary button counts the rows
that will actually import, `Nhập 115 dòng hợp lệ`, not the rows in the file.

## G. Order lifecycle, reports, notifications, settings

Wholesale order detail uses the same stepper pattern: `Báo giá`, `Đã xác nhận`, `Đang giao`,
`Hoàn tất`. Partial delivery is normal, so `Còn lại` is a `warning` coloured column rather
than a separate badge, and delivery notes are a list in the side pane each with its own
status. The order completes only when every note is delivered.

Reports use no chart library: horizontal bars are a div with a percentage width, hourly
columns are a div with a percentage height, peak column in `primary` and the rest in
`series-1`. Gross profit uses the cost snapshot taken at the time of sale, never the current
cost. Reports use the same 64 pt stat strip as every other list screen.

Notifications are a bell in the 48 pt header with an unread count and a 400 pt popover on
desktop, and a real screen under `Thêm` on phone. Five kinds carry the semantic colour of
what they report. Every notification has a second line with a concrete number, enough to
decide whether to open it.

Org switch lives in the avatar menu, not the store chip: the chain is identity, the store is
working context. Each org shows its store count and the user's role there. Per store settings
use store chips in the toolbar to switch which store is being edited, and an empty field means
inherit from the chain.
