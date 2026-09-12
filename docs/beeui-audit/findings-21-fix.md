# Findings 21 · fixing the native smoke defects (iOS + web)

Phase: `plans/260912-1054-beepos-design-pass/phase-05-feature-upgrade.md`, block W-N fix pass.
Surface exercised: the documented app-level theme switch (`Uniwind.setTheme`, the API BeeUI's
theming guide hands to the application), plus `Dialog`/`DialogContent`, `SearchInput` and
`SegmentedControl` on iOS 18.6 (iPhone 16 Pro, iPad Pro 11-inch M4) and on
react-native-web 0.21.

Nothing in the published packages was patched. The one entry below is worked around in app
code, and the workaround is named in the entry.

### 21F-01 · `Uniwind.setTheme` pins the colour scheme with no documented way back to "follow the OS"
- Area: api-types
- Severity: major
- Source consulted: <https://beeui.beemvp.com/docs/theming/>,
  `https://beeui.beemvp.com/llms-full.txt` (the only place `Uniwind.setTheme` is named),
  generated `uniwind-types.d.ts`
- Expected (per docs): the app-level light/dark switch is `Uniwind.setTheme(name)`, and an app
  that offers "light / dark / follow the system" can express all three through it. The
  generated types accept `'system'` alongside the six BeeUI themes, which reads as exactly
  that: hand back `'system'` and the OS is followed again.
- Actual: once an explicit theme has been set, the app stops following the OS for the rest of
  the process, and `'system'` does not undo it.
  - Web, measured: with the app on "follow the system" from boot, flipping
    `prefers-color-scheme` re-themes the page. After one `Uniwind.setTheme('dark')`, flipping
    the media query leaves `document.documentElement.className` on the pinned theme, and
    `Uniwind.setTheme('system')` afterwards does not restore the following: the class stays
    where it was through a further dark/light flip (`matchMedia('(prefers-color-scheme:
    dark)').matches` confirmed as toggling in the same run).
  - Native, observed: React Native's `useColorScheme()` stops reporting OS changes after the
    same call, which is the signature of an `Appearance` override being held. The app then
    shows the last explicit choice whatever the OS and whatever the setting says
    (`plans/260912-1054-beepos-design-pass/reports/phase-05-native-smoke-report.md`, N-03).
  - No page of the public docs mentions the pin, its lifetime, or a release call; `setTheme`
    itself appears in one fixture snippet only.
- Repro: `Uniwind.setTheme('dark')`, then `Uniwind.setTheme('system')`, then change the OS
  appearance: the tree keeps the dark theme (web: `documentElement.className === 'dark'`).
- Workaround: the app stops trusting the library for "what does the OS want". On native it
  releases React Native's override itself (`Appearance.setColorScheme('unspecified')` while the
  mode is `system`) and on web it subscribes to `matchMedia('(prefers-color-scheme: dark)')`
  directly, then hands Uniwind a concrete `'light' | 'dark'` on every change
  (`src/theme/use-app-theme.ts`). Note that `Appearance.setColorScheme` does not exist on
  react-native-web 0.21, so calling it unguarded crashes the web build with
  `Appearance.default.setColorScheme is not a function`.
- Suggested fix for BeeUI: document what `setTheme` pins and how long it holds, and make
  `setTheme('system')` release the override and re-subscribe to the platform scheme on both
  platforms. An app that ships a three-way theme setting cannot implement it from the public
  API as it stands without reaching past BeeUI to `Appearance` and `matchMedia`.
