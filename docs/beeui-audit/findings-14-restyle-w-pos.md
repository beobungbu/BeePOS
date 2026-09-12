# Findings 14 · Restyle 2B, W-POS (sell, cart, checkout, receipt, shift) · 2026-09-12

Context: sub-phase 2B rebuilds the POS screens against `docs/design/design-direction.md` and
`docs/design/mockups/pos.html` / `checkout.html`. Public sources only:
<https://beeui.beemvp.com/docs/> and `@beemvp/beeui-*@0.86.2-rc.1`. Numbering continues after
`findings-14-restyle-2a-foundation.md` (14-01 to 14-04).

Already filed, not repeated here: the open-order strip has no BeeUI family behind it
(14-01, BeeUI #591). This phase confirms that conclusion in code: `Tabs` cannot carry a press
handler on the active trigger, which is exactly where the close control lives.

### 14-05 · `DialogTrigger variant="outline"` keeps the primary label colour, which is invisible in dark
- Area: component-behavior
- Severity: major
- Source consulted: <https://beeui.beemvp.com/docs/components/button/> ("Colors, spacing and
  typography come from semantic tokens rather than from values written here"),
  <https://beeui.beemvp.com/docs/components/dialog/>
- Expected: `DialogTrigger` is documented as a `Button`, so `variant="outline"` should paint
  its label the same colour a standalone `<Button variant="outline">` does.
- Actual, measured in the dark theme at 1440 on web:
  - `<Button variant="outline"><ButtonLabel>In lại</ButtonLabel></Button>` label is
    `rgb(242, 244, 247)` (`foreground`), correct.
  - `<DialogTrigger variant="outline"><ButtonLabel>Ghi chú</ButtonLabel></DialogTrigger>`
    label is `rgb(31, 41, 55)` (`primary-foreground`) on a `bg-surface` `rgb(18, 24, 32)`
    parent. That is a contrast ratio of about 1.1 to 1: the button reads as empty.
  The trigger therefore renders the outline *fill* but the primary *label*.
- Repro:
  ```tsx
  <Dialog><DialogTrigger variant="outline"><ButtonLabel>Ghi chú</ButtonLabel></DialogTrigger>
    <DialogContent><DialogTitle>x</DialogTitle></DialogContent></Dialog>
  ```
  with the dark theme active, then read `getComputedStyle` on the label node.
- Workaround: `src/features/pos/components/secondary-button-label.tsx`, a `ButtonLabel` with
  `className="text-foreground"`, used for every unfilled button in POS (dialog triggers,
  dialog closes, alert-dialog cancels, the tablet "Xem giỏ hàng" button). Applied to all of
  them rather than only the measured one, because they come from the same family and the
  failure mode is silent.
- Suggested fix for BeeUI: have `DialogTrigger` / `AlertDialogTrigger` / `DialogClose` resolve
  the label colour from the `variant` they already forward to the button surface. A theme
  snapshot test that renders each variant in dark and asserts label-to-surface contrast would
  have caught it, since the bug is invisible in light.

### 14-06 · `labelClassName` does nothing when the child is a `ButtonLabel`
- Area: docs-public
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/components/button/> ("labelClassName:
  Extra utility classes for the label text specifically, merged after the component's own")
- Expected: `labelClassName="text-foreground"` colours the label, whatever form the children
  take. The docs attach no condition to the prop.
- Actual: with an explicit `<ButtonLabel>` child the prop is ignored. Measured in dark:
  `<DialogTrigger variant="outline" labelClassName="text-foreground"><ButtonLabel>Ghi
  chú</ButtonLabel></DialogTrigger>` still resolves to `rgb(31, 41, 55)`, while moving the
  same class onto the `ButtonLabel` gives `rgb(242, 244, 247)`. The prop presumably only
  reaches the label the button creates for a plain string child.
- Repro: the two lines above, side by side, in the dark theme.
- Workaround: put the class on `ButtonLabel` instead (see 14-05).
- Suggested fix for BeeUI: either merge `labelClassName` into the `ButtonLabel` child through
  context, or say in the prop's description that it applies only when `children` is a string,
  and point to `ButtonLabel`'s own `className` for the composed case.

### 14-07 · The `useBeeToken` path for chart colours is not discoverable from the docs
- Area: docs-public
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/reference/tokens/> (lists
  `chartColorTokens: ["series-1", "series-2", "series-3", "series-4", "positive", "negative",
  "neutral", "highlight", "grid", "axis"]` and a `chartColorVariable()` helper)
- Expected: a page that documents `useBeeToken('colors.primary')` and then lists the chart
  token names should say which prefix the chart ones take.
- Actual: the page never writes a chart path in full. `useBeeToken('colors.chart-series-1')`,
  the form the CSS variable name (`--chart-series-1`) suggests, fails to typecheck:
  `Argument of type '"colors.chart-series-1"' is not assignable to parameter of type
  'BeeTokenPath'`. The working path is `useBeeToken('chart.series-1')`, found by trying five
  candidates against `tsc`. Another worker in this repo hit the same wall in
  `src/features/products/components/product-thumb.tsx` on the same day.
- Repro: `useBeeToken('colors.chart-series-1')` versus `useBeeToken('chart.series-1')`.
- Workaround: `src/features/pos/lib/category-accent.ts` uses `chart.series-1..4` and
  `chart.highlight`, and falls back to `bg-muted` when a token does not resolve to a colour.
- Suggested fix for BeeUI: print one full example on the tokens page
  (`useBeeToken('chart.series-1')`) next to the colour example, or export the union so editors
  can complete it.

### 14-08 · `SearchInput` has no trailing slot and no documented way to focus it
- Area: gap
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/components/search-input/> (documents
  `onSearch` plus `Omit<InputProps, 'inputMode' | 'returnKeyType'>`)
- Expected: a search field that a POS can put a scan glyph in, and that a keyboard shortcut
  can focus. Both are ordinary requirements for the component's main use case.
- Actual: no trailing adornment slot is documented, and nothing documents ref forwarding, a
  `focus()` handle or `autoFocus`, so "F3 focuses search" has no supported implementation.
- Repro: try to render the direction doc's search bar (leading magnifier, trailing 44 pt
  `scan-barcode` control, `F3` hint) from `SearchInput` alone.
- Workaround: `src/features/pos/components/catalog-search.tsx` wraps `SearchInput` in a
  bordered row that owns the trailing glyph and the key hint, and F3 focuses the field on web
  by querying the DOM for `input[placeholder="..."]`. That is a web-only escape hatch for a
  web-only shortcut, but it depends on a placeholder string, which is fragile.
- Suggested fix for BeeUI: a `trailing` slot (the family already owns the leading icon) and a
  forwarded ref exposing `focus()` / `blur()`, documented on `Input` so every field inherits it.

## Confirmed working, worth recording

- `AlertDialog` driven by `open` / `onOpenChange` with no `AlertDialogTrigger` child renders
  and dismisses correctly, which is what the open-order strip needs: the confirmation is
  raised by a keyboard shortcut (`Alt+W`) as well as by a press.
- `Table` right-alignment through `className` on a child view works as the docs promise
  ("Extra utility classes, merged after the component's own via `cn(...)`"); there is no
  `align` prop and the docs do not claim one.
- `IconButton` rejecting `size` is documented ("A size prop is not accepted: an icon button
  always renders at Button's icon size"), so the compile error it produced was the app's
  fault, not a docs defect.
