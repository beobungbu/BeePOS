# BeePOS design direction

Status: v3 · 2026-09-12 · single reference for build phases · author: design

Token values were read from the theme CSS the deployed app ships (the compiled
`@beemvp/beeui-tokens/theme.css`) and cross-checked against
<https://beeui.beemvp.com/docs/reference/tokens/> and <https://beeui.beemvp.com/docs/theming/>.
Hex appears here only as a token's documented value; app code uses the class name.

## 1. Breakpoints and shell

| Band | Width | Shell | POS |
|---|---|---|---|
| phone | < 768 | compact header + bottom tab bar (5 slots) | catalog only, docked cart bar, cart is the pushed route `/pos/cart` |
| tablet | 768 to 1279 | 72 pt icon rail, labels under icons | catalog full width, docked cart bar, cart is `/pos/cart` |
| desktop | >= 1280 | 240 pt sidebar, collapsible to the rail | two pane: catalog + 380 pt cart pane, always visible |

Rail over sidebar on tablet is deliberate: the shipped build spends 490 pt of a 768 pt screen
on a sidebar card, which is why names truncate to `Trà xan...`; the rail gives the catalog
roughly 170 pt back. Bottom tabs (phone): Bán hàng, Đơn hàng, Sản phẩm, Kho hàng, Thêm;
everything else sits behind Thêm. Rail and sidebar carry all nine plus Cài đặt at the bottom.

Sheet is banned on native (it never presents on iOS): anything that would be a sheet is a pushed route on phone and tablet, and a Dialog on desktop only.

### Desktop density (>= 1280)
On the shipped build at 1440x900, chrome before the first data row was 55 percent on
`/inventory`, 35 on `/orders`, 27 on `/reports`. Seven rules, desktop only:

1. **Sidebar collapses to the 72 pt rail.** Chevron toggle pinned at the bottom of the sidebar
   or rail, `[` on web, preference persisted in the settings store. `/pos*` forces the rail for
   focused selling while remembering the preference elsewhere; the toggle still works in POS.
2. **Header is one 48 pt row.** Screen title with its subtitle inline and muted on the left;
   store switcher chip `HN01 · Tạp hoá Cầu Giấy` (a `dropdown-menu` listing the staff's stores,
   address inside the menu) then the avatar on the right. The separate page title block is gone
   and the address never appears in the header.
3. **Toolbar is one 56 pt row** under the header: search and filters left, primary actions
   right. The result count appears only in the pagination footer, never twice.
4. **Stats are a 64 pt borderless strip**, label above value, vertical separators, no cards.
   Reports keeps cards because they carry deltas and sparklines.
5. **A warning chip replaces a banner** that exists only to filter: inventory's low stock
   `alert-banner` becomes `17 sắp hết` in the toolbar and toggles the filter, retiring the
   `Tồn kho / Sắp hết` tab pair.
6. **POS category chips are one scrolling row** with an edge fade and wheel or drag scroll.
   The order strip and the shift strip stay.
7. **Table rows are 48 pt** on desktop against 56 at 768, with a 32 pt thumbnail in the
   product column. Admin content caps at 1600 pt centred; POS uses the full width.

At 1440 `/orders` and `/inventory` open with 168 pt of chrome, 18.7 percent, or 208 pt counting
the table header. POS keeps 244 pt because the order and shift strips are load bearing, and the
rail buys a fifth catalog column at 178 pt.

## 2. Colour roles to tokens

Light value first, dark second. Every role is a token that exists in both themes.
| Role | Token / class | light | dark |
|---|---|---|---|
| page background | `bg-background` | `#fff` | `#0b0f14` |
| surface (card, pane) | `bg-surface` | `#fff` | `#121820` |
| sunken surface (catalog bg, table head) | `bg-surface-muted` | `#f9fafb` | `#171e27` |
| elevated (popover, dialog, docked bar) | `bg-surface-raised` | `#fff` | `#1b2430` |
| neutral fill (chip rest, avatar, skeleton) | `bg-muted` | `#f2f4f7` | `#202936` |
| border | `border-border` | `#eaecf0` | `#273241` |
| border strong (table rules, dividers) | `border-border-strong` | `#d0d5dd` | `#3a4656` |
| control border (input, stepper) | `border-control-border` | `#8590a2` | `#667085` |
| text primary | `text-foreground` | `#101828` | `#f2f4f7` |
| text secondary | `text-muted-foreground` | `#667085` | `#a4adba` |
| text muted / placeholder | `text-subtle-foreground` | `#98a2b3` | `#7d8796` |
| brand, primary action | `bg-primary` | `#f59e0b` | `#fbbf24` |
| text on brand | `text-primary-foreground` | `#1f2937` | `#1f2937` |
| neutral strong action | `bg-secondary` | `#111827` | `#e5e7eb` |
| success, paid, positive variance | `text-success` / `bg-success` | `#16a34a` | `#4ade80` |
| warning, low stock, shift not open | `text-warning` / `bg-warning` | `#d97706` | `#fbbf24` |
| danger, refund, delete, over-tender error | `text-destructive` | `#dc2626` | `#f87171` |
| info | `text-info` | `#2563eb` | `#60a5fa` |
| disabled fill / text | `bg-disabled` / `text-disabled-foreground` | `#f2f4f7` / `#98a2b3` | `#202936` / `#667085` |
| focus ring | `ring-focus-ring` | `#b45309` | `#fbbf24` |
| overlay scrim | `bg-overlay` | `#00000080` | `#0009` |
| category accent | `--chart-series-1..4`, `--chart-highlight` | `#0072b2 #009e73 #5f7a00 #be185d #7c3aed` | see dark set |

Rules: `bg-card` and `bg-accent` are **not** BeeUI tokens, they are absent from `theme.css`
and are silent no-ops in `src/` today, so use `bg-surface` and `bg-muted`. Primary is reserved
for one action per screen (Thanh toán, Mở ca, Đăng nhập) plus the selected category chip; low
stock is `warning`, avatars are `muted`. Category colour is decoration, always paired with
text, never the only carrier of meaning. Contrast: `#1f2937` on `#f59e0b` is 6.7:1 and
`#667085` on `#fff` is 5.3:1, both pass AA.

## 3. Icons

Use **`lucide-react-native`** on `react-native-svg` (already in Expo SDK 57). One family on
web and native, tree shaken per icon, stroke and colour are props so icons inherit semantic
tokens, and BeeUI ships no Icon component so the app owns the element it hands to
`IconButton` (<https://beeui.beemvp.com/docs/components/>). `@expo/vector-icons` is rejected:
it mixes five unrelated families and uses font glyphs that ignore stroke weight.

The 20 icons the app needs, lucide names:

`search`, `scan-barcode`, `shopping-cart`, `receipt-text`, `package`, `warehouse`,
`users-round`, `chart-column`, `store`, `settings`, `ellipsis`, `plus`, `minus`,
`trash-2`, `x`, `chevron-right`, `banknote`, `qr-code`, `credit-card`, `triangle-alert`.

Default size 20, 24 in the rail and bottom tabs, stroke 2, colour `currentColor` inherited
from the text token, always inside a 44 pt hit area.

## 4. Type, spacing, radius, elevation, tap targets

Five type steps, all BeeUI tokens, reached through the `variant` prop of BeeUI `Text`:

| Step | how to write it | size / line | use |
|---|---|---|---|
| caption | `variant="caption"` | 12 / 16 | unit, SKU, stock badge, table meta |
| label | `variant="label"` | 14 / 20 | product name, cart line, buttons, tabs |
| body | `variant="body"` (the default) | 16 / 24 | inputs, paragraphs, list primary text |
| heading | `variant="heading"` | 18 / 24 | tile price, section titles, cart subtotal |
| title | `variant="title"` | 24 / 32 | screen title, grand total (weight 700) |

The named utilities `text-caption`, `text-label`, `text-heading` and `text-title` are dead in
this toolchain: they generate no CSS, and `cn()` drops them as a colour when the element also
carries a colour class, so anything written that way silently rendered at body size
(`docs/beeui-audit/findings-15-polish.md`, 15-02). Where the target is not a BeeUI `Text` and
takes only a class string (`ListItem` `titleClassName`, `StatValue`), write the step the way
BeeUI writes it internally: `text-[length:var(--text-label)]` with
`leading-[var(--text-label--line-height)]`.

Weights: 400 body, 500 secondary emphasis, 600 names and section titles, 700 money.
`variant="label"` ships weight 600 of its own, so a label row that should read regular (table
cells, totals rows) states `font-normal`; the other four variants carry no weight. Money uses
tabular figures (`font-variant-numeric: tabular-nums`) so columns align.

Spacing is the 4 pt scale: 0, 4, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64. Page gutter 16 phone,
20 tablet, 24 desktop; grid gap 8 phone, 12 tablet and up. Radius `sm` 6 (chips, badges, image
slot), `md` 10 (inputs, buttons, tiles), `lg` 14 (cards, panes), `xl` 18 (dialogs), `full`
(avatar, stepper). Elevation `flat` by default, `raised` only for the docked cart bar and the
bottom tab bar, `overlay` only for dialog, popover and toast; a card gets a border or a shadow,
never both, and the default is border. Tap targets 44 pt minimum
(`--spacing-touch-target: 2.75rem`), chips 36 high inside a 44 pt row.

**POS grid density rule.** The image slot is reserved at a fixed aspect before load, so the
grid never jumps. The name gets exactly 2 lines and is never clamped shorter; if 2 lines of
`variant="label"` do not fit at the current column count, drop a column. Price is the loudest
element (`variant="heading"`, weight 700) and stock is a `variant="caption"` badge, never a bare
circled number. Columns: 2 at phone, 4 at 768, 5 on desktop beside the 380 pt cart pane once
the sidebar is the rail. Minimum tile width 150.

## 5. Component specs

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

**Stock badge.** `variant="caption"`, radius `full`, padding 2 x 8. Normal `bg-muted` +
`text-muted-foreground`, `Còn 23`. At or under `minLevel`: `bg-warning` tint + `text-warning` +
`triangle-alert` 12 pt, `Sắp hết · 4`. Zero: `destructive` tint, `Hết hàng`.

**Category chips.** Height 36, radius `full`, `variant="label"` weight 500; selected is
`bg-primary` + `text-primary-foreground`, unselected `bg-muted` with no border. Phone and
desktop use one horizontally scrolling row with `Tất cả` pinned first, 8 pt gaps and an edge
fade; tablet wraps to at most 2 rows with the remainder behind `+3`.

**Search bar.** Full width, 44 high, radius `md`, `border-control-border`, `search` leading and
a 44 pt `scan-barcode` icon button trailing. Placeholder `Tìm tên, SKU hoặc quét mã vạch`,
shortened to `Tìm hoặc quét mã vạch` under 400 pt so it never wraps. Sticky at the top of the
catalog; desktop adds an `F3` hint in `variant="caption"` `text-subtle-foreground`.

**Cart line.** Row min height 64. Leading: a 40 pt thumbnail, radius `sm`, accent tint at 10
percent, same image and monogram fallback as the tile; the orders preview pane uses the same
thumbnail and tables use it at 32 pt. Then name weight 600 `variant="label"`,
`330ml · chai · 9.000 đ` in `variant="caption"`, line total right aligned `variant="label"`
weight 700 tabular. The qty stepper sits under the name: 44 pt buttons around a 40 pt field,
`minus` becoming `trash-2` at qty 1. Swipe left deletes on phone, desktop shows an `x` on
hover. A line discount is a third caption line in `text-success`, `Giảm 2.000 đ`.

**Checkout total block.** Bottom of the cart pane on desktop, above the bottom tab bar on
phone. Rows in `variant="label"`: Tạm tính, Giảm giá (`text-success`, with a minus), Thuế VAT;
then a `border-border-strong` rule, `TỔNG CỘNG` in `variant="label"` `text-muted-foreground`
with the amount in `variant="title"` weight 700, then a full width 52 pt `bg-primary` button
reading `Thanh toán · 158.000 đ`. The total is always on the button, following Square.

**Payment.** A 2x2 card grid with icons at every breakpoint, 64 pt rows and 56 on phone; the
selected card takes a 2 pt `border-primary` and an 8 percent primary fill. `segmented-control`
was built first and rejected: `Chuyển khoản` wraps at 375 pt and breaks the control height.
Cash view: tendered field, quick chips `Đủ tiền`, `100.000`, `200.000`, `500.000`, then
`Tiền thừa` in `variant="title"` `text-success`, or `text-destructive` with `Còn thiếu` when
short. Split payment appends a `list-group` of applied payments with remove controls, and the
pay button reads `Còn lại 40.000 đ` until the balance is zero.

**Empty states.** `state-message`: 40 pt lucide icon in `text-subtle-foreground`, a
`variant="body"` weight 600 line, one `variant="label"` `text-muted-foreground` line, and a
single action where one exists. Cart empty: `shopping-cart`, `Giỏ hàng trống`, `Quét mã vạch
hoặc chạm vào sản phẩm để thêm`. Cap the block at 280 pt and align it to the top third.

**Alert banner rules.** `alert-banner` never sits above the product grid. Shift-not-open is a
40 pt full bleed strip under the app header and under the order tab strip, which is shell
chrome while the banner is a transient notice: `bg-warning` at 12 percent, `triangle-alert`,
`Chưa mở ca`, text button `Mở ca`. A banner whose only job is to filter becomes a toolbar chip
instead (see Desktop density rule 5). One banner per screen.

## 6. Nhiều đơn cùng lúc

A cashier serves several customers in parallel: A goes back for the fish sauce, B is rung up,
then A returns. The sell screen keeps up to 8 open orders, switchable without losing a line.
**Placement.** Shell chrome, so the same slot at every width: under the app header, above the
shift banner and the search bar. On desktop it spans the full working width instead of sitting
in the 380 pt cart pane, because 380 pt holds only 2 tabs, because the catalog is identical for
every order, and because KiotViet places multi-bill tabs the same way
(<https://www.kiotviet.vn/cap-nhat-giao-dien-ban-hang/>).

**Strip.** 48 pt tall, `bg-surface-muted`, bottom `border-border`. Tabs scroll horizontally and
the new-order button is a 48 pt square pinned outside the scroller, always reachable. Visible
before scrolling: 2 on phone, 5 at 768, 8 at 1440. No overflow menu; scrolling is the only
overflow mechanism.

**Tab.** 36 pt tall, radius `md`, `variant="label"` weight 600, in order: a 3 pt primary accent
bar (active only), `Đơn 1`, a `badge` with the line count, the total in weight 700 tabular
figures, then the close control (active only). Active is `bg-surface` with
`border-border-strong` and `text-foreground`; inactive is transparent `text-muted-foreground`
with no border. An order with no lines shows `Trống` instead of the badge and total.

**Close.** Only the active tab carries one; on touch the tabs sit next to each other and a
close on every tab produces mis-taps, so closing another order means selecting it first. It is
a 32 pt square, the one documented exception to the 44 pt rule, paid for by the confirmation:
closing an order with lines opens an `alert-dialog` naming the order, its line count and its
total (`Đóng Đơn 2?`) with a destructive confirm. An empty order closes with no dialog.

**Limit and keyboard.** 8 open orders; at 8 the new-order button disables and a `toast` says
`Tối đa 8 đơn cùng lúc. Hoàn tất hoặc đóng bớt một đơn.` On web `Alt+1` to `Alt+8` switch,
`Alt+N` opens, `Alt+W` closes through the same confirmation. `Ctrl/Cmd+number` was rejected:
every major browser binds it to browser tab switching.

**Persistence.** Open orders live in the in-memory cart store and a reload discards them, per
`docs/product-spec.md`. Nothing may imply otherwise: no `đã lưu`, no draft badge, no restore
prompt. Parked bills arrive with a backend and the copy changes then, not now.

**Which BeeUI component.** None of the three candidates fits, so this is an app-owned
composite: a horizontal `ScrollView` of `Pressable` rows using `Badge`, `Text` and
`IconButton`. `Tabs` is out, the docs say a trigger "cannot carry its own press handler" and
"pressing the active tab does nothing", which kills the close control exactly where it lives
(<https://beeui.beemvp.com/docs/components/tabs/>). `Chip`/`ChipGroup` documents no remove
affordance and no leading or trailing slot (<https://beeui.beemvp.com/docs/components/chip/>).
`SegmentedControl` has equal width segments and does not scroll.

**Name the order everywhere else.** The phone and tablet cart bar reads `Đơn 1 · 4 mặt hàng`,
the desktop cart pane header reads `Đơn 1` not `Giỏ hàng`, and checkout shows a static `Đơn 1`
badge with no strip because switching order mid payment is never correct. Completing a payment
returns the cashier to the next open order; if none remains open, a fresh `Đơn 1` is created.


## 7. Forms

Form content is capped at 480 and centred at every breakpoint. Page padding 16 phone, 24
tablet, 32 desktop; field gap 16, group gap 24 (`--spacing-density-form-gap` scales these).
Login and select-store centre vertically under a brand block: a 56 pt rounded `bg-primary`
square with the bee mark, `BeePOS` in `variant="title"` weight 700, one `variant="label"`
`text-muted-foreground` line. Login fields are `Mã cửa hàng` (autocapitalize characters) and
`Mã PIN` (`otp-input`, 4 numeric cells); primary button full width 52 pt. Select-store is a
`list-group` of 72 pt rows: code chip, name weight 600, address caption, `chevron-right`.

## 8. Tables versus lists

Rule: `table` at >= 768, `list-group` below, never a horizontally scrolling table on phone.
Rows are 56 pt at 768 (`--spacing-density-row-height`) and 48 pt on desktop, and link to the
detail route. If a column set does not fit, fold the secondary value under the primary one
(orders folds the time under the code) or drop the column; never clip it.

| Screen | Table columns (tablet+) | List row (phone) |
|---|---|---|
| orders | Mã đơn + giờ, Khách hàng, Thu ngân, Thanh toán, Trạng thái, Tổng tiền (right); drop Thu ngân at 768 | line 1 code + total, line 2 time + customer, line 3 status badge + method |
| products | Sản phẩm, SKU, Danh mục, Giá bán, Tồn kho, Trạng thái | line 1 name + price, line 2 SKU + category, trailing stock badge |
| inventory | Sản phẩm, SKU, Tồn kho, Đặt trước, Khả dụng, Định mức, Trạng thái | line 1 name + available, line 2 SKU + min level, trailing state badge |

Money columns are right aligned and tabular in both modes; status is always a `badge` with a
word, never a bare colour dot.

## 9. Dark mode
Same token names, no per-screen overrides, no conditional colours in components. The only
allowed theme branch in app code is `Uniwind.setTheme('light' | 'dark')`
(<https://beeui.beemvp.com/docs/theming/>). Category accents and the image slot tint follow the
dark chart series automatically because they are tokens; anything needing a dark special case
means the wrong token was used in light.

## 10. Copy rules
Vietnamese is the default and every string ships through `src/i18n`. No em-dash anywhere, in
code or copy. Money is `9.000 đ`: dot thousands separator, non breaking space, lowercase `đ`.
Quantities read `Còn 23`, low stock `Sắp hết · 4`, zero `Hết hàng`. Dates `12/09/2026`, times
`14:32`. Buttons are verb first (`Thanh toán`, `Mở ca`), never `OK`. Destructive confirms name
the object: `Huỷ đơn HD20260912-0007?`, `Đóng Đơn 2?`.
