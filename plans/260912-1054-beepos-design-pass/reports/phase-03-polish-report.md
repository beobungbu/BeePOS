# Phase 3 report · polish after the restyle

Worker: phase 3 polish · 2026-09-12 · working tree left uncommitted for review.
Scope: the `## App` list of `plans/260912-1054-beepos-design-pass/phase-03-polish.md` except the
last two (large Dynamic Type and the VoiceOver / TalkBack pass), which are another worker's.

## What changed, per item

### 1. Tendered amount formats while typing
`src/features/pos/lib/money-draft.ts` (new, pure) plus
`src/features/pos/components/money-input.tsx`: state stays digits (`200000`), the field shows
`200.000 đ` through `formatVND`, so nothing downstream parses a formatted string and the
payment draft is untouched. The cash, transfer and card amount fields all use it; points stay a
plain number field because points are not money.

Deleting needed a rule: the caret sits after the ` đ` suffix, so the first backspace removes a
character that is not a digit. A shorter text that still yields the same digits therefore means
"drop the last digit" (`nextMoneyDigits`). Measured on web: typing `2 0 0 0 0 0` gives
`2 đ`, `20 đ`, `200 đ`, `2.000 đ`, `20.000 đ`, `200.000 đ`, one keystroke per digit, and three
backspaces give `20.000 đ`, `2.000 đ`, `200 đ`. Junk characters are ignored (`abc5` appends 5).
Quick chips still fill the field (`500.000 đ` after pressing `500.000`), and the e2e journey's
`fill('500000')` on `Tiền khách đưa` still works, which is what the 8/8 run below proves.
9 jest cases cover the helpers.

### 2. `/reports` period control at 375
`period-filter.tsx` keeps `SegmentedControl` from 768 up and renders a horizontally scrolling
chip row below it, with the same four values (`today`, `7d`, `30d`, `custom`) and the same
labels, so no locale string and no e2e selector moves. Chips are 36 pt, radius `full`,
`bg-primary` + `text-primary-foreground` when selected and `bg-muted` when not, with
`accessibilityRole="radio"` and the selected state on every chip.

Measured at 375: the segmented control was 4 segments of 81 pt and **58 pt tall** (every label
wrapped to two lines); the chip row is **36 pt tall** and scrolls, `Tuỳ chọn` bleeding past the
right edge exactly as the chip rule in the direction doc asks.

### 3. One shared 40 pt thumbnail
`src/components/product-thumb.tsx` replaces the three copies:
`src/features/products/components/product-thumb.tsx` and
`src/features/orders/components/order-line-thumb.tsx` are deleted, and the POS cart line no
longer borrows `ProductImageSlot` (its `compact` prop is gone with it). Call sites: product
table, product phone rows, product form (at 72), order lines list (detail and preview pane),
cart line.

The three copies hashed the category id three different ways, so one category could read as
three colours. The shared component takes the accent from `useCategoryAccent`, which the tile
already used, so a product now has one colour everywhere;
`src/features/pos/lib/category-accent.ts` moved to `src/lib/category-accent.ts` because it is no
longer a POS-local concern.

### 4. `ShellHeader` carries the screen title
`src/components/shell/screen-header.ts` (new): a screen registers `{ title, subtitle, badge,
backTo }` with `useScreenHeader(...)` and `ShellHeader` renders it, so the mockup's
`Đơn hàng` over `Tạp hoá Cầu Giấy · 7 ngày · 56 kết quả` is one row, not two.

The store is keyed by route path, not a single slot: a pushed route leaves the screen under it
mounted, so "last writer wins" would leave a detail screen wearing the list's title. A screen
that registers nothing falls back to the store name, which is what `/pos` and every detail
route do today.

Converted: orders, customers, products, inventory, reports, stores, staff, settings (title row
or `Section title` removed, page actions kept), and checkout, receipt and shift, which now pass
`backTo: '/pos'` so the header carries the back control. On phone the header shows the screen's
own line (counts, result totals); from tablet up it shows `store · screen line`, because at 375
the two together truncate both.

`pos-sub-header.tsx` stays for `/pos/cart` alone: that header carries a trailing control (clear
cart), and a node in the header store would make the registration re-render on every frame.
The checkout badge `Đơn 1` moved to the header's badge slot; the `Còn N đơn đang mở` badge
became part of the header subtitle from tablet up.

### 5. `Product.variantLabel`
`variantLabel?: string` on `Product` in `src/domain/types.ts`, filled from the seed's own
`variant.label`, so all 120 SKUs carry the exact variant (`330ml`, `Lốc 6 lon`, `Gói 75g`,
`Thùng 24 chai`) with no string splitting. `variantAndUnit()` in `src/domain/catalog.ts` (6 jest
cases) composes `330ml · chai` and falls back to the unit alone; the tile and the cart line both
use it.

### 6. Order strip auto-scroll at 7 and 8 open orders
It did not work and now does. The old rule scrolled by index and only when the active order was
the first or last, so at 1440 with 8 open orders, selecting `Đơn 5`, `Đơn 6` or `Đơn 7` left the
tab off screen. Measured before, scroller right edge 1012:

| Orders | Alt+1..4 | Alt+5 | Alt+6 | Alt+7 | Alt+8 |
|---|---|---|---|---|---|
| 7 before | in view | x=953..1132 off | x=1129..1309 off | in view | |
| 8 before | in view | off | off | x=1306..1484 off | in view |
| 7 after | in view | in view | in view | in view | |
| 8 after | in view | in view | in view | in view | in view |

The strip now measures each tab (`onLayout`), tracks its own scroll offset and viewport, and
scrolls only when the active tab is not fully visible, with one tab's padding of margin. A tab
opened by `Alt+N` reveals itself from its own `onLayout`, because it is measured after the
effect runs, and a closed tab's measurement is dropped so a stale x can never drive a scroll.

### 7. Phone catalogue: 3 columns under 400
`usePosLayout` returns 3 columns and `compactTiles` under 400 pt, 2 columns from 400 to 767 and
4 from 768, unchanged. The compact tile drops one type step (name `caption`, price `label`),
padding 10 to 8, and the stock pill drops its warning glyph so `Sắp hết 6` stays on one line.

**Tiles above the fold at 375 x 812, counted as tiles whose bottom edge is inside the viewport:**

| Width | Before | After |
|---|---|---|
| 375 | **2** fully (2 more partly), tile 167.5 x 273.5 | **6** fully (3 more partly), tile 109 x 189 |
| 390 | **2** fully (2 more partly), tile 175 x 281 | **6** fully (3 more partly), tile 114 x 194 |
| 414 | 2 fully (2 more partly) | 2 fully, unchanged: 2 columns from 400 up |

Before was measured on a clean checkout of `HEAD` with the same script and the same rule.

### 8. Phone page gutter on login and select-store
Login was flush against both screen edges: the auth layout put `px-4` on `SafeArea`, and
`SafeArea` drops it (finding 15-01). The gutter moved to a `View` inside it. Measured at 375:
the store-code field was x=0, width 375; it is now x=16 with 16 pt on both sides.
Select-store was already correct at 16 (its rows use a plain padded `View`), verified, not
changed.

## Two things found while doing the above

**The whole type scale was a no-op** (finding 15-02). `text-caption`, `text-label`,
`text-heading` and `text-title` generate no CSS in this toolchain, so every screen from phase 2
has been rendering at body size, 16 / 24. It surfaced here because the 3 column tile sized its
name box for 2 x 16 while the name drew at 2 x 24 and overlapped the variant line. Fixed by
using BeeUI's `variant` prop in the components this phase touched: product tile, stock badge,
40 pt thumbnail, cart line, app header, report period chips. **The rest of the tree still
writes the scale as class names and still renders flat** (product table, orders, customers,
inventory, reports, settings, receipt, shift, auth). That is a tree-wide sweep, not a polish
item, and it is the single highest-value follow-up out of this phase.

**A wildcard inside a bracketed utility, in a markdown file, breaks `expo export`** (finding
15-03). Writing the findings doc failed the export with
`SyntaxError: SyntaxError in global.css: Unexpected token Delim('*')`, naming a file that has
six clean lines in it. Tailwind scans the project, documentation included. The line was
reworded; do not write wildcard utilities in docs.

## Deviations

1. `/pos/cart` keeps its own header row, see item 4. Every other pushed POS route moved.
2. The checkout `Còn N đơn đang mở` badge is now text in the header subtitle (tablet and up),
   not a second badge: the header badge slot takes one short string by design.
3. The direction doc's grid rule says "if 2 lines of `text-label` do not fit, drop a column".
   Item 7 asks for the opposite trade at 375 and names the smaller step, so the compact tile
   takes 3 columns at `caption`. Long names still clamp at 2 lines with an ellipsis.
4. Stores and staff keep their `Section`, now with only an `action`. `Section` renders the
   header row for an action alone, so the button stays end-aligned where it was.

## Gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | pass |
| `npm test` | pass, 193 tests in 12 suites (11 new: 3 for `variantAndUnit`, 8 for the money field) |
| `npx expo export --platform all` | pass: web 3561 modules, android 4317, ios 4084 |
| `npm run qa:e2e` | 8 passed (7.1m), wide and narrow x vi/en x light/dark |
| Console errors, 1440, 8 screens (`/products`, `/inventory`, `/customers`, `/stores`, `/staff`, `/settings`, `/reports`, `/pos/shift`) | 0 |
| `bg-card`, `bg-accent`, em dash in `src/` and `app/` | none |
| vi / en dictionaries | untouched this phase, still key-for-key equal |

## Screenshots

`docs/design/after/`: `pos-375.png`, `checkout-375.png`, `reports-375.png`, `orders-1440.png`
refreshed. `docs/screenshots/e2e-*.png` are rewritten by the e2e run, as in every phase.

## Files

New: `src/components/product-thumb.tsx`, `src/components/shell/screen-header.ts`,
`src/features/pos/components/money-input.tsx`, `src/features/pos/lib/money-draft.ts`,
`src/features/pos/lib/__tests__/money-draft.test.ts`,
`docs/beeui-audit/findings-15-polish.md`.
Moved: `src/features/pos/lib/category-accent.ts` to `src/lib/category-accent.ts`.
Deleted: `src/features/products/components/product-thumb.tsx`,
`src/features/orders/components/order-line-thumb.tsx`.
Modified: 31 files across `src/components`, `src/domain`, `src/data/seed`, `src/features/{pos,
orders,customers,products,inventory,reports,stores,staff,settings,auth}`. No file under
`scripts/qa/e2e/**` was changed.
