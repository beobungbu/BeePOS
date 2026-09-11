# Phase 00 · Scaffold

## Context
- Read first: `/Users/textsoft/workspace/BeePOS/docs/product-spec.md`, `/Users/textsoft/workspace/BeePOS/docs/beeui-audit/protocol.md`, `/Users/textsoft/workspace/BeePOS/plans/260911-0854-beepos-ui-prototype/plan.md`.
- BeeUI public docs: https://beeui.beemvp.com/docs/start/ , https://beeui.beemvp.com/docs/start/expo/ (Expo path), https://beeui.beemvp.com/docs/start/provider-safe-area/ , https://beeui.beemvp.com/llms-full.txt , https://beeui.beemvp.com/llms-components.txt , https://beeui.beemvp.com/docs/compatibility/ .
- Repo root `/Users/textsoft/workspace/BeePOS` is an empty git repo (branch main, no commits). Node 24.14.1, pnpm 10.15.0 available. Use **npm** for this app (single package, matches BeeUI's consumer examples), `package-lock.json` committed.

## Requirements
1. Expo SDK 57 app at repo root (not a subfolder). `npx create-expo-app@latest . --template blank-typescript` or equivalent, then `npx expo install expo-router react-native-safe-area-context react-native-screens react-native-gesture-handler react-native-reanimated react-native-worklets react-native-web react-dom @expo/metro-runtime @gorhom/bottom-sheet @react-native-community/datetimepicker react-native-teleport`. Pin exactly: `react@19.2.3 react-dom@19.2.3 react-native@0.86.2 react-native-web@0.21.0 expo@~57.0.18 expo-router@~57.0.20 tailwindcss@4.3.3 uniwind@1.10.1`. If `expo install` picks different minor versions, keep Expo's choice but log it if it conflicts with BeeUI peer ranges (`npm view @beemvp/beeui-ui peerDependencies`).
2. Install BeeUI from npm, pinned: `npm i -E @beemvp/beeui-ui@0.86.2-rc.1 @beemvp/beeui-core@0.86.2-rc.1 @beemvp/beeui-tokens@0.86.2-rc.1`. Follow the public Expo start doc for metro config (`withUniwindConfig`, `cssEntryFile`, `dtsFile`, `extraThemes`), `global.css` (`@import 'tailwindcss'; @import 'uniwind'; @import '@beemvp/beeui-tokens/theme.css'; @source` globs for core+ui `src`), babel if the doc requires it, and TS config. Also try `npx @beemvp/beeui-cli@0.86.2-rc.1 --help` and `list` once and log what happens (do not use it for install).
3. expo-router layout:
   - `app/_layout.tsx`: `GestureHandlerRootView` → `BottomSheetModalProvider` → `BeeUIProvider` → theme bootstrap → `Stack`. Fonts: system.
   - `app/index.tsx` redirects to `/login` if no session else `/pos`.
   - `app/(auth)/login.tsx`, `app/(auth)/select-store.tsx`: real forms with BeeUI `Field`, `Input`, `PasswordInput` or `OTPInput` for PIN, `Button`, validation, mock auth from seed (PIN `1234` for every staff). Store session in zustand (`src/data/session-store.ts`).
   - `app/(app)/_layout.tsx`: responsive shell in `src/components/shell/`: width `< 768` → bottom tab bar (BeeUI `BottomActionBar` or a local composite using BeeUI `IconButton`/`Text`) with tabs POS, Orders, Products, Inventory, More; width `>= 768` → left sidebar (BeeUI `ListGroup`/`ListItem`) with ALL areas: POS, Orders, Products, Inventory, Customers, Reports, Stores, Staff, Settings. Nav entries live in ONE array `src/components/shell/nav-items.ts` so later phases do not edit the layout. Header uses BeeUI `AppHeader` with store switcher (`DropdownMenu`) and user menu (logout).
   - Placeholder route files for every area so navigation works today: `app/(app)/pos/index.tsx`, `orders/index.tsx`, `products/index.tsx`, `inventory/index.tsx`, `customers/index.tsx`, `reports/index.tsx`, `stores/index.tsx`, `staff/index.tsx`, `settings/index.tsx`, each rendering BeeUI `EmptyState` with the area title. Later phases replace file contents; they never touch `_layout.tsx`.
4. `src/domain/types.ts` exactly per product-spec. `src/domain/money.ts` (`formatVND`, `roundVND`, `sum`) + `src/domain/__tests__/money.test.ts` with jest-expo.
5. `src/data/seed.ts`: deterministic mock data generator (seeded PRNG, no faker): 4 stores, 12 staff, 8 categories, 120 products with realistic Vietnamese grocery names/units/prices/barcodes (EAN-13 valid checksum), stock levels per store, 40 customers, 300 orders spread over last 30 days, 6 shifts, a few receipts/transfers/counts. Export typed arrays. Keep it one file ≤ 500 lines; if larger, split by entity under `src/data/seed/`.
6. zustand stores skeleton in `src/data/`: `session-store.ts` (staff, store, login/logout), `catalog-store.ts` (products, categories), `inventory-store.ts`, `customer-store.ts`, `order-store.ts`, `settings-store.ts` (theme, locale, density, tax, receipt text). Each exports typed hooks + plain actions. Seed on first import. Later phases extend their own store file only.
7. i18n: `src/i18n/index.ts` with `useT()` and `t(key)`, dictionaries `src/i18n/common.vi.ts` / `common.en.ts` (nav, actions, auth, shell). Provide a merge point so later phases add `src/i18n/<area>.vi.ts`. Locale from settings-store; default `vi`.
8. Theme: `src/theme/use-app-theme.ts` wiring settings-store theme (`light`|`dark`|`system`) to `Uniwind.setTheme` + `useColorScheme`. Settings placeholder screen gets a working theme `SegmentedControl` and locale `Select` so QA can flip them (phase 4 will build the full settings screen around it).
9. Scripts in package.json: `start`, `web`, `ios`, `android`, `typecheck` (`tsc --noEmit`), `test` (jest), `export:all` (`expo export --platform web,ios,android`), `lint` (eslint via `expo lint`).
10. `.gitignore` (node_modules, dist, .expo, ios, android, *.log, .DS_Store), `README.md` (short: what, run, structure, audit link), `app.json` (name BeePOS, slug beepos, scheme beepos, web output single, bundle ids `com.beemvp.beepos`).

## Acceptance criteria (verify yourself, paste evidence in report)
- `npx tsc --noEmit` clean. `npm test` green. `npx expo export --platform web` succeeds AND the exported CSS contains BeeUI utility classes (grep `bg-primary` or `--bee-` in `dist/_expo/static/css/*.css`). `npx expo export --platform ios,android` succeeds.
- `npx expo start --web` renders login → PIN 1234 → shell with sidebar at 1280px and bottom tabs at 390px (use Playwright/Chromium via `npx playwright` if available, else describe manual check). Theme switch light/dark visibly changes background. Capture 2 screenshots into `docs/screenshots/phase-00-*.png`.
- No console errors on web load. Warnings logged as findings.
- `docs/beeui-audit/findings-00-scaffold.md` written per protocol (expect at least install/metro/CSS/DX observations; "no issues" is suspicious).
- Commit on `main` in conventional format: `feat: scaffold Expo 57 + expo-router + BeeUI shell` (no co-author trailer). Do NOT push (Ambrose creates the GitHub repo).

## Constraints
- Do not read `~/workspace/BeeUI` before logging why the public docs were insufficient.
- No em-dash in UI copy. Vietnamese default copy.
- Semantic tokens only (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`...). No hex colors in app code.
- Keep files < 300 lines; split by concern.

## Report
Write `/Users/textsoft/workspace/BeePOS/plans/260911-0854-beepos-ui-prototype/reports/phase-00-scaffold-report.md`: what was done, exact commands, versions installed (`npm ls --depth=0`), evidence for each acceptance line, open questions. End with the Status block.
