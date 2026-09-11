# BeePOS UI prototype + BeeUI field audit

Status: IN PROGRESS · started 2026-09-11 · owner Ambrose · repo github.com/beobungbu/BeePOS (public)

Spec: `docs/product-spec.md` · Audit protocol: `docs/beeui-audit/protocol.md`

## Phases
| # | Phase | File | Owner | Status |
|---|---|---|---|---|
| 0 | Scaffold: Expo 57 + expo-router + BeeUI npm + shell + mock data + i18n + theme | phase-00-scaffold.md | Sonnet worker | DONE 2026-09-11 (commit 94c5abf, 10 findings) |
| 1 | POS sell flow: catalog, cart, checkout, receipt, shift | phase-01-pos-sell.md | Sonnet worker | IN PROGRESS (started 2026-09-11 09:40) |
| 2 | Products + categories + inventory (levels, receipts, transfers, counts) | phase-02-products-inventory.md | Sonnet worker | IN PROGRESS (started 2026-09-11 09:40) |
| 3 | Orders + refunds + customers | phase-03-orders-customers.md | Sonnet worker | IN PROGRESS (started 2026-09-11 09:40) |
| 4 | Reports dashboard + stores + staff + settings | phase-04-reports-admin.md | Sonnet worker | DONE 2026-09-11 (7 findings) |
| 5 | QA (web + iOS sim screenshots), audit report compile, README, publish | phase-05-qa-audit-publish.md | Ambrose + worker | TODO (spec written) |
| 6 | Docs site vs llms*.txt consistency matrix (steps 1-2 now, step 3 after feature phases) | phase-06-docs-llms-consistency-audit.md | Sonnet auditor | IN PROGRESS (started 2026-09-11 10:15) |

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
