# Phase 07 Worker A · doc-truth verification (props + behavior + reality matrix) — report

Date: 2026-09-11. Owner: dedicated worker (Worker A). Tasks A1-A4 of
`plans/260911-0854-beepos-ui-prototype/phase-07-doc-truth-verification.md`.

## Method

1. Read the phase spec, `docs/beeui-audit/protocol.md`, the existing `scripts/audit/lib/*`
   helpers (disk-cached fetch, Starlight HTML extraction, llms*.txt parsers, `.d.ts` export
   parser) and `docs-llms-matrix.json` (501 rows from phase 06).
2. **A1 (props-accuracy)**: wrote `scripts/audit/lib/props-table.mjs` (parses every Props
   table on a component doc page into `{typeName, rows, inheritsRaw}`, including the
   `" (required)"` naming convention BeeUI uses instead of a Required column) and
   `scripts/audit/lib/ts-props.mjs` (builds one TypeScript `Program`/checker from the
   project's own `tsconfig.json` plus a generated probe file that re-exports a `type
   __probe_X = X` alias per BeeUI `*Props` type and per referenced React Native base type,
   so `checker.getPropertiesOfType` flattens `Omit<>`/`VariantProps<>`/intersections exactly
   as `tsc` does for app code) and `scripts/audit/lib/js-runtime-defaults.mjs` (extracts real
   `cva({defaultVariants})` and destructured function-parameter defaults from the compiled
   `dist/module/**/*.js`, including resolving a `SCREAMING_CASE` constant reference to its
   real value). Wrote `scripts/audit/check-props-vs-dts.mjs` combining all three against all
   62 components / 137 Props-bearing types. Iterated through several false-positive sources
   (RN's `React.ComponentProps<typeof NativeSafeAreaProvider>`-style unresolvable bases;
   `TextProps`/`SwitchProps` name collisions between BeeUI's own exports and React Native's;
   `cva`'s systematic `| null` on every variant prop; `Omit<>` key-order differences; indexed
   -access (`PressableProps['onPress']`) and generic-shorthand (`RegistryAppearance<Def>`)
   doc idioms; a discriminated-union `never`-typed row) until the diff list held only genuine
   findings, verified by spot-checking the `.d.ts`/compiled JS directly for a sample.
3. **A2 (behavior claims)**: confirmed `@testing-library/react-native` is NOT installed
   (per the phase brief's "do not add packages"); used `react-test-renderer` (already present
   via `react-native`) instead. Wrote `scripts/audit/claims/jest.config.js` (own config,
   `preset: 'jest-expo'`, widened `transformIgnorePatterns` for `@beemvp/*`, a
   `moduleNameMapper` forcing `@beemvp/beeui-ui` through its `require`-condition CommonJS
   build instead of the `source`-condition TS tree its `exports` map prefers under Metro-style
   resolution) and `scripts/audit/claims/jest.setup.js` (auto-stubs `@gorhom/bottom-sheet` and
   `react-native-reanimated` — both otherwise crash on import under plain Jest via
   `react-native-worklets`' native module, with no native host present). Extracted 21 real
   claims from the "State and behavior contract" sections of the components BeePOS uses
   (Button, Checkbox, Switch, Radio/RadioGroup, Chip/ChipGroup, SegmentedControl, Tabs,
   Pagination, Table, Progress, Skeleton, Avatar, AlertBanner, IconButton, ListItem,
   Timeline, Badge, Card, BottomActionBar, Field/Input, SearchInput, OTPInput), read each
   component's actual compiled `dist/module/components/*.js` to ground every assertion in
   real logic (not guesses), and wrote 72 `it()` tests (one per claim ID) across 21
   `*.claims.test.tsx` files. Added 8 `untested-needs-browser` entries for
   Select/Dialog/AlertDialog/Sheet/Toast (the anchored-overlay/portal/gesture-runtime and
   provider-singleton components this harness's stubs cannot faithfully exercise) for Worker
   B. Wrote `scripts/audit/generate-behavior-claims.mjs` to run the suite and combine its real
   pass/fail with each claim's quoted doc source into `behavior-claims.{md,json}`.
4. **A3 (matrix reality)**: wrote `scripts/audit/apply-reality.mjs`, applying a
   category-specific classifier (using `npm view`, the already-fetched-and-cached HTTP
   checks, the `.d.ts` cross-check, and this phase's own `props-accuracy.json`) to every one
   of the 501 rows, adding `reality`/`verdict`/`fix`. Found and fixed an ordering bug (the
   "Family exports vs llms" rows were reading their companion "vs npm .d.ts" row's verdict
   before that row had been classified in the same pass) by splitting Category D into two
   passes. Regenerated `docs-llms-matrix.{md,json}` in place.
5. Wrote `docs/beeui-audit/findings-07a-doc-truth.md` (9 concrete findings with doc quote +
   URL + `.d.ts`/npm evidence + proposed fix, plus the totals summary).
6. Posted one comment on BeeUI #574 and a 3-line pointer on #234.

## A1 totals

62/62 components checked, 137 Props-bearing types. After removing tooling false-positives
(documented in the methodology above and inline in `check-props-vs-dts.mjs`'s comments):

| Classification | Count |
|---|---|
| documented-and-real | 532 |
| missing-in-docs | 3 |
| extra-in-docs | 0 |
| type-mismatch | 2 |
| default-mismatch | 30 |
| required-mismatch | 3 |
| type-not-resolved | 0 |
| base-unresolved-limited-coverage | 4 (sections where coverage was deliberately restricted to documented props only — see script comments) |

## A2 totals

80 claims total. 72 executed (all **hold** — zero behavioral contradictions found between the
docs' contract sentences and the installed package's real runtime logic for the components
checked). 8 `untested-needs-browser` (Select ×2, Dialog ×2, AlertDialog ×1, Sheet ×1, Toast
×2) handed to Worker B.

## A3 totals (matrix reality verdicts, 501/501 rows classified)

| Verdict | Count |
|---|---|
| both-right | 214 |
| docs-right | 110 |
| both-wrong | 115 |
| llms-right | 4 |
| reality-unknown | 58 |

`both-wrong` is almost entirely the pre-existing 115 broken llms*.txt link targets (category
H, repo-relative paths that 404 on the public docs site). `reality-unknown` is concentrated in
Architecture/ADR (20, repo-only ADR files with no public docs-site route), Accessibility
contract (8, "does this keyword appear" text checks with no independent a11y-tree audit run
in this pass), and most of Setup instructions (17, presence checks Worker A did not
independently re-run — that is Worker B's clean-room job) plus a chunk of Compatibility (11,
Node.js/pnpm toolchain versions with no npm-peerDependencies ground truth).

## Top findings

See `docs/beeui-audit/findings-07a-doc-truth.md` for the full write-up (9 entries, each with
quoted doc sentence + URL + `.d.ts`/npm evidence + proposed fix). Highlights: a systematic
doc-generator gap where plain (non-variant) boolean/string props with a JSDoc "Defaults to
X." comment don't reach the Default column (11 `loading` rows across the Dialog/Sheet/
Popover/Tooltip/DropdownMenu *Trigger/*Close family, Input's `disabled`/`invalid`, 13
DatePicker/DateTimePicker/Calendar accessibility-label/locale defaults, Select's `maxHeight`,
ThemeScope's `registry`); two undocumented discriminated-union shapes (`PaginationItemProps`
marks `page` required even though the navigation-item variant forbids it; `BeeThemeScopeProps`
marks `appearance`/`brand` required even though the alternate `theme`-prop form omits them
both); and the already-known npm `latest`/`next` dist-tag collapse (matrix row A013, related
to filed #561).

## Files touched

Owned per the phase file: `scripts/audit/check-props-vs-dts.mjs`,
`scripts/audit/generate-behavior-claims.mjs`, `scripts/audit/apply-reality.mjs`,
`scripts/audit/lib/{props-table,ts-props,js-runtime-defaults}.mjs`,
`scripts/audit/claims/**`, `docs/beeui-audit/props-accuracy.{md,json}`,
`docs/beeui-audit/behavior-claims.{md,json}`, `docs/beeui-audit/docs-llms-matrix.{md,json}`
(regenerated in place), `docs/beeui-audit/findings-07a-doc-truth.md`, this report. Also
touched `.gitignore` (added `scripts/audit/claims/.cache/`, mirroring the existing
`scripts/audit/.cache/` entry) since that is where the claims Jest run's own results cache
and generated TS probe file live.

## Status

Status: DONE
Summary: Verified BeeUI's docs against the installed package's real .d.ts, compiled JS, and
runtime behavior across all 62 components; posted the reality matrix and top findings to
BeeUI #574 and a pointer to #234.
Concerns/Blockers: Categories F (Architecture/ADR) and G (Accessibility contract) stayed
`reality-unknown` — there is no public, independently-crawlable source for ADR content or a
live a11y-tree audit within this pass's scope; a future worker with browser/assistive-tech
access could close that gap. 8 behavior claims need Worker B's Playwright pass (already
flagged as `untested-needs-browser`).
Props checked: 62 components / 137 props-bearing types · Claims: 72 executed / 72 holds / 0
fails (8 untested-needs-browser) · Verdicts: docs-right 110, llms-right 4, both-wrong 115,
both-right 214, reality-unknown 58
