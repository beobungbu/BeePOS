# Phase 5 wave 2 — W-R code review + fixes

Scope: `src/**` and `app/**` (excluding `src/features/audit/**` and `scripts/**`, owned by W-E).
Baseline at review time (commit `e25cb92`): `tsc --noEmit` clean, `jest` green, `eslint` 7 errors + 6 warnings in scope.

Severity: **critical** = wrong behaviour a shop would hit, or data/authz defect · **major** = perf, duplicated logic,
a11y gap, lint error · **minor** = consistency, dead code.

## Ranked findings

| # | Sev | Location | Problem | One-line fix | Fixed / Left |
|---|-----|----------|---------|--------------|--------------|
| 1 | critical | `src/data/session-store.ts:23-34` | `login()` authenticates against the **seed** staff array, so every `/staff` edit is ignored: a reset PIN never takes effect (the old one still works), a deactivated member still signs in, a newly created one cannot. `isStaffActive()` already exists in `org-store.ts:71` and is never called on the login path. | Read `useOrgStore.getState().staff` and reject when `!isStaffActive(...)`. | **Fixed** |
| 2 | critical | `src/data/persistence-bootstrap.ts:56` | The persisted `session` slice serialises the whole `Staff` record, including `pin`, into `localStorage`/AsyncStorage. The PIN is never read back from the session, so this is a pure credential leak. | Pick `{id,name,role,storeIds}` for the session slice instead of the whole record. | **Fixed** |
| 3 | critical (production) / major (prototype) | `src/data/persistence-bootstrap.ts:66-76`, `src/domain/types.ts:19` | The `org` slice persists every staff member's plaintext PIN to device storage; anyone with devtools reads every till PIN. This is inherent to the seeded mock-auth decision documented at `src/domain/org.ts:32`, so fixing it properly means hashing + a server check, which reverses a product decision. | Hash PINs and move verification behind a service before production. **Owner decision required — not changed in this pass.** | **Left (needs owner)** |
| 4 | major | `src/features/orders/screens/orders-list-screen.tsx:70-72` | `useEffect(() => setPage(1), [filters])` — lint `react-hooks/set-state-in-effect`; also renders one frame on the stale page. | Reset the page in the filter change handler, not in an effect. | **Fixed** |
| 5 | major | `src/features/pos/components/qty-stepper.tsx:24` | `useEffect(() => setText(String(qty)), [qty])` — lint `react-hooks/set-state-in-effect`; an invalid entry also stays in the field until `qty` happens to change. | Hold a nullable edit draft and fall back to `String(qty)` when it is null. | **Fixed** |
| 6 | major | `src/features/pos/hooks/use-barcode-scan.ts:19` | `handler.current = onScan` during render — lint `react-hooks/refs`. | Assign the ref inside an effect. | **Fixed** |
| 7 | major | `src/components/command-palette.tsx:102-103,107-124` | Two ref writes during render (`react-hooks/refs`) and two `setState` in effects (`react-hooks/set-state-in-effect`) used to reset query/selection when the dialog closes. | Move ref writes into a post-render effect; reset the index in the query handler; mount the palette body only while open so close needs no reset. | **Fixed** |
| 8 | major | `src/features/pos/components/product-grid.tsx:56-57` | `stockLevels.find(...)` and `lines.find(...)` run inside `renderItem`, i.e. once per tile per render. At the 1000-product target of the W-E perf harness this is O(products x stockLevels) on every scroll frame. | Build `Map`s keyed by `productId` once with `useMemo` and look up O(1). | **Fixed** |
| 9 | major | `src/features/pos/lib/cart-totals.ts:12` | `pricedLinesOf` does `products.find(...)` per cart line. Its own doc comment lists four callers, and `order-tab-strip.tsx:327` calls it once per open tab, so a full POS render is `tabs x lines x products` scans. | Join through a `Map<productId, taxRate>` built once per call. | **Fixed** |
| 10 | major | `src/features/pos/components/order-tab-strip.tsx:147-189`, `src/features/pos/components/cart-panel.tsx:48-57` | The global `Alt+N/W/R/1..8` and `F9` handlers have no open-dialog guard, unlike `use-barcode-scan.ts:37-42`. `Alt+W` while the naming dialog is open stacks a close-confirmation on top of it, `Alt+1..8` switches the order the dialog is about, and `F9` leaves for checkout with the dialog's half-finished answer discarded. | Bail out through a shared `isOverlayOpen()` when a `[role=dialog]`/`[role=alertdialog]` is present. | **Fixed** (verified: see "Keyboard behaviour verified by hand") |
| 11 | major | `src/features/pos/components/catalog-search.tsx:20` | `document.querySelector(\`input[placeholder="${placeholder}"]\`)` builds a CSS attribute selector out of a translated string. A dictionary entry containing `"` makes F3 throw `SyntaxError`; the two other F3/palette focus paths already use a wrapper id instead. | Enumerate `input` elements and compare the `placeholder` property — no selector parsing. | **Fixed** |
| 12 | major (duplicated helper) | `src/features/inventory/counts-list-screen.tsx:13`, `receipts-list-screen.tsx:15`, `transfers-list-screen.tsx:13`, `movement-history-dialog.tsx:16`, `src/features/pos/receipt-screen.tsx:50,73`, `shift-screen.tsx:159,161,186` | Nine private date formatters: four copies of `formatDate` using `toLocaleDateString('vi-VN')` (`12/9/2026`) and five inline `toLocaleString('vi-VN')`, all diverging from the padded `formatDate`/`formatDateTime` in `src/features/orders/lib/order-presentation.ts:59-68` that the copy rules fix (`12/09/2026`), and all hardcoding the Vietnamese locale while the app supports `en`. | Promote `formatDate`/`formatTime`/`formatDateTime` to `src/lib/datetime.ts` and use it from all nine sites. | **Fixed** |
| 13 | major (duplicated helper) | `src/features/pos/hooks/use-barcode-scan.ts:63-69` | Private `isTextEntry()` re-implements `isTypingTarget()` from `src/lib/keyboard.ts:10`, which exists for exactly this and says so in its header. | Import `isTypingTarget` and delete the copy. | **Fixed** |
| 14 | major (duplicated helper) | `src/features/customers/lib/initials.ts:2` vs `src/components/shell/brand-mark.tsx:35` | Two identical "first + last initial" helpers; the customer copy returns `''` for a blank name where the shell copy returns `'?'`. (`monogramOf` in `category-accent.ts:49` is deliberately different — first *two* words for product names — and stays.) | Keep one `initialsOf` in `src/lib/initials.ts`, delete `features/customers/lib/initials.ts`, update the 6 call sites. | **Fixed** |
| 15 | major (duplicated authz) | `src/features/inventory/inventory-screen.tsx:58`, `src/features/reports/use-report-filters.ts:40` | `staff?.role === 'owner' || staff?.role === 'manager'` is written out twice. A permission predicate that lives in two files drifts the first time a role is added. | One `canViewAllStores(staff)` in `src/domain/org.ts`. | **Fixed** |
| 16 | major | `src/components/product-thumb.tsx:33` | The thumbnail paints `${accent.color}1a` (10 %) while `useCategoryAccent` already exposes `accent.tint` at `14` (8 %), which `product-image-slot.tsx:41` uses. The same category therefore reads as two different tints, which is precisely what the file header claims it prevents. | Use `accent.tint`. | **Fixed** |
| 17 | major (a11y) | `src/features/inventory/counts-list-screen.tsx:50`, `receipts-list-screen.tsx:53`, `transfers-list-screen.tsx:59` | Navigating table-row `Pressable`s with no `accessibilityRole` and no `accessibilityLabel`: on web they render as a plain `div`, so they are neither focusable nor announced. Every other row control in the app carries both. | Add `accessibilityRole="button"` and a label naming the row. | **Fixed** |
| 18 | major | `src/features/pos/components/quick-cash-chips.tsx:8` | `new Intl.NumberFormat('vi-VN')` — a second money formatter outside `src/domain/money.ts`, which already owns the vi-VN grouping. | Export `formatAmount()` from `src/domain/money.ts` and use it. | **Fixed** |
| 19 | minor (i18n) | `src/features/inventory/counts-list-screen.tsx:75`, `transfers-list-screen.tsx:85` | `` `${n} dòng · ...` `` — Vietnamese hardcoded in a rendered description, so the English dictionary never reaches it. | Use the dictionary key + `fill()`. | **Fixed** |
| 20 | minor (dead code) | `src/features/pos/receipt-screen.tsx:8`, `src/features/products/product-form-screen.tsx:26`, `src/features/settings/components/about-section.tsx:3,5,7` | Unused `Payment` type import, unused `router`, three stale `eslint-disable` directives that suppress nothing. | Delete. | **Fixed** |
| 21 | minor (gate) | `package.json:lint` | `npx expo lint` exits **0** with 7 errors, so the lint gate cannot fail CI and these errors survived four waves. | Run `eslint` directly (or `expo lint -- --max-warnings 0`) in CI. | **Left (CI change, not in scope)** |
| 22 | minor | `src/data/persist.ts:306` | `lastWritten` is set before the `setItem` promise settles, so a failed write is remembered as persisted and an unchanged slice is never retried. | Set `lastWritten` in the resolution path. | **Left (demo data, no loss path that matters)** |
| 23 | minor | `app/_layout.tsx:31` | `accessibilityLabel="Đang tải dữ liệu"` hardcoded; defensible because the locale preference has not hydrated at that point, but nothing says so. | Note the reason in a comment. | **Fixed (comment)** |
| 24 | minor | `src/data/customer-store.ts:105` | Runtime-generated point-history note in Vietnamese only. | Prototype seed-ish data; acceptable. | **Left (accepted)** |

## Checked and clean

- **Lists**: the only unbounded data list is the POS catalogue and it already uses `FlatList` with a stable `keyExtractor`. Every other `.map` renders a paginated page, a cart, or a fixed set (categories, tiers, units, payment methods). No missing keys found.
- **a11y**: 4 of ~130 `Pressable`s lacked a label; 3 are fixed above, `payment-method-cards.tsx:47` takes its accessible name from its children and carries `accessibilityState`, which is correct.
- **Dead files**: none. Every module under `src/` is reachable (the `i18n/*.vi|en.ts` files are side-effect imports).
- **`Platform.OS` branches**: all 23 sites guard a web-only API and fall through sanely on native.
- **i18n parity**: `src/i18n/__tests__/dictionary-parity.test.ts` covers key-for-key equality and passes.
- **Error boundaries**: `persist.ts`, `export-file.ts`, `receipt-print.ts` and `csv-export-button.tsx` each either surface the failure to the cashier or degrade to a documented fallback; no silent swallow found.

## Found while fixing

| # | Sev | Location | Problem | Fixed / Left |
|---|-----|----------|---------|--------------|
| 25 | major | `src/data/seed/staff.ts:5` + `src/data/session-store.ts` | All twelve seeded members share the mock PIN `1234`, and the login form asks only for a store code plus a PIN. `login()` therefore resolves to whichever member the array lists first for that store, not to the person at the till: `order.cashierId`, the receipt's cashier line and the cashier-performance report are all attributed to that one member whoever signed in. Surfaced by the new `session-store` test: "deactivate this cashier, they can no longer log in" was only true because of the shared PIN. | **Left (owner decision)** — the fix is either a unique PIN per member or a staff picker after the store code, and the E2E logs in with `HN01 / 1234` (`scripts/qa/e2e/lib/labels.ts`), so it is not a silent change. The revocation guard was written to skip inactive members rather than reject the first match, so deactivating one member no longer locks out everyone sharing their PIN. |
| 26 | minor | `src/data/cart-store.ts:41-43` | The header still reads "Open orders live here only: a reload discards them ... Nothing in the UI may imply a parked bill survives a reload." W-B's persistence made that false in the same wave: carts are persisted under `beepos.persist.carts`. | **Left (W-B's file)** — flagged to the lead; the comment now misleads the next reader in the opposite direction from the truth. |

| 27 | **critical** | `src/components/shell/overlay-store.ts:53`, `src/features/pos/components/catalog-search.tsx:41`, `cart-panel.tsx:55`, `order-tab-strip.tsx:185`, `src/features/orders/components/order-filters-bar.tsx:262` | **A focused BeeUI `Input`/`SearchInput` stops `keydown` from bubbling**, so every shortcut registered on the bubble phase is silently dead while the caret is in any text field. On the sell screen that is most of a shift: `Alt+1..8`, `Alt+N`, `Alt+W`, `Alt+R`, `F3`, `F9` and `Cmd/Ctrl+K` all do nothing once the cashier has touched the catalogue search, which is the whole keyboard model the `?` help dialog advertises. Found by hand-testing the fix for #10, not by reading the diff. | Register on the capture phase and do the "is the user typing" test inside the handler. | **Fixed** in the five app listeners; BeeUI side filed as `docs/beeui-audit/findings-19-review.md` 19-01 |
| 28 | major | `src/features/pos/components/order-tab-strip.tsx` (this pass's first attempt) | The first version of the #10 fix also guarded on `isTypingTarget`. That would have made `Alt+N`/`Alt+W`/`Alt+1..8` dead whenever the caret sat in the catalogue search, which is a worse regression than the bug being fixed. An Alt chord is not ambiguous with typing the way a digit burst is, so the typing guard does not belong there. | Overlay guard only for the Alt chords; keep the typing guard for `?` and `[`, which are real characters. | **Fixed before landing** (caught by the hand test, not by any gate) |

## Keyboard behaviour verified by hand

The palette and the shortcuts have no E2E coverage (`grep -ri palette scripts/qa/e2e` returns nothing), so the
refactors in #7, #10, #11 and #27 were driven against a real browser on `localhost:8104` before being reported
green. Both scripts pass:

- Palette: `Ctrl+K` opens it **from inside the catalogue search field**, it opens with an empty query, typing filters
  to products, `ArrowDown`+`Enter` selects and navigates, reopening starts empty again (the point of mounting the
  body only while open), `Escape` closes.
- Shortcuts: `F3` focuses the search through the rewritten lookup; `Alt+N` still opens an order with the caret in
  that field; `Alt+R` opens the naming dialog; behind that dialog `Alt+N`, `Alt+W`, `Alt+1` and `F9` are all
  correctly ignored and nothing stacks on top of it; everything works again once it closes.

## Gates after the fixes

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | clean |
| `npm test` | 21 suites, 282 tests passed (6 new: `src/data/__tests__/session-store.test.ts`) |
| `npx eslint src app` | **0 errors** in scope (was 7). One error remains in `src/features/audit/perf-harness-screen.tsx:103` (`react-hooks/purity`), W-E's file, untouched. |
| Palette + shortcut hand tests | 12 + 10 assertions, all passing (see above) |
| `npx expo export --platform all` | web + iOS + Android bundles written |
| E2E `journey` + `pos-features` | journey 8/8 (vi/en x light/dark x wide/narrow) and pos-features green; re-run after the keyboard changes |

### E2E failures that are not from this pass

Three of W-E's in-flight specs failed on the full run. Each was checked against the diff before being handed back:

- `perf.spec.ts` (both projects) — "Test not found in the worker process": the spec file was being edited while the run was in flight.
- `reports-settings.spec.ts:58` (both projects) — times out clicking a calendar day (`Tuesday, September 1, 2026`) in the BeeUI date picker. The only reports change in this pass is a local variable rename in `use-report-filters.ts`; the value returned as `canViewAllStores` is identical, and the failure is in both projects, so it is not layout-dependent either.
- `inventory-ops.spec.ts:55` (**narrow only**) — asserts `getByRole('row')` on `/inventory/receipts`. `receipts-list-screen.tsx:35` renders `<Table>` only when `breakpoint !== 'phone'`, so the phone layout has no row role at all. Line 54 (`getByText(SUPPLIER)`) passes, so the data is right and only the locator is wrong. **For W-E: assert on the `ListItem` text at narrow, or restrict that assertion to the wide project.**
