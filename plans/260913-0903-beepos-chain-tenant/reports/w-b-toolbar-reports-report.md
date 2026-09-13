# W-B · toolbar overflow (6.3) and reports stat strip (6.4) · 2026-09-13

Status: DONE_WITH_CONCERNS (every gate green except `eslint`, which cannot run in this tree at
all; see "Gates").

## What changed

**6.3 · the desktop toolbar never wraps and never clips.** `src/components/toolbar.tsx` now owns
four slots instead of one child list: `search` (always inline, shrinks to a floor), `pinned`
(always inline, for inventory's low-stock alert), `children` (the secondary filters, the only
thing allowed to leave the row) and `actions` (always inline, right aligned). The row measures
itself and its slots with `onLayout`; when the filters no longer fit beside everything that may
not move, they move whole into a `Bộ lọc` popover whose trigger carries the active-filter count as
a badge. The rule is a pure function in `src/components/toolbar-fit.ts`, unit tested, so the
threshold is reviewable without a renderer:

    fits = searchFloor + pinned + filters + actions + 8 pt per gap <= row width

`searchFloor` is 260 pt: 240 for a box that still shows its own placeholder, 20 for the `F3` hint
orders prints beside it. The filters are measured only while they are inline, and that measurement
is kept while they are collapsed; that is what stops the decision oscillating once the filters
leave the row. Below 1280 nothing changes: the same children wrap, as before.

**6.4 · reports uses the shared strip.** `StatStrip` gained an optional `delta` line
(`+2775.4% so với kỳ trước`, `text-success` or `text-destructive`) and a `stacked` layout. The
fixed `h-16` became `min-h-16`, so a screen without deltas (inventory, customers, orders) keeps its
64 pt row unchanged and reports grows only as far as the delta line needs. `/reports` renders
`ReportStats` (`src/features/reports/components/report-stats.tsx`), which replaces the deleted
`stat-cards.tsx`: one row on desktop, one figure per row below 1280, charts and tables untouched.

## Measured, Chromium on the dev build, light, seeded data

Header is 48 pt at every desktop width (0-48, the store chip 44 pt inside it). The toolbar band is
48-104, height 56 pt, at 1280, 1440 expanded, 1440 rail and 1920, on all seven screens.

| Screen · width | filters | toolbar band | table top | first data row |
|---|---|---|---|---|
| orders 1280 (sidebar) | collapsed | 48-104 (56) | 168 | 233 |
| orders 1440 (sidebar) | collapsed | 48-104 (56) | 168 | 209 |
| orders 1440 (rail) | inline | 48-104 (56) | 168 | 209 |
| orders 1920 (sidebar) | inline | 48-104 (56) | 168 | 209 |
| inventory 1440 | inline | 48-104 (56) | 168 | 209 |
| inventory 1280 | collapsed | 48-104 (56) | 168 | 209 |
| products 1280 | collapsed | 48-104 (56) | 121 | 185 |
| customers 1280 | inline (tier chips) | 48-104 (56) | 168 | 209 |
| reports 1440 / 1280 | inline | 48-104 (56) | n/a | strip at 124, charts at 210 |
| orders 768 | wrapped, two rows | 73-173 (100) | n/a | 426 |
| reports 375 | stacked strip | n/a | n/a | first figure 242 |

The 169 pt figure of the phase-4 doc is the top of the table; it is 168 here, unchanged, and the
first data row sits at 209 on every 1440 and 1920 frame. Orders at 1280 is 233 rather than 209
because two column headers (`Trạng thái`, `Tổng tiền`) wrap at 992 pt of content width; that is the
table, not the toolbar, and it predates this change.

Why orders collapses at 1440 with the sidebar open: its four selects measure 192 pt each, 792 pt
with gaps. The budget at 1152 pt of content width is 1152 - 260 (search floor) - 98 (`Xuất CSV`) -
24 (three gaps) = 770 pt. It is 22 pt short, so the filters collapse rather than wrap, which is the
decision as written. With the rail (1320 pt) the budget is 938 pt and they stay inline. If the
owner would rather see the four selects at 1440 with the sidebar open, the lever is the search
floor (260 -> 240) plus moving the `F3` hint, and that buys exactly the 22 pt; it is one constant
in `toolbar-fit.ts`. Not done on my own authority, because 240 is the documented legibility floor.

## Screenshots · docs/design/after/density2/

Required: `orders-1280`, `orders-1440-expanded`, `orders-1440-rail`, `orders-1920`,
`inventory-1440`, `reports-1440`, `reports-375`. Also captured as evidence:
`inventory-1280`, `products-1280`, `customers-1280`, `orders-768`, `orders-375`, `reports-1280`,
`reports-768`, the collapsed popovers opened (`orders-1280-filters-open`,
`products-1280-filters-open`, `inventory-1280-filters-open`), a `Select` opened inside a popover
(`inventory-1280-filters-select`), and the four `-30d` frames, because the default period is today
and the seed has no orders today, so a zero strip proves nothing about clipping. At 1280 the
five figures with real money values and deltas end 143 pt short of the right edge.

## Files

- `src/components/toolbar.tsx` (rewritten, 140 lines)
- `src/components/toolbar-fit.ts` (new, the measured rule)
- `src/components/__tests__/toolbar-fit.test.ts` (new, 6 cases)
- `src/components/stat-strip.tsx` (delta line, stacked layout, `min-h-16`)
- `src/features/reports/report-screen.tsx`, `components/report-stats.tsx` (new),
  `components/stat-cards.tsx` (deleted)
- toolbar call sites, toolbar lines only: `src/features/orders/components/order-filters-bar.tsx`,
  `src/features/products/product-toolbar.tsx`, `src/features/inventory/inventory-screen.tsx`,
  `src/features/customers/screens/customers-list-screen.tsx`
- `src/i18n/common.vi.ts`, `src/i18n/common.en.ts`: `toolbar.filters`, `toolbar.filtersActive`
- `docs/beeui-audit/findings-23-toolbar.md` (new, 5 findings)

`stores` and `staff` pass actions only, so their call sites needed no edit. `src/components/shell/**`
untouched.

## Active-filter count, per screen

Orders counts the three "all" selects (store, cashier, status); the date range is not counted,
because a range is always in force. Products counts category and status. Inventory counts the store
scope only once it leaves the store the screen opened on, and its low-stock chip is `pinned` rather
than collapsible, because that chip replaced a banner (phase 4, decision 5) and an alert that hides
itself is not an alert. Customers counts the tier chip. Reports counts a period other than today
and a chosen store.

## Gates

- `npx tsc --noEmit`: clean.
- `npx jest`: 24 suites, 334 tests, all pass (includes the new `toolbar-fit` cases and the vi/en
  parity test, which covers the two new keys).
- `npx eslint src app`: **cannot run in this tree**. `eslint` and `eslint-config-expo` are not in
  `package.json` at all (`git log -p -- package.json | grep eslint` is empty), so `npm run lint`
  exits with `Cannot find module 'eslint'` and a fetched `eslint` cannot resolve the config's own
  `require('eslint/config')`. I did not install packages, because W-A is working in the same tree.
  As a substitute, `tsc --noEmit --noUnusedLocals --noUnusedParameters` reports nothing on any file
  touched here.
- Journey E2E: **8 of 8 pass** (3.6 min, wide and narrow, vi and en, light and dark), against the
  dev server on 8112. The first run failed 8 of 8 on the login step, because W-A's email + password
  screen had landed before `scripts/qa/e2e/lib/session.ts` was updated; I did not touch the spec,
  re-ran after five minutes as instructed, and by then W-A had updated the helper. A middle run
  reported two narrow failures whose error was `ENOENT ... recording2.trace`, two Playwright runs
  sharing one `--output` directory; with a private directory per run, all eight pass. The browser
  console was clean (0 errors) across all sixteen frames captured for the screenshots too.

## Concerns

1. Orders at 1440 with the sidebar open collapses by 22 pt (above). One constant if the owner
   disagrees.
2. At tablet the reports strip is stacked, 295 pt for five figures against roughly 208 pt for the
   old two-row card grid. Desktop and phone both improve; 768 pays about 87 pt for one figure per
   row. Putting the delta on the same line as the value would win it back but risks wrapping at
   375, so it was not done.
3. The collapsed popover holds the same React elements the row held, so filter state survives the
   collapse; it is not a second copy of the filters.
