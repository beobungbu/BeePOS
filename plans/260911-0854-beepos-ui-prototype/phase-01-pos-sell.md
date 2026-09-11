# Phase 01 · POS sell flow (area: pos)

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
- `src/data/cart-store.ts` (new), `src/data/shift-store.ts` (new). You may call actions of `order-store`, `inventory-store`, `customer-store` (append order, decrement stock, add points) but if an action is missing, add it in `src/features/pos/adapters.ts` operating on those stores' public setters rather than editing their files.

## Screens
1. `/pos` (app/(app)/pos/index.tsx → src/features/pos/pos-screen.tsx)
   - Left/main: `SearchInput` (search by name/sku/barcode; pressing Enter with an exact barcode match adds 1 unit immediately, mimic scanner), category `ChipGroup` filter, product grid (2 cols at 390, 4 at ≥768, 5 at ≥1280) of `Card` tiles: name, unit, price, stock badge (`Badge` warning when onHand ≤ minLevel, destructive when 0). Tap adds to cart; long-press or info icon opens `Popover`/`Dialog` with details.
   - Cart panel: at ≥1024 a right pane (360px) always visible; below that a floating summary bar (items, total) with a button opening BeeUI `Sheet` (native) / same Sheet on web containing the cart.
   - Cart lines: product name, unit price, qty stepper (IconButton −/+, direct `Input` numeric), line total, swipe/delete IconButton, line discount via `Popover` (percent/amount).
   - Cart footer: subtotal, discount (order-level `Dialog` with `SegmentedControl` percent/amount + reason `Textarea`), tax, total; customer attach (`Dialog` with search by phone, shows tier + points; "Khách lẻ" default); note; buttons "Xoá giỏ" (`AlertDialog`) and "Thanh toán".
   - Empty cart → `EmptyState`.
   - If no open shift: `AlertBanner` at top "Chưa mở ca" with button to `/pos/shift`; selling still allowed but banner persists.
2. `/pos/checkout` (src/features/pos/checkout-screen.tsx)
   - Summary card; payment method `SegmentedControl`/`RadioGroup`: Tiền mặt (amount input with quick-cash chips 50k/100k/200k/500k and change calc), Chuyển khoản (VietQR placeholder: a `Card` with a static QR-like SVG or `Box` grid + bank info from settings), Thẻ, Điểm (uses customer points, 1 point = 1,000 VND). Split payment: list of payments with add/remove; remaining amount; confirm enabled when remaining = 0.
   - Confirm → domain `createOrder` (assign code `HD-<store code>-<yyyymmdd>-<seq>`), decrement stock, add points (1 point per 10,000 VND), append to shift, clear cart, `useToast` success, navigate `/pos/receipt/[id]`.
3. `/pos/receipt/[orderId]`: receipt layout (store header from settings, lines, totals, payments, change, footer text), buttons In (toast "Đã gửi lệnh in"), Chia sẻ (toast), Bán tiếp → `/pos`.
4. `/pos/shift`: current shift `Stat` cards (orders, revenue, cash expected), open shift form (opening cash `Input`), close shift form (counted cash, variance shown with `Badge`), history `Table` of past shifts (`Timeline` optional). Uses `AlertDialog` on close.

## Domain (src/domain/pos.ts, tested)
`calcLine`, `calcCart` (subtotal, discountTotal, taxTotal, total with VND rounding), `applyOrderDiscount`, `calcChange`, `pointsEarned`, `pointsToVnd`, `nextOrderCode`, `shiftSummary`. Edge cases: discount > subtotal clamps to subtotal; qty ≤ 0 removes line; points payment cannot exceed customer points.

## Acceptance
- Full flow on web at 1280 and 390: add 3 products (one via barcode Enter), change qty, line discount, order discount 10%, attach customer, checkout split cash+transfer, receipt shows change, order appears in order-store, stock decreased, points increased. Screenshot each main step.
- Unit tests ≥ 15 cases green.
- Findings file has entries for every BeeUI component you used that behaved differently from docs or lacked a needed prop (e.g., Sheet on web, SearchInput submit event, numeric Input, Popover in scroll).
