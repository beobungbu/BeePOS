# BeePOS design direction

Status: v5 · 2026-09-13 · foundations; per-area specs live in `specs/` · author: design

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

## 5. Forms

Form content is capped at 480 and centred at every breakpoint. Page padding 16 phone, 24
tablet, 32 desktop; field gap 16, group gap 24. Login, onboarding and select-store centre
vertically under a brand block: a 56 pt rounded `bg-primary` square with the bee mark, the
wordmark in `variant="title"` weight 700, one muted `variant="label"` line. Primary button full
width 52 pt. Select-store and select-register are a `list-group` of 72 pt rows: code chip, name
weight 600, one caption line, `chevron-right`.

## 6. Tables versus lists

Rule: `table` at >= 768, `list-group` below, never a horizontally scrolling table on phone.
Rows are 56 pt at 768 and 48 pt on desktop and link to the detail route. If a column set does
not fit, fold the secondary value under the primary one (orders folds time under code) or drop
the column; never clip it. Money columns are right aligned and tabular in both modes; status is
always a `badge` with a word, never a bare colour dot. Per-screen column sets:
[`specs/lists.md`](specs/lists.md).

## 7. Dark mode
Same token names, no per-screen overrides, no conditional colours in components. The only
allowed theme branch in app code is `Uniwind.setTheme('light' | 'dark')`
(<https://beeui.beemvp.com/docs/theming/>). Category accents and the image slot tint follow the
dark chart series automatically because they are tokens; anything needing a dark special case
means the wrong token was used in light.

## 8. Copy rules
Vietnamese is the default and every string ships through `src/i18n`. No em-dash anywhere, in
code or copy. Money is `9.000 đ`: dot thousands separator, non breaking space, lowercase `đ`.
Quantities read `Còn 23`, low stock `Sắp hết · 4`, zero `Hết hàng`. Dates `12/09/2026`, times
`14:32`. Buttons are verb first (`Thanh toán`, `Mở ca`), never `OK`. Destructive confirms name
the object: `Huỷ đơn HD20260912-0007?`, `Đóng Đơn 2?`. Percentages use a decimal comma and a
space before the sign, `9,8 %`; a negative amount keeps its sign in front of the number,
`-50.000 đ`. Document codes are `HD` for a retail order, `DH` for a wholesale order, `PN` for
a goods receipt, `PO` for a purchase order, `PGH` for a delivery note, all
`<prefix><yyyymmdd>-<nnnn>`.

## 9. Commerce

Cross-cutting rules that the commerce screens share; the full specs are in
[`specs/commerce.md`](specs/commerce.md).

1. **Wholesale is a per-order switch, not a second app.** `Bán sỉ` lives at the top of the
   cart pane, the order tab carries a `Sỉ` badge, and turning it on changes pricing, units,
   payment methods and VAT presentation for that order only.
2. **Every computed price says where it came from.** A cart line carries a price source label
   coloured by source: `series-1` tint for price list or group, `success` for a quantity tier,
   `highlight` for a promotion, `muted` for a manual override, nothing for the base price. The
   same colours repeat in the pricing screens.
3. **Quantities that convert are written out in full**, `10 thùng x 24 lon = 240 lon`. One
   barcode means one unit, so a case barcode adds a case.
4. **Aging is days overdue, not document age**, in both receivables and payables, with the
   buckets `Chưa đến hạn`, `1-30`, `31-60`, `61-90`, `Trên 90` and a totals row inside the
   table. A `0 đ` cell is `text-subtle-foreground`, never blank.
5. **Money screens state the balance after the action** before the user commits: credit left
   after this order, drawer after this movement, debt after this collection.
6. **A destructive-looking amount is coloured by direction**, not by size: money in
   `text-success`, money out `text-destructive`, and the running balance stays neutral.
7. **Multi step documents put the stepper inside the 56 pt toolbar**, never on its own row:
   purchase orders, wholesale orders and onboarding all use one pattern.
8. **Partial is the normal case.** Purchase orders receive per line, wholesale orders deliver
   per note, collections allocate oldest first; each shows what remains rather than forcing an
   all-or-nothing action.
9. **Nothing imports or posts without a preview** that names, per row, the cause and the
   consequence, and a primary button that counts what will actually happen.
10. **Charts are plain views.** Bars are a div with a percentage width, hourly columns a div
    with a percentage height, peak in `primary` and the rest in `series-1`. No chart library.

## 10. Specs index

| Area | File | Mockups |
|---|---|---|
| POS, cart, several open orders | [`specs/pos.md`](specs/pos.md) | `pos.html`, `checkout.html` |
| Auth, tenant, chain ops | [`specs/auth-tenant.md`](specs/auth-tenant.md) | `auth.html`, `chain-ops.html` |
| List and table column sets | [`specs/lists.md`](specs/lists.md) | `orders.html`, `inventory.html` |
| Commerce: B2B, pricing, money, returns, inventory 2 | [`specs/commerce.md`](specs/commerce.md) | `commerce-sales.html`, `commerce-ops.html` |

All mockups are indexed at `mockups/index.html`.
