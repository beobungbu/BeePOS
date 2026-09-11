# Phase 04 · Reports dashboard, stores, staff, settings (areas: reports, stores, staff, settings)

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
- `src/data/settings-store.ts` (phase-0 skeleton; extend). Stores/staff: add `src/data/org-store.ts` (stores + staff CRUD) seeded from `src/data/seed` exports. Reports read `order-store`, `catalog-store`, `inventory-store` (read-only).

## Screens
1. `/reports`: filter bar: period `SegmentedControl` (Hôm nay / 7 ngày / 30 ngày / Tuỳ chọn → two `DatePicker`s), store `Select` (Tất cả for owner/manager). Sections (`Section`): `Stat` cards (doanh thu, đơn hàng, giá trị TB/đơn, lợi nhuận gộp, hoàn tiền) with delta vs previous period (`StatHelpText` + up/down `Badge`); "Doanh thu theo ngày" bar chart built from BeeUI `Box`/`Stack` + `Text` (no chart library; each bar a View with height proportional, accessible label); "Theo cửa hàng" `Table` (store, orders, revenue, share % with `Progress`); "Top 10 sản phẩm" `Table`/list; "Phương thức thanh toán" list with `Progress`; "Thu ngân" `Table` (orders, revenue, avg). Export button → toast. At 390 all sections stack; at 1280 two-column grid.
2. `/stores` + `/stores/[id]` (+ `new`): list (`Table`/cards: code, name, address, phone, staff count, status `Switch`), detail: `DescriptionList`, staff assigned (`ListGroup`), today's `Stat`s, edit form (`Field`s, hours as simple text), deactivate via `AlertDialog`.
3. `/staff` + `/staff/[id]` (+ `new`): list (avatar, name, role `Badge`, stores `Chip`s, status), detail: form (name, phone, role `RadioGroup`, stores multi-select via `Checkbox` list inside `FormGroup`, active `Switch`), "Đặt lại PIN" → `Dialog` with `OTPInput` (4 digits) twice, confirm; toast.
4. `/settings`: `ListGroup` sections: Giao diện (theme `SegmentedControl` sáng/tối/hệ thống wired by phase 0, density `Select` compact/comfortable if BeeUI tokens expose density per https://beeui.beemvp.com/docs/guides/density/ , else log gap), Ngôn ngữ (`Select` vi/en, instant), Cửa hàng mặc định, Hoá đơn (`Textarea` header/footer, `Switch` show logo, preview `Card` reusing the receipt component from src/features/pos if exported; else a local preview), Thuế (`Select` 0/5/8/10%), Thanh toán (bank name/account/holder for VietQR block, `Field`s), Máy in (mock `Select` of printers + test print toast), Về ứng dụng (`DescriptionList`: BeePOS version from app.json, BeeUI version read from package.json at build time via `require('../../package.json')` or a generated constant, Expo SDK), Đăng xuất (`AlertDialog`). `SettingsItem` from BeeUI where it fits.

## Domain (src/domain/reports.ts, src/domain/org.ts, tested)
`periodRange`, `previousPeriod`, `revenueByDay`, `revenueByStore`, `topProducts`, `paymentMix`, `cashierPerformance`, `grossProfit`, `deltaPercent`; `canAssignRole`, `validatePin`, `staffForStore`.

## Acceptance
- Dashboard numbers reconcile with seed (report shows a manual cross-check of one day); period switch updates all sections; bar chart has accessible labels.
- Settings: theme + locale + density (if available) apply instantly; receipt preview reflects header/footer text.
- Screenshots 390 + 1280, light + dark for reports and settings.
- Unit tests ≥ 20 green. Findings logged (Stat API, Progress, DatePicker range UX, OTPInput, FormGroup+Checkbox a11y, density support, SettingsItem).
