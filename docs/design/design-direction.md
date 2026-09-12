# BeePOS design direction

Status: v1 · 2026-09-12 · single reference for phase 2 · author: design

Token values below were read from the theme CSS the deployed app already ships
(`https://beepos.beemvp.com/_expo/static/css/global-*.css`, the compiled
`@beemvp/beeui-tokens/theme.css`) and cross-checked against
<https://beeui.beemvp.com/docs/reference/tokens/> and
<https://beeui.beemvp.com/docs/theming/>. Hex appears in this document only as the
documented value of a token. Application code uses the class name, never the hex.

---

## 1. Breakpoints and shell

| Band | Width | Shell | POS |
|---|---|---|---|
| phone | < 768 | compact header + bottom tab bar (5 slots) | catalog only, docked cart bar, cart is the pushed route `/pos/cart` |
| tablet | 768 to 1279 | 72 pt icon rail, labels under icons | catalog full width, docked cart bar, cart is `/pos/cart` |
| desktop | >= 1280 | 240 pt sidebar with labels | two pane: catalog + 380 pt cart pane, always visible |

Rail over sidebar on tablet is deliberate: the current build spends 490 pt of a 768 pt
screen on a sidebar card, which is why product names truncate to `Trà xan...`.
The rail returns roughly 170 pt to the catalog, one extra column.

Bottom tabs (phone): Bán hàng, Đơn hàng, Sản phẩm, Kho hàng, Thêm. Everything else
(Khách hàng, Báo cáo, Cửa hàng, Nhân viên, Cài đặt) lives behind Thêm.
Rail and sidebar carry all nine plus Cài đặt pinned to the bottom.

Sheet is banned on native (BeeUI Sheet never presents on iOS). Anything that would be a
sheet is a pushed route on phone and tablet, and a Dialog on desktop only.

## 2. Colour roles to tokens

Light values first, dark second. Every role is a token that exists in both themes.

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
| selected chip | `bg-primary` + `text-primary-foreground` | | |
| unselected chip | `bg-muted` + `text-foreground`, no border | | |
| category accent | `--chart-series-1..4`, `--chart-highlight` | `#0072b2 #009e73 #5f7a00 #be185d #7c3aed` | see dark set |

Rules:
- `bg-card` and `bg-accent` are **not** BeeUI tokens. They do not exist in `theme.css`
  and are silently no-ops today in `src/`. Use `bg-surface` and `bg-muted`.
- Primary is reserved for one action per screen (Thanh toán, Mở ca, Đăng nhập) and the
  selected category chip. Low stock is `warning`, not primary. Avatars are `muted`.
- Category colour is decoration and is always paired with text. Colour is never the only
  carrier of meaning.

Contrast check: `#1f2937` on `#f59e0b` is 6.7:1, passes AA for all sizes.
`#667085` on `#fff` is 5.3:1, passes AA for body text.

## 3. Icons

Use **`lucide-react-native`** on top of `react-native-svg` (already in the Expo SDK 57
dependency set). Reasons: one visual family across web and native, tree-shaken per icon,
stroke width and colour are props so icons inherit semantic token colours, and BeeUI has
no Icon component so the app owns the element it hands to `IconButton`
(<https://beeui.beemvp.com/docs/components/>). `@expo/vector-icons` is rejected because it
mixes five unrelated icon families and ships bitmap-free but font-based glyphs that do not
respect stroke weight.

The 20 icons the app needs, lucide names:

`search`, `scan-barcode`, `shopping-cart`, `receipt-text`, `package`, `warehouse`,
`users-round`, `chart-column`, `store`, `settings`, `ellipsis`, `plus`, `minus`,
`trash-2`, `x`, `chevron-right`, `banknote`, `qr-code`, `credit-card`, `triangle-alert`.

Default size 20 (24 in the rail and bottom tabs), stroke 2, colour `currentColor`
inherited from the text token. Icons are always inside a 44 pt hit area.

## 4. Type, spacing, radius, elevation, tap targets

Five type steps, all BeeUI tokens:

| Step | class | size / line | use |
|---|---|---|---|
| caption | `text-caption` | 12 / 16 | unit, SKU, stock badge, table meta |
| label | `text-label` | 14 / 20 | product name, cart line, buttons, tabs |
| body | `text-body` | 16 / 24 | inputs, paragraphs, list primary text |
| heading | `text-heading` | 18 / 24 | tile price, section titles, cart subtotal |
| title | `text-title` | 24 / 32 | screen title, grand total (weight 700) |

Weights: 400 body, 500 secondary emphasis, 600 names and section titles, 700 money.
All money uses tabular figures (`font-variant-numeric: tabular-nums`) so columns align.

Spacing is the 4 pt scale from the tokens page: 0, 4, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64.
Page gutter: 16 phone, 20 tablet, 24 desktop. Grid gap: 8 phone, 12 tablet and up.

Radius tokens: `sm` 6 (chips, badges), `md` 10 (inputs, buttons, tiles), `lg` 14 (cards,
panes), `xl` 18 (dialogs), `full` (avatar, stepper buttons).

Elevation: `flat` everywhere by default. `raised` only for the docked cart bar and the
bottom tab bar. `overlay` only for dialog, popover and toast. The current build outlines
every card with a border and a shadow; pick one, and the default is border only.

Tap targets: 44 pt minimum on every interactive element, which is
`--spacing-touch-target: 2.75rem`. Stepper buttons 44, icon buttons 44, chips 36 high with
4 pt vertical padding inside a 44 pt row so the row is still thumb-safe.

**POS grid density rule.** The product name gets exactly 2 lines and is never clamped to
fewer. If the tile cannot fit 2 lines of `text-label` at the current column count, drop a
column. Price is the loudest element on the tile (`text-heading`, weight 700). Stock is a
`text-caption` badge, never a bare circled number.

Columns: 2 at phone, 4 at 768, 4 at 1280 to 1439 in the two-pane layout, 5 at 1440 and up.
Minimum tile width 150.

## 5. Component specs

**Product tile.** Surface `bg-surface`, border `border-border`, radius `md`, padding 12.
Top row: 36 pt rounded square in the category accent at 12 percent opacity with the product
initials in that accent, plus the stock badge pushed right. Then the name, 2 lines, weight
600. Then variant and unit as one `text-caption` line (`330ml · chai`). Then the price,
`text-heading` weight 700. Pressed state fills `bg-muted`. Quantity already in the cart
shows as a filled primary counter on the top right corner of the tile, replacing the stock
badge. Out of stock: tile at 50 percent opacity, not tappable, badge reads `Hết hàng` in
`destructive`.

**Stock badge.** `text-caption`, radius `full`, padding 2 x 8. Normal: `bg-muted` +
`text-muted-foreground`, text `Còn 23`. At or under `minLevel`: `bg-warning` tint +
`text-warning` + `triangle-alert` 12 pt, text `Sắp hết · 4`. Zero: `destructive` tint,
text `Hết hàng`.

**Category chips.** Height 36, radius `full`, `text-label` weight 500. Selected is
`bg-primary` + `text-primary-foreground`; unselected is `bg-muted` with no border. Phone:
one horizontally scrolling row, `Tất cả` pinned first, 8 pt gaps, gutter bleed so a half
chip is visible at the right edge to signal scrollability. Tablet and desktop: wrap, max 2
rows, then the remainder collapses behind a `+3` chip.

**Search bar.** Full width, height 44, radius `md`, `border-control-border`, `search` icon
leading, `scan-barcode` icon button trailing (44 pt). Placeholder
`Tìm tên, SKU hoặc quét mã vạch`. Sticky at the top of the catalog column, sitting on
`bg-surface` with a bottom border once the grid scrolls under it. Desktop adds a trailing
`F3` key hint in `text-caption` `text-subtle-foreground`.

**Cart line.** Row min height 64. Left column: name weight 600 `text-label` on line 1,
`330ml · chai · 9.000 đ` in `text-caption` on line 2. Right column: line total
`text-label` weight 700, tabular. Below right: the qty stepper, 44 pt buttons with a 40 pt
numeric field between them, `minus` turns into `trash-2` at qty 1. Swipe left on phone
reveals delete; desktop shows an `x` icon button on hover. Line discount renders as a
third caption line in `text-success`, `Giảm 2.000 đ`.

**Checkout total block.** Pinned to the bottom of the cart pane on desktop, pinned above
the bottom tab bar on phone. Rows in `text-label`: Tạm tính, Giảm giá (in `text-success`
with a minus), Thuế VAT. Then a `border-border-strong` rule, then `TỔNG CỘNG` in
`text-label` `text-muted-foreground` with the amount in `text-title` weight 700. Then a
full width 52 pt `bg-primary` button reading `Thanh toán · 158.000 đ`. The total is always
on the button, following Square.

**Payment.** Method chooser is the same 2x2 card grid with icons at every breakpoint, 64 pt
rows, selected card takes a 2 pt `border-primary` and an 8 percent primary fill. A
`segmented-control` was tried first and rejected: `Chuyển khoản` wraps at 375 pt and breaks
the control height. Cash view: tendered field,
then quick chips `Đủ tiền`, `50.000`, `100.000`, `200.000`, `500.000`, then `Tiền thừa` in
`text-title` `text-success`, or in `text-destructive` with `Còn thiếu` when short.
Split payment appends a `list-group` of applied payments each with a remove control, and
the pay button label switches to `Còn lại 40.000 đ` until the balance is zero.

**Empty states.** `state-message` with a 40 pt lucide icon in `text-subtle-foreground`, a
`text-body` weight 600 line and one `text-label` `text-muted-foreground` line, plus a
single action where one exists. Cart empty: `shopping-cart`, `Giỏ hàng trống`,
`Quét mã vạch hoặc chạm vào sản phẩm để thêm`. Never centre an empty state in a 600 pt
void the way the current build does; cap the block at 280 pt and align it to the top third.

**Alert banner rules.** `alert-banner` never sits above the product grid. Shift-not-open
renders as a 40 pt strip directly under the app header, full bleed, `bg-warning` at 12
percent, `triangle-alert` + `Chưa mở ca` + a text button `Mở ca`. Low stock on
`/inventory` is the only place a full alert-banner block is allowed, and it sits above the
filters, not above data. One banner maximum per screen.

## 6. Forms

Form content is capped at 480 and centred, regardless of breakpoint. Page padding: 16
phone, 24 tablet, 32 desktop. Field gap 16, group gap 24 (`--spacing-density-form-gap`
scales these under compact density).

Login and select-store are centred vertically with a brand block on top: a 56 pt rounded
`bg-primary` square carrying the bee mark, the wordmark `BeePOS` in `text-title` weight
700, and one `text-label` `text-muted-foreground` line under it. Login fields: `Mã cửa
hàng` (uppercase, autocapitalize characters) and `Mã PIN` (`otp-input`, 4 cells, numeric).
Primary button full width, 52 pt. Select-store renders stores as a `list-group` of 72 pt
rows: store code chip, name weight 600, address in caption, `chevron-right` trailing.

## 7. Tables versus lists

Rule: `table` at >= 768, `list-group` below. Never a horizontally scrolling table on phone.
Every table row keeps a 56 pt height (`--spacing-density-row-height` is 3.5rem) and is a
link to the detail route.

| Screen | Table columns (tablet+) | List row (phone) |
|---|---|---|
| orders | Mã đơn, Thời gian, Khách hàng, Thu ngân, Thanh toán, Trạng thái, Tổng tiền (right) | line 1 code + total, line 2 time + customer, line 3 status badge + method |
| products | Sản phẩm, SKU, Danh mục, Giá bán, Tồn kho, Trạng thái | line 1 name + price, line 2 SKU + category, trailing stock badge |
| inventory | Sản phẩm, SKU, Tồn kho, Đặt trước, Khả dụng, Định mức, Trạng thái | line 1 name + available, line 2 SKU + min level, trailing state badge |

Money columns are right aligned and tabular in both modes. Status is always a `badge`
with a word, never a bare colour dot.

## 8. Dark mode

Same token names, no per-screen overrides, no conditional colours in components. The only
allowed theme branch in app code is `Uniwind.setTheme('light' | 'dark')`, per
<https://beeui.beemvp.com/docs/theming/>. Category accents switch to the dark chart series
values automatically because they are tokens. Anything that needs a special case in dark
means the wrong token was used in light.

## 9. Copy rules

Vietnamese is the default and every string ships through `src/i18n`. No em-dash anywhere,
in code or in copy. Money is `9.000 đ`: dot thousands separator, a non breaking space, a
lowercase `đ`. Quantities read `Còn 23`, low stock reads `Sắp hết · 4`, zero reads
`Hết hàng`. Dates are `12/09/2026`, times are `14:32`. Buttons are verb first
(`Thanh toán`, `Mở ca`, `Thêm sản phẩm`), never `OK`. Destructive confirmations name the
object: `Huỷ đơn HD20260912-0007?`.
