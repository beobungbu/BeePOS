# Phase 10 findings: Guides, Theming/Reference and Patterns code samples

BeePOS consumer field audit of BeeUI 0.86.2-rc.1. Method, clean room, and full per-sample
results are in `doc-samples.md` / `doc-samples.json`; this file lists the findings that
matter, per the audit protocol (`docs/beeui-audit/protocol.md`).

## Broken

### 10-01 - Branding guide's own "register a brand" example throws at runtime
- Area: component-behavior
- Severity: major
- Source consulted: https://beeui.beemvp.com/docs/guides/branding/ , heading "Register a brand of your own"
- Expected (per docs): the shown `defineThemeRegistry` + `Uniwind.setTheme(acmeRegistry.resolve('acme', 'dark'))` snippet is presented as a working "register a brand of your own" example.
- Actual: mounted verbatim (wrapped only in a try/catch screen, no other changes) it throws immediately: `Uniwind: You're trying to setTheme to 'acme-dark', but it was not registered.` It also fails `tsc` once compiled as part of a real app (the generated `uniwind-types.d.ts` restricts `Uniwind.setTheme` to the six runtime themes BeeUI ships plus `'system'`; `'acme-dark'` is not among them). The same file compiles with zero errors in isolation (no app-level `.d.ts` in scope) -- the failure only shows up in the realistic full-project case.
- Repro: `Uniwind.setTheme(defineThemeRegistry({ bee: {light:'light',dark:'dark'}, acme: {light:'acme-light',dark:'acme-dark'} }).resolve('acme','dark'))` in a real app; screenshot `docs/screenshots/samples-guides-branding-5-390.png`.
- Workaround: none shown on the page. The guide itself says "Registering the CSS/native theme named acme-dark with the styling engine stays your application's job" but never demonstrates that step in its own worked example, and the example throws the instant it runs rather than degrading.
- Suggested fix for BeeUI: either extend the example to show the missing registration step (e.g. via `extraThemes` in the Metro/Uniwind config, matching how the branding/density guides configure `violet-light`/`violet-dark`), or add an explicit warning that `defineThemeRegistry` alone does not make a theme usable.

## Needs-context (systemic)

### 10-02 - 30 of 37 pattern "State and callback contract" blocks reference an undefined domain type
- Area: docs-public
- Severity: minor
- Source consulted: `/docs/patterns/**` "State and callback contract" code block, all 37 pattern pages
- Expected (per docs): each pattern page's single code block is presented as the pattern's prop/callback contract, the page's "one sample."
- Actual: 30 of the 37 blocks reference a domain type (`Order`, `Product`, `SocialPost`, `AccountProfileFixture`, `WalletData`, `TransactionRowData`, etc.) that is neither imported nor defined in the block itself, so the block does not compile standalone (`tsc` TS2304 "Cannot find name"). The 7 clean pages (`account-settings/notification-settings-screen`, `account-settings/privacy-security-screen`, `auth/forgot-password-screen`, `auth/password-updated-screen`, `auth/sign-in-screen`, `auth/verify-code-screen`, `auth/welcome-screen`) only use primitive types, so they happen not to hit this.
- Repro: `npx tsc --noEmit` on any of the 30 files listed in `doc-samples.md` verdict=needs-context for `patterns-*`, e.g. `patterns-commerce-social-cart-screen/0.tsx(3,11): error TS2304: Cannot find name 'CartItem'.`
- Workaround: each contract compiles once the missing type is stubbed (`type CartItem = any;` etc. -- see `errorText`/`needsContext` per row in `doc-samples.json`). The full shape of these fixture types is not shown anywhere on the pattern page.
- Suggested fix for BeeUI: either inline the fixture type in the code block (even a minimal shape) or link to where it is defined, since a reader copying only the shown block cannot compile it.

### 10-03 - Table guide's responsive snippet is an unimportable fragment
- Area: docs-public
- Severity: nit
- Source consulted: https://beeui.beemvp.com/docs/guides/table/ , heading "Responsive behavior"
- Expected: `<Table layout={isCompact ? 'stacked' : 'scroll'} />` reads as a drop-in line.
- Actual: as pasted it does not compile (`Cannot find name 'Table'`, `Cannot find name 'isCompact'`) -- no import shown, `isCompact` is presented as if already in scope. Once given the `Table` import and a `useState`-backed `isCompact`, it compiles and renders correctly at both layout values.
- Workaround: see `guides-table/1` harness in `doc-samples.json`.
- Suggested fix: mark this explicitly as a fragment ("assuming `Table` is imported and `isCompact` comes from your breakpoint logic") the way other guides do.

## Stale / contradictory prose

### 10-04 - Branding guide still says "The packages are not published to npm yet"
- Area: docs-public
- Severity: major
- Source consulted: https://beeui.beemvp.com/docs/guides/branding/ , "Known limitations" section (last bullet before "Related")
- Expected (per this exact sentence): branding work today happens against a repository checkout or a locally packed artifact, because the packages are not on npm.
- Actual: `@beemvp/beeui-ui@0.86.2-rc.1`, `@beemvp/beeui-core@0.86.2-rc.1`, `@beemvp/beeui-tokens@0.86.2-rc.1` and `@beemvp/beeui-cli@0.86.2-rc.1` are all published (`npm view @beemvp/beeui-ui dist-tags` -> `{"next":"0.86.2-rc.1","latest":"0.86.2-rc.1"}`), and this entire phase installed and used them from the public registry in a clean room with no repository checkout. This directly contradicts the CLI & source ownership, Migration & versioning, and Current release guides, all three of which describe the npm release as live.
- Repro: `npm view @beemvp/beeui-ui dist-tags`, `npm view @beemvp/beeui-core dist-tags`, `npm view @beemvp/beeui-tokens dist-tags`, `npm view @beemvp/beeui-cli dist-tags` -- all resolve.
- Workaround: none needed; ignore the sentence.
- Suggested fix for BeeUI: delete or update that sentence; it is leftover from before the first public release and is the same doc-vs-reality contradiction already tracked for the llms*.txt files (see BeePOS's prior audit note on `beeui-docs-status-contradiction`), just in a guide page instead of an llms.txt file.

### 10-05 - Troubleshooting guide's metro config fragment does not match the config a real app needs
- Area: docs-public
- Severity: minor
- Source consulted: https://beeui.beemvp.com/docs/guides/troubleshooting/ , metro config code block (`withUniwindConfig(getDefaultConfig(__dirname), { cssEntryFile: './global.css', dtsFile: './uniwind-types.d.ts' })`)
- Expected: this is the metro config object shown as the fix for a metro/uniwind symptom.
- Actual: it is a bare object-argument fragment, not a full `metro.config.js` (missing the `const {...} = require(...)` / `module.exports = ...` wrapper shown nowhere on this page). Its `cssEntryFile: './global.css'` also does not match the actual working clean-room config (carried over from the phase-07B clean room and still working today), which needs `cssEntryFile: './src/global.css'` because the app keeps `global.css` under `src/`. A reader who keeps `global.css` under `src/` (the layout Expo Router's own templates use) and pastes this path verbatim gets a metro build that cannot find the CSS entry.
- Workaround: use the path relative to your own `global.css` location, not the literal string shown.
- Suggested fix for BeeUI: show the full `metro.config.js`, or note explicitly that `cssEntryFile` is relative to wherever the project keeps `global.css`.

### 10-06 - Theming guide's CSS import block omits the `@source` lines a real app needs
- Area: docs-public
- Severity: minor
- Source consulted: https://beeui.beemvp.com/docs/theming/ (Web CSS code block) vs https://beeui.beemvp.com/docs/guides/troubleshooting/ (CSS code block)
- Expected: the Theming page's 3-line CSS block (`@import 'tailwindcss'; @import 'uniwind'; @import '@beemvp/beeui-tokens/theme.css';`) reads as the CSS entry a consumer needs.
- Actual: it is an exact subset of the clean room's real working `src/global.css`, which additionally carries two `@source` lines (`@source '../node_modules/@beemvp/beeui-core/src'; @source '../node_modules/@beemvp/beeui-ui/src';`) so Tailwind v4 scans BeeUI's own package source for utility classes. Those `@source` lines only appear on the Troubleshooting guide, not on the Theming page itself, and the Theming page never mentions `@source` at all.
- Workaround: copy the `@source` lines from Troubleshooting too.
- Suggested fix for BeeUI: either show the complete working `global.css` on the Theming page, or cross-link to the `@source` requirement explicitly.

## Holds (verified, notable)

- Density guide: "An unknown mode throws rather than silently resolving to undefined" -- verified directly: `applyDensity(stub, 'light', 'ludicrous')` throws `Unknown density mode "ludicrous"; supported modes: compact, comfortable, spacious`.
- Branding guide: `resolveBeeAccessibilityRuntimeTheme('bee', 'dark')` resolves to `'high-contrast-dark'` exactly as the trailing comment claims.
- Date & time guide: `toISODateString`/`parseISODateString` round-trip exactly as documented, including `parseISODateString('not-a-date')` returning `null`; `toLocalDate`/`fromLocalDate`/`clockTimeFromLocalDate` round-trip exactly as documented; `getCalendarMonthGrid({month:9, year:2026, weekStartsOn:1})` returns 5 weeks, inside the documented "five or six weeks" range.
- CLI & source ownership guide: the full command contract (`--help`, `init`, `list`, `add --dry-run`, `add`, `doctor`, `diff`, `update`) was run for real against `@beemvp/beeui-cli@0.86.2-rc.1` in the clean room. Every command matched its documented behavior exactly: `add button` created the 4 declared files with the declared external-package requirements list; the follow-up `diff` reported all 4 files `UNCHANGED`; `update` reported `SKIP ... unchanged` for all 4.
- Migration & versioning guide: `npm view` confirms `next` and `latest` both resolve to `0.86.2-rc.1` for all three packages, matching the guide's install line; the shown `import { BeeUIProvider, Button } from '@beemvp/beeui-ui';` line is exactly what the working clean-room app's own `_layout.tsx` already imports successfully.

## Untestable (out of scope for a public-docs-only consumer audit)

- Table guide's exact benchmark numbers (`~0.073ms`/100 rows, `~0.36ms`/500 rows via `pnpm bench:web`) -- no `pnpm` workspace, ADR-007 fixtures, or benchmark harness exist in a plain consumer app; qualitatively, the `TeamTable` sample renders correctly with no virtualization as claimed.
- Branding guide's "an unknown brand/appearance/runtime-theme name throws during render" for `BeeThemeScope` -- not independently probed with an actually-invalid brand name (time-boxed out of this pass).
- Date & time guide's DST edge-case and locale/week-start `Intl`-dependent claims -- would need explicit DST-boundary dates and multiple ICU locales to verify; not probed this pass.
- CLI guide's repository-local `pnpm beeui <cmd>` maintainer path, and Troubleshooting's `pnpm --filter @beemvp/beeui-cli run build` / `pnpm registry:verify` / `pnpm ui-exports:check` / `pnpm docs:contract:check` -- these only exist inside the BeeUI monorepo, which is out of scope for a public-docs-only clean-room audit. The underlying CLI operations they wrap were independently verified via the published CLI (see Holds above).

## Totals

- Guide/theming code samples: 36 (7 branding, 2 density, 3 table, 7 date-time, 2 cli-source-ownership, 5 migration-versioning [incl. 1 non-code placeholder], 9 troubleshooting, 1 theming) -- see `doc-samples.md` for the per-sample table.
- Pattern code samples: 37 (one "State and callback contract" block per pattern page).
- All 73 rows: as-pasted 22, needs-context 50, broken 1 (10-01).
- Prose instructions checked across the 9 guides: 33 -- holds 24, fails 3 (10-01, 10-04, 10-05), untestable 6.
