# BeePOS design direction

Status: v4 · 2026-09-13 · single reference for build phases · author: design

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

1. **Sidebar collapses to the 72 pt rail.** Chevron toggle at the bottom of the sidebar or
   rail, `[` on web, preference persisted. `/pos*` forces the rail for focused selling while
   remembering the preference elsewhere; the toggle still works in POS.
2. **Header is one 48 pt row**: screen title with its subtitle inline and muted on the left;
   store switcher chip `HN01 · Tạp hoá Cầu Giấy` (a `dropdown-menu` of the staff's stores, with
   the address inside the menu) then the avatar on the right. No separate page title block.
3. **Toolbar is one 56 pt row** under the header: search and filters left, primary actions
   right. The result count appears only in the pagination footer, never twice.
4. **Stats are a 64 pt borderless strip**, label above value, vertical separators, no cards.
5. **A warning chip replaces a banner** that exists only to filter: inventory's low stock
   banner becomes `17 sắp hết` in the toolbar, retiring the `Tồn kho / Sắp hết` tab pair.
6. **POS category chips are one scrolling row** with an edge fade. Order and shift strips stay.
7. **Table rows are 48 pt** on desktop against 56 at 768, with a 32 pt thumbnail in the product
   column. Admin content caps at 1600 pt centred; POS uses the full width.

At 1440 `/orders` and `/inventory` open with 168 pt of chrome, 18.7 percent, or 208 pt counting
the table header. POS keeps 244 pt because the order and shift strips are load bearing, and the
rail buys a fifth catalog column at 178 pt.

### Auth, tenant and chain ops

1. **Identity is email plus password**; the org comes from the account, so login has no chain
   or store code field. PIN is never a login credential, it only unlocks the screen and
   switches cashier, and it is unique per org.
2. **Session order is store then register**, register skipped when the store has one.
   `Session` carries `orgId`, `userId`, `staffId`, `storeId`, `registerId`; changing register
   means logging in again or closing the shift.
3. **Onboarding is 3 `stepper` steps**: chain, first store plus register, owner account.
   Currency is locked to VND and says why; the org code warns it is permanent because it enters
   order codes and the persistence key.
4. **Lock screen** is full screen: 72 pt PIN keys, current cashier avatar and name, no close
   control, and `Đổi thu ngân` for another staff's PIN. Auto-lock after N minutes lives in
   Settings, default 5. Unlocking never touches the cart or the open orders.
5. **Permissions are a matrix**, roles as columns, permissions as rows grouped by area, the
   permission code under the Vietnamese label. The owner column is checked, muted and locked
   with a lock glyph in its header: visible, not editable. A denied permission hides its
   control rather than showing a dead one.
6. **Account status**: `success` Đang hoạt động, `warning` Đã mời, `destructive` Đã khoá, and
   a disabled row also drops to 45 percent opacity.
7. **Suppliers are an entity, not free text**; receipts pick from the list and offer `Thêm nhà
   cung cấp mới` inside the flow. **Store prices** show base, override and effective in one row
   per store including stores with no override; POS reads the effective price of the session store.
8. **Cash movements** use 4 reason chips (Nộp tiền, Rút tiền, Chi vặt, Khác) plus a note and
   show the drawer balance before and after; pushed route on phone, `dialog` on desktop, Sheet
   still banned. **The Z report** is a 320 pt monospace receipt on the real print path, not a
   screen table; print and close shift are one action and explanation never goes on the sheet.
9. **The audit log is read only**, gated by `audit.view`: no row actions, no edit, no delete,
   summary column a sentence carrying amounts and the old value. **Never claim the prototype
   sent an email**: invites and reset codes say the link or code appears in a Toast.

## 2. Colour roles to tokens

Light value first, dark second. Every role is a token that exists in both themes.
| Role | Token / class | light | dark |
|---|---|---|---|
| page / surface / sunken / elevated | `bg-background`, `bg-surface`, `bg-surface-muted`, `bg-surface-raised` | `#fff`, `#fff`, `#f9fafb`, `#fff` | `#0b0f14`, `#121820`, `#171e27`, `#1b2430` |
| border / strong / control | `border-border`, `border-border-strong`, `border-control-border` | `#eaecf0`, `#d0d5dd`, `#8590a2` | `#273241`, `#3a4656`, `#667085` |
| text primary / secondary / muted | `text-foreground`, `text-muted-foreground`, `text-subtle-foreground` | `#101828`, `#667085`, `#98a2b3` | `#f2f4f7`, `#a4adba`, `#7d8796` |
| brand / on brand / neutral strong | `bg-primary`, `text-primary-foreground`, `bg-secondary` | `#f59e0b`, `#1f2937`, `#111827` | `#fbbf24`, `#1f2937`, `#e5e7eb` |
| success / warning / danger | `text-success`, `text-warning`, `text-destructive` | `#16a34a`, `#d97706`, `#dc2626` | `#4ade80`, `#fbbf24`, `#f87171` |
| info / focus ring / scrim | `text-info`, `ring-focus-ring`, `bg-overlay` | `#2563eb`, `#b45309`, `#00000080` | `#60a5fa`, `#fbbf24`, `#0009` |
| neutral fill / disabled | `bg-muted`, `bg-disabled`, `text-disabled-foreground` | `#f2f4f7`, `#f2f4f7`, `#98a2b3` | `#202936`, `#202936`, `#667085` |
| category accent | `--chart-series-1..4`, `--chart-highlight` | `#0072b2 #009e73 #5f7a00 #be185d #7c3aed` | see dark set |

Rules: `bg-card` and `bg-accent` are **not** BeeUI tokens, they are absent from `theme.css`
and are silent no-ops in `src/` today, so use `bg-surface` and `bg-muted`. Primary is reserved
for one action per screen (Thanh toán, Mở ca, Đăng nhập) plus the selected category chip; low
stock is `warning`, avatars are `muted`. Category colour is decoration, always paired with
text, never the only carrier of meaning. Contrast: `#1f2937` on `#f59e0b` is 6.7:1 and
`#667085` on `#fff` is 5.3:1, both pass AA.

## 3. Icons

Use **`lucide-react-native`** on `react-native-svg` (already in Expo SDK 57): one family on web
and native, tree shaken per icon, stroke and colour as props so icons inherit semantic tokens,
and BeeUI ships no Icon component so the app owns the element it hands to `IconButton`
(<https://beeui.beemvp.com/docs/components/>). `@expo/vector-icons` is rejected: five unrelated
families and font glyphs that ignore stroke weight. Default size 20, 24 in the rail and bottom
tabs, stroke 2, `currentColor`, always inside a 44 pt hit area.

Names: `search`, `scan-barcode`, `shopping-cart`, `receipt-text`, `package`, `warehouse`,
`users-round`, `chart-column`, `store`, `settings`, `ellipsis`, `plus`, `minus`, `trash-2`,
`x`, `chevron-right`, `chevron-left`, `banknote`, `qr-code`, `credit-card`, `triangle-alert`,
and for phase 6 `lock`, `mail`, `key-round`, `eye`, `delete`, `truck`, `tag`, `clipboard-list`,
`user-plus`, `printer`, `log-out`, `shield`.

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
`variant="label"` ships weight 600, so a label row that should read regular (table cells,
totals) states `font-normal`; the other four carry no weight. Money uses tabular figures.

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

## 6. Nhiều đơn cùng lúc

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

## 7. Forms

Form content is capped at 480 and centred at every breakpoint. Page padding 16 phone, 24
tablet, 32 desktop; field gap 16, group gap 24. Login, onboarding and select-store centre
vertically under a brand block: a 56 pt rounded `bg-primary` square with the bee mark, the
wordmark in `variant="title"` weight 700, one muted `variant="label"` line. Primary button full
width 52 pt. Select-store and select-register are a `list-group` of 72 pt rows: code chip, name
weight 600, one caption line, `chevron-right`.

## 8. Tables versus lists

Rule: `table` at >= 768, `list-group` below, never a horizontally scrolling table on phone.
Rows are 56 pt at 768 and 48 pt on desktop and link to the detail route. If a column set does
not fit, fold the secondary value under the primary one (orders folds time under code) or drop
the column; never clip it.

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
