# Phase 5 · W-E · E2E extension + perf harness

Worker: W-E · 2026-09-13 · Metro on 8105 · Playwright output `/tmp/claude-501/pw-e2e` ·
login HN01 / 1234 · nothing committed.

## Gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | pass |
| `npx tsc --noEmit -p scripts/qa/e2e/tsconfig.json` (new) | pass |
| `npx eslint scripts/qa/e2e src/features/audit` | 0 errors, 0 warnings |
| `npm test` | 21 suites, 282 tests, pass (unchanged by this block) |
| `npm run qa:e2e` | **23 passed, 3 skipped, 4 min 20 s** (`fullyParallel`, `workers: 2`) |

The three skips are by design: `pos-features`, `perf` and `shortcuts` are desktop-only and skip
themselves in the `narrow` project.

Runs used `BEEPOS_E2E_PORT=8105` against this worker's own Metro and a private `--output` dir,
so the concurrent review worker's Playwright runs never shared `test-results/`.

## Specs

New files, all under `scripts/qa/e2e/specs/`, both projects unless noted. Times are from the
final full run (wide / narrow).

| Spec | Covers | Time |
|---|---|---|
| `multi-order.spec.ts` | three orders open at once, one paid, the neighbour becomes active, an empty order closes with no confirmation, one with lines is confirmed by name, closing the last leaves a fresh empty order | 5.9s / 6.9s |
| `inventory-ops.spec.ts` | receipt with two lines (qty 5 and 3) received, listed as received, stock up on the sell screen; then a stock count generated, counted 2 short, variance badge, posted, and the till sells the counted quantity | 4.2s / 3.9s |
| `customer-from-pos.spec.ts` | quick-add at the till attaches the customer to the order, and the directory then finds and opens the record | 3.1s / 2.9s |
| `reports-settings.spec.ts` | period switch (today to 30 days), custom range through both calendar popovers, back to today; language switch to English and back | 2.8+2.4s / 1.9+1.6s |
| `persistence.spec.ts` | a finished sale and a parked order survive `page.reload()`, then "Đặt lại dữ liệu mẫu" puts the seed back (no parked lines, one empty order, the sale gone from `/orders`) | 4.4s / 3.3s |
| `shortcuts.spec.ts` (wide) | `Alt+N` and `Cmd/Ctrl+K` with the catalogue search focused, and `Alt+N` ignored behind a dialog | 2.8s |
| `perf.spec.ts` (wide) | the perf budget, three measurements (below) | 27.5s |

Support: `scripts/qa/e2e/lib/flows.ts` (new) holds the Vietnamese labels and the flows the new
specs share (`openShift`, `showCart`, `payWithCash`, `posTile`, `posStock`, `orderTabs`,
`overlay`, `pick`, `money`). `lib/labels.ts` stays the journey's own per-locale dictionary.

Assertions are written against values rather than layouts wherever the two viewports differ:
stock is read off the sell tile's accessible name ("Còn 42"), a receipt's status off the receipt
itself rather than a table row (the phone renders that list as `ListGroup`), and the cart is
reached through `showCart()` which knows the pane from the pushed route.

Config: `fullyParallel: true`, `workers: 2`. Safe because every test starts from `/login` with
storage wiped by `clearPersistedState`, so no test depends on another. `journey.spec.ts` needed
one type annotation (`let t: (typeof L)[Locale]`) to pass the new E2E typecheck; no behaviour
changed.

## Perf harness

Route `/audit/perf` (`app/(app)/audit/perf.tsx`, `src/features/audit/perf-harness-screen.tsx`):
the sell screen's real `ProductGrid` over a catalogue built by cycling the seed products, with
URL knobs `?count=`, `?images=0`, `?batch=`. The spec marks `performance.now()` before the
client-side navigation, the harness marks the first animation frame after the grid's first
commit, then the spec wheel-scrolls 20 viewport heights in 5 notches each and collects
`requestAnimationFrame` deltas.

Full numbers, method and the production-build comparison: **`docs/qa/perf-260913.md`**.

| Measurement | First tile (budget 1500 ms) | p50 | p95 | Worst | Frames > 100 ms |
|---|---|---|---|---|---|
| 120 products (shipped catalogue), `ProductGrid` | 68 to 138 ms | 16.7 ms | 16.8 ms | 83 to 100 ms | 0 |
| 1000 products, `ProductGrid` | 74 to 140 ms | 16.7 ms | 50 ms | 133 to 250 ms | 7 to 9 |
| 1000 products, batched grid (`?batch=4`) | 43 to 73 ms | 16.7 ms | 16.8 ms | 66 to 100 ms | 0 |

**First tile passes everywhere by more than an order of magnitude.**

**The 100 ms frame budget is missed at 1000 products, and it is not about the catalogue size.**
400 products jank identically (worst 133 ms), turning the tile photos off changes nothing, and a
production `expo export` build behaves like the dev bundle. The long frames are whole multiples
of 16.7 ms spread evenly through the scroll: `ProductGrid` passes no windowing props, so
`FlatList` renders `maxToRenderPerBatch` 10 **rows**, which at the desktop grid's 5 columns is 50
tiles in one commit. The shipped 120 SKU catalogue only passes because the grid is 8164 px tall
and the scroll runs out of list halfway.

Proven fix, measured rather than assumed: the same 1000 tiles through the same `ProductCard`
with `initialNumToRender` / `maxToRenderPerBatch` 4 and `windowSize` 7 hold p95 at 16.8 ms and
never cross 100 ms.

```tsx
// src/features/pos/components/product-grid.tsx, on the FlatList  (owner: POS worker)
initialNumToRender={4}
maxToRenderPerBatch={4}
windowSize={7}
updateCellsBatchingPeriod={50}
```

## Deviations, and why

1. **The 1000 product case asserts a regression ceiling, not the budget.** `ProductGrid` is not
   in this block's ownership, so the miss above could be measured but not fixed. The spec asserts
   the budget on the shipped catalogue and on the batched grid, and for the untuned 1000 tile
   grid asserts p95 under 66.7 ms and no frame over 300 ms, printing a `PERF NOTE` line naming
   the fix on every run. Once the knobs land, that case goes back to the budget and `BatchedGrid`
   can be deleted from the harness.
2. **The catalogue is not written into `catalog-store`.** The brief says "into the catalog store
   in memory (not persisted)", but `persistence-bootstrap` subscribes to that store, so seeding
   it would serialise ~300 KB into localStorage on a debounce timer: a synthetic catalogue
   persisted into the demo, and a JSON stringify inside the frame measurement. `ProductGrid`
   takes its products as props, so the harness owns them and nothing outside the screen sees
   them. The parenthetical intent is met exactly; the mechanism differs.
3. **A frame of exactly 100.0 ms counts as inside the budget** ("no frame *longer than* 100 ms"),
   and the budget cases tolerate one such frame: with two browsers on one machine the first batch
   render of a scroll can eat one frame of someone else's work. The p95 assertion (under 33.4 ms)
   is what actually separates a grid inside the budget from one outside it: the untuned 1000 tile
   case sits at 50 ms with 7 to 9 frames over.
4. **`BatchedGrid` duplicates ~20 lines of `ProductGrid`** inside the harness, because
   `ProductGrid` accepts no windowing props. It exists to keep the recommendation above honest
   and is documented as delete-on-fix.

## Coordinator items

- `react-hooks/purity` error in `perf-harness-screen.tsx`: fixed by removing the render-phase
  `performance.now()` entirely. The start mark was only feeding a `buildAndRenderMs` diagnostic;
  the metric that matters is measured spec-side from before the navigation, which already covers
  building the catalogue. `npx eslint src/features/audit` is now clean (the two unused BeeUI
  imports in `audit-harness-screen.tsx` went with it).
- `getByRole('row')` on `/inventory/receipts` in the narrow project: replaced. The spec now opens
  the receipt and asserts its status there, which is the same list item on both layouts.
- Capture-phase shortcuts: `specs/shortcuts.spec.ts` covers `Alt+N` and `Cmd/Ctrl+K` with the
  catalogue search focused (and asserts the search keeps its query and its focus), plus `Alt+N`
  correctly doing nothing behind an open dialog.

## Notes

- Running the suite rewrites the journey's screenshots (`docs/screenshots/e2e-*.png`) and W-A's
  feature shots (`docs/design/after/features/*.png`). That is the existing specs doing their job,
  not an edit by this worker.
- `scripts/qa/e2e/tsconfig.json` is new: the root `tsconfig.json` excludes `scripts/qa/**`, so
  the suite had no typecheck at all. It found one real error (the journey's `t` binding).
- `openCalendar()` in `reports-settings.spec.ts` retries the date popover press twice and logs
  when it does. That is defensive, not a diagnosis: the day cells turned out to carry
  `role="cell"` rather than `role="button"`, which is what the first failures actually were, and
  the retry has not fired in any run since. No BeeUI finding filed.
- `docs/beeui-audit/findings-18-w-e.md` not created: this block touched no BeeUI component and
  found nothing to file.

## Unresolved

1. Who applies the `ProductGrid` windowing props, and in which phase? It is a two-line change in
   a POS-owned file.
2. `npm run qa:e2e` was verified through `BEEPOS_E2E_PORT=8105` against a warm Metro. A cold run
   on the default port additionally pays Metro's first web bundle (about 40 s here), which still
   leaves the 15 minute budget untouched but is not included in the 4 min 20 s above.
