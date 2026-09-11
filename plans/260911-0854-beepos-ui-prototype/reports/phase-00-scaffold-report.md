# Phase 00 - Scaffold report

Status: DONE_WITH_CONCERNS (functionally complete and all acceptance criteria met; concerns
are the BeeUI doc/runtime frictions logged in the audit findings, not open implementation gaps)

## What was done

Scaffolded a full Expo SDK 57 + expo-router + BeeUI app at the BeePOS repo root:

1. `create-expo-app@latest --template blank-typescript` into a scratch dir (repo root already
   had `docs/` and `plans/`, which the CLI refuses to overwrite), then merged the generated
   files into the repo root (excluding `.git`, `node_modules`, and a stray Expo-template
   `LICENSE`/`CLAUDE.md`/`AGENTS.md`).
2. Installed the pinned stack via `npx expo install <packages>` (router, safe-area-context,
   screens, gesture-handler, reanimated, worklets, react-native-web, react-dom,
   metro-runtime, bottom-sheet, datetimepicker, teleport), then `npm i -E @beemvp/beeui-ui@0.86.2-rc.1
   @beemvp/beeui-core@0.86.2-rc.1 @beemvp/beeui-tokens@0.86.2-rc.1 tailwindcss@4.3.3 uniwind@1.10.1 zustand`,
   then `npx expo install jest-expo jest --dev`.
3. Metro/Tailwind/Uniwind wiring: `metro.config.js` (`withUniwindConfig`), `global.css`
   (`@import 'tailwindcss'; @import 'uniwind'; @import '@beemvp/beeui-tokens/theme.css';`
   plus `@source` globs for `beeui-core`/`beeui-ui` `src`), `postinstall`/`typecheck` npm
   scripts that run `uniwind generate-artifacts` before `tsc` (see finding 00-04 for why).
4. `app.json` set to BeePOS/beepos/`com.beemvp.beepos`, `web.output: "single"`.
5. expo-router tree: root `_layout.tsx` (`GestureHandlerRootView` -> `BottomSheetModalProvider`
   -> `BeeUIProvider` -> theme bootstrap -> `Stack`), `index.tsx` redirect, `(auth)/login.tsx`
   + `(auth)/select-store.tsx` (real forms, mock PIN `1234` auth via `session-store`),
   `(app)/_layout.tsx` (auth guard + `AppShell`), 9 placeholder routes (pos, orders, products,
   inventory, customers, reports, stores, staff, settings) each rendering `AreaPlaceholder`
   (an `EmptyState` wrapper), all nav entries centralized in
   `src/components/shell/nav-items.ts`.
6. Responsive shell in `src/components/shell/`: `app-shell.tsx` (sidebar >= 768px,
   bottom tabs + more-sheet < 768px), `sidebar.tsx`, `bottom-tab-bar.tsx`, `more-sheet.tsx`,
   `shell-header.tsx` (store switcher + user menu via `DropdownMenu`).
7. `src/domain/types.ts` (full domain model per product-spec), `src/domain/money.ts`
   (`formatVND`/`roundVND`/`sum`) + 8 passing jest-expo unit tests.
8. `src/data/seed/` (split by entity, each file well under 300 lines): seeded PRNG
   (mulberry32) in `prng.ts`, 4 stores, 12 staff (PIN `1234` for all), 8 categories, 120
   products (30 base products x 4 size/pack variants, valid EAN-13 barcodes, realistic
   Vietnamese grocery names/units/prices), stock levels (4 stores x 120 products), 40
   customers, 300 orders spread over the last 30 days, 6 shifts derived from the generated
   orders, plus a handful of goods receipts / stock transfers / stock counts.
9. zustand stores: `session-store.ts`, `catalog-store.ts`, `inventory-store.ts`,
   `customer-store.ts`, `order-store.ts`, `settings-store.ts` - typed hooks + plain actions,
   each seeded from `src/data/seed` on import.
10. i18n: `src/i18n/registry.ts` (merge point via `registerDictionary`, so phases 1-4 can add
    `src/i18n/<area>.vi.ts`/`.en.ts` without ever touching `index.ts`), `common.vi.ts`/`common.en.ts`
    (nav/actions/auth/shell), `useT()`/`t()`.
11. Theme: `src/theme/use-app-theme.ts` wires `settings-store`'s `light|dark|system` to
    `Uniwind.setTheme` + `useColorScheme`; settings screen has a working `SegmentedControl`
    (theme) and `Select` (locale).
12. `package.json` scripts (`start`, `web`, `ios`, `android`, `typecheck`, `test`,
    `export:all`, `lint`), `.gitignore`, `README.md`.

## Exact commands run (chronological, abbreviated)

```
npx create-expo-app@latest <scratch-dir> --template blank-typescript
rsync -a --exclude .git --exclude node_modules --exclude CLAUDE.md --exclude AGENTS.md <scratch-dir>/ .
npm install
npx expo install expo-router react-native-safe-area-context react-native-screens \
  react-native-gesture-handler react-native-reanimated react-native-worklets \
  react-native-web react-dom @expo/metro-runtime @gorhom/bottom-sheet \
  @react-native-community/datetimepicker react-native-teleport
npm i -E @beemvp/beeui-ui@0.86.2-rc.1 @beemvp/beeui-core@0.86.2-rc.1 \
  @beemvp/beeui-tokens@0.86.2-rc.1 tailwindcss@4.3.3 uniwind@1.10.1 zustand
npx expo install jest-expo jest --dev
npm i -D @types/jest
npx uniwind generate-artifacts --css ./global.css --theme violet-light --theme violet-dark \
  --theme high-contrast-light --theme high-contrast-dark --dts ./uniwind-types.d.ts
npx tsc --noEmit
npx jest
npx expo export --platform web
npx expo export --platform all
npx expo start --web --port 8099   (+ Playwright/Chromium driven QA, see below)
```

## Versions installed (`npm ls --depth=0`)

```
beepos@0.1.0
+-- @beemvp/beeui-core@0.86.2-rc.1
+-- @beemvp/beeui-tokens@0.86.2-rc.1
+-- @beemvp/beeui-ui@0.86.2-rc.1
+-- @expo/metro-runtime@57.0.15
+-- @gorhom/bottom-sheet@5.2.14
+-- @react-native-community/datetimepicker@9.1.0
+-- @types/jest@30.0.0
+-- @types/react@19.2.18
+-- expo-router@57.0.20
+-- expo-status-bar@57.0.1
+-- expo@57.0.21
+-- jest-expo@57.0.5
+-- jest@29.7.0
+-- react-dom@19.2.3
+-- react-native-gesture-handler@2.32.0
+-- react-native-reanimated@4.5.1
+-- react-native-safe-area-context@5.7.0
+-- react-native-screens@4.26.2
+-- react-native-teleport@1.2.2
+-- react-native-web@0.21.2
+-- react-native-worklets@0.10.1
+-- react-native@0.86.3
+-- react@19.2.3
+-- tailwindcss@4.3.3
+-- typescript@6.0.3
+-- uniwind@1.10.1
`-- zustand@5.0.15
```

`react-native@0.86.3` (not the spec's exact `0.86.2`) and `react-native-web@0.21.2`/
`react-native-teleport@1.2.2` (not exactly `0.21.0`/`1.1.13`) are Expo's/npm's own resolved
choices; all satisfy BeeUI's declared peer ranges (`react-native >=0.86.0 <0.87.0`,
`react-native-web` has no BeeUI peer constraint, `react-native-teleport >=1.1 <2`). See audit
finding 00-10 for why the exact `0.86.2` pin was not kept.

## Evidence per acceptance line

- `npx tsc --noEmit` clean: confirmed, zero output. Required running `npm run uniwind:types`
  first (now wired into `postinstall` and `typecheck` scripts) - see finding 00-04.
- `npm test` green: `Test Suites: 1 passed, 1 total / Tests: 8 passed, 8 total` (`src/domain/__tests__/money.test.ts`).
- `npx expo export --platform web` succeeds; exported CSS contains BeeUI classes: grepped
  `dist/_expo/static/css/global-*.css` (38KB) for `bg-primary` (1 match) and confirmed
  semantic `--color-*` tokens (`--color-primary`, `--color-background`, `--color-border`,
  `--color-destructive`, etc.) are present.
- `npx expo export --platform all` (the phase spec's `--platform web,ios,android` syntax is
  rejected by this Expo CLI version, see finding 00-09) succeeds for web (2.9MB JS + 38KB
  CSS), iOS (4.5MB Hermes bytecode), and Android (4.7MB Hermes bytecode).
- `npx expo start --web` + Playwright/Chromium (`npx playwright --version` -> `1.61.1`,
  already available, browsers already installed): drove the full flow at both 1280px and
  390px viewports - login (`HN01` + PIN `1234` via `OTPInput`) -> `/select-store` (owner
  `staff-1` has all 4 stores) -> pick a store -> `/pos` with the responsive shell. Screenshots
  saved to `docs/screenshots/phase-00-wide-sidebar.png` (1280px, full sidebar with all 9
  areas), `docs/screenshots/phase-00-narrow-tabs.png` (390px, 4 primary bottom tabs +
  active-tab highlight), `docs/screenshots/phase-00-wide-settings-light.png` and
  `docs/screenshots/phase-00-wide-settings-dark.png` (theme `SegmentedControl` -> `Uniwind.setTheme('dark')`
  flips background/text/every token instantly, confirmed visually).
- No console errors on web load: confirmed via Playwright `page.on('console')` +
  `page.on('pageerror')` across the full login -> select-store -> pos -> settings -> orders
  flow at both viewports: `CONSOLE_ERRORS_COUNT: 0` on the final run. Getting to zero required
  fixing two real bugs found along the way (nested `<button>` from wrapping `IconButton`
  inside `DropdownMenuTrigger`, and a `styleq: tailwind typeof undefined is not "string" or
  "null"` runtime error from `AppHeader` nested in a partial-edge `SafeArea`, i.e. the
  official doc's own composition example) - both logged as findings 00-05/00-08 with the
  workarounds applied in `src/components/shell/`.
- `docs/beeui-audit/findings-00-scaffold.md` written: 10 findings (2 major docs-public status
  contradictions, 1 minor dist-tag doc issue, 1 minor compatibility-matrix gap, 1 major
  undocumented uniwind CLI requirement, 1 major "no prop docs, had to reverse-engineer via
  tsc" finding, 1 minor component gap, 2 major runtime bugs with full repro/isolation, 1
  minor Expo-CLI-not-BeeUI friction, 1 minor version-pin conflict).
- Commit: see below.

## Open questions / follow-ups for later phases

- `react-native@0.86.3` vs. the spec's exact `0.86.2` pin (finding 00-10) - if a future phase
  needs the exact patch, expect to re-hit the `jest-expo` ERESOLVE conflict; recommend keeping
  `0.86.3` unless BeeUI explicitly certifies otherwise.
- `AppHeader`'s partial-edge-`SafeArea` bug (finding 00-08) was worked around by using one
  outer `SafeArea` for the whole shell. If a later phase needs a header that does NOT extend
  to the bottom safe-area inset (e.g., a modal with its own header), re-test that composition
  first rather than assuming the split-SafeArea doc pattern is safe.
- `ListItem` has no built-in `active`/`selected` state (finding 00-06); `Sidebar`'s
  `className`-based highlight is a plain workaround, not a BeeUI-native affordance.

## Status

Status: DONE_WITH_CONCERNS
Summary: Expo 57 + expo-router + BeeUI shell scaffolded end to end (auth, responsive shell, 9 placeholder areas, seed data, zustand stores, i18n, theme); tsc/jest/export(web,ios,android) all pass and the web flow is console-error-free after fixing two real BeeUI runtime bugs found during QA.
Concerns/Blockers: None blocking; 10 BeeUI audit findings logged in docs/beeui-audit/findings-00-scaffold.md, two of which (00-05 undocumented component props, 00-08 AppHeader/SafeArea runtime bug matching the official doc example) are worth BeeUI team attention before other consumers hit them.
