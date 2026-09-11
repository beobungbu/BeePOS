# BeePOS UI prototype + BeeUI field audit

Status: DONE (all 12 phases) · started 2026-09-11 · owner Ambrose · repo github.com/beobungbu/BeePOS (public)

Spec: `docs/product-spec.md` · Audit protocol: `docs/beeui-audit/protocol.md`

## Phases
| # | Phase | File | Owner | Status |
|---|---|---|---|---|
| 0 | Scaffold: Expo 57 + expo-router + BeeUI npm + shell + mock data + i18n + theme | phase-00-scaffold.md | Sonnet worker | DONE 2026-09-11 (commit 94c5abf, 10 findings) |
| 1 | POS sell flow: catalog, cart, checkout, receipt, shift | phase-01-pos-sell.md | Sonnet worker | DONE 2026-09-11 (integrated on main, batch-2 issues filed) |
| 2 | Products + categories + inventory (levels, receipts, transfers, counts) | phase-02-products-inventory.md | Sonnet worker | DONE 2026-09-11 (integrated on main, batch-2 issues filed) |
| 3 | Orders + refunds + customers | phase-03-orders-customers.md | Sonnet worker | DONE 2026-09-11 (integrated on main, batch-2 issues filed) |
| 4 | Reports dashboard + stores + staff + settings | phase-04-reports-admin.md | Sonnet worker | DONE 2026-09-11 (7 findings) |
| 5 | QA (web + iOS sim screenshots), audit report compile, README, publish | phase-05-qa-audit-publish.md | Ambrose + worker | PARTIAL 2026-09-11: cleanups, fresh-clone gate, README, LICENSE, consolidated report, 21 issues filed; iOS Simulator QA still open |
| 6 | Docs site vs llms*.txt consistency matrix (steps 1-2) | phase-06-docs-llms-consistency-audit.md | Sonnet auditor | DONE 2026-09-11 (501 rows, issue #574) |
| 7 | Step 3: verify docs against reality (props, behavior claims, clean-room usability, readability rubric) | phase-07-doc-truth-verification.md | 2 Sonnet workers (A verifier, B fresh reader) | DONE 2026-09-11 (A: 62 comps, 72 claims hold; B: 2 clean rooms, 12 pages scored; issues #575-#580) |
| 8 | Pass 1: per-prop, per-value executable verification (570 props) | phase-08-per-prop-behavior.md | Sonnet worker | DONE 2026-09-11 (570 props, 947 tests, 1 robustness fail, 3 too-vague) |
| 9 | Pass 2: readability + comprehension exam, all 151 docs pages | phase-09-readability-comprehension.md | Fable (Ambrose writes rubric + exam; Fable subagent scores; fresh Sonnet sits the exam) | DONE 2026-09-11 (52 pages 3.82, templates 3.0/3.3, exam 50/50; #585) |
| 10 | Pass 3: guides + patterns code blocks executed in clean room | phase-10-guides-patterns-executable.md | Sonnet worker | DONE 2026-09-11 (73 samples, 37/37 patterns rendered, CLI holds; issues #581-#583) |
| 11 | Pass 4: native iOS Simulator happy path + 8 web-only claims via Playwright | phase-11-native-and-browser-claims.md | Sonnet worker + Ambrose Sheet reproduction | DONE 2026-09-11 (iOS 12 screenshots, 8/8 browser claims, Sheet defect isolated; #584, #586) |

Dependencies: 1..4 depend on 0 and run in parallel (disjoint route folders + own store files). 5 depends on 1..4.

## Acceptance (whole plan)
- `npx expo export --platform web,ios,android` succeeds; `npx tsc --noEmit` clean; `npm test` green.
- Every screen in `docs/product-spec.md` reachable and interactive on web (Chromium) and iOS Simulator.
- Light + dark correct on every screen; vi + en.
- `docs/beeui-audit/` has findings per phase + `report.md` compiled with severity table.
- Public repo pushed, README with run instructions and screenshots.

## File ownership (parallel safety)
- Phase 0 owns: root configs, `app/_layout.tsx`, `app/(app)/_layout.tsx` (declares ALL nav entries up front), `src/domain/types.ts`, `src/domain/money.ts`, `src/data/seed.ts`, `src/data/store-*.ts` skeletons, `src/i18n/*`, `src/theme/*`, `src/components/shell/*`.
- Phases 1..4 own only their route folder under `app/(app)/<area>/`, their `src/features/<area>/` folder, their `src/domain/<area>.ts` module and tests, and their `docs/beeui-audit/findings-0N-*.md`. They append i18n keys ONLY under their own namespace file `src/i18n/<area>.vi.ts` + `.en.ts` (phase 0 creates the merge).
