# Phase 10 · Pass 3: every code block in Guides and Patterns executed in a clean room

Owner: one Sonnet worker. Tracker: BeeUI #234. Question: do the code samples on the 9 guide pages and 37 pattern pages compile and run as pasted, and do the guides' prose instructions hold?

## Scope
- Guides: https://beeui.beemvp.com/docs/guides/ index + branding, density, table, date-time, cli-source-ownership, troubleshooting, migration-versioning, current-release (from /docs/sitemap-0.xml, `/docs/guides/*`).
- Theming: /docs/theming/ and /docs/reference/tokens/ , /docs/reference/core/ , /docs/reference/styling/ code blocks.
- Patterns: /docs/patterns/ index + the 37 pattern pages (`/docs/patterns/<pack>/<screen>/`). Each pattern page shows a "Verified example source"/composition excerpt; treat each as one sample.

## Method
1. Clean room `/Users/textsoft/workspace/beeui-cleanroom-samples` (outside the repo): an Expo SDK 57 app with BeeUI 0.86.2-rc.1 installed following ONLY the public Expo start guide (you may copy the working config from `/Users/textsoft/workspace/beeui-cleanroom-expo` created in phase 07B to save time; note in the log that you did). Web target via `expo start --web --port 8097` + Playwright, plus `npx tsc --noEmit`.
2. Extractor `scripts/audit/extract-doc-samples.mjs` (in BeePOS, reuse `scripts/audit/lib/html.mjs` + `http.mjs`): pull every fenced code block from the pages above into `scripts/audit/.cache/samples/<page>/<n>.<ext>` with the page URL, heading and language. Record counts per page.
3. For every TS/TSX sample: write it as a file in the clean room under `samples/<page>/<n>.tsx`, wrapping in the minimal harness the page implies (imports it omits, a `BeeUIProvider`, dummy state/props). Rule: if you had to add anything the page does not show, log it as `needs-context` with the exact additions. Then: `tsc --noEmit` (compile result), render on Web through a generated `samples` route that mounts each sample, screenshot at 390 and 1024, capture console errors. For CSS/shell/JSON samples: apply them (global.css, metro config, CLI commands) and record the result; for CLI samples (`npx @beemvp/beeui-cli@0.86.2-rc.1 ...`, `beeui add`, `list`, `diff`, `update`) run them in the clean room and record stdout/exit code.
4. Prose checks: for each guide, list its imperative instructions ("set X", "call Y", "use Z for ...") and mark each `holds | fails | untestable` with evidence (the density guide, branding guide and table guide are the richest).

## Output
- `docs/beeui-audit/doc-samples.{md,json}`: per sample: page URL, heading, language, `compiles`, `renders`, console errors, `needs-context` additions, screenshot path, verdict `as-pasted | needs-context | broken`, with the failing error text for `broken`.
- `docs/beeui-audit/findings-10-guides-patterns.md`: broken samples with URL + quote; guide instructions that fail; CLI results vs the CLI guide text; anything the guides claim about density/branding/table/date-time that did not hold.
- Screenshots `docs/screenshots/samples-*.png` (one per pattern page at 390, one contact sheet is fine).
- Report `plans/260911-0854-beepos-ui-prototype/reports/phase-10-guides-patterns-report.md` with totals (samples per verdict, per page) and the Status block.
- One comment on BeeUI #234 (totals table per page, the list of `broken` and the top `needs-context` gaps, CLI results). No new issues, no em-dash, credit BeePOS.

## Acceptance
- Every code block on the 9 guides + theming/reference pages + 37 pattern pages has a row; ≥ 90% of TSX samples reach a compile verdict; every pattern page has a render attempt and screenshot or a `broken` reason.
- App gates untouched (`npm run typecheck`, `npm test` green). Files you own in BeePOS: `scripts/audit/extract-doc-samples.mjs`, `docs/beeui-audit/doc-samples.*`, `docs/beeui-audit/findings-10-guides-patterns.md`, `docs/screenshots/samples-*.png`, your report. Commit only those; do not push.
