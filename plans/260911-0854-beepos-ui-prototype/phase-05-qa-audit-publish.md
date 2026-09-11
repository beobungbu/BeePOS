# Phase 05 · QA, audit report, publish

## Inputs
- Phases 1..4 committed on main with their reports and findings files.

## Steps
1. Integration pass (worker): after all four phases land, run `npm run typecheck`, `npm test`, `npx expo export --platform all`; fix cross-phase breakage only (imports between stores, i18n merge, nav placeholders left over). Remove `dist-phase0N/` dirs (they are gitignored via `dist/`? verify; add `dist-*/` to .gitignore).
2. End-to-end web QA (worker, Playwright at 1280 + 390, light + dark): login → open shift → sell 3 items incl. barcode → split payment → receipt → order appears in /orders → partial refund → stock/points reflect → products edit → receipt goods → transfer → count → dashboard numbers move → settings theme/locale. Zero console errors is the bar; each warning logged as a finding or fixed.
3. iOS Simulator QA (Ambrose via simulator tool or worker with `npx expo run:ios` / Expo Go): same happy path, screenshots into `docs/screenshots/ios-*.png`. Log native-only findings (Sheet gesture, keyboard-aware forms, SafeArea, DatePicker native).
4. Audit report (Ambrose): `docs/beeui-audit/report.md` — executive summary, severity table (count per area × severity), top 10 findings with links, verdict on the three audit questions (public docs, llms*.txt, API/component correctness), recommendations for BeeUI ordered by impact, and a "what a first-time consumer experiences" narrative with time costs.
5. README (worker): what BeePOS is, screenshots grid, run instructions (web/iOS/Android), demo credentials (PIN 1234), architecture map, how to convert to production (where backend plugs in), link to audit report, BeeUI version.
6. Push main; open GitHub issues on beobungbu/BeeUI for each major/blocker finding (Ambrose, one issue per finding, quoting the finding text). Do NOT open issues for minor/nit; list them in one umbrella issue.

## Acceptance
- CI-less but reproducible: fresh clone + `npm ci` + `npm run typecheck && npm test && npm run export:all` passes (worker verifies in a temp dir).
- Report published in repo; issues opened; plan.md marked DONE.
