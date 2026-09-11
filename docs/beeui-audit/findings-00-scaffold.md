# BeeUI audit findings — Phase 00 (scaffold)

Consumed only via https://beeui.beemvp.com, its `llms*.txt` files, and the published npm
packages `@beemvp/beeui-*@0.86.2-rc.1`. `~/workspace/BeeUI` source was never opened during
this phase; every finding below is reproducible from the public docs site and the installed
npm package's own shipped `.d.ts` files (a normal part of consuming a typed npm package,
inspected only through TypeScript compiler diagnostics, never by reading BeeUI's repository).

### 00-01 · Public docs say the npm packages are "UNPUBLISHED" but they install fine
- Area: docs-public
- Severity: major
- Source consulted: https://beeui.beemvp.com/llms.txt , https://beeui.beemvp.com/llms-full.txt , https://beeui.beemvp.com/llms-components.txt
- Expected (per docs): All three files repeat, verbatim: "BeeUI is pre-1.0 and UNPUBLISHED. No `@beemvp/beeui-*` package or CLI is on npm... Do not tell a user to `npm install @beemvp/beeui-ui` or `npx @beemvp/beeui-cli` yet — those resolve to nothing today."
- Actual: `npm view @beemvp/beeui-ui versions`, `@beemvp/beeui-core`, `@beemvp/beeui-tokens`, and `@beemvp/beeui-cli` all resolve cleanly to `0.86.2-rc.1` on the public registry. `npm i -E @beemvp/beeui-ui@0.86.2-rc.1 @beemvp/beeui-core@0.86.2-rc.1 @beemvp/beeui-tokens@0.86.2-rc.1` installed without error, and `npx @beemvp/beeui-cli@0.86.2-rc.1 --help` / `list` both worked (list printed the 62-component registry).
- Repro: `npm view @beemvp/beeui-ui versions --json` → `["0.86.2-rc.1"]`.
- Workaround: Ignore the "unpublished" warning; install the pinned `-rc.1` version directly, as the phase spec instructed.
- Suggested fix for BeeUI: Regenerate/ship the `llms*.txt` files after the npm publish step so agent-facing docs do not actively tell consumers the packages don't exist.

### 00-02 · Docs also claim `@next` dist-tag is required; `latest` already points to the RC
- Area: docs-public
- Severity: minor
- Source consulted: https://beeui.beemvp.com/docs/start/expo/ , https://beeui.beemvp.com/docs/start/
- Expected (per docs): "Currently, the release candidate requires the `@next` dist-tag, as stable `0.86.2` has not yet been promoted to the default `latest` channel." Install commands shown as `npm install @beemvp/beeui-ui@next ...`.
- Actual: `npm view @beemvp/beeui-ui dist-tags --json` → `{"next":"0.86.2-rc.1","latest":"0.86.2-rc.1"}`. Both tags already point at the same version; `@next` is unnecessary.
- Repro: `npm view @beemvp/beeui-ui dist-tags --json`.
- Workaround: Install the exact version (`@0.86.2-rc.1`) as the phase spec required; do not need `@next`.
- Suggested fix for BeeUI: Update the docs once `latest` is promoted, or state the real current dist-tag state accurately.

### 00-03 · Compatibility matrix omits several documented peer dependencies
- Area: docs-public
- Severity: minor
- Source consulted: https://beeui.beemvp.com/docs/compatibility/ , https://beeui.beemvp.com/docs/compatibility/current/
- Expected (per docs): A "pinned/tested versions" table for the full stack.
- Actual: The fetched table lists Node, pnpm, React, React DOM, React Native, React Native Web, Expo SDK, Tailwind, Uniwind, react-native-safe-area-context, react-native-teleport — but omits `@gorhom/bottom-sheet`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-worklets`, and `@react-native-community/datetimepicker`, even though `npm view @beemvp/beeui-ui peerDependencies` shows BeeUI declares peer ranges for all five (`@gorhom/bottom-sheet >=5.2 <6`, `react-native-gesture-handler >=2.32 <3`, `react-native-reanimated >=4.5 <5`, `react-native-worklets >=0.10 <1`, `@react-native-community/datetimepicker >=9.1 <10`).
- Repro: `npm view @beemvp/beeui-ui@0.86.2-rc.1 peerDependencies --json` vs. the compatibility page content.
- Workaround: Used `npx expo install <pkg>` for each, which resolved SDK-57-compatible versions that satisfy BeeUI's peer ranges.
- Suggested fix for BeeUI: Publish the full peer-dependency version table on the compatibility page, not just a subset.

### 00-04 · `tsc --noEmit` fails until a separate `uniwind generate-artifacts` CLI step runs; undocumented
- Area: dx-install
- Severity: major
- Source consulted: https://beeui.beemvp.com/docs/start/expo/ (metro.config.js snippet with `dtsFile`), https://beeui.beemvp.com/llms-full.txt (Web bundling section)
- Expected (per docs): The Expo setup doc shows `withUniwindConfig(..., { dtsFile: './uniwind-types.d.ts', ... })` in `metro.config.js` and implies that's sufficient for `className` on RN core components (`View`, `Pressable`, etc.) to type-check.
- Actual: `dtsFile` is only written the first time Metro actually bundles (e.g. on `expo start`); a fresh checkout running `npx tsc --noEmit` before ever starting Metro fails with dozens of `Property 'className' does not exist on type '... ViewProps'` errors. The fix is an undocumented (from the fetched pages) `uniwind` CLI: `npx uniwind generate-artifacts --css ./global.css --theme <name>... --dts ./uniwind-types.d.ts`.
- Repro: fresh clone → `npm install` → `npx tsc --noEmit` (before ever running `expo start`) → `className` errors on every raw RN `View`/`Pressable` usage.
- Workaround: Added `postinstall` and `typecheck` npm scripts that run `uniwind generate-artifacts` before `tsc`, so a clean checkout always has the file (see `package.json`, `uniwind:types` script). `uniwind-types.d.ts` itself stays gitignored, matching how Metro also treats it as generated output.
- Suggested fix for BeeUI/Uniwind: Document the `uniwind generate-artifacts` CLI in the Expo start guide as a required one-time (or postinstall) step, independent of running Metro.

### 00-05 · Component prop APIs are absent from every fetched public doc page; had to reverse-engineer via tsc
- Area: docs-public
- Severity: major
- Source consulted: https://beeui.beemvp.com/llms-components.txt (explicitly says "Full per-component behavior/accessibility contracts live in docs/components.md" but that page's content was not retrievable as prop tables through the public site/WebFetch), https://beeui.beemvp.com/llms-full.txt
- Expected (per docs): `llms-components.txt` lists only exported symbol names and a source file path per component ("token-efficient map from name to symbols to source"), explicitly deferring prop-level docs elsewhere.
- Actual: No fetched public page gave concrete prop names/types for `ListItem`, `ListGroupHeader`, `AppHeader`, `DropdownMenuTrigger`, `OTPInput`, etc. Had to enumerate real prop names by writing `type Keys = keyof React.ComponentProps<typeof X>; const probe: Keys = 'zzz_probe'` and reading the TS2322 union-of-valid-keys error (with `--noErrorTruncation`), i.e. reverse-engineering the public npm package's own shipped `.d.ts` through compiler diagnostics rather than reading any doc page. Concretely discovered this way (differs from a shadcn/RN-idiomatic guess):
  - `ListItem` / `ListGroupHeader`: no `children` prop; content goes through `title`/`description`/`leading`/`trailing` (+ `className`). No `selected`/`active` prop for nav highlighting.
  - `AppHeader`: no `right` prop; uses `title`/`description`/`leading`/`trailing`/`bordered` (+ `className`).
  - `DropdownMenuTrigger`: is itself a full pressable (has `variant`/`size`/`labelClassName`/`loading`/`onPress`, like `Button`). Wrapping another interactive element (e.g. `IconButton`) inside it renders a `<button>` nested inside a `<button>` on web — an HTML violation that produced React hydration warnings (`<button> cannot contain a nested <button>`, `In HTML, %s cannot be a descendant of <%s>`).
  - `OTPInput`'s `onChange` receives a standard React Native `NativeSyntheticEvent<TextInputChangeEventData>` (i.e. `e.nativeEvent.text`), not a bare string via `onChangeText` as `Input`/`PasswordInput` might suggest by analogy.
- Repro: write `type Keys = keyof React.ComponentProps<typeof ListItem>; const probe: Keys = 'zzz_probe';` in a scratch `.tsx` inside the project and run `npx tsc --noEmit --noErrorTruncation`; the TS2322 error lists every valid prop name for that component.
- Workaround: Fixed all call sites in `src/components/shell/*` and `app/(auth)/*` to match the real prop shapes.
- Suggested fix for BeeUI: Publish an actual prop-table doc per component (or at minimum ship richer TSDoc so hover/quick-info surfaces it), and add one composition example for "icon-only trigger button inside DropdownMenu" since the nested-interactive-element pitfall is easy to hit for any consumer.

- **Review note (Ambrose, 2026-09-11):** partially incorrect as stated. The public per-component pages `https://beeui.beemvp.com/docs/components/<name>/` DO carry full Props tables (prop, type, default, description), e.g. `list-item` documents `title` (required), `description`, `leading`, `trailing`, `className`; `app-header` documents `bordered`, `leading`, `trailing`, etc. The worker never reached those pages because it followed `llms.txt` / `llms-components.txt`, which link only to source paths and `docs/components.md` (a repo file, not the site) and never to `/docs/components/<name>/`. Re-classified: Area `llms`, Severity major, title "llms-components.txt does not link the per-component docs pages that hold the Props tables; agents following the AI entry point cannot discover prop contracts". The nested-button and `OTPInput onChange` observations still stand as `component-behavior` / docs-clarity items. Suggested fix: add `docs: https://beeui.beemvp.com/docs/components/<name>/` to every line of `llms-components.txt` and a "Props tables live at ..." sentence in `llms.txt`.

### 00-06 · No active/selected state prop on ListItem for nav highlighting
- Area: gap
- Severity: minor
- Source consulted: `@beemvp/beeui-ui` `ListItem` prop surface (see 00-05 probe method)
- Expected: A list-based sidebar nav is a common pattern; expected a `selected`/`active` boolean to style the current route.
- Actual: `ListItem` has no such prop (confirmed via the same `keyof` probe as 00-05).
- Workaround: Pass a conditional `className` (see 00-07 for why that itself needed care) to highlight the active row in `src/components/shell/sidebar.tsx`.
- Suggested fix for BeeUI: Add an `active`/`selected` visual-state prop to `ListItem`, mirroring what many list/nav components offer.

### 00-07 · `className={condition ? 'x' : undefined}` throws a runtime console error
- Area: component-behavior
- Severity: major
- Source consulted: runtime console output on web (`expo start --web`), captured via Playwright/CDP
- Expected: Conditionally applying a class by falling back to `undefined` is idiomatic React/TS and normally a no-op.
- Actual: Passing an explicit `undefined` (not simply omitting the prop) as `className` throws, on every render: `styleq: tailwind typeof undefined is not "string" or "null".` The styling engine's runtime apparently only accepts `string | null`, not `undefined`, despite the TypeScript type for `className` being `string | undefined` everywhere it's used.
- Repro: `<ListItem className={isActive ? 'bg-accent' : undefined} .../>` inside `src/components/shell/sidebar.tsx`, load the app, active tab present → console error every render.
- Workaround: Use `''` (empty string) instead of `undefined` for the "no class" branch.
- Suggested fix for BeeUI/Uniwind: Either accept `undefined` in the runtime (matching the TS type), or narrow the public `className?: string` type to explicitly exclude `undefined` handling gaps, and document the `string | null` runtime contract.

### 00-08 · `AppHeader` inside a partial-edge `SafeArea` (the doc's own example) throws the same styleq error
- Area: component-behavior
- Severity: major
- Source consulted: https://beeui.beemvp.com/docs/start/provider-safe-area/ (exact composition shown there)
- Expected (per docs): The provider/safe-area guide's own example composes:
  ```tsx
  <SafeArea edges={['top', 'left', 'right']}>
    <AppHeader title="BeeUI" />
  </SafeArea>
  ```
- Actual: Reproducing this exact pattern (top-edges-only `SafeArea` wrapping `AppHeader`, with a sibling bottom-edge `SafeArea` wrapping a `BottomActionBar`, as the same doc example goes on to show) throws `styleq: tailwind typeof undefined is not "string" or "null".` once on the first web mount of the shell. Isolated via binary search: stripped `AppShell` down to nothing, then reintroduced pieces one at a time (bare `AppHeader`, no `SafeArea` → no error; `AppHeader` inside `SafeArea edges={['top','left','right']}` → error; `AppHeader` inside `SafeArea` with **all four** edges → no error). The trigger is specifically an edge-partial `SafeArea` (missing `'bottom'`) as the immediate parent of `AppHeader`.
- Repro: `<Screen><SafeArea edges={['top','left','right']}><AppHeader title="x" /></SafeArea>...</Screen>`, load on web, watch console.
- Workaround: `src/components/shell/app-shell.tsx` now uses a single outer `SafeArea` covering all four edges for the whole shell (header + sidebar/content + bottom tab bar), instead of the doc's per-section split `SafeArea`.
- Suggested fix for BeeUI: Fix `AppHeader`'s internal style computation to not depend on sibling/ancestor `SafeArea` edge completeness, or update the provider-safe-area doc's example if the split-SafeArea pattern is known-broken for `AppHeader` specifically.

### 00-09 · `expo export --platform web,ios,android` (comma list) is rejected by the installed Expo CLI
- Area: dx-install
- Severity: minor
- Source consulted: phase spec instruction (mirrors common Expo CLI usage) vs. `npx expo export --help`
- Expected: `--platform web,ios,android` exports all three platforms in one invocation.
- Actual: `CommandError: Unsupported platform "ios,android"`. The installed Expo CLI (`expo` ~57.0.21) only accepts a single value from `android | ios | web | all` for `-p/--platform`; comma-separated lists are not supported.
- Repro: `npx expo export --platform web,ios,android` → error. `npx expo export --platform all` → succeeds.
- Workaround: Changed the `export:all` npm script to `expo export --platform all`.
- Suggested fix: Not a BeeUI issue (Expo CLI), documented here per protocol's "log every friction point" rule since it blocked the exact command the phase spec specified.

### 00-10 · Exact `react-native@0.86.2` pin conflicts with `jest-expo`'s peer requirement
- Area: dx-install
- Severity: minor
- Source consulted: `npm install` output, `npm view @beemvp/beeui-ui@0.86.2-rc.1 peerDependencies`
- Expected (per phase spec): Pin `react-native@0.86.2` exactly.
- Actual: `create-expo-app` / `expo install` resolve `react-native@0.86.3` for SDK 57 by default. Forcing the exact `0.86.2` pin produces `npm error ERESOLVE`: `react-native@0.86.2` declares a `peerOptional @react-native/jest-preset@0.86.2`, while `jest-expo@57.0.5` requires `@react-native/jest-preset@^0.86.3` — an unresolvable conflict without `--legacy-peer-deps`.
- Repro: set `"react-native": "0.86.2"` exactly in `package.json`, run `npm install` with `jest-expo` already present → ERESOLVE.
- Workaround: Followed the phase spec's own fallback instruction ("If `expo install` picks different minor versions, keep Expo's choice ... log it if it conflicts with BeeUI peer ranges") — kept `react-native@0.86.3`, which satisfies BeeUI's declared peer range (`>=0.86.0 <0.87.0`).
- Suggested fix: Not directly a BeeUI issue, but BeeUI's compatibility matrix pinning the exact patch `0.86.2` (see 00-03) is one patch behind what Expo SDK 57 + `jest-expo` currently resolve to; consider pinning a range or the resolved patch instead.
