# Clean-room log: Web (Vite) path (Worker B, phase 07B)

Tester: fresh-reader (never seen BeeUI). Directory: `/Users/textsoft/workspace/beeui-cleanroom-web` (outside BeePOS, not committed). Node 24.14.1, npm 11.11.0, macOS. Date 2026-09-11.

Confusion codes: `clear | ambiguous | missing-step | wrong | contradicts <url> | had-to-guess | BLOCKED`.

---

## Step 1 · Read /docs/start/web/

- Doc URL: https://beeui.beemvp.com/docs/start/web/
- Quoted instruction: "Use this path for a browser-first product built with Vite and React Native Web."
- What I did: read the whole page (Install, Styling entry, Vite configuration, Application root, Verify, Evidence boundary).
- What happened: like the Expo page, this page never says how to create the underlying Vite project in the first place; it assumes one already exists. Unlike the Expo page, it also never gives an actual `vite.config.ts` — see step 5.
- Minutes lost: 3
- Confusion code: missing-step (project scaffold, same class of gap as Expo step 2)

## Step 2 · Scaffold a Vite React+TS project (Vite's own docs, allowed third-party source)

- Doc URL: https://vite.dev (via `npm create vite@latest`)
- What I did: `npm create vite@latest . -- --template react-ts` in the empty clean-room directory, then `npm install`.
- What happened: succeeded. Scaffold used `vite@^8.3.0`, `react@^19.2.8`; BeeUI's Web page pins `vite@8.2.2` and `react@19.2.3` — both get overridden in step 4/5's explicit installs.
- Minutes lost: 4
- Confusion code: missing-step (continued from step 1)

## Step 3 · Install (first attempt, literal two-command sequence as printed)

- Doc URL: https://beeui.beemvp.com/docs/start/web/
- Quoted instruction: "`npm install @beemvp/beeui-ui@next @beemvp/beeui-core@next @beemvp/beeui-tokens@next` `npm install react@19.2.3 react-dom@19.2.3 react-native@0.86.2 react-native-web@0.21.0 react-native-safe-area-context@5.7.0 react-native-teleport@1.1.13 tailwindcss@4.3.3 uniwind@1.10.1`"
- What I did: ran the first `npm install @beemvp/beeui-ui@next ...` line by itself, exactly as the page presents it (a separate command block from the second line).
- What happened: hard failure. `npm error Could not resolve dependency: npm error peer react-native@">=0.86.0 <0.87.0" from @beemvp/beeui-ui@0.86.2-rc.1` because npm's resolver picked up `react-native@0.87.1` (pulled in transitively by BeeUI's own `peerOptional` `@gorhom/bottom-sheet` dependency, which accepts `react-native@"*"`) before the second command ever pins `react-native@0.86.2`. First 5 lines of the exact error:
  ```
  npm error While resolving: beeui-cleanroom-web@0.0.0
  npm error Found: react-native@0.87.1
  npm error node_modules/react-native
  npm error   peer react-native@"*" from @gorhom/bottom-sheet@5.2.14
  npm error   node_modules/@gorhom/bottom-sheet
  ```
- Minutes lost: 11 (ran the command, hit the error, re-read the page twice to check I hadn't skipped a step, read the npm error report)
- Confusion code: wrong

## Step 4 · Install (second attempt, workaround: combine both commands into one)

- Doc URL: https://beeui.beemvp.com/docs/start/web/
- What I did: re-ran the two documented `npm install` lines as a single combined `npm install` invocation instead of two sequential ones.
- What happened: succeeded, with `ERESOLVE overriding peer dependency` warnings (react-dom wants react `^19.3.0`, I am pinning `19.2.3` as BeeUI's docs say) but no hard failure and no forced flags needed. This is not documented anywhere as the required install order; the page's own two-block presentation actively suggests running them separately, which breaks.
- Minutes lost: 6
- Confusion code: wrong (workaround found and applied)

## Step 5 · Vite configuration — the central gap

- Doc URL: https://beeui.beemvp.com/docs/start/web/
- Quoted instruction, in full, under "Vite configuration": "The maintained `examples/web-consumer` fixture is the executable authority for plugin order and React Native Web aliasing. Keep the RNW, Uniwind and Tailwind integrations aligned with that fixture."
- What I did: looked for an actual `vite.config.ts` code block on this page (none), a link to `examples/web-consumer` (none — checked every `href` on the page, found zero references to `web-consumer` or any GitHub URL at all, unlike the component pages which do link GitHub for "Verified example source"), and any other page in my three-page Web path or in the four `llms*.txt` files that shows working Vite plugin wiring for RNW + Uniwind + Tailwind together (found only prose in `llms-full.txt`, no code — see step 8 below).
- What happened: this is the single largest gap in the whole Web path. The docs *name* a plugin package (`vite-plugin-rnw@0.0.12`, from the Install step) but never show how to use it, never mention `@tailwindcss/vite`'s usage beyond naming the package, and never mention that `uniwind` ships its own Vite plugin (`uniwind/vite`) at all — which turned out to be required (see step 7).
- Minutes lost: 18 (re-reading the page three times, checking every link, confirming there is genuinely no code here)
- Confusion code: missing-step, BLOCKED (attempt 1: docs page itself; attempt 2: link-hunting for the referenced fixture — both failed, no way to reach `examples/web-consumer` from https://beeui.beemvp.com)

## Step 6 · Workaround attempt 1: assemble a Vite config from public package READMEs

- Doc URL (allowed — npm, per the task's source rule): `npm view vite-plugin-rnw@0.0.12 readme`
- What I did: read `vite-plugin-rnw`'s own published README (not a BeeUI source) which shows `plugins: [rnw()]` as its entire usage example, added `@tailwindcss/vite`'s `tailwindcss()` plugin (name only given by BeeUI's Install step; usage guessed from the "Tailwind CSS / Uniwind" wording pattern used elsewhere in BeeUI's docs), and guessed a `resolve.alias: { 'react-native': 'react-native-web' }` + `.web.tsx`-first `resolve.extensions` list from general React Native Web knowledge, since nothing in BeeUI's docs mentions aliasing at all despite explicitly calling it out as something the (unreachable) fixture handles ("React Native Web aliasing").
- What happened: `npm run build` (`tsc -b && vite build`) succeeded with no errors. The app ran (`npx vite --port 8096`), but rendered **completely unstyled** — plain black text, no button backgrounds, no borders on Field/Input/Select, only the browser's native `<table>` border on Table. Browser console showed a repeating error: `styleq: tailwind typeof undefined is not "string" or "null".`
- Repro: load `http://localhost:8096/`, open DevTools console, see the `styleq` error twice on first paint.
- Minutes lost: 24 (writing the config, building, serving, diagnosing why it renders unstyled instead of erroring)
- Confusion code: had-to-guess, then wrong (this is exactly the failure mode `llms-full.txt` itself warns about, see step 8 — it happened to me despite reading that warning first)

## Step 7 · Workaround attempt 2: find and add `uniwind/vite`

- Doc URL: none on beeui.beemvp.com mentions this. Found via `npm view uniwind@1.10.1 exports`, an allowed npm source, which lists a `./vite` export (`dist/vite/index.d.ts`: `export declare function uniwind(config: UniwindConfig): Plugin`, `UniwindConfig = { cssEntryFile: string; extraThemes?: string[]; dtsFile?: string }`) — the Vite-world counterpart of the Metro page's `withUniwindConfig`, which BeeUI's Expo docs do mention. BeeUI's Web docs never mention this plugin exists.
- What I did: added `uniwind({ cssEntryFile: './src/global.css' })` to the Vite plugin list alongside `rnw()` and `tailwindcss()`.
- What happened: fixed it. `npm run build` produced a 37KB compiled CSS (up from an unstyled build with no BeeUI/Uniwind classes previously) containing `.pt-safe` and the theme names, and the running app in Chromium is now fully styled: BeeUI's orange button color, bordered inputs, a working Select dropdown, dark-theme toggle via `Uniwind.setTheme()`, a real Toast, and Field's invalid-state red border + message. Two `styleq: tailwind typeof undefined is not "string" or "null".` console errors remain on first paint (non-fatal — the app renders correctly afterward) with no explanation anywhere in the docs I am allowed to read.
- Screenshots: `docs/screenshots/cleanroom-web-shell.png`, `cleanroom-web-dialog.png`, `cleanroom-web-select.png`, `cleanroom-web-sheet.png`, `cleanroom-web-toast.png`, `cleanroom-web-dark-theme.png`, `cleanroom-web-field-invalid.png`.
- Minutes lost: 20 (finding the plugin export existed at all, then wiring and re-verifying)
- Confusion code: missing-step, BLOCKED then resolved (this is the 2nd honest attempt per the worker protocol; without stepping outside beeui.beemvp.com to a third npm README this would have stayed BLOCKED)

## Step 8 · The docs' own warning, found only in llms-full.txt, matches exactly what happened

- Doc URL: https://beeui.beemvp.com/llms-full.txt
- Quoted instruction: "`@import '@beemvp/beeui-tokens/theme.css'` supplies the semantic tokens but is not, by itself, a Web build. A from-scratch Vite + react-native-web app needs a specific plugin stack and a Tailwind/Uniwind CSS entry; get it wrong and the app either fails to resolve `react-native` or builds **unstyled**."
- What I did: noted this sentence *after* already having lived through exactly the "builds unstyled" failure in step 6.
- What happened: this sentence is accurate and honest about the risk, but it appears only in `llms-full.txt` (a machine-oriented index file, not linked from the human-facing `/docs/start/web/` page itself) and, crucially, it never gives "the specific plugin stack" it says is needed — it names the risk without naming the fix. A fresh reader who never thinks to fetch `llms-full.txt` separately (nothing on `/docs/start/web/` tells a human reader that file exists or that it contains additional, non-duplicated information) would not even get this warning.
- Minutes lost: 2 (just cross-referencing after the fact)
- Confusion code: ambiguous (accurate content, wrong/absent placement, and still no actual fix given)

## Step 9 · Typecheck and build

- Doc URL: https://beeui.beemvp.com/docs/start/ ("Verify your install")
- What I did: `npx tsc --noEmit` after wiring `App.tsx`/`main.tsx` with the same screen used on the Expo path (Field+Input+validation, Dialog-from-Button, Select, 3-row Table, Sheet, `useToast`, theme switch).
- What happened: zero errors, first try. `npm run build` (`tsc -b && vite build`) also succeeded cleanly (bundle size warning only, not an error).
- Minutes lost: 0
- Confusion code: clear

## Step 10 · Dark-theme table contrast

- Doc URL: n/a — observed via Playwright screenshot, not a specific doc claim.
- What I did: toggled to dark theme and screenshotted the same screen.
- What happened: `Table`'s row text ("Ada Lovelace", "Engineering", etc.) renders in a very dark color that is nearly invisible against BeeUI's dark theme background in this Web build — clearly a contrast/legibility problem, whether it is a genuine BeeUI dark-theme bug or a symptom of the same incomplete Uniwind wiring from steps 5-7. I cannot tell which from the public docs alone, and no page documents expected Table colors per theme to check against.
- Screenshot: `docs/screenshots/cleanroom-web-dark-theme.png` (compare `Table` legibility against `cleanroom-expo-dark-theme.png`, where the same component is fully legible in dark theme).
- Minutes lost: 5
- Confusion code: ambiguous

---

## Outcome

Reached a **styled, running screen** on Vite web (port 8096) exercising the same six BeeUI surfaces as the Expo path, verified with `npx tsc --noEmit` (clean), `npm run build` (clean), and Playwright screenshots/interactions in Chromium (Dialog, Select, Sheet, Toast, theme switch, Field validation all functional).

This required two rounds of BLOCKED-then-workaround (steps 5-7) to reconstruct a Vite configuration that the docs explicitly say exists ("the maintained `examples/web-consumer` fixture is the executable authority") but never publish, link, or reproduce on https://beeui.beemvp.com. Without stepping outside the allowed BeeUI+npm sources to read `vite-plugin-rnw`'s own README and inspect `uniwind`'s package exports, the Web path would have stayed permanently BLOCKED at "builds and runs but is completely unstyled" — exactly the failure `llms-full.txt` itself predicts, in a file most human readers of `/docs/start/web/` would never find.

Total minutes lost to documentation friction: approximately 89 minutes, almost entirely in steps 5-7 (the missing Vite configuration, 62 minutes combined) and the broken two-command install order (step 3-4, 17 minutes combined).

## Contradiction with the Expo path

- The Expo page (`/docs/start/expo/`) gives a complete, working Metro configuration inline (`withUniwindConfig` from `uniwind/metro`, shown in full).
- The Web page (`/docs/start/web/`) gives no equivalent for Vite, despite Uniwind needing platform-specific wiring on both bundlers (confirmed in step 7: `uniwind/vite` exists and is required, exactly parallel to `uniwind/metro`). This is an internal inconsistency in how much the two platform guides trust the reader to reconstruct: Expo readers get the real config, Web readers get a pointer to a fixture they cannot reach.
