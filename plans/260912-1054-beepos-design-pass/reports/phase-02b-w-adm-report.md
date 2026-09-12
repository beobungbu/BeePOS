# Phase 2B report · W-ADM (products, inventory, reports, stores, staff, settings)

Worker: W-ADM · 2026-09-12 · working tree left uncommitted for review.

## What changed

### Shared pieces (new, inside products)
- `src/features/products/components/product-thumb.tsx`: the 40 pt slot of direction doc
  section 5. Category accent tint from the chart tokens, `expo-image` with `contentFit="cover"`
  and a 150 ms transition when the product has a photo, product monogram in the accent colour
  when it does not, same size either way so a list never reflows. Used at 40 in the product
  table and the phone rows, at 72 in the form's image slot.
- `src/features/products/components/stock-badge.tsx`: `Còn 23` neutral, `Sắp hết · 4` warning at
  or under the minimum, `Hết hàng` destructive. A word plus a number, never a bare count.
- `product-list-utils.ts` gained `totalMinLevel`, the comparison point the badge needs, with
  jest cases next to the existing `totalStock`.

### Products
- List header: title, result count caption, `Danh mục sản phẩm` and `Thêm sản phẩm` actions
  moved out of the filter row into the header, as the mockups place page actions. Phone stacks
  the header instead of squeezing the title into a one-character column.
- Filter row: search, category select, status segments. One row on desktop only; at 768 the
  three controls together left the search box too narrow to read its own placeholder, so tablet
  and phone stack them.
- Table (tablet and up), list (phone), per the table-versus-list rule. Desktop shows eight
  columns; at 768 SKU, category and cost are dropped and SKU folds under the product name,
  because eight columns there produced three-line names and a wrapped SKU. Money is right
  aligned and tabular, stock and status are badges, the product cell is a 44 pt pressable that
  opens the form, and the `Thao tác` menu keeps `Sửa` / `Ngừng bán` / `Xoá`.
- The status `Switch` inside the table is gone: status is a badge with a word, and the same
  toggle already lives in the row menu and on the form.
- Phone rows: thumbnail, name, `SKU · danh mục`, price and stock badge trailing.
- Form: capped at 480 and centred, page padding 16 / 24 / 32, grouped into `Thông tin cơ bản`,
  `Giá và thuế`, `Mô tả và trạng thái` and `Tồn kho theo cửa hàng`, with the display-only image
  slot at the top of the first group. The hint says the photo comes from the sample catalogue
  and that uploading is not supported, because it is not. Per-store stock table switches to
  `stacked` on phone. Field labels, the save button and the toast are untouched.
- Variants: the `x` text button is now the `trash-2` icon.

### Inventory
- Header, then the low-stock `AlertBanner`, then the filters, then the data. The banner is the
  one full banner the direction doc allows, and it now sits above the filter row rather than
  between the filters and the stats.
- Stat cards in the admin card style; on the phone each card takes the full row, because
  `272.909.500 đ` wrapped to two lines in a half-width card.
- Table: numbers right aligned and tabular, SKU folded under the product name, status badges.
  `Đủ hàng` is neutral, not solid green: a green badge on 118 healthy rows hides the 17 that
  need attention.
- Phone rows: name with available quantity, `SKU · định mức`, state badge trailing.
- Receipts, transfers and counts lists keep the table/list rule and gain the same number and
  date treatment; the line editor's `x` is now `trash-2`.

### Reports
- `bg-card` on the stat cards is now `bg-surface`.
- Delta badges read `+84.3%` / `-100%` instead of `▲ 84.3%`: a sign survives a screen reader and
  a monochrome print, a coloured triangle does not.
- Period filter no longer stretches the segmented control across 1440, and no longer pushes
  `Xuất báo cáo` onto its own line on desktop.
- The revenue chart's bars take `chart.series-1` instead of `bg-primary`, which the direction
  doc reserves for the one action per screen.
- Every table: money and counts right aligned and tabular, names at label weight 600.
- The screen scrolls (see below).

### Stores, staff, settings
- `bg-card` in `store-detail-screen.tsx` is now `bg-surface` (both cards).
- The bee emoji in the receipt preview is the BeePOS brand mark (`BrandMark`, the amber square
  the auth screens and the sidebar use); the preview's totals are tabular and the hard coded
  `Tổng cộng` string moved into `src/i18n`.
- Store list: table from 768, `ListGroup` rows below, which is where the old build broke the
  rule with a stacked table on the phone.
- Store detail, store new, staff detail, staff new: forms capped at 480, page padding
  16 / 24 / 32, `< Quay lại` replaced by a `chevron-left` icon plus label.
- Staff list rows: the disabled `ChipGroup` in the row description is now a plain caption line.
  Chips are pressables, and nesting pressables inside a `ListItem` row is the defect
  findings-02 and findings-00-05 already documented.
- Settings: capped at 480 and centred, title at `text-title`, and the em-dash in the file's
  doc comment is gone.
- All six areas now derive layout from `useBreakpoint()`; the two local `use-is-wide.ts` copies
  in products and inventory are deleted.

### One fix that was not a restyle
`Screen` owns no scroll behaviour, and nothing in the family provides a scrolling page
container. Settings, reports, store list, store detail, store new, staff list, staff detail and
staff new all rendered clipped at the viewport with no way to reach their last group. Each now
wraps its content in a `ScrollView` with a comment. Filed as 14-23.

## Deviations

1. **Settings groups are not `ListGroup` rows.** The phase file asks for settings groups as
   ListGroup sections. Every group here owns a real control (`SegmentedControl`, `Select`,
   `Textarea`, `Switch`), and `SettingsItem` documents no slot for one; putting a control inside
   its pressable row is the nested-pressable defect already recorded as finding 04-06 in
   `findings-04-reports-admin.md`. The groups keep `Section` + `Field`, and the two groups that
   really are lists (`Tài khoản`, `Về ứng dụng`) keep `ListGroup` and `DescriptionList`. The
   480 cap and the section rhythm give the grouped-settings look the mockups ask for.
2. **Money still prints `₫`, not `đ`.** The direction doc's copy rule says `9.000 đ`.
   `formatVND` in `src/domain/money.ts` uses `Intl.NumberFormat('vi-VN', currency)`, which emits
   `₫`. That file is shared with POS and orders and is not in this worker's ownership, and the
   e2e journey matches on `₫`, so changing it is a cross-worker decision, not a W-ADM edit.
3. **The products table keeps a `Thao tác` column and menu.** The mockups show no actions column,
   but the e2e journey drives the wide product edit through
   `getByRole('button', { name: 'Thao tác' })` then `Sửa`, and W-POS owns the e2e selectors this
   phase. The product name cell is also a pressable that opens the form, which is the mockup's
   behaviour, so the menu is additive.
4. **No `F3` hint on the products search.** The orders mockup shows one, but there is no key
   handler on this screen, and a hint for a shortcut that does nothing is a lie about the
   product. W-POS owns the POS search where the handler lives.
5. **`src/i18n/stores.*.ts` untouched.** Stores i18n was not in the ownership list, so the store
   screens reuse existing keys only.

## Gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | pass, exit 0, whole repo |
| `npm test` | pass, 182 tests in 11 suites (4 new in `src/features/products/__tests__`) |
| Web console on the five screens at 3 widths | zero errors |
| Journey steps that touch W-ADM screens, replayed at 1440 and 375 | products edit + save toast, categories, receipt, count, reports period switch, stores, staff reset PIN: all pass, zero console errors |
| `grep` for `bg-card`, `bg-accent`, emoji, em-dash in the six owned areas | none |

`npm run qa:e2e` itself was not run from this worker: two other workers were editing the same
tree during this phase, and the suite is W-POS's gate. The replay above covers every journey
step that touches a W-ADM screen, using the same selectors and labels.

## Screenshots

`docs/design/after/`, at 375, 768 and 1440: `products-*.png`, `product-form-*.png`,
`inventory-*.png`, `reports-*.png`, `settings-*.png`, plus `reports-dark-1440.png`.
The dark capture reads cleanly: no unreadable text, table headers and muted captions both hold
contrast, and the chart bars follow the dark chart token.

## BeeUI findings

`docs/beeui-audit/findings-14-restyle-w-adm.md`, ids 14-20 to 14-23 (block reserved so the three
parallel 2B workers cannot collide):
- 14-20 major api-types: the documented chart token path `colors.chart-series-1` is not a
  `BeeTokenPath`; the installed type wants `chart.series-1`.
- 14-21 major component-behavior: `TableCell` has no alignment prop and `className="items-end"`
  alone does nothing on web, so a right aligned money column needs `items-end text-right`.
- 14-22 minor component-behavior: a `Badge` directly inside a `TableCell` stretches to the
  column width and needs a `flex-row` wrapper to hug its text.
- 14-23 minor gap: no family member is a scrolling page container, so eight screens in this
  phase each hand rolled the same `ScrollView`.
