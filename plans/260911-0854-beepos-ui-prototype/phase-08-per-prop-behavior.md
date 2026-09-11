# Phase 08 · Pass 1: per-prop, per-value executable verification (62 components, 570 props)

Owner: one Sonnet worker. Tracker: BeeUI #574 (comment), #234 (pointer). Answers the question "does every documented prop do what its docs row says, for every documented value, nothing missing, nothing extra, nothing wrong".

## Inputs (reuse, do not rebuild)
- `scripts/audit/check-props-vs-dts.mjs` + `scripts/audit/lib/*`: already resolves every `*Props` type through the TypeScript compiler API and parses every docs Props table (prop, type, default, required, description). Extend it (or add `scripts/audit/lib/prop-model.mjs`) to emit a machine model: per component, per Props type, per own prop: `{ name, kind: 'literal-union'|'boolean'|'number'|'string'|'callback'|'node'|'object'|'other', values: [...literals], docsDefault, realDefault, docsDescription, required }`.
- `scripts/audit/lib/js-runtime-defaults.mjs`: already extracts `cva` variant→class maps and destructured defaults from compiled JS. Use the variant→class map as the oracle for literal-union props.
- Test harness: `scripts/audit/claims/jest.config.js` + `jest.setup.js` + `test-utils.ts` (react-test-renderer, mocks for bottom-sheet/reanimated). Put the new suite under `scripts/audit/props/` with its own `jest.config.js` that extends the claims one; never touch the app's jest/tsconfig.

## What to generate (scripts/audit/gen-prop-tests.mjs → scripts/audit/props/__tests__/<slug>.props.test.tsx)
One `it()` per (prop, value) with title `<SLUG>.<Type>.<prop>=<value> · <first 60 chars of docs description>`:
- `literal-union` (variant, size, tone, align, orientation, presentation, ...): render with each literal; assert the rendered tree carries the classes the `cva` map assigns to that value (search `className` strings in the renderer tree), or for non-cva props assert the value reaches the expected native prop (e.g. `presentationStyle`, `keyboardType`, `accessibilityRole`). Also render with an invalid literal under `// @ts-expect-error` and assert it does not crash (defensive, `renders-only`).
- `boolean` (disabled, loading, required, invalid, checked, open, bordered, clearable, ...): render true and false; assert the documented effect: `accessibilityState.disabled/busy/checked/expanded/selected`, spinner presence, press blocked (`onPress` not called), border class present/absent, `aria-*` on web-only props marked `untested-needs-browser`.
- `callback` (onPress, onValueChange, onChange, onOpenChange, onSearch, onDismiss ...): render, trigger the documented event through the rendered primitive's props (`onPress`, `onChangeText`, `onValueChange`) and assert the callback fires with the documented argument shape (from the docs description and the .d.ts signature).
- `string`/`number` (label, title, description, placeholder, accessibilityLabel, min, max, step, numberOfLines, ...): render with a sentinel value and assert it appears in the tree at the documented place (Text child, accessibilityLabel, prop pass-through).
- `node` (leading, trailing, children, icon, action ...): render a sentinel `<View testID>` and assert it is mounted.
- `object`/`other` (style, ref, value objects, CalendarDate ...): `renders-only` (no throw) unless the docs description states a checkable effect.
- Required props: assert that omitting a documented-required prop (under `@ts-expect-error`) either throws a dev warning or renders; record which, because docs say "required" while some are runtime-optional (#579).
- Defaults: for props with a real default (JSDoc/cva/destructured), assert the default render equals the render with the default value passed explicitly (same classes / same native props). Docs default "—" while a real default exists → mark `default-undocumented` (already filed as #580; count only).

Fixtures: `scripts/audit/props/fixtures.tsx` hand-written minimal required props and wrappers per component (Field needs `label`; Select/Dialog/Sheet/Popover need their provider and root; Table needs rows; PaginationItem needs `type`; OTPInput needs `length`). Wrap everything in `BeeUIProvider`. Compound families: test the sub-component props in the family test file.

## Output
- `docs/beeui-audit/prop-behavior.{md,json}`: every (prop, value) row with `result ∈ holds | fails | renders-only | untested-needs-browser | skipped(reason)` and, for `fails`, the observed vs documented effect with the docs sentence quoted. Totals per component and overall; coverage = props with ≥ 1 non-skipped test ÷ 570.
- `docs/beeui-audit/findings-08-per-prop.md`: narrative for every `fails` and for any prop whose documented description could not be turned into an assertion (list them as "docs too vague to test", that is itself a finding).
- Report `plans/260911-0854-beepos-ui-prototype/reports/phase-08-per-prop-report.md` with command evidence and the Status block.
- GitHub: one comment on #574 (totals, coverage %, list of `fails` with URL + quote + observed) and a 3-line pointer on #234. No new issues. No em-dash characters.

## Acceptance
- Model enumerates all 62 components and ≥ 570 own props; ≥ 85% of props have at least one executed (non-skipped) test; every literal-union value has a test; `npx jest -c scripts/audit/props/jest.config.js` runs green except tests deliberately left red for real `fails` (mark those with `test.failing` so the suite still passes and the list is machine-readable).
- Regenerable: `node scripts/audit/gen-prop-tests.mjs && npx jest -c scripts/audit/props/jest.config.js` from a fresh clone.
- App gates untouched and still green: `npm run typecheck`, `npm test`.

## Constraints
- Reality is the installed npm package only; do not read ~/workspace/BeeUI. A shell hook blocks Bash commands containing the literal `node_modules`; build such paths in Node at runtime.
- Files you own: `scripts/audit/gen-prop-tests.mjs`, `scripts/audit/lib/prop-model.mjs`, `scripts/audit/props/**`, `docs/beeui-audit/prop-behavior.*`, `docs/beeui-audit/findings-08-per-prop.md`, your report. Commit only those; do not push.
