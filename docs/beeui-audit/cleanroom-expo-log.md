# Clean-room log: Expo path (Worker B, phase 07B)

Tester: fresh-reader (never seen BeeUI). Directory: `/Users/textsoft/workspace/beeui-cleanroom-expo` (outside BeePOS, not committed). Node 24.14.1, npm 11.11.0, macOS. Date 2026-09-11.

Confusion codes: `clear | ambiguous | missing-step | wrong | contradicts <url> | had-to-guess | BLOCKED`.

---

## Step 1 · Read /docs/start/

- Doc URL: https://beeui.beemvp.com/docs/start/
- Quoted instruction: "BeeUI 0.86.2-rc.1 is public on npm under the opt-in `next` dist-tag. Stable `latest` is not promoted yet, so every release-candidate install should use `@next` or pin the exact RC version."
- What I did: read the Overview, "Which intent is yours" table, Prerequisites table, "Pick a platform" table.
- What happened: page is clear that "Integrate the public RC" -> "Pick a platform" is my path. Prerequisites table lists Node 24.13.1 (I have 24.14.1), pnpm 10.15.0 (repo tooling only), React 19.2.3, React Native 0.86.2, Expo SDK ~57.0.0, react-native-web 0.21.0, Tailwind/Uniwind 4.3.3/1.10.1.
- Minutes lost: 3 (reading only)
- Confusion code: clear

## Step 2 · Follow "Pick a platform" -> Expo guide link

- Doc URL: https://beeui.beemvp.com/docs/start/expo/
- Quoted instruction: "Use this path for an Expo SDK 57 application." then immediately "Add BeeUI to Expo — Install the BeeUI RC packages explicitly from `next`: `npm install @beemvp/beeui-ui@next @beemvp/beeui-core@next @beemvp/beeui-tokens@next` ..."
- What I did: looked for a step that creates the Expo app itself (`npx create-expo-app` or similar) before the `npm install @beemvp/beeui-ui@next ...` line.
- What happened: there is no such step on this page, on /docs/start/, or on /docs/start/provider-safe-area/. The page's very first instruction assumes an Expo SDK 57 application already exists and jumps straight to installing BeeUI into it. Nothing on the three pages I am allowed to read (Overview -> Expo -> Provider & safe area) tells a fresh reader how to scaffold that starting Expo app, which Expo template to use, or that `npx create-expo-app` is expected.
- Minutes lost: 12 (searched the whole page twice, then Overview, then provider-safe-area, before concluding the step is simply absent)
- Confusion code: missing-step

## Step 3 · Workaround: scaffold an Expo app (outside BeeUI docs, per Expo's own docs)

- Doc URL (third-party, allowed because BeeUI told me to use Expo): https://docs.expo.dev/get-started/create-a-project/
- What I did: ran `npx create-expo-app@latest .` in the empty clean-room directory, accepting the default template.
- What happened: succeeded. Scaffolded a default Expo Router project, `expo@~57.0.21`, `react@19.2.3`, `react-native@0.86.3` (BeeUI's own prerequisite table says `react-native 0.86.2`; the current default `create-expo-app` template pulls `0.86.3` — a one-patch drift the BeeUI docs do not mention or allow for).
- Minutes lost: 4
- Confusion code: missing-step (continued from step 2; workaround applied)

## Step 4 · Install BeeUI packages

- Doc URL: https://beeui.beemvp.com/docs/start/expo/
- Quoted instruction: `npm install @beemvp/beeui-ui@next @beemvp/beeui-core@next @beemvp/beeui-tokens@next` then `npm install react@19.2.3 react-dom@19.2.3 react-native@0.86.2 react-native-web@0.21.0 react-native-safe-area-context@~5.7.0 react-native-teleport@~1.1.13 tailwindcss@4.3.3 uniwind@1.10.1`
- What I did: ran both commands verbatim, in order, against the freshly scaffolded Expo app.
- What happened: both succeeded without error (unlike the Web path, see cleanroom-web-log.md step 4, which fails with this same two-command pattern). `npm ls` after install resolved `@beemvp/beeui-ui@0.86.2-rc.1`, `@beemvp/beeui-core@0.86.2-rc.1`, `@beemvp/beeui-tokens@0.86.2-rc.1` as documented.
- Minutes lost: 2
- Confusion code: clear

## Step 5 · Styling entry

- Doc URL: https://beeui.beemvp.com/docs/start/expo/
- Quoted instruction: "`@import 'tailwindcss'; @import 'uniwind'; @import '@beemvp/beeui-tokens/theme.css';`" and "`@source './node_modules/@beemvp/beeui-core/src'; @source './node_modules/@beemvp/beeui-ui/src';` The `@source` entries are required so Tailwind sees BeeUI's published source classes."
- What I did: looked for the file this CSS block should go in. The docs never say. The freshly scaffolded `create-expo-app` project already ships a `src/global.css` (plain CSS custom properties, no Tailwind) — I guessed this was the intended target file and pasted the docs' block at its top.
- What happened: the `@source` paths as written (`./node_modules/...`) are relative to the file they are declared in. Because the scaffold's CSS lives at `src/global.css`, not at the project root, the literal `./node_modules/...` path is wrong (it would resolve to a non-existent `src/node_modules`). I had to change it to `../node_modules/...` to point at the real location. The docs give no indication that the css entry point's location is expected to vary between projects, or that the `@source` paths must be adjusted accordingly.
- Minutes lost: 9
- Confusion code: had-to-guess (both the target file and the corrected `@source` paths)

## Step 6 · Metro configuration

- Doc URL: https://beeui.beemvp.com/docs/start/expo/
- Quoted instruction: "`const { getDefaultConfig } = require('expo/metro-config'); const { withUniwindConfig } = require('uniwind/metro'); module.exports = withUniwindConfig(getDefaultConfig(__dirname), { cssEntryFile: './global.css', dtsFile: './uniwind-types.d.ts', extraThemes: [...] });`"
- What I did: created `metro.config.js` at the project root (the scaffold has none by default) with this snippet, changing `cssEntryFile` from `'./global.css'` to `'./src/global.css'` to match where the CSS entry actually lives (see step 5).
- What happened: worked once I adjusted the path myself; the docs' literal `'./global.css'` would not have found the file.
- Minutes lost: 5
- Confusion code: had-to-guess

## Step 7 · Provider (App root)

- Doc URL: https://beeui.beemvp.com/docs/start/expo/ and https://beeui.beemvp.com/docs/start/provider-safe-area/
- Quoted instruction: "`import { AppHeader, BeeUIProvider, BottomActionBar, SafeArea, Screen } from '@beemvp/beeui-ui'; export function AppShell() { return (<BeeUIProvider>...`" (provider-safe-area) and a bare `export default function App() { return (<BeeUIProvider>...` on the Expo page.
- What I did: looked for where to put this in the scaffold. The default `create-expo-app` template (current, as of this test) is an Expo Router app: there is no `App.js`/`App()` default export anywhere; the entry point is `expo-router/entry` and the real root component is `src/app/_layout.tsx`, which already returns a `NativeTabs` navigator, not a bare `<Screen>`/`<SafeArea>` tree.
- What happened: neither of the two BeeUI pages I am allowed to read (Expo guide, Provider & safe area) mentions Expo Router, `_layout.tsx`, tabs, or how `BeeUIProvider` composes with a router-based root at all. I guessed the safest minimal composition: wrap the existing `_layout.tsx` return value in `<BeeUIProvider>` without touching the Router/Tabs subtree, rather than replacing the whole file with the docs' `App()` snippet (which would have thrown away Expo Router entirely, a much bigger, undocumented, unjustified change).
- Minutes lost: 14 (had to open the scaffold's actual files, understand NativeTabs, and decide how much to preserve)
- Confusion code: missing-step

## Step 8 · Typecheck

- Doc URL: https://beeui.beemvp.com/docs/start/ ("Verify your install" -> "Typecheck your application.")
- What I did: `npx tsc --noEmit`.
- What happened: 2 pre-existing errors from the *unmodified* `create-expo-app` scaffold (`animated-icon.web.tsx` cannot find `./animated-icon.module.css` types; `theme.ts` cannot find type declarations for the side-effect import of `@/global.css`) — confirmed pre-existing by `git stash` and re-running `tsc` before any BeeUI change. Not BeeUI's fault, but the "Typecheck your application" checkpoint does not actually pass cleanly on a freshly scaffolded Expo app before BeeUI is even added, and the docs give no warning that this is expected. My own BeeUI wiring introduced zero new type errors.
- Minutes lost: 6 (verifying the errors were pre-existing rather than something I broke)
- Confusion code: ambiguous

## Step 9 · Export for web

- Doc URL: https://beeui.beemvp.com/docs/start/ ("Build or export for every platform you ship.")
- What I did: `npx expo export --platform web`.
- What happened: succeeded. Produced `dist/_expo/static/css/global-*.css` at 37KB, containing `.pt-safe` (the documented safe-area utility class) and the `violet` extra-theme names from my Metro config — real evidence the Tailwind/Uniwind/BeeUI-token pipeline actually compiled, once steps 5-7's gaps were individually guessed around.
- Minutes lost: 2
- Confusion code: clear

## Step 10 · Build the small screen (Field+Input, Dialog+Button, Select, Table x3, Sheet, useToast, theme switch)

- Doc URLs: https://beeui.beemvp.com/docs/components/{button,field,input,dialog,select,table,sheet,toast}/ and https://beeui.beemvp.com/llms-full.txt
- What I did: composed the screen from each component page's "Import" section and the fragments under "Verified example source". Used one component (`ScreenTitle`) that does not exist in `@beemvp/beeui-ui` — I invented that name by analogy without checking the export list first; `tsc` caught it immediately (`error TS2305: Module '"@beemvp/beeui-ui"' has no exported member 'ScreenTitle'`) and I replaced it with the documented `<Text variant="heading">` pattern shown on the Button page's fixture.
- What happened: once real exported names were used, `npx tsc --noEmit` passed with zero new errors.
- Minutes lost: 7 (my own error, logged as `had-to-guess` since I did not check the component inventory first)
- Confusion code: had-to-guess

## Step 11 · The screen renders the wrong content (silent NativeTabs routing failure)

- Doc URL: n/a — this is a consequence of step 7's undocumented Expo Router gap, not a new doc citation.
- What I did: placed the new screen at `src/app/clean-room.tsx` (a normal Expo Router file route) and requested `/clean-room` both via `npx expo export --platform web` (static route list showed `/clean-room (25KB)`, a distinct file from `/ (index)`) and via a live `npx expo start --web --port 8095` dev server.
- What happened: both the static export's `dist/clean-room.html` and the live dev server's `/clean-room` response rendered the **starter's index/"Welcome to Expo" screen**, not my component — with no error, no warning, no 404. Root cause: `src/app/_layout.tsx` renders `NativeTabs` (from `expo-router/unstable-native-tabs`) with only two declared `<NativeTabs.Trigger name="index">` / `name="explore">` children; a file route that is not registered as a trigger silently falls back to the first tab's content instead of erroring or navigating. Nothing in the BeeUI docs I am permitted to read mentions Expo Router, NativeTabs, or this fallback behavior; a newcomer following only these docs would have no idea their new screen was silently never rendered.
- Repro: `curl -sS http://localhost:8095/clean-room` returns 200 and the literal text "Welcome to Expo", not any string from the new screen.
- Minutes lost: 22 (diagnosed via `diff`/`md5` on two exported HTML files before finding the NativeTabs cause)
- Confusion code: missing-step, BLOCKED (2 honest attempts: (1) direct file route, (2) re-export/re-serve to rule out a stale-cache artifact — both reproduced the same silent-fallback)
- Workaround applied: moved the screen's content into `src/app/index.tsx` (the Home tab BeeUI Router already renders by default) instead of registering a new tab. This is the smallest change that gets a real BeeUI screen on screen and does not require guessing at NativeTabs API the docs never mention.

## Step 12 · Verify in Chromium (Playwright)

- Doc URL: n/a (task instruction, not a BeeUI doc claim)
- What I did: `npx playwright --version` in the clean-room dir found nothing (global install not visible from a fresh project); ran `npm i -D playwright` then `npx playwright install chromium`, then a small script drove `http://localhost:8095/` and clicked through Theme toggle, Dialog, Select, Sheet, Toast, and an invalid email in Field.
- What happened: everything works and is fully styled once steps 5-7 and 11's workarounds are applied: orange BeeUI button styling, bordered Field/Input/Select, working Dialog/Sheet overlays with Escape-to-close, a real Toast with title/description/success color, dark-theme toggle via `Uniwind.setTheme()` re-themes the whole tree live, and Field shows the red invalid border + error message on a bad email. Zero browser console errors during the whole interaction sequence.
- Screenshots: `docs/screenshots/cleanroom-expo-shell.png`, `cleanroom-expo-dialog.png`, `cleanroom-expo-select.png`, `cleanroom-expo-sheet.png`, `cleanroom-expo-toast.png`, `cleanroom-expo-dark-theme.png`, `cleanroom-expo-field-invalid.png`.
- Minutes lost: 0 (this step worked cleanly)
- Confusion code: clear

## Step 13 · The runtime theme API import (`Uniwind.setTheme`)

- Doc URL: https://beeui.beemvp.com/llms-full.txt
- Quoted instruction: "the **app-level** switch between light and dark at runtime is owned by the application and driven through Uniwind — not a BeeUI component. Import from the `uniwind` package: `Uniwind.setTheme(name)` changes the active theme globally, and `useUniwind()` reads the current `{ theme }`..."
- What I did: looked for the exact import statement (`import { Uniwind } from 'uniwind'` vs. a default export, vs. `useUniwind` from the same or a different module) on this page, on /docs/start/provider-safe-area/, and on the theming Overview page.
- What happened: no page gives the literal `import` line for `Uniwind`/`useUniwind`. The Button component page's fixture snippet uses `Uniwind.setTheme(nextTheme)` inline but does not show its import either (the snippet is a JSX fragment, not a full file). I guessed `import { Uniwind, useUniwind } from 'uniwind';` by analogy with the fact that `uniwind/metro` exports `withUniwindConfig` as a named export. This guess happened to be correct (`tsc` passed, runtime worked).
- Minutes lost: 6
- Confusion code: had-to-guess (worked)

## Step 14 · `llms-components.txt` disagrees with reality on publish status

- Doc URL: https://beeui.beemvp.com/llms-components.txt
- Quoted instruction: "STATUS: BeeUI is pre-1.0 and UNPUBLISHED. No `@beemvp/beeui-*` package or CLI is on npm,"
- What I did: nothing — noticed this while grepping the file for a `ScreenTitle`/heading component (step 10).
- What happened: this directly contradicts https://beeui.beemvp.com/docs/start/, which opens with "BeeUI 0.86.2-rc.1 is public on npm under the opt-in `next` dist-tag," and contradicts my own successful `npm install @beemvp/beeui-ui@next` in step 4. A reader who starts from `llms-components.txt` (a file this task explicitly designates as an allowed, load-bearing source for AI agents) would conclude the package cannot be installed at all.
- Minutes lost: 3 (just noticing and confirming the contradiction against step 4's evidence)
- Confusion code: contradicts https://beeui.beemvp.com/docs/start/

---

## Outcome

Reached a **styled, running screen** exercising Field+Input+validation, Dialog-from-Button, Select, a 3-row Table, a Sheet, `useToast`, and a light/dark runtime theme switch, on Expo web (port 8095), verified with `npx tsc --noEmit` (clean, modulo 2 pre-existing scaffold errors unrelated to BeeUI), `npx expo export --platform web` (clean), and Playwright screenshots showing correct BeeUI styling and working interactions in Chromium.

Total minutes lost to documentation friction (excludes clean/expected steps): approximately 90 minutes, dominated by step 11 (silent Expo Router/NativeTabs fallback, 22 min), step 7 (provider placement with no Router guidance, 14 min), step 5 (styling entry path guess, 9 min).
