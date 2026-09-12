# Phase 5: overnight feature upgrade (autonomous, owner reads the report in the morning)

Owner ask (2026-09-12 23:34): keep upgrading and optimising, add features, report tomorrow.

## Waves
- Wave 1 (parallel, disjoint ownership): W-A POS features · W-B persistence · W-C admin, shell, command palette, export, dark sweep.
- Wave 2 (after wave 1 merges): code review of the whole `src/` with fixes · E2E extension + 1000-product perf harness · native smoke on iOS.
- Wave 3: gates, deploy, BeeUI batch 15, morning report `plans/reports/day-summary-260913-*.md`.

## Shared rules (all workers)
Uniwind semantic tokens only; Text via `variant`; no `bg-card`/`bg-accent`; no em-dash; vi/en dictionaries key-for-key equal; a11y label/role on every control; no BeeUI package patches (findings to `docs/beeui-audit/findings-18-<worker>.md` per protocol); tsc + jest + `qa:e2e` 8/8 + `expo export --platform all` green before reporting; do not commit; a shell hook blocks Bash commands containing `node_modules` or `dist`; Metro per worker on ports 8101 (A), 8102 (B), 8103 (C); login HN01 / 1234.

## W-A · POS features
Owns: `src/features/pos/**`, `src/i18n/pos.*.ts`, `src/data/cart-store.ts`, `src/domain/pos.ts` + its tests, new spec `scripts/qa/e2e/specs/pos-features.spec.ts` (new file only; do not edit journey.spec.ts or lib/).
1. Keyboard-wedge barcode scanner: on `/pos` (web and native with a hardware scanner) a burst of 8+ digits arriving faster than 50 ms apart and ending with Enter, while focus is not in a text field, looks up `barcode` in the catalog and adds one unit; unknown code shows a warning Toast with the code. The existing search field keeps its own behaviour. Pure parser in `src/domain/pos.ts` (`scanBuffer` state machine) with tests.
2. Customer quick-add inside the existing customer dialog: name + phone, validation (phone 9 to 11 digits, unique), creates the customer (customer store already has a create action; if not, add one in `src/data/customer-store.ts` and tell W-B in your report) and attaches it to the active cart.
3. Order tab naming: double-click on web or long-press on native opens a small Dialog "Đặt tên đơn" (e.g. "Chị Lan", "Bàn 3"); the tab shows the name instead of "Đơn N"; `Cart.label?: string`.
4. Order discount presets in the order-discount dialog: chips 5%, 10%, 20%, and "Số tiền"; keep the free input.
5. Receipt: web `window.print()` with a print stylesheet that prints only the receipt block (58 mm friendly); native `Share.share` with a plain-text receipt (pure formatter in `src/domain/pos.ts` with a test). Buttons "In hoá đơn" / "Chia sẻ".
6. E2E `pos-features.spec.ts` (wide project only is fine): scan a known barcode via `page.keyboard.type` fast, quick-add a customer, rename a tab, apply a 10% preset, open receipt and assert the print button exists.
Report: `plans/260912-1054-beepos-design-pass/reports/phase-05-w-a-pos-features-report.md`.

## W-B · Persistence
Owns: `package.json` (only to add `@react-native-async-storage/async-storage` via `npx expo install`), `src/data/persist.ts` (new), `src/data/persistence-bootstrap.ts` (new), `src/lib/preference-storage.ts`, `app/_layout.tsx` (hydration gate only), `src/data/{session,settings,order,inventory,customer,shift,catalog,org}-store.ts` (only if a store needs a `hydrate`/`replaceAll` action; keep public selectors), `scripts/qa/e2e/lib/session.ts`, `src/domain/__tests__/persist.test.ts` (new).
1. `persist.ts`: generic `persistStore(key, useStore, pick, version)` that subscribes to a zustand store, debounces writes 300 ms, serialises the picked slice to AsyncStorage (native) / localStorage (web), and hydrates on boot; a `schemaVersion` per key; mismatched version discards the slice. Dates serialised as ISO and revived.
2. `persistence-bootstrap.ts`: registers session (active staff, store), settings, carts (do not touch cart-store.ts itself: subscribe from outside; W-A is editing that file), orders, inventory, customers, shifts, catalog edits (products, categories). Exposes `hydrateAll(): Promise<void>` and `resetDemoData(): Promise<void>` (clears storage, reseeds, reloads stores). W-C will call `resetDemoData` from Settings; document the import path in your report.
3. `app/_layout.tsx`: await `hydrateAll()` before rendering routes (keep splash / a Spinner screen), no flash of seed data.
4. E2E: `login()` in `scripts/qa/e2e/lib/session.ts` clears storage (`page.addInitScript` or `localStorage.clear()` before navigation) so runs stay deterministic; `npm run qa:e2e` must stay 8/8 without editing specs.
5. Tests for `persist.ts` (pick, version mismatch, date revival) with an in-memory storage double.
6. Verify manually on web: add items to two orders, reload, orders still there; change theme, reload, theme kept; reset restores seed.
Report: `plans/260912-1054-beepos-design-pass/reports/phase-05-w-b-persistence-report.md`.

## W-C · Admin, shell, command palette, export, dark sweep
Owns: `src/components/**` except `icons.tsx`, `src/components/shell/**`, `src/features/{products,inventory,orders,customers,reports,stores,staff,settings}/**`, their `app/(app)/**` routes, their i18n files and `src/i18n/common.*.ts`, `src/lib/**` except `preference-storage.ts`.
1. Header store chip: make it read as a control (ghost button with chevron-down icon, hover/pressed state, 44 pt target).
2. Back controls on pushed routes still missing: staff detail/new, store detail/new (use `useScreenHeader({ backTo })`).
3. Command palette `Cmd/Ctrl+K` on web (a header search button on tablet/desktop too): Dialog with SearchInput, results grouped (Màn hình, Sản phẩm, Đơn hàng, Khách hàng), arrow keys + Enter, Esc closes; pure ranking helper in `src/lib/command-search.ts` with tests. Shortcut help Dialog on `?` listing the app's shortcuts (F3, F8, F9, Alt+1..8, Alt+N, Alt+W, `[`, Cmd+K).
4. Export: "Xuất CSV" on orders, products, inventory (web: Blob download with UTF-8 BOM; native: `Share.share` of the CSV text). Pure CSV formatter in `src/lib/csv.ts` with tests (quotes, commas, newlines, VND as plain integers).
5. Settings: "Đặt lại dữ liệu mẫu" button in an AlertDialog calling `resetDemoData()` from `src/data/persistence-bootstrap.ts` (W-B ships it; if the file is not there yet when you reach this step, import it anyway and coordinate through the report; the integrator will wire it).
6. Dark-mode sweep: screenshot every screen at 1440 in dark (`docs/design/after/dark/<screen>-1440.png`), fix contrast or missing-token issues in your owned files, list the rest.
Report: `plans/260912-1054-beepos-design-pass/reports/phase-05-w-c-admin-shell-report.md`.

## Wave 2 (after wave 1 lands)

### W-R · Code review + fixes
Read-only review of the whole `src/` and `app/` against `docs/product-spec.md` (non-functional section), `docs/design/design-direction.md`, and the shared rules. Look for: render-phase state updates, effects that set state (lint `set-state-in-effect`), unbounded lists without FlatList, missing keys, i18n strings hard-coded in components, a11y labels missing on Pressables, `Platform.OS` branches that break web keyboard handling, duplicated helpers across features, dead files. Produce a ranked list (severity, file:line, one-line fix) in `plans/260912-1054-beepos-design-pass/reports/phase-05-review-report.md`, then fix everything of severity major or higher and every lint error, keeping gates green. Do not restyle.

### W-E · E2E extension + perf harness
Owns `scripts/qa/e2e/**` (all files), `src/features/audit/**`, `docs/qa/**` (new).
1. New specs: multi-order journey (open 3 orders, pay one, next order active, close an empty one), inventory receipt (create, add 2 lines, confirm, stock increases), stock count with variance and post, customer create from POS then find it in /customers, reports period switch and custom range, settings language switch (labels change to English and back), persistence (add lines, `page.reload()`, lines still there; reset demo data restores seed). Both wide and narrow projects where the flow exists on phone.
2. Perf harness: `/audit/perf` route (existing audit feature folder) that seeds 1000 products into the catalog store in memory (not persisted) and renders the POS grid; Playwright measures time to first tile and scroll frame time via `page.evaluate(performance.now())` and `requestAnimationFrame` counts; assert first tile under 1500 ms and no frame over 100 ms while scrolling 20 screens. Write numbers to `docs/qa/perf-260913.md`.
3. `npm run qa:e2e` stays the single entry; total runtime under 15 minutes (use `fullyParallel` and `workers: 2`).

### W-N · Native smoke on iOS after wave 1 + review
Fresh Metro (`--clear`), existing dev client on iPhone 16 Pro. Path: cold start with persisted data (from a previous session), scan-buffer via hardware keyboard (`xcrun simctl` cannot type into the app; use the Simulator MCP `text` action on the search field to prove the field still works, and note that wedge input needs a real scanner), quick-add customer, rename a tab, share receipt (Share sheet appears), reset demo data. Screenshots `docs/screenshots/ios-p5-*.png`. Report `plans/260912-1054-beepos-design-pass/reports/phase-05-native-smoke-report.md`.
