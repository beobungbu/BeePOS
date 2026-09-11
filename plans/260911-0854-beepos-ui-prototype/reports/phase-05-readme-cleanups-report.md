# Phase 05: README + integration cleanups report

Date: 2026-09-11 · Scope: phase-05-qa-audit-publish.md steps 1, 5, and the "Integration cleanups" section.

## Cleanups done

1. **`description` field**: folded `description?: string` directly into `src/domain/types.ts#Product`; deleted `src/features/products/product-type-augment.d.ts` (the module-augmentation workaround). No other file referenced the augment file.
2. **Settings receipt preview reuse**: left as-is. `src/features/pos/receipt-screen.tsx` is a full route screen bound to `useLocalSearchParams` and four stores (order/catalog/customer/session); it renders a real `Order`, not sample data, and exports no presentational sub-component. Extracting one so the settings preview (static header/footer/logo, fixed sample line) could reuse it would mean refactoring the live checkout screen, more than a small refactor, so out of scope here. Updated the stale comment in `receipt-preview.tsx` (it referenced a "phase worker actively editing in parallel" that no longer applies) to state the real reason.
3. **`AreaPlaceholder`**: `src/components/shell/area-placeholder.tsx` had zero importers anywhere in `app/` or `src/` (grepped `AreaPlaceholder` project-wide, only its own definition matched). Deleted as dead code.
4. **Unplanned but required for "stays green"**: found the repo's `tsc --noEmit` and root `npm test` were already broken at HEAD before I touched anything (verified via `git stash` + rerun). `scripts/audit/claims/__tests__/*.claims.test.tsx` (phase 07A audit fixtures, deliberately type/runtime-mismatched to probe BeeUI's fail-safes) were being swept into both:
   - `tsc --noEmit`: 5 errors (unused `@ts-expect-error`, `children` missing on `IconButton`, `value` missing on `Progress`).
   - root `npm test`: 21 suites failed with `SyntaxError: Unexpected token 'export'` because the audit fixtures import BeeUI's ESM `dist/module` build, which the root jest config has no `transformIgnorePatterns` override for (their own `scripts/audit/claims/jest.config.js` does, and is how the audit report's own "Reproduce" section runs them).

   Fixed by scoping both tools to the app, not the audit tooling:
   - `tsconfig.json`: added `"exclude": ["node_modules", "scripts/audit/claims/**/*"]`.
   - `package.json` `jest.testPathIgnorePatterns`: added `"/scripts/audit/claims/"`.

   This is exactly what phase-05 step 1 asks for ("fix cross-phase breakage") and was required for the fresh-clone acceptance criterion to pass at all. Did not touch anything under `scripts/audit/claims/` itself; the audit's own reproduce commands (`npx jest -c scripts/audit/claims/jest.config.js`) are unaffected.
5. Also reverted a stray uncommitted 1-line timestamp diff in `docs/beeui-audit/props-accuracy.json` (unrelated to this phase, pre-existing in the working tree, not part of my file ownership) via `git checkout --` before committing, so it wasn't accidentally swept into my commit.

All three gates green after cleanups, before writing the README:
- `npm run typecheck`: clean.
- `npm test`: 8 suites, 140/140 passed.
- `npm run export:all`: web/android/iOS bundles all exported.

## Fresh-clone check

After committing the cleanups (commit `89ec16f`), cloned to `/private/tmp/claude-501/.../scratchpad/beepos-fresh`, ran `npm ci && npm run typecheck && npm test && npx expo export --platform web`, then deleted the clone.

```
npm ci
  added 866 packages, and audited 867 packages in 8s
  postinstall: uniwind generate-artifacts ran clean

npm run typecheck
  [Uniwind] Artifacts generated   (no tsc errors)

npm test
  PASS src/domain/__tests__/{orders,org,catalog,pos,customers,reports,inventory,money}.test.ts
  Test Suites: 8 passed, 8 total
  Tests:       140 passed, 140 total

npx expo export --platform web
  Web Bundled 1304ms node_modules/expo-router/entry.js (1876 modules)
  ...
  Exported: dist
```

No local-state-only passes found; the fixes above (tsconfig/jest scoping) are what made this reproducible on a clean clone.

## README + LICENSE

- `README.md` rewritten: what BeePOS is, second purpose (BeeUI field audit, links `docs/beeui-audit/report.md` and https://github.com/beobungbu/BeeUI/issues/234), screenshot grid (8 images picked by viewing candidates: POS wide `phase-01-cart-3-items.png`, POS narrow `phase-01-pos-narrow-added.png`, checkout `phase-01-checkout-split-payment.png`, orders `phase-03-orders-wide-light.png`, products `phase-02-products-list-1280-light.png`, inventory `phase-02-inventory-1280-light.png`, reports `phase-04-reports-1280-light.png`, settings dark `phase-04-settings-1280-dark.png`), run instructions with demo login (store codes from `src/data/seed/stores.ts`, PIN `1234`), scripts table, architecture map, "From prototype to production" section listing the 9 `src/data/*-store.ts` files as the swap points and confirming `src/domain` stays untouched, BeeUI notes for `postinstall` (#562), single outer `SafeArea` (#564), empty-string `className` (#563), MIT license line, prototype/reload-resets status line. No em-dash characters (checked with grep, none remain after a sed pass fixed the first draft).
- `LICENSE` added: MIT, 2026, Tran Duc Lan (was missing).

## Commits and push

```
89ec16f chore: integration cleanups
7041194 docs: README for public showcase
```

Pushed to `origin/main` (`6197c28..7041194`).

## Not done (per instructions, out of scope)

- Steps 2, 3, 4, 6 of phase-05 (Playwright QA, iOS Simulator QA, audit report authoring, opening GitHub issues) were explicitly skipped, handled elsewhere.
- `docs/beeui-audit/report.md` not rewritten, only linked as instructed.

Status: DONE
Summary: Folded the `description` workaround into `Product`, deleted the dead `AreaPlaceholder` and the augment file, left the settings receipt preview un-reused with a documented reason, fixed a pre-existing tsc/jest scope bug that was leaking `scripts/audit/claims` fixtures into the app's build gates, verified green on a fresh clone, wrote the public README and MIT LICENSE, and pushed two commits to `main`.
Concerns/Blockers: none. The tsconfig/jest scoping fix was not explicitly listed in the phase's "Integration cleanups" section but was required for the acceptance criterion ("fresh clone + npm ci + typecheck && test && export:all passes") to hold at all; flagging it here since it touches `tsconfig.json` and `package.json`, not files explicitly named in that section.
Commits: 89ec16f, 7041194
