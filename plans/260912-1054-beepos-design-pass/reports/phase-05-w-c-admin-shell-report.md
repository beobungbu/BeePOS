# Phase 5 · W-C · admin, shell, command palette, export, dark sweep

Worker: W-C · 2026-09-13 · Metro on 8103 · login HN01 / 1234 · nothing committed.

## Gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | pass |
| `npm test` | 20 suites, 276 tests, pass (adds `command-search` 20 and `csv` 14) |
| `npm run qa:e2e` (journey spec) | 8/8 pass, 7.0 min, no console or page errors |
| `npx expo export --platform all` | pass (web 5.4 MB, ios 7.3 MB, android 7.5 MB) |

The first full `qa:e2e` run showed two failures (`journey en dark` wide and W-A's new
`pos-features` spec) with `ENOENT ... /test-results/.playwright-artifacts-1/traces/...`: another
worker was running Playwright into the same `test-results/` directory at the same time. Re-running
`specs/journey.spec.ts` alone with a private `--output` gave 8/8. The pos-features spec is W-A's
and was not run again.

## What shipped

1. **Header store chip is a control.** `HN01 · Tạp hoá Cầu Giấy` is now a 44 pt ghost trigger with
   a chevron, a `bg-muted` hover fill and an `active:` pressed fill, and its accessible name reads
   `Đổi cửa hàng · HN01 · Tạp hoá Cầu Giấy`. A single-branch cashier still gets a plain label with
   no chevron, because a chevron promising a menu that cannot open is worse than a caption.
   Two BeeUI gaps had to be worked around: the trigger takes no pointer callbacks (wrapper `View`
   with `onPointerEnter`) and the app's icon set has no `chevron-down` (`chevron-right` rotated a
   quarter turn, because `src/components/icons.tsx` is excluded from this block's ownership; swap
   it for a real `chevron-down` when the icon list is next touched).
2. **Back controls on the four missing pushed routes.** staff detail, staff new, store detail and
   store new now register `useScreenHeader({ title, backTo })`, so the back control sits in the app
   header like every other pushed route, and the old inline `Quay lại` ghost button is gone from
   all four (it was the pre-header pattern and would now be a second back control on the same
   screen).
3. **Command palette and shortcut help.** `Cmd/Ctrl+K` (and a header search button from 768 up)
   opens a Dialog over `SearchInput` with results grouped `Màn hình · Sản phẩm · Đơn hàng ·
   Khách hàng`, at most 5 rows per group, arrow keys wrapping, Enter to open, Esc to close. An
   empty query lists the nine screens only. Ranking is pure in `src/lib/command-search.ts`:
   Vietnamese is folded to unaccented lowercase (`nuoc ngot` finds `Nước ngọt`, `đ` folded by
   hand), every query token must match, a title prefix outranks a word prefix outranks a
   substring, and SKU, barcode and phone match without being shown. `?` opens the shortcut list.
4. **CSV export** on orders, products and inventory. `src/lib/csv.ts` is the pure formatter (RFC
   4180 quoting, CRLF, money as a plain integer of đồng, no grouping and no `đ`), `src/lib/
   export-file.ts` does the platform half (web Blob download with a UTF-8 BOM, native
   `Share.share`), and `src/components/csv-export-button.tsx` is the one button all three screens
   use. Each export writes the rows the filters selected, not the page on screen, and reports the
   outcome in a toast (a failed download is never silent). Filenames are localised:
   `don-hang-20260913.csv` / `orders-20260913.csv`.
5. **Settings: `Đặt lại dữ liệu mẫu`.** A `Dữ liệu` section above `Tài khoản`, an `AlertDialog`
   naming what is lost, and `resetDemoData()` from `src/data/persistence-bootstrap.ts`. W-B's file
   was already in the tree when this step ran, so **no stub was needed and nothing has to be
   rewired**; the import is the real one and the confirm path is guarded with a busy flag, a
   `console.error` and a destructive toast.
6. **Dark sweep** at 1440: 33 screenshots under `docs/design/after/dark/`, plus a scripted WCAG
   pass that walks every rendered leaf text node on each screen. Details below.

## Dark mode: fixed

Measured with a contrast script (effective background resolved by walking ancestors, 4.5:1 for
body text, 3:1 for large). Before: 8 admin screens carried 40+ nodes below AA. After: zero.

| Issue | Where | Fix |
|---|---|---|
| Every `<th>` in every table was `#000` on `#0b0f14`, 1.09:1 (`Mã cửa hàng`, `Địa chỉ`, `Cửa hàng`, `Nhà cung cấp`, …) | stores, customers, reports, inventory, receipts, transfers, counts | `text-foreground` on the shell's outer `SafeArea` (`app-shell.tsx`). BeeUI's web `Table` emits raw `<th>` with no colour class, so it inherited the document colour; one declaration at the root fixed 40+ nodes. Finding 18-01. |
| Whole `/pos/shift` table body, 1.18:1 | pos/shift (W-A's screen, fixed from the shell) | same root fix |
| Avatar initials `#000` on the muted circle, 1.43:1 | sidebar, header, customers list and table, staff list, customer detail | `fallbackClassName="text-foreground"` at all six call sites. Finding 18-02. |
| `Xuất báo cáo` 1.22:1, `In thử` 1.22:1 | reports toolbar, settings printer row | `ButtonLabel` paints `text-primary-foreground` whatever the variant; `className="text-foreground"` on both. Finding 18-03. |
| Toolbar clipped its primary action off the right edge at 1440 (`Thêm sản phẩm`, `Xuất CSV`) | products, orders | `Toolbar` is now `min-h-14 flex-wrap` instead of a fixed `h-14` single row. See the trade-off note below. |

## Dark mode: left (owner)

| Issue | Owner | Note |
|---|---|---|
| POS toast covers the order tab strip and the search field at 1440 (`Đã thêm vào giỏ` stacks two deep over the chrome) | W-A / BeeUI `Toast` placement | visible in `docs/design/after/dark/pos-cart-1440.png`; placement is a Toast provider concern, not a token one |
| POS outline buttons still use `ButtonLabel` without a colour class: receipt `In hoá đơn` / `Chia sẻ`, cart bar `Xem giỏ hàng`, order note and order discount dialog triggers | W-A | same one-line fix as reports and settings (`className="text-foreground"`), but the files are W-A's this phase |
| `select-store` avatar initials keep the black fallback | auth (unowned this phase) | `fallbackClassName="text-foreground"`, same as the six fixed here |
| `Avatar`, `ButtonLabel`, `<th>` defaults | BeeUI | filed as 18-01, 18-02, 18-03 in `docs/beeui-audit/findings-18-w-c.md`, with repro, measurement and suggested fix |
| Reports `Tỷ trọng` progress tracks are faint in dark | BeeUI `Progress` track token | decorative, paired with a `0%` label, so it carries no meaning alone; not filed |

## Trade-off worth the owner's eye

The desktop toolbar now wraps instead of clipping. At 1440 with the **sidebar expanded**, orders
and products cannot hold their filters plus three actions on one 56 pt row, so the actions drop to
a second row (chrome goes from 168 pt to about 212 pt on those two screens). With the **rail**, the
documented focused state, both stay on one row (measured: export button and search field share
y=48). Phase 4 fixed the toolbar at one row that never wraps; wrapping is the smaller sin than a
`Thêm sản phẩm` button rendered past the right edge of the viewport, which is what the extra
export button caused. If the one-row rule matters more than the label, the export control can
become an icon button later.

## Notes and deviations

- **`F8` is not in the shortcut list.** The phase text lists `F3, F8, F9, Alt+1..8, Alt+N, Alt+W,
  [, Cmd+K`; nothing in `src/` binds `F8` (`grep` finds only F3 in the POS and orders search and
  F9 in the cart pane). The dialog lists the shortcuts that exist, plus `?` and `Esc`, rather than
  advertising a key that does nothing. Add the row when someone binds `F8`.
- `src/lib/keyboard.ts` now owns `isTypingTarget` (moved out of `sidebar-toggle.tsx`, which
  imports it) plus the `Cmd/Ctrl+K` chord test, so the three app-level shortcut listeners share
  one definition of "the cashier is typing".
- No E2E label changed. The new controls are additive and carry names the journey does not use
  (`Tìm nhanh`, `Xuất CSV`, `Đặt lại dữ liệu mẫu`).
- vi and en dictionaries stay key-for-key equal (`dictionary-parity` test passes); `orders.table
  .time` was added for the CSV date column.

## Files

New: `src/lib/command-search.ts`, `src/lib/csv.ts`, `src/lib/export-file.ts`,
`src/lib/keyboard.ts`, `src/lib/__tests__/command-search.test.ts`, `src/lib/__tests__/csv.test.ts`,
`src/components/command-palette.tsx`, `src/components/shortcut-help.tsx`,
`src/components/csv-export-button.tsx`, `src/components/shell/overlay-store.ts`,
`src/features/settings/components/reset-data-section.tsx`, `docs/beeui-audit/findings-18-w-c.md`.

Changed: `src/components/shell/{app-shell,shell-header,sidebar,sidebar-toggle}.tsx`,
`src/components/toolbar.tsx`, `src/features/orders/{screens/orders-list-screen,components/order-filters-bar}.tsx`,
`src/features/products/product-list-screen.tsx`, `src/features/inventory/inventory-screen.tsx`,
`src/features/reports/report-screen.tsx`,
`src/features/settings/{settings-screen,components/printer-section}.tsx`,
`src/features/staff/{staff-detail-screen,staff-new-screen,staff-list-screen}.tsx`,
`src/features/stores/{store-detail-screen,store-new-screen}.tsx`,
`src/features/customers/{components/customer-table,components/customer-list-group,screens/customer-detail-screen}.tsx`,
`src/i18n/{common,orders,settings}.{vi,en}.ts`.

Nothing outside the W-C ownership list was touched: `src/components/icons.tsx`, POS, the stores
under W-B, `app/_layout.tsx` and the E2E `lib/` are untouched.

## Screenshots

`docs/design/after/`: `command-palette-1440`, `shortcut-help-1440`, `store-chip-hover-1440`,
`orders-export-1440`.

`docs/design/after/dark/` (33 at 1440): pos, pos-cart, pos-checkout, pos-shift, orders,
order-detail, products, product-detail, product-new, product-categories, inventory,
inventory-receipts, inventory-receipt-new, inventory-transfers, inventory-transfer-new,
inventory-counts, inventory-count-new, customers, customer-detail, reports, stores, store-detail,
store-new, staff, staff-detail, staff-new, settings, settings-reset, settings-reset-dialog,
command-palette, shortcut-help, login, select-store. The dark receipt screen is already captured
by the journey (`docs/screenshots/e2e-wide-05-receipt.png`, which runs en/dark).
