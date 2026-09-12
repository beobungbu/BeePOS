# Phase 4: desktop density (>= 1280)

Owner ask (2026-09-12 21:54): desktop wastes space; the sidebar need not always show; filters and top areas are not optimised.

Measured on the 1440x900 "after" captures: chrome before the first data row is 55% on /inventory, 35% on /orders, 27% on /reports; sidebar is a fixed 240 pt (17% of width). Header repeats store name and address on every screen; the page title block repeats the active sidebar item; filters, stats, alert banners and tabs each take their own row.

## Decisions (apply on desktop only; tablet and phone unchanged)
1. Sidebar collapses to the 72 pt rail. Toggle button at the bottom of the sidebar/rail (chevron) and keyboard `[` on web; preference persisted in the settings store. `/pos*` routes force the rail (focused sell mode) while remembering the user preference for other routes; the toggle still works inside POS.
2. Shell header is one 48 pt row: left = screen title (from `useScreenHeader`) with subtitle inline muted; right = store switcher chip `HN01 · Tạp hoá Cầu Giấy` (DropdownMenu listing the staff's stores, address shown inside the menu) + avatar. The separate page title block is removed on desktop. Address is not shown in the header on desktop.
3. Toolbar is one 56 pt row directly under the header: search + filters left, primary actions right (`Thêm sản phẩm`, `Nhập hàng` / `Chuyển kho` / `Kiểm kê`, `Xuất báo cáo`). Result count appears only in the pagination footer. Reports: period SegmentedControl + store select + export on one row.
4. List screens (orders, inventory, customers, products where present) render stats as a 64 pt borderless strip: label above value, vertical separators, no cards. Reports keeps its cards.
5. Inventory low-stock AlertBanner becomes a warning chip in the toolbar (`17 sắp hết`) that toggles the low-stock filter; the tab pair `Tồn kho / Sắp hết` is replaced by that chip.
6. POS desktop: category chips in one horizontally scrolling row with edge fade and wheel/drag scroll; the order strip and shift strip stay.
7. Table rows 48 pt on desktop (pointer) via the density token if BeeUI exposes one, else `min-h-12`; admin content max-width 1600 pt centred; POS uses the full width.

## Deliverables
- Designer: update the desktop (1440) frames of `docs/design/mockups/pos.html`, `orders.html` and add an `inventory.html` desktop-only frame; add a "Desktop density" subsection to `docs/design/design-direction.md`; regenerate previews.
- Worker: implement 1 to 7 across shell, POS, orders, customers, products, inventory, reports, stores, staff, settings; screenshots at 1440 (and 1920) for pos (rail + expanded), orders, inventory, reports, products; gates green (tsc, jest, e2e 8/8, export); before/after chrome percentages in the report.

## Acceptance
- /inventory chrome before first row <= 30% at 1440x900; /orders <= 20%; /pos with rail shows 5 catalog columns.
- Sidebar preference survives reload; `[` toggles on web; POS auto-rails and restores.
- No regressions at 768 and 375 (spot screenshots).
