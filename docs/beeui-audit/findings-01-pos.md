# BeeUI audit findings, Phase 01 (POS sell flow)

Consumed only via https://beeui.beemvp.com per-component docs pages (`/docs/components/<name>/`,
fetched with curl and stripped of HTML tags per the phase brief), `llms-components.txt`, and the
installed npm packages `@beemvp/beeui-*@0.86.2-rc.1`. `~/workspace/BeeUI` was never opened.

## 01-01, IconButtonProps silently omits size, unlike every other Button-family trigger
- Area: api-types
- Severity: minor
- Source consulted: https://beeui.beemvp.com/docs/components/icon-button/ (Props table)
- Expected: IconButton sits in the same family as Button/DialogTrigger/PopoverTrigger
  (all documented as "carries ButtonProps"), and every one of those exposes size: sm/md/lg/icon.
  Reasonable to expect IconButton (used for the cart qty stepper's minus/plus and the
  "remove line" action) to accept the same size prop to fit a dense cart row.
- Actual: the doc's own Props table states IconButtonProps carries
  Omit<ButtonProps, 'accessibilityLabel' | 'children' | 'labelClassName' | 'size'>, size is
  explicitly omitted, not just narrowed. Passing size="sm" fails tsc --noEmit with TS2322
  (confirmed the doc's own claim against the compiler, not a doc/runtime mismatch this time).
- Repro: `<IconButton accessibilityLabel="x" size="sm" onPress={...}>...</IconButton>` fails
  with "Property 'size' does not exist on type 'IntrinsicAttributes & Omit<ButtonProps, ...>'".
- Workaround: dropped size from every IconButton call site (qty-stepper.tsx,
  cart-line-item.tsx); IconButton has one fixed footprint.
- Suggested fix for BeeUI: either expose size on IconButton (most icon-only actions in a
  dense UI like a cart row want sm), or state the fixed-size constraint in the family
  overview prose, not just implicitly via the Omit in the Props table.

## 01-02, Trigger components are themselves full pressables, not slots; nesting another interactive element inside one repeats phase 0's nested-button pitfall
- Area: component-behavior
- Severity: minor (avoided proactively; documenting so the next consumer does not rediscover it)
- Source consulted: https://beeui.beemvp.com/docs/components/popover/ and /dialog/
  (PopoverTriggerProps is exactly ButtonProps, DialogTriggerProps is exactly
  DialogTriggerProps, both Omit<PressableProps, 'accessibilityRole' | 'role' | 'children'>),
  plus docs/beeui-audit/findings-00-scaffold.md finding scaffold-05 (DropdownMenuTrigger
  nested-pressable / hydration-warning report from phase 0).
- Expected: a "trigger" name suggests a thin wrapper that forwards press handling to
  whatever child is passed (an asChild-style slot), so wrapping an IconButton inside it for a
  custom icon look would be natural.
- Actual: every *Trigger in the family is documented as carrying full ButtonProps itself
  (variant/size/loading/labelClassName), the trigger IS the pressable/button, the same shape
  phase 0 already hit with DropdownMenuTrigger. Wrapping another pressable inside one would
  repeat the nested-button HTML violation phase 0 saw.
- Workaround: every icon-style trigger in this phase (ProductCard's info DialogTrigger,
  LineDiscountPopover's percent PopoverTrigger) renders a bare glyph Text as the trigger's own
  children, using the trigger's own variant="ghost" size="icon", instead of nesting an
  IconButton. Info-icon buttons are laid out as siblings of the tap-to-add Pressable in
  ProductCard, not nested inside it, so info-icon presses do not also fire add-to-cart via
  event bubbling.
- Suggested fix for BeeUI: an explicit "composing a custom trigger" example in the shared
  anchored-overlays doc (Popover/Dialog/AlertDialog/Sheet all repeat this shape) showing the
  bare-glyph-as-children pattern would save every consumer the same investigation.

## 01-03, A selector deriving a new array every call throws Maximum update depth exceeded via useSyncExternalStore, own code but logged per protocol
- Area: component-behavior (own code: zustand + React 19's useSyncExternalStore, not BeeUI)
- Severity: major (blocked the /pos/shift screen entirely with an Uncaught Error overlay)
- Source consulted: runtime console/overlay on web (expo start --web), Playwright-captured
- Expected: a zustand selector such as
  `useOrderStore((s) => s.shifts.filter(...).slice().sort(...))` is common shorthand and reads
  as "derive and return"; nothing in BeeUI is involved, but the resulting screen renders
  Stat/Table/AlertDialog from BeeUI, so the failure surfaced while wiring those up.
- Actual: because the selector allocates a brand new array on every single call, React 19's
  useSyncExternalStore (which zustand's create uses internally) detects an unstable snapshot
  and re-renders in a loop, throwing Maximum update depth exceeded on first mount of
  /pos/shift.
- Repro: `export function useShiftHistory(storeId) { return useOrderStore((s) =>
  s.shifts.filter(...).slice().sort(...)); }`, call it from a component, mount it on web.
- Workaround: src/data/shift-store.ts now selects the store's raw, referentially-stable
  shifts array from zustand, then derives the filtered/sorted list in a separate useMemo
  keyed on [shifts, storeId] inside the exported hook, so the zustand selector itself never
  allocates.
- Suggested fix: none needed from BeeUI; logged per protocol's "log every friction point"
  since it was discovered while building a BeeUI-heavy screen and is the kind of pitfall other
  BeePOS phases sharing similar list-derivation selectors could hit too.

## 01-04, SearchInput's onSearch fires correctly for the barcode-scanner-Enter pattern
- Area: component-behavior
- Severity: nit (positive confirmation, not a defect)
- Source consulted: https://beeui.beemvp.com/docs/components/search-input/ ("uncontrolled...
  onSearch(value) called on submit, not on every keystroke, use onChangeText for that")
- Expected/Actual: matched the doc exactly. pos-screen.tsx uses value/onChangeText to drive
  live name/SKU/barcode filtering and onSearch to fire only on Enter, which is exactly what
  "type a barcode and press Enter to add 1 unit like a scanner" needed, no surprises. Noted
  here as a positive data point since most other phase-0 SearchInput findings were about
  missing docs, not behavior mismatches.

## 01-05, Textarea's numberOfLines controls visible height on web too
- Area: docs-public
- Severity: nit
- Source consulted: https://beeui.beemvp.com/docs/components/textarea/
- Expected/Actual: used for the cart note and the order-discount reason field with
  numberOfLines={2}/default 4; rendered correctly on web (a textarea element with a matching
  rows count), confirming the native-prop-name-on-web behavior the doc implies but does not
  spell out explicitly for numberOfLines (it is listed as "own field, default 4" with no
  platform-behavior note beyond "also carries Omit<InputProps, 'multiline' | 'size'>").
