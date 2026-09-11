# Phase 05 step 2 · integrated E2E Web QA report (Ambrose, 2026-09-11)

Executed by Ambrose after five subagent launches stalled on infrastructure (three Sonnet, two Opus, zero output each).

## Suite
- `scripts/qa/e2e/playwright.config.ts` (projects `wide` 1280x800, `narrow` 390x844 mobile emulation; webServer Expo web on 8099, reuses a running server), `lib/session.ts` (login, client-side `go()` navigation so in-memory state survives, console/page error collection), `lib/labels.ts` (vi/en labels used by the journey), `specs/journey.spec.ts` (one journey per locale x theme, 12 steps, screenshots for narrow/vi/light and wide/en/dark).
- Run: `npm run qa:e2e`. Excluded from the app's `tsc` and jest.

## Matrix (final run, 7.0 min)
| Run | vi light | vi dark | en light | en dark |
|---|---|---|---|---|
| wide 1280 | pass 52.1s | pass 52.0s | pass 51.8s | pass 52.2s |
| narrow 390 | pass 52.7s | pass 52.6s | pass 52.8s | pass 52.6s |

Console errors remaining: 0 in all runs (3 warnings per run, logged; React dev-only key/act warnings from list rendering, not failures). 20 screenshots in `docs/screenshots/e2e-*.png`.

## App bugs found and fixed (see docs/beeui-audit/findings-05-e2e.md for detail)
1. Product tile and floating cart bar not exposed as buttons.
2. Seed "today" orders timestamped in the future (UTC day + 8h..21h), new order not first, receipt date wrong in local time.
3. `router.back()` with no history logged GO_BACK errors on 18 call sites; replaced by `goBackOr(fallback)`.
4. Bottom tab bar overflow at 390 with Vietnamese labels; fixed and asserted.

## BeeUI findings
05-01 AlertDialog role is `dialog` on Web; 05-02 Field duplicate accessible name reconfirmed (#570); 05-03 SelectValue default placeholder not localizable.

## Evidence
```
npm run qa:e2e   -> 8 passed (7.0m)
npx jest         -> Tests: 140 passed, 140 total
npx tsc --noEmit -> clean
```

Status: DONE
Summary: Integrated journey passes on all 8 viewport x locale x theme runs with zero console errors after four app fixes; suite kept in the repo for reruns.
Concerns/Blockers: Metro's file watcher on this machine misses edits (needed `expo start --clear` after each source change); the suite is sequential and takes about 7 minutes.
