# Phase 06 · Docs vs llms*.txt consistency audit (dedicated auditor)

Owner: one dedicated Sonnet auditor. Tracker: BeeUI #234 (shared log). Runs alongside phases 1..5.

## Goal
Find every mismatch between the human docs site (https://beeui.beemvp.com/docs/**) and the AI surfaces (`/llms.txt`, `/llms-full.txt`, `/llms-components.txt`, `/llms-patterns.txt`, `/docs/ai/`), item by item, in a machine-regenerable matrix. Later (step 3) each item is checked against reality (npm package `.d.ts`, runtime behaviour observed in BeePOS phases 1..5) and the wrong side gets an upstream fix request.

## Step 1 · Build the checklist matrix (log to GitHub)
Enumerate every checkable item. Categories and minimum rows:
- A. Publication and install: status wording, version string, dist-tags, `npm install` command, CLI command, "private/public repo" claim. Sources: /docs/start/, /docs/ai/, /docs/release-security/, all 4 llms files, `npm view`.
- B. Compatibility: Node, pnpm, React, React DOM, RN, Expo SDK, RNW, Tailwind, Uniwind, and every peer in `npm view @beemvp/beeui-ui peerDependencies` (12). Sources: /docs/compatibility/, /docs/compatibility/current/, /docs/compatibility/native/, /docs/compatibility/web/, llms-full.
- C. Setup instructions: Expo metro config keys (`cssEntryFile`, `dtsFile`, `extraThemes`), global.css lines and `@source` globs, babel, Vite plugin order, `uniwind generate-artifacts`, provider tree (GestureHandlerRootView, BottomSheetModalProvider, BeeUIProvider), SafeArea root guidance, theme switching API (`Uniwind.setTheme`, `useUniwind`, `beeRuntimeThemeNames`), `BeeThemeScope`, `useBeeToken`, density, high contrast. Sources: /docs/start/expo/, /docs/start/web/, /docs/start/bare-react-native/, /docs/start/provider-safe-area/, /docs/theming/, /docs/guides/density/, /docs/guides/branding/, llms-full.
- D. Component inventory: for each of the 62 modules in llms-components.txt: docs page exists at /docs/components/<slug>/ (slug mapping may differ, record it), exported symbols listed identically, "Exported types" on page, Props table present, platform-behavior section present, a11y section present, the page's import line matches llms. Also reverse: every /docs/components/ page has an llms row.
- E. Patterns: 4 packs × 37 screens; names and counts identical between llms-patterns and /docs/patterns/**; each pattern page exists.
- F. Architecture/ADR list: 11 ADRs in llms-full vs /docs/reference/architecture/ (or wherever the site lists them); invariants list wording; non-goals list.
- G. Accessibility contract claims: the bullet claims in llms-full vs /docs/accessibility/*.
- H. Link integrity: every URL or repo-relative path referenced in the 4 llms files and /docs/ai/: does it resolve on the site (HTTP 200) or is it a repo-only path (README.md, docs/*.md, packages/**, apps/**) that a site visitor cannot open? Record status code.
- I. Numbers: counts stated anywhere (62 components, 70 registry items, 37 screens, 28 screenshots, 370 renders, 4 themes ...) cross-checked across surfaces.

Matrix format (`docs/beeui-audit/docs-llms-matrix.md`, generated, plus `docs/beeui-audit/docs-llms-matrix.json` for step 3): columns `ID | Category | Item | Docs-site value (page URL) | llms value (file, line) | Status | Note`. Status ∈ `identical | mismatch | docs-only | llms-only | unverifiable`.

Generation: write scripts under `scripts/audit/` (Node, no new deps beyond what is installed; use `fetch`, regex/`cheerio`-free HTML stripping) so the matrix is regenerable: `node scripts/audit/build-docs-llms-matrix.mjs` fetches, parses, writes both files. Cache raw fetches in `scripts/audit/.cache/` (gitignored).

GitHub: open ONE issue on beobungbu/BeeUI titled `[Consumer audit] Docs site vs llms*.txt consistency matrix (BeePOS)` with: purpose, method (script link), category totals table, then the full mismatch list (not the identical rows; link to the matrix file in BeePOS for the full table), and "Step 3 pending: reality check against npm package + BeePOS runtime". Labels: `documentation, area:docs, area:ai-agent`. Footer credits BeePOS and says "Tracked in #234". Then add a short comment on #234 linking the new issue with the totals.

## Step 2 · Compare item by item
Done by the same script: normalise values (trim, lowercase versions, strip markdown/HTML), mark status. For text claims (setup steps, a11y claims) compare semantically and note the exact wording difference in `Note`. Do not hide near-matches: `mismatch` with a note beats a lenient `identical`.

## Step 3 (later, not now)
- 3a identical items: verified against reality by BeePOS feature phases and an npm `.d.ts` diff (`scripts/audit/check-exports-vs-dts.mjs`, write it now if cheap: compare llms-components exported symbols to `node_modules/@beemvp/beeui-ui/dist/typescript/module/index.d.ts` exports and report). Any reality mismatch → issue.
- 3b mismatched items: decide which side is right from reality; propose the sync fix per item in the tracker issue.

## Constraints
- Only public surfaces + the installed npm package in `node_modules/@beemvp/*` (that IS the customer reality). Do not read ~/workspace/BeeUI.
- No em-dash in anything posted to GitHub. Credit BeePOS. Do not open more than the one issue in this phase; do not comment on component-specific issues.
- Files you own: `scripts/audit/**`, `docs/beeui-audit/docs-llms-matrix.*`, `docs/beeui-audit/findings-06-docs-llms.md` (narrative findings the matrix cannot express), report `plans/260911-0854-beepos-ui-prototype/reports/phase-06-docs-llms-audit-report.md`. Add `scripts/audit/.cache/` to .gitignore (one line). Commit only those paths; other workers are committing to main concurrently, never `git add -A`; retry on index lock. Do not push.

## Acceptance
- Matrix has ≥ 250 rows covering all categories A..I; every one of the 62 components has its D-rows; every link in the llms files has an H-row with a status code.
- Script regenerates both files deterministically from cache.
- Issue opened with totals + mismatch list; comment on #234 posted; report with Status block.
