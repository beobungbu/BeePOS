# Findings 23 · W-B, toolbar overflow + reports stat strip · 2026-09-13

Context: phase 6 density fixes. The desktop toolbar may no longer wrap or clip, so the
secondary filters had to collapse into a popover, and `/reports` moved from stat cards to the
shared stat strip. Public sources only: <https://beeui.beemvp.com/docs/> and
`@beemvp/beeui-*@0.86.2-rc.1`. Ids start at 23-01.

### 23-01 · No overflow or collapse primitive for a toolbar row
- Area: gap
- Severity: major
- Source consulted: <https://beeui.beemvp.com/llms-components.txt>,
  <https://beeui.beemvp.com/llms-patterns.txt> (searched for "toolbar", "overflow", "responsive",
  "collapse", "more")
- Expected (per docs): a library that ships `Toolbar`-shaped patterns (filters left, actions
  right) also ships the overflow behaviour that row needs, the way a menubar ships an overflow
  menu. `llms-patterns.txt` describes the filter row but says nothing about what happens when it
  stops fitting.
- Actual: nothing in the package measures or collapses. The app had to build the rule itself in
  `src/components/toolbar.tsx` + `src/components/toolbar-fit.ts`: measure the filter slot and the
  action slot with `onLayout`, compare against the row width, and swap the filters into a
  `Popover` when the sum passes it. React Native has no `scrollWidth`, so the only way to know a
  row would overflow is to lay it out once and keep the measurement.
- Repro: put a search box, four `Select`s and four `Button`s in one `flex-row`; at 1280 the row
  either wraps or clips depending on `flexWrap`, and no prop changes that.
- Workaround: the two files above. The measurement is cached while the filters are collapsed,
  because a collapsed row no longer reports their width and the decision would otherwise
  oscillate every frame.
- Suggested fix for BeeUI: an `Overflow`/`Toolbar` primitive that takes `priority` per child and
  hides the lowest-priority children into a trigger, or at minimum a documented recipe. Every
  admin product hits this on the same day it hits 1280.

### 23-02 · No popover example with a count on the trigger, and no word on its accessible name
- Area: docs-public
- Severity: nit
- Source consulted: <https://beeui.beemvp.com/docs/components/popover/> (reference and every
  example, 2026-09-13)
- Expected (per docs): the "Filters (2)" pattern, a trigger carrying a badge, is the first thing a
  list screen asks a popover for; the page should show it once.
- Actual: `PopoverTrigger` takes `ButtonProps`, so `children: React.ReactNode` does allow element
  children, but every example on the page passes a plain string, there is no `asChild`, and
  nothing states what the accessible name becomes when the children are `Text` + `Badge` rather
  than one string. A reader has to try it to learn that `Button` wraps only string and number
  children in its own `Text` and passes elements through unchanged.
- Repro: `<PopoverTrigger variant="outline" size="sm"><Text>Bộ lọc</Text><Badge>2</Badge></PopoverTrigger>`
- Workaround: it renders correctly on one line; the app passes `accessibilityLabel` explicitly
  rather than trusting an inferred name that would read `Bộ lọc2`
  (`src/components/toolbar.tsx`).
- Suggested fix for BeeUI: one badge-on-trigger example plus a sentence on how the accessible name
  is derived when the children are elements.

### 23-03 · A `Select` inside a `Popover` works, but nothing says it may
- Area: docs-public
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/components/popover/>,
  <https://beeui.beemvp.com/docs/components/select/>
- Expected (per docs): a statement about nesting overlays, since a filter popover holding
  `Select`s is the obvious use of a popover on a list screen.
- Actual: neither page mentions the other. Building it blind risked the select list rendering
  under the popover or the outside-press handler closing both. It behaves: the select list paints
  above the popover, the popover stays open while the list is open, and `Escape` closes the list
  first.
- Repro: `docs/design/after/density2/inventory-1280-filters-select.png`, five options listed from
  a `Select` nested two overlays deep.
- Workaround: none; verified by screenshot rather than by documentation.
- Suggested fix for BeeUI: a "nesting overlays" note on the popover page stating what closes what.

### 23-04 · `Separator orientation="vertical"` still needs an explicit height
- Area: component-behavior
- Severity: nit
- Source consulted: <https://beeui.beemvp.com/docs/components/separator/>
- Expected (per docs): `orientation="vertical"` draws a vertical rule.
- Actual: it draws nothing unless the caller also passes a height, because the rule has no
  intrinsic height and its parent row is `items-center`. The stat strip carries `className="mx-5 h-8"`
  for that reason and has since phase 4; the same trap is still there in this release.
- Repro: `<Separator orientation="vertical" />` between two `View`s in a `flex-row items-center`.
- Workaround: `h-8` on the separator (`src/components/stat-strip.tsx`).
- Suggested fix for BeeUI: default the vertical variant to `self-stretch`, or say in the docs that
  a height is required.

### 23-05 · Prop shapes for `Popover` were read from the installed `.d.ts`, not from the docs
- Area: docs-public
- Severity: nit
- Source consulted: <https://beeui.beemvp.com/docs/components/popover/>, the installed
  `@beemvp/beeui-ui@0.86.2-rc.1` declarations via `scripts/audit/props/model.json`
- Expected (per protocol): the public pages answer "may the trigger hold elements, and is the
  popover controlled or uncontrolled" without opening the package.
- Actual: the reference page does list `ButtonProps` for the trigger and the controlled /
  uncontrolled union for `Popover`, so the docs were sufficient for the API; the two things they
  did not answer (badge on a trigger, `Select` nested inside the content) are logged as 23-02 and
  23-03. Logged here so the record shows the `.d.ts` was consulted alongside the docs.
- Repro: n/a
- Workaround: n/a
- Suggested fix for BeeUI: none beyond 23-02 and 23-03.
