# Phase 5 · wave 3 · fixing the native smoke defects N-01 to N-05

Worker: fix pass · 2026-09-13 (02:00 to 02:45) · nothing committed · only `src/` plus this
report, `docs/beeui-audit/findings-21-fix.md` and `docs/screenshots/ios-p5-fix-*.png`.

Input: `plans/260912-1054-beepos-design-pass/reports/phase-05-native-smoke-report.md`.
Verified on the iPhone 16 Pro and iPad Pro 11-inch M4 simulators (iOS 18.6, the dev client the
smoke run built, Metro on 8106) and on web (`expo start --web --port 8107`, Chromium).

## FIXED / LEFT

| id | sev | state | what changed | proof |
|---|---|---|---|---|
| N-03 | major | **FIXED** | `src/theme/use-app-theme.ts`: the app now reads the OS scheme from the platform instead of from whatever theme was last applied, and native releases React Native's colour-scheme override while the mode is `system`. "Theo hệ thống" goes back to the OS value immediately, and a later OS flip re-themes the running app. The demo reset restores the default theme in the same session, no restart. | `ios-p5-fix-04-theme-dark-chosen.png` (Tối, OS light) → `ios-p5-fix-05-theme-system-back-to-light.png` (back to system, light at once) → `ios-p5-fix-06-theme-follows-os-dark.png` (OS flipped to dark, app follows, app untouched). Web measured in the same order: `light → dark → light → dark → light`, 0 console errors. |
| N-01 | major | **FIXED** | `src/features/pos/components/customer-dialog.tsx`: the capped `View` is a `ScrollView` (`max-h-80 overflow-hidden`, `keyboardShouldPersistTaps="handled"`, `nestedScrollEnabled`). The list clips at the dialog surface and scrolls inside it. | `ios-p5-fix-01-customer-dialog-clipped.png` (five rows, nothing over the totals or the tab bar), `ios-p5-fix-02-customer-dialog-scrolled.png` (scrolled to later customers, still clipped at both edges) |
| N-02 | minor | **FIXED** | `src/data/persistence-bootstrap.ts`: `resetDemoData()` kicks off every slice reset (each puts its seed back synchronously) and restores the session **in the same tick**, before the first await. No render sees `staff === null`, so the app-area guard never redirects. | `ios-p5-fix-07-reset-stays-on-settings.png`: Settings still on screen with "Đã nạp lại dữ liệu mẫu", and the theme has gone from dark back to the default in the same frame |
| N-04 | nit | **FIXED** | `src/components/command-palette.tsx`: the search field is focused after the dialog mounts on both platforms (web through the wrapper's DOM node as before, native through a `ref` on `SearchInput`), with a 250 ms delay on native so the focus is not eaten by the `Modal` presentation. The arrow/Enter/Esc hint renders on web only, where those keys exist. | `ios-p5-fix-08-ipad-palette-focus.png`: palette opened from the header, nothing else tapped, "coca" typed straight in, keyboard up, results filtered; no hint line |
| N-05 | nit | **FIXED** | The cart's customer action reads `pos.cart.changeCustomer` once a customer is attached (`Đổi khách hàng` / `Change customer`, both dictionaries). | `ios-p5-fix-03-change-customer-label.png` |
| — | — | LEFT | Phase 3b's role-level a11y evidence (order chip announced as a button rather than a tab, D-05 stock inputs) still needs an unlocked macOS session; Maestro exposes labels, not traits. Unchanged by this pass. | smoke report, unresolved question 2 |
| — | — | LEFT | W-B's risk 2: an app killed inside the 300 ms write debounce still loses that change. A native `AppState` flush is the open item; out of scope here. | smoke report, "Persistence" |
| — | — | LEFT | Two pre-existing eslint warnings (`Array<T>` in `src/data/seed/operations.ts` and `src/features/orders/components/order-list-group.tsx`). Not touched: not this pass's files. | `npx eslint src app` |

## How N-03 was actually diagnosed

The smoke report's open question was whether the fix is ours or whether `Uniwind.setTheme`
takes a "follow the system" value. Measured, not assumed:

1. `Uniwind.setTheme('system')` type-checks (the generated `uniwind-types.d.ts` allows it) and
   does not throw, **but it does not restore following the OS**. On web, after one explicit
   `setTheme('dark')`, flipping `prefers-color-scheme` left `documentElement.className` pinned
   even with `'system'` handed back, while `matchMedia('(prefers-color-scheme: dark)').matches`
   toggled correctly in the same run. So the pin is the library's, and `'system'` does not
   release it.
2. `Appearance.setColorScheme` **does not exist on react-native-web 0.21**. Calling it
   unguarded crashed the web app with `Appearance.default.setColorScheme is not a function`
   (caught by the web smoke before anything else was run, not in review).

The hook therefore owns "what does the OS want": `useColorScheme()` on native (truthful once
the override is released) and a `matchMedia` subscription through `useSyncExternalStore` on
web, with a concrete `'light' | 'dark'` handed to Uniwind on every change. Filed against BeeUI
as `docs/beeui-audit/findings-21-fix.md` 21F-01 (major): the documented app-level theme switch
cannot express "follow the system" after an explicit choice, and the pin is undocumented.
Deduped against `findings-*.md` (only `findings-10` mentions `setTheme`, for the branding
registry snippet, not the pin).

## Files touched

| file | lines | what |
|---|---|---|
| `src/theme/use-app-theme.ts` | +47 -20 | OS scheme read from the platform; native override released in `system` mode |
| `src/theme/theme-mode.ts` | new, 25 | `resolveRuntimeTheme` split out, free of React/RN/Uniwind so it is testable |
| `src/theme/__tests__/theme-mode.test.ts` | new, 26 | 4 cases incl. the system → explicit → system sequence |
| `src/features/pos/components/customer-dialog.tsx` | +16 -6 | `ScrollView` for the list, `Đổi khách hàng` when attached |
| `src/data/persistence-bootstrap.ts` | +11 -5 | session restored in the reset tick |
| `src/components/command-palette.tsx` | +29 -10 | native focus via `ref`, web focus unchanged, hint web-only |
| `src/i18n/pos.vi.ts`, `src/i18n/pos.en.ts` | +1 each | `cart.changeCustomer`, key-for-key equal |

No BeeUI package was patched. `scripts/qa/e2e/lib/labels.ts` was not touched: the trigger's
accessible name still carries "Khách lẻ" while no customer is attached, which is what the
specs match on.

## Gates

| gate | result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm test` | 22 suites, 286 tests passed (4 new) |
| `npx eslint src app` | 0 errors, 2 pre-existing warnings |
| `npm run qa:e2e` | **23 passed**, 3 skipped (wide-only specs on narrow), 4.1 min, private `--output` dir |
| `npx expo export --platform all` | web + android + ios bundles written |

## Machine state left behind

iPhone 16 Pro simulator: booted, appearance **light**, signed in, seed data (a demo reset ran
on it), theme back on "Theo hệ thống". iPad Pro 11-inch M4: shut down again. Metro on 8106 (the
smoke run's) and a web dev server on 8107 are still up. The dev client's user defaults were not
touched. Nothing committed.
