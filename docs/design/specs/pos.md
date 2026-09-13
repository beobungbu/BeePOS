# POS and cart specs

Part of the BeePOS design system. Foundations (breakpoints, tokens, icons, type, density,
dark mode, copy) live in [`../design-direction.md`](../design-direction.md); this file holds
the point of sale and cart specs. Mockups: `mockups/pos.html`, `mockups/checkout.html`.

## Selling surface components

**Product tile.** Surface `bg-surface`, border `border-border`, radius `md`, padding 10,
internal gap 6. Top to bottom: image slot, name, variant line, price. The slot is full width, radius `sm`, aspect 1:1 on phone and tablet and 4:3 on
desktop, where 4:3 is what keeps 5 columns at 1440 beside the cart pane. Background is the
category accent at 7 percent so the slot never reads as a hole while loading. The stock badge
overlays its top right corner with a 1 pt shadow so it stays legible on any photo, and the
in-cart quantity counter takes that same corner. Out of stock greyscales and dims the image to
45 percent, keeps the badge at full strength reading `Hết hàng` in `destructive`, and is not
tappable. When `imageUrl` is missing the slot shows the category monogram, product initials in
the accent colour, at the same size, so the grid never reflows between a product with a photo
and one without; the fallback is a property of the slot, not a different tile.

Below the slot: name at `variant="label"` weight 600 on exactly 2 lines, variant and unit on
one `variant="caption"` line (`330ml · chai`), price at `variant="heading"` weight 700. Pressed
fills `bg-muted`. Phase 2 loads with `expo-image`: `contentFit="cover"`, `transition={150}` and
a `placeholder` (blurhash if the catalog carries one, otherwise the accent tint), with the slot
reserved before the image resolves. Consequence to accept: at 375 pt a 1:1 slot over 2 columns
leaves about 3 tiles above the fold, the same trade Square and Loyverse make; if that is too
slow at the till the answer is a compact list mode, not a shrunken grid image.

**Stock badge.** `variant="caption"`, radius `full`, padding 2 x 8: `bg-muted` + `Còn 23`
normally, `bg-warning` tint + `triangle-alert` + `Sắp hết · 4` at or under `minLevel`,
`destructive` tint + `Hết hàng` at zero.

**Category chips.** 36 high, radius `full`, `variant="label"` weight 500; selected `bg-primary`
+ `text-primary-foreground`, unselected `bg-muted` with no border. Phone and desktop use one
scrolling row with `Tất cả` pinned first and an edge fade; tablet wraps to 2 rows, rest behind `+3`.

**Search bar.** Full width, 44 high, radius `md`, `border-control-border`, `search` leading, a
44 pt `scan-barcode` icon button trailing, placeholder `Tìm tên, SKU hoặc quét mã vạch`
shortened to `Tìm hoặc quét mã vạch` under 400 pt. Sticky at the top of the catalog; desktop
adds an `F3` hint.

**Cart line.** Row min height 64. Leading: a 40 pt thumbnail, radius `sm`, accent tint at 10
percent, same image and monogram fallback as the tile; preview panes reuse it and tables use it
at 32 pt. Then name weight 600 `variant="label"`, `330ml · chai · 9.000 đ` in
`variant="caption"`, line total right aligned weight 700 tabular. The qty stepper sits under the
name: 44 pt buttons around a 40 pt field, `minus` becoming `trash-2` at qty 1. Swipe left
deletes on phone, desktop shows an `x` on hover. A line discount is a third caption line in
`text-success`.

**Checkout total block.** Bottom of the cart pane on desktop, above the bottom tab bar on
phone. Rows in `variant="label"`: Tạm tính, Giảm giá (`text-success`, minus), Thuế VAT; then a
`border-border-strong` rule, `TỔNG CỘNG` muted with the amount in `variant="title"` weight 700,
then a full width 52 pt `bg-primary` button reading `Thanh toán · 158.000 đ`. The total is
always on the button, following Square.

**Payment.** A 2x2 card grid with icons at every breakpoint, 64 pt rows and 56 on phone; the
selected card takes a 2 pt `border-primary` and an 8 percent primary fill. `segmented-control`
was built first and rejected: `Chuyển khoản` wraps at 375 pt and breaks the control height.
Cash view: tendered field, quick chips `Đủ tiền`, `100.000`, `200.000`, `500.000`, then
`Tiền thừa` in `variant="title"` `text-success`, or `text-destructive` `Còn thiếu` when short.
Split payment appends a `list-group` of applied payments with remove controls, and the pay
button reads `Còn lại 40.000 đ` until the balance is zero.

**Empty states.** `state-message`: 40 pt lucide icon in `text-subtle-foreground`, a
`variant="body"` weight 600 line, one muted `variant="label"` line, and a single action where one
exists. Cart empty: `shopping-cart`, `Giỏ hàng trống`, `Quét mã vạch hoặc chạm vào sản phẩm để
thêm`. Cap the block at 280 pt, aligned to the top third.

**Alert banner rules.** `alert-banner` never sits above the product grid. Shift-not-open is a
40 pt full bleed strip under the app header and the order tab strip, which is shell chrome while
the banner is a transient notice: `bg-warning` at 12 percent, `triangle-alert`, `Chưa mở ca`,
text button `Mở ca`. A banner whose only job is to filter becomes a toolbar chip (Desktop
density rule 5). One banner per screen.

## Several open orders at once

A cashier serves several customers in parallel: A goes back for the fish sauce, B is rung up,
then A returns. The sell screen keeps up to 8 open orders, switchable without losing a line.

**Placement.** Shell chrome, same slot at every width: under the app header, above the shift
banner and the search bar. On desktop it spans the full working width rather than the 380 pt
cart pane, which holds only 2 tabs, and KiotViet places multi-bill tabs the same way
(<https://www.kiotviet.vn/cap-nhat-giao-dien-ban-hang/>).

**Strip and tab.** Strip 48 pt, `bg-surface-muted`, bottom `border-border`; tabs scroll
horizontally, the new-order button is a 48 pt square pinned outside the scroller, and scrolling
is the only overflow mechanism (2 tabs visible on phone, 5 at 768, 8 at 1440). A tab is 36 pt,
radius `md`, `variant="label"` weight 600: a 3 pt primary accent bar (active only), `Đơn 1`, a
`badge` line count, the total in weight 700 tabular, then the close control (active only).
Active is `bg-surface` with `border-border-strong`; inactive is transparent
`text-muted-foreground`. An empty order shows `Trống` instead of the badge and total.

**Close.** Only the active tab carries one; on touch a close on every tab produces mis-taps, so
closing another order means selecting it first. It is a 32 pt square, the one documented
exception to the 44 pt rule, paid for by the confirmation: closing an order with lines opens an
`alert-dialog` naming the order, its line count and total, with a destructive confirm. An empty
order closes with no dialog.

**Limit, keyboard, persistence.** 8 open orders; at 8 the new-order button disables and a
`toast` says `Tối đa 8 đơn cùng lúc. Hoàn tất hoặc đóng bớt một đơn.` On web `Alt+1` to `Alt+8`
switch, `Alt+N` opens, `Alt+W` closes through the same confirmation; `Ctrl/Cmd+number` is
rejected, browsers bind it to tab switching. Open orders live in memory and a reload discards
them, so no `đã lưu`, no draft badge, no restore prompt.

**Which BeeUI component.** An app-owned composite: a horizontal `ScrollView` of `Pressable`
rows using `Badge`, `Text` and `IconButton`. `Tabs` is out because a trigger "cannot carry its
own press handler" and "pressing the active tab does nothing"
(<https://beeui.beemvp.com/docs/components/tabs/>), which kills the close control;
`Chip`/`ChipGroup` documents no remove affordance or trailing slot
(<https://beeui.beemvp.com/docs/components/chip/>); `SegmentedControl` cannot scroll.

**Name the order everywhere else.** Cart bar reads `Đơn 1 · 4 mặt hàng`, the desktop cart pane
header reads `Đơn 1` not `Giỏ hàng`, checkout shows a static `Đơn 1` badge with no strip because
switching order mid payment is never correct. Completing a payment returns the cashier to the
next open order; if none remains, a fresh `Đơn 1` is created.
