# Phase 03 · Orders, refunds, customers (areas: orders, customers)

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
- `src/data/order-store.ts` and `src/data/customer-store.ts` (phase-0 skeletons; extend, keep exported names stable because pos writes into them).

## Screens
Orders
1. `/orders`: filters bar: store `Select`, date range (two BeeUI `DatePicker`s, default last 7 days; verify DatePicker on web behaves), status `ChipGroup` (paid/refunded/partial/void), cashier `Select`, `SearchInput` (order code or customer phone). ≥768 `Table` (code, time, store, cashier, customer, items, total, payment methods icons/text, status `Badge`), sortable by time/total, `Pagination`; <768 `ListGroup` cards grouped by day (`ListGroupHeader`). `Stat` strip on top (orders, revenue, refunds for current filter). `Skeleton` while "loading" (simulate 300ms on filter change to exercise Skeleton).
2. `/orders/[id]`: header with code + status; `DescriptionList` (store, cashier, customer, time, note); lines `Table`; totals; payments; `Timeline` (created → paid → refund events). Actions: Hoàn tiền (`Dialog`: choose full or per-line qty to refund, refund method, reason `Textarea`; confirm via `AlertDialog`) → creates refund record, restocks, deducts points, updates status paid→partial_refund/refunded; In lại hoá đơn (toast); Huỷ (void, only within 10 minutes and no refund, `AlertDialog`).
Customers
3. `/customers`: `SearchInput` phone/name, tier `ChipGroup` (Thường/Bạc/Vàng/Kim cương by totalSpent thresholds in domain), ≥768 `Table` (avatar initials `Avatar`, name, phone, tier badge, points, totalSpent, last order), <768 list. Button Thêm khách → `Dialog` form (name, phone validated VN format, birthday `DatePicker`, note).
4. `/customers/[id]`: profile card (`Avatar`, name, tier, points, totalSpent, member since), `Tabs`: Đơn hàng (list linking to /orders/[id]), Điểm (`Timeline` of point movements: earned/spent/adjust; manual adjust `Dialog` for manager), Thông tin (edit form). Delete via `AlertDialog` (blocked if has orders → `AlertBanner`).

## Domain (src/domain/orders.ts, src/domain/customers.ts, tested)
`filterOrders`, `sortOrders`, `orderStats`, `refundPlan` (validates qty ≤ sold, computes refund amount incl. proportional discount, points to deduct), `applyRefund` (status transitions), `canVoid`, `tierFor(totalSpent)`, `isValidVnPhone`, `pointHistory`.

## Acceptance
- Filters combine correctly (verified with seed counts in report); partial refund of 1 line restocks and changes status; customer tier updates when totalSpent crosses threshold; VN phone validation.
- Screenshots 390 + 1280, light + dark for orders list and customer detail.
- Unit tests ≥ 20 green. Findings logged (DatePicker web, Table + Pagination, Tabs controlled, Timeline API, Avatar fallback, Skeleton).
