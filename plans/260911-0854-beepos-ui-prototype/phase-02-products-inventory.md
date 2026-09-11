# Phase 02 · Products, categories, inventory (areas: products, inventory)

## Common rules (all phases 1..4)
- Read first: `docs/product-spec.md`, `docs/beeui-audit/protocol.md`, `plans/260911-0854-beepos-ui-prototype/plan.md` (file ownership), the phase-00 report in `reports/phase-00-scaffold-report.md`, and the scaffold code under `app/`, `src/` to follow its conventions (stores, i18n merge, shell nav, money helpers).
- BeeUI via public docs only (https://beeui.beemvp.com/docs/components/<name>/ , llms-components.txt). Log every friction point in your findings file. Do not touch `node_modules`, `app/_layout.tsx`, `app/(app)/_layout.tsx`, `src/components/shell/*`, other phases folders, or `src/data/seed*` (if you need more seed data, add a generator in your own feature folder and merge into your own store).
- You own: `app/(app)/<area>/**`, `src/features/<area>/**` (screens split into components, hooks), `src/domain/<area>.ts` + `src/domain/__tests__/<area>.test.ts`, your store file(s) in `src/data/` listed below, `src/i18n/<area>.vi.ts` + `<area>.en.ts` (register them in the i18n merge point exactly as phase 0 documented), `docs/beeui-audit/findings-0N-<area>.md`, `docs/screenshots/phase-0N-*.png`.
- Responsive: same screen must work at 390px (phone) and 1280px (web). Use `useWindowDimensions` breakpoints already defined by phase 0 (`src/components/shell` exports them) or add a local hook in your feature.
- Copy: Vietnamese default + English; no em-dash; semantic tokens only; files < 300 lines.
- Domain logic pure and unit-tested (jest). UI reads/writes through the zustand store.
- Verify: `npx tsc --noEmit`, `npm test`, `npx expo export --platform web` all green; Playwright/Chromium screenshots at 390 and 1280 of your main screens (light + dark for at least one) into `docs/screenshots/`. Paste command evidence into your report.
- Commit on `main` (conventional, no co-author) at the end. Other workers commit to the same branch in parallel; before committing run `git pull --rebase` is NOT possible (no remote), so just commit; if `git commit` fails because of index lock, retry after a few seconds. Never `git add -A` blindly: add only your owned paths plus the i18n merge file if phase 0 requires editing it (keep that edit to one line).
- Report to `plans/260911-0854-beepos-ui-prototype/reports/phase-0N-<area>-report.md` and end with the Status block.

## Store files you own
- `src/data/catalog-store.ts` and `src/data/inventory-store.ts` (created by phase 0 as skeletons; you extend them, keep exported names stable because pos/orders read them).

## Screens
Products
1. `/products`: ≥768 → BeeUI `Table` (columns: ảnh/tên, SKU, danh mục, đơn vị, giá vốn, giá bán, tồn (sum across stores), trạng thái `Switch`, actions `DropdownMenu`), sortable headers (caller-owned sort state per ADR-007), `Pagination` 20/page; < 768 → `ListGroup`/`ListItem` cards. Toolbar: `SearchInput`, category `Select`, status `SegmentedControl` (all/active/inactive), button "Thêm sản phẩm". Empty/no-results → `EmptyState`.
2. `/products/[id]` and `/products/new`: form with `Field`s: tên, SKU (auto-suggest), barcode (validate EAN-13 checksum, `FormMessage` error), danh mục `Select`, đơn vị `Select` (cái, kg, lốc, thùng, chai, gói), giá vốn, giá bán (margin % shown live with `HelperText`), thuế `Select`, trạng thái `Switch`, mô tả `Textarea`. Variants section (`Collapsible`): list + add (name, sku, price delta). Stock per store `Table` (read-only here) with minLevel editable inline. Save → toast; delete → `AlertDialog`. Use `KeyboardAwareScreen`. Unsaved-changes guard on back (`AlertDialog`).
3. `/products/categories`: tree (2 levels) using `Accordion`; add/rename/delete inline `Dialog`; product count per category.

Inventory
4. `/inventory`: store `Select` (default session store; owner/manager can pick "Tất cả"), `AlertBanner` low-stock count, `Stat` row (SKU count, tổng tồn giá vốn, sắp hết, hết hàng), `Tabs`: Tồn kho (`Table`/list with onHand, reserved, available, minLevel, badge), Sắp hết (filtered). Row action `DropdownMenu`: điều chỉnh nhanh (`Dialog` +/− qty with reason), xem lịch sử (`Timeline` of movements from a local movement log you maintain in inventory-store).
5. `/inventory/receipts` + `/inventory/receipts/[id]` (+ `new`): goods receipt list (`Table`, status `Badge`), create: supplier name, lines picker (search product → add line qty + unit cost), totals; Lưu nháp / Nhận hàng (`AlertDialog`) → stock += qty, movement log.
6. `/inventory/transfers` + `[id]` + `new`: from/to store `Select`s (from ≠ to validation), lines, states draft → sent (stock out at source, reserved) → received (stock in at destination). `Stepper` shows state.
7. `/inventory/counts` + `[id]` + `new`: pick store + category scope, generate lines with expected onHand, cashier enters counted (numeric `Input` per row, keyboard-aware on mobile), variance column with `Badge`, Ghi nhận (`AlertDialog`) → set onHand = counted, log movements.

## Domain (src/domain/catalog.ts, src/domain/inventory.ts, tested)
`isValidEan13`, `nextSku`, `marginPercent`, `availableQty`, `applyMovement`, `receiptTotals`, `transferTransition` (state machine with invalid-transition errors), `countVariance`, `lowStock`.

## Acceptance
- All 7 screens interactive at 390 + 1280, light + dark screenshot for products list and inventory.
- Table sort + pagination works; form validation shows errors via `FormMessage`; EAN check rejects bad checksum.
- Receipt → stock increases; transfer full cycle; count posts variance. Verified via UI then store state (log in report).
- Unit tests ≥ 20 cases green. Findings logged (Table on mobile, Select inside Dialog, Accordion nesting, numeric keyboard, Switch controlled warning, etc.).
