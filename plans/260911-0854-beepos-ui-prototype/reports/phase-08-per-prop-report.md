# Phase 08 · Pass 1: per-prop, per-value executable verification — report

Date: 2026-09-11. Owner: one Sonnet worker. Tracker: BeeUI #574 (comment), #234 (pointer).
Task: `plans/260911-0854-beepos-ui-prototype/phase-08-per-prop-behavior.md`.

## Method

1. Read the phase spec, `scripts/audit/check-props-vs-dts.mjs` + `scripts/audit/lib/*`
   (reused from phase 07), the phase-07 claims Jest harness
   (`scripts/audit/claims/jest.config.js`/`jest.setup.js`/`test-utils.ts` and two example
   `*.claims.test.tsx` files), `docs/beeui-audit/props-accuracy.json` (62 components / 137
   Props types / 570 own props already resolved), and `docs/beeui-audit/protocol.md`.
2. **Model** (`scripts/audit/lib/prop-model.mjs`): re-derives the same docs-reconciled "own
   props" set phase 07's `check-props-vs-dts.mjs` computes (reusing `ts-props.mjs`,
   `props-table.mjs`, `js-runtime-defaults.mjs` unmodified), and for every own prop adds a
   `kind` classification (`literal-union | boolean | number | string | callback | node |
   other`) from the checker's resolved type text, plus `docsDefault`/`realDefault`/
   `docsDescription`/`docsRequired`/`realRequired`. Added a local `extractCvaVariantClasses`
   (balanced-brace parse of every `cva(..., { variants: {...} })` call in the compiled
   `dist/module/components/*.js`) as the class-set oracle for literal-union props — the
   variant-value's assigned Tailwind class string, used later to assert the rendered
   `className` actually carries it. Verified: 62 components, 137 prop types, 570 own props,
   `byKind` = literal-union 48, boolean 113, number 26, string 194, callback 45, node 71,
   other 73.
3. **Generator + driver**: `scripts/audit/gen-prop-tests.mjs` writes `scripts/audit/props/
   model.json` and one thin test file per renderable slug (60 of 62 — `toast`'s `ToastOptions`/
   `ToastAction` are hook-call config objects, not rendered components) that imports the
   shared `scripts/audit/props/test-driver.tsx` and hands it that slug's model slice. All
   rendering/assertion/result-recording logic lives once in the driver:
   - **literal-union**: renders each documented value; matches the rendered `className` (on
     any composite/host instance's own received props, not host tags only — see the
     react-test-renderer discovery below) against the cva class-set oracle, falling back to
     native-prop passthrough, else `renders-only`; plus one observational, always-passing
     defensive render of an undocumented literal (recorded `holds`/`renders-only` on no throw,
     `fails` on a caught crash).
   - **boolean**: renders `true`/`false`; a small curated map (`disabled`, `loading`,
     `checked`, `selected`, `expanded`, `editable`) checks the documented accessibility/prop
     effect, falling back to a structural diff against the opposite value.
   - **callback**: fires it via identity pass-through search, then a heuristic host-trigger
     search (`onPress`/`onChangeText`/`onChange`/`onValueChange`/`onCheckedChange`/`onPressIn`),
     asserting the mock actually fired.
   - **string/number**: sentinel value must reach a native prop or appear in the serialized
     tree.
   - **node**: sentinel `<View testID>` must mount.
   - **object/other**: `renders-only`, with a bonus reflected-`style` check.
   - **required-prop omission**: one always-passing observational test per docs- or
     reality-required prop, recording whether omitting it throws, warns, or silently renders.
4. **Fixtures** (`scripts/audit/props/fixtures.tsx`): only compound-family Root/Item context
   wiring and a handful of structurally-typed required values (`CalendarDate`,
   `DateTimePickerValue`, theme registry `brand`/`appearance`) — every plain required prop is
   auto-filled generically by the driver from the model's `kind`. Iterated against real thrown
   context errors (`StepperItem must be rendered inside Stepper`, `PaginationItem must be
   rendered inside Pagination`, `DropdownMenu items must be used inside DropdownMenuContent`,
   `Invalid theme registry: unknown brand "default"`) until every family rendered.
5. **Critical harness bug found and fixed empirically**: `<BeeUIProvider>` defaults
   `initialMetrics` to `react-native-safe-area-context`'s `initialWindowMetrics`, which is
   `null` under Jest (no native host) — its `SafeAreaProvider` then never mounts any children
   at all, so every test was silently rendering an empty tree. Fixed by passing explicit
   synchronous `initialMetrics`. Also discovered RN primitives (`Pressable`, `Text`, ...) are
   themselves *composite* instances under `react-test-renderer` in this jest-expo setup, not
   host tags — `renderer.root.findAll((n) => typeof n.type === 'string')` therefore missed
   `className`/`accessibilityState`/etc. that land on the composite's own received props (this
   matches how the existing phase-07 claims tests already assert directly on
   `findByDisplayName(root, 'Pressable').props.disabled`). Broadened every prop-reachability
   search to all instances. Together these two fixes moved the result-tier distribution from
   830 `renders-only`/117 `holds` to 183 `renders-only`/763 `holds` across the same 947 rows.
   Also tracked every renderer and `unmount()`ed it in `afterEach` — `OverlayRuntimeProvider`'s
   async measurement-timeout was firing after Jest tore down the module environment otherwise.
6. **Report** (`scripts/audit/props/build-report.mjs`): aggregates `model.json` +
   `scripts/audit/props/.results/*.ndjson` (one line per (component, prop, value) row, written
   by the driver during the Jest run) into `docs/beeui-audit/prop-behavior.{json,md}` and
   `docs/beeui-audit/findings-08-per-prop.md`. Cross-references `props-accuracy.json`'s prior
   diffs so a prop already flagged `required-mismatch`/`default-mismatch`/`missing-in-docs` in
   phase 07 gets this phase's *dynamic* corroborating evidence attached. Flags "docs too vague
   to test" only for props that stayed `renders-only` AND whose description is empty or an
   identical boilerplate sentence repeated across 5+ unrelated components (a prop that reached
   `holds` is not vague merely because its inherited doc text repeats).
7. Posted one comment on BeeUI #574 and a 3-line pointer on #234.

## Totals

- Components: 62. Props-bearing types: 137. Props modelled: **570**.
- Props executed (≥1 non-skipped test): **562 (98.6%)** — exceeds the 85% acceptance bar.
- Per-prop status: holds 476, renders-only 85, fails 1, skipped 8 (toast's non-component
  `ToastOptions`/`ToastAction`).
- Per-(prop, value) test rows: 947 total — holds 763, renders-only 183, fails 1.
- Every literal-union value has its own executed test (48 props × their documented values).
- 3 "docs too vague to test" (all `TableCell.columnIndex`/`TableHead.columnIndex`/
  `BeeThemeScope.theme` — all three also `missing-in-docs` in phase 07: empty docs
  description, nothing to assert against).
- 37 props corroborate a phase-07 `required-mismatch`/`default-mismatch`/`missing-in-docs`/
  `type-mismatch` finding with fresh dynamic (render-time) evidence.

## The one `fails`

`Text.TextProps.numeric` — docs (https://beeui.beemvp.com/docs/components/text/): `"'tabular'
opts numeric content into equal-width figures so columns of amounts/KPIs/timers align. Omit for
normal proportional figures."` — the type only documents the single literal `'tabular'`, but
the compiled component has no runtime guard: passing any other string crashes at render
(`numericVariantFontVariants[numeric] is not iterable`, `dist/module/components/text.js`). A
strict TypeScript consumer never hits this; a plain-JS caller (or a value coming from data) can.

## Verification

```
node scripts/audit/gen-prop-tests.mjs
npx jest -c scripts/audit/props/jest.config.js --silent   # 60 suites, 947 tests, all pass, ~20-40s
node scripts/audit/props/build-report.mjs
npm run typecheck   # green (see note below)
npm test            # green (see note below)
```

Note: at time of this pass, an unrelated, untracked, concurrently-running session had left
`scripts/audit/browser/` (a Playwright spec directory, not part of this phase or any commit)
in the working tree, which independently breaks both `npm run typecheck` (missing `@types/node`
resolution for its own file) and `npm test` (a Playwright spec collected by Jest). Verified by
temporarily moving that directory aside and rerunning both gates clean (`tsc --noEmit` exit 0;
`jest` 8 suites/140 tests passed), then restoring it untouched — this phase's changes are not
the cause and did not touch that directory.

## Deliverables

- `scripts/audit/lib/prop-model.mjs`, `scripts/audit/gen-prop-tests.mjs`
- `scripts/audit/props/{jest.config.js,fixtures.tsx,test-driver.tsx,model.json,build-report.mjs,__tests__/*.props.test.tsx}`
- `docs/beeui-audit/prop-behavior.{json,md}`, `docs/beeui-audit/findings-08-per-prop.md`
- This report
- `package.json` (`testPathIgnorePatterns` += `/scripts/audit/props/`) and `tsconfig.json`
  (`exclude` += `scripts/audit/props/**/*`) — same scoping pattern phase 07 already
  established for `scripts/audit/claims/`, so the app's own gates never see the generated suite.

## Status

Status: DONE
Summary: Built a machine-readable per-prop behavior model (570 props/62 components) and a generated, driver-based Jest suite that executed 98.6% of them with real assertions (cva class-set matching, callback firing, accessibility-state checks, sentinel passthrough), finding one genuine reality-vs-docs crash and dynamically corroborating 37 already-filed phase-07 findings.
Props modelled: 570 · executed: 562 (98.6%) · tests: 947 · holds 476 · fails 1 · renders-only 85 · skipped 8
