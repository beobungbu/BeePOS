# Readability rubric and component spot checks (Worker B, phase 07B)

Rubric criteria, each scored 1 (fails) .. 5 (excellent) with one sentence of justification:

- **Prereq** — prerequisites stated
- **Steps** — steps ordered and complete
- **Runnable** — example runnable as pasted
- **Terms** — terms defined before use
- **Platform** — platform differences explicit
- **Success** — "what success looks like" stated

All scores below are the honest reaction of a first-time reader following only https://beeui.beemvp.com, the four `llms*.txt` files, and npm — exactly as required by the task.

## Start pages

| Page | Prereq | Steps | Runnable | Terms | Platform | Success |
|---|---|---|---|---|---|---|
| /docs/start/ | 5 | 3 | n/a | 4 | 4 | 4 |
| /docs/start/expo/ | 3 | 2 | 3 | 3 | 4 | 3 |
| /docs/start/web/ | 3 | 1 | 1 | 2 | 3 | 2 |
| /docs/start/provider-safe-area/ | 4 | 4 | 4 | 5 | 4 | 5 |

### /docs/start/ — justifications
- Prereq (5): the "Prerequisites" table names exact tested versions for every tool (Node, pnpm, React, React Native, Expo SDK, react-native-web, Tailwind/Uniwind) in one place.
- Steps (3): the "Which intent is yours" routing table is genuinely useful, but the page silently assumes an application project already exists before any install command is meaningful, so "steps" only make sense once a reader has separately solved that (see /docs/start/expo/ and /docs/start/web/ below).
- Terms (4): "RC," "dist-tag," "package boundary" vs. "source ownership" are all defined on this page before use.
- Platform (4): the "Pick a platform" table cleanly separates Expo / Bare React Native / Web with links, though it does not yet say the three guides differ wildly in completeness (see below).
- Success (4): "Verify your install" gives five concrete checkpoints (npm ls resolves the RC, typecheck, build/export per platform, exercise one real component, native checks for native apps).

### /docs/start/expo/ — justifications
- Prereq (3): repeats the Expo SDK 57 requirement but does not state that an Expo project must already exist, which is the actual first prerequisite a reader is missing.
- Steps (2): jumps directly from "Use this path for an Expo SDK 57 application" to `npm install @beemvp/beeui-ui@next ...` with no scaffold step; Metro/Provider steps that follow also skip the Expo Router reality of the current default template (cleanroom-expo-log.md steps 2, 6, 7, 11).
- Runnable (3): the Metro config and Provider snippets are individually correct but only for a project shape (root-level `global.css`, bare `App()` entry) that does not match what `npx create-expo-app@latest` actually produces today.
- Terms (3): "styling entry," "@source entries," and "extraThemes" are used without a sentence explaining what each does before the code block appears.
- Success (3): no page-local success checkpoint; the reader is pointed back to the shared "Verify your install" list on /docs/start/, which is generic across all three platforms.

### /docs/start/web/ — justifications
- Prereq (3): same gap as Expo (no "create a Vite project first" step), compounded by pinning `vite@8.2.2`/`vite-plugin-rnw@0.0.12` without saying which scaffold tool produces a project those versions slot into.
- Steps (1): the two `npm install` command blocks, followed literally in the order and separation the page presents them, produce a hard `ERESOLVE` failure (cleanroom-web-log.md step 3); the "Vite configuration" section that should be the centerpiece of this page contains zero code.
- Runnable (1): there is no `vite.config.ts` on the page at all — only a pointer to an internal, unlinked, unreachable fixture ("the maintained `examples/web-consumer` fixture is the executable authority for plugin order and React Native Web aliasing").
- Terms (2): "RNW aliasing" is named but never explained or shown; a reader cannot tell what "aligned with that fixture" concretely requires.
- Platform (3): the page correctly scopes itself to Vite + RNW and disclaims Next.js/Webpack/SSR, which is honest, but doesn't warn that this platform's guide is far less complete than the Expo guide for the exact same category of problem (bundler + Uniwind wiring).
- Success (2): "Verify the maintained Web consumer" describes commands to run inside a repo checkout of BeeUI itself (`examples/web-consumer`, `setup.sh`) that a package consumer following only the public docs does not have access to; the fallback ("npm run build && npm run preview") assumes the hard part (the config) already works.

### /docs/start/provider-safe-area/ — justifications
- Prereq (4): explicitly says "Read this after you have a platform guide running," correctly sequencing itself after Expo/Web.
- Steps (4): "Safe-area ownership rules," "The doubled-inset failure," and the common-failures table are exceptionally well organized cause -> symptom -> fix content.
- Runnable (4): both the correct and incorrect `SafeArea` nesting examples are short, complete, and directly testable.
- Terms (5): "depth 0," "anchored-overlay runtime," "Toast scope," and "nested provider" are all defined the first time they appear, with a concrete ASCII ownership tree at the top of the page.
- Platform (4): explicitly calls out that "Browsers report no system insets, so an edge-ownership bug is invisible on Web and appears on the first device run" — the single best platform-difference callout in the whole start section.
- Success (5): the "Verify" table gives five checkpoints with an explicit expected result for each, including exact interaction steps ("open a Dialog, open a Select inside it, press Escape").

## Component pages (B4 spot checks: Button, Field, Input, Dialog, Select, Table, Sheet, Toast)

For each: could I use it from the page alone, what was missing, was any statement false in practice, and was "Verified example source" copy-paste runnable.

### Button
- Usable from the page alone: yes.
- Missing: nothing blocking; `Uniwind.setTheme` appears in one fixture snippet with no import shown (see cleanroom-expo-log.md step 13).
- False in practice: no.
- Verified example source copy-paste runnable: **no** — every block is a bare JSX fragment ("lines 126-134", "lines 533-541", etc.) taken out of a 1074-line file; the page says "Open the fixture itself for the surrounding imports and state," and the fixture is only reachable via a GitHub link (`github.com/beobungbu/BeeUI/.../component-gallery.tsx`), which is outside this task's allowed-source list. A reader confined to beeui.beemvp.com cannot compile any of these fragments as-is.

### Field
- Usable from the page alone: yes, for the common label/description/error/required/disabled props.
- Missing: nothing blocking for the props actually used.
- False in practice: no — `invalid`/`error` rendered exactly as shown (red border + message) in both clean rooms.
- Verified example source copy-paste runnable: no, same fragment-only pattern as Button.

### Input
- Usable from the page alone: yes.
- Missing: nothing blocking.
- False in practice: no.
- Verified example source copy-paste runnable: no, same fragment-only pattern.

### Dialog
- Usable from the page alone: yes — `Dialog`/`DialogTrigger`/`DialogContent`/`DialogTitle`/`DialogDescription`/`DialogFooter`/`DialogClose` composition matched the "Composition anatomy" list exactly, and Escape-to-close worked as promised on /docs/start/provider-safe-area/'s "Verify" table.
- Missing: nothing blocking.
- False in practice: no.
- Verified example source copy-paste runnable: no, same fragment-only pattern (multiple unrelated overlay-context fixtures mixed into the same "Verified example source" section, which makes it harder, not easier, to find the plain single-dialog case — it is the 4th of 4 blocks).

### Select
- Usable from the page alone: yes.
- Missing: nothing blocking for the basic + grouped + disabled variants I used.
- False in practice: no.
- Verified example source copy-paste runnable: no, same fragment-only pattern, sourced from a *different* fixture file (`select-showcase.tsx`) than Button/Field/Input/Dialog/Sheet/Toast (`component-gallery.tsx`) with no explanation on the page that the source file differs per component.

### Table
- Usable from the page alone: **yes, and uniquely well** — this is the only one of the 8 pages whose "Verified example source" is the complete file (imports, types, sort/selection state, both a scroll and a stacked layout demo), explicitly labeled "there is no separately maintained demo snippet." It is genuinely copy-paste runnable.
- Missing: nothing.
- False in practice: no, with one caveat — in the Web clean room's dark theme, the rendered row text was nearly illegible against the dark background (see cleanroom-web-log.md step 10); nothing on the Table page documents expected per-theme text color to check this claim against.
- Verified example source copy-paste runnable: **yes** — the one true exception among the 8 pages checked.

### Sheet
- Usable from the page alone: yes.
- Missing: nothing blocking.
- False in practice: no.
- Verified example source copy-paste runnable: no, same fragment-only pattern (single 15-line block, at least not mixed with unrelated fixtures like Dialog's).

### Toast
- Usable from the page alone: yes — `useToast()` and `.show({ title, description, variant })` worked exactly as documented, including the success/green styling.
- Missing: nothing blocking for the basic case; the `TypeError: BeeUI toast show() requires a non-empty string title.` failure mode documented on /docs/start/provider-safe-area/ was not tested (out of scope for the 6-surface screen).
- False in practice: no.
- Verified example source copy-paste runnable: no, same fragment-only pattern.

## Top 10 rewrites (ranked by time they would have saved)

1. **/docs/start/expo/ and /docs/start/web/, top of "Add BeeUI to Expo" / "Install"** (saved ~16 min each path, ~32 min total)
   - Current: jumps straight to `npm install @beemvp/beeui-ui@next ...`.
   - Replace with: "Before this step you need a working Expo SDK 57 / Vite project. If you do not have one yet, run `npx create-expo-app@latest` (Expo) or `npm create vite@latest -- --template react-ts` (Web) first, then continue below."

2. **/docs/start/web/, "Vite configuration"** (saved ~62 min)
   - Current: "The maintained `examples/web-consumer` fixture is the executable authority for plugin order and React Native Web aliasing. Keep the RNW, Uniwind and Tailwind integrations aligned with that fixture."
   - Replace with the actual working config:
     ```ts
     import tailwindcss from '@tailwindcss/vite'
     import { defineConfig } from 'vite'
     import { rnw } from 'vite-plugin-rnw'
     import { uniwind } from 'uniwind/vite'

     export default defineConfig({
       plugins: [rnw(), tailwindcss(), uniwind({ cssEntryFile: './src/global.css' })],
       resolve: {
         alias: { 'react-native': 'react-native-web' },
         extensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
       },
     })
     ```
     (or, at minimum, a working link to the fixture's actual source on the public docs site).

3. **/docs/start/web/, "Install"** (saved ~17 min)
   - Current: two separate `npm install` command blocks presented as sequential steps.
   - Replace with: a single combined `npm install @beemvp/beeui-ui@next @beemvp/beeui-core@next @beemvp/beeui-tokens@next react@19.2.3 react-dom@19.2.3 react-native@0.86.2 react-native-web@0.21.0 ...` command, with a note: "Install these together in one command — installing the BeeUI packages before pinning `react-native` lets npm resolve an incompatible `react-native` version transitively via `@gorhom/bottom-sheet` and fails."

4. **/docs/start/expo/, "Provider" and /docs/start/provider-safe-area/, "Root setup"** (saved ~14 min)
   - Current: shows a bare `export default function App()` composition.
   - Replace with: a second example (or an explicit callout) for Expo Router: "If your project uses Expo Router (the current `create-expo-app` default), wrap the return value of your root `_layout.tsx` in `<BeeUIProvider>` instead of replacing it; do not delete your navigator."

5. **/docs/start/expo/, "Styling entry" and /docs/start/web/, "Styling entry"** (saved ~9 min Expo, similar on Web)
   - Current: `@source './node_modules/@beemvp/beeui-core/src';` with no statement of where this file lives.
   - Replace with: "Create this file at your project root as `global.css` (or, if your project already has a CSS entry point elsewhere, e.g. `src/global.css`, place it there and adjust the `@source` paths to be relative to that file's actual location, e.g. `../node_modules/...`)."

6. **/docs/start/, llms-full.txt's Web-build warning** (saved ~2 min directly, prevents the ~44 min lost in cleanroom-web-log.md steps 6-7 if surfaced earlier)
   - Current: the accurate "get it wrong and the app... builds unstyled" warning exists only in `llms-full.txt`, not linked from `/docs/start/web/`.
   - Replace with: surface the same sentence directly on `/docs/start/web/` next to "Vite configuration," with a link to whatever documents "the specific plugin stack" (see rewrite #2).

7. **Every component page's "Verified example source" section (Button, Field, Input, Dialog, Select, Sheet, Toast — 7 of 8 checked)** (saved ~5-10 min per page, most acutely on Dialog where 4 unrelated fixtures are mixed together)
   - Current: "Open the fixture itself for the surrounding imports and state," pointing at a file outside beeui.beemvp.com with no in-page link.
   - Replace with: follow Table's pattern — either reproduce the complete runnable file per component, or add a direct link to the fixture on the docs site itself (not only via a GitHub cross-reference), the way most other "Source authority" sections already link GitHub.

8. **/docs/start/expo/, Prerequisites cross-reference** (saved ~4 min)
   - Current: table says `react-native 0.86.2`; `npx create-expo-app@latest` currently installs `react-native@0.86.3`.
   - Replace with: a note that a one-patch drift from the pinned version is expected and fine, or update the pin, so a reader doesn't have to wonder whether their scaffold is already "wrong."

9. **llms-components.txt header** (saved ~3 min, prevents a much larger trust problem for anyone who starts here instead of the docs site)
   - Current: "STATUS: BeeUI is pre-1.0 and UNPUBLISHED. No `@beemvp/beeui-*` package or CLI is on npm,"
   - Replace with: the same "public under the `next` dist-tag" status shown on `/docs/start/`, kept in sync.

10. **Web clean-room console noise** (saved ~5 min of doubt about whether the build was actually correct)
    - Current: no mention anywhere of the `styleq: tailwind typeof undefined is not "string" or "null".` console errors that appear on first paint even in a fully-working `uniwind/vite`-wired build.
    - Replace with: a short troubleshooting entry: "Two `styleq: tailwind typeof undefined...` console errors on first paint are expected during initial hydration and are not a sign of misconfiguration; they stop after the first render."
