# Findings 14 · Restyle W-ORD, orders and customers · 2026-09-12

Context: sub-phase 2B of the design pass restyles `/orders`, `/orders/[id]`, `/customers` and
`/customers/[id]` to `docs/design/mockups/orders.html` and `docs/design/design-direction.md`.
Public sources only: <https://beeui.beemvp.com/docs/> and `@beemvp/beeui-*@0.86.2-rc.1`.

Numbers start at 14-30 so they cannot collide with 2A (14-01 to 14-04) or W-ADM (14-20 to
14-23).

### 14-30 · `TableRow selected` sets `aria-selected` but paints nothing
- Area: component-behavior
- Severity: major
- Source consulted: <https://beeui.beemvp.com/docs/components/table/> (`TableRow.selected`,
  boolean, default `false`, documented as "Visual highlight for a caller-selected row";
  "Table owns no selection state" describes who owns the boolean, not that the highlight is
  the caller's job)
- Expected: `<TableRow selected>` renders the row with a visible selected surface, so a
  master/detail table (list plus preview pane) needs no colour of its own.
- Actual: the row gets `aria-selected="true"` and nothing else. Its class list and computed
  background are identical to an unselected row.
- Repro: on web, `<TableRow selected>...</TableRow>`, then in the console:
  `const r = document.querySelector('tr[aria-selected="true"]'); getComputedStyle(r).backgroundColor`
  returns `rgba(0, 0, 0, 0)`, the same as `tr[aria-selected="false"]`, and `r.className` is
  `border-b border-border last:border-b-0` for both.
- Workaround: the orders table adds its own tint,
  `className={order.id === selectedId ? 'bg-primary/10' : undefined}`, next to `selected`.
  Keeping `selected` for the ARIA state and painting by hand means the two can drift.
- Suggested fix for BeeUI: paint the row from a token (`bg-primary/10` or a
  `--color-row-selected`) when `selected` is true, or, if the family really does not want to
  own the colour, change the prop's description from "Visual highlight" to "ARIA state only,
  style the row yourself". Right now the docs promise a highlight the component does not draw.

### 14-31 · A table row cannot be pressable, so a list of records cannot link to its detail route
- Area: gap
- Severity: major
- Source consulted: <https://beeui.beemvp.com/docs/components/table/> (TableRow props:
  `children`, `className`, `selected`; TableCell props: `children`, `className`, `colSpan`,
  `label`)
- Expected: a data table in an admin or POS app makes the whole 56 pt row the target that
  opens the record, the way `ListItem` does with `onPress` on phone. BeeUI's own list family
  ships that, so the table family reads as the same pattern one breakpoint up.
- Actual: no member of the table family takes a press handler, an `href`, or an `asChild`.
  Wrapping `TableRow` is not an option on web either: `Table` renders a real `<table>`, and a
  `<div role="button">` between `<tbody>` and `<tr>` is invalid HTML the browser reparents.
- Repro: `<TableRow onPress={...}>` is a type error, and the prop is absent from the docs.
- Workaround: the press target lives inside the first cell (a `Pressable` around the order
  code or the customer name, `min-h-11`, explicit `accessibilityLabel`). W-ADM reached the
  same workaround independently for the products table, which is the signal that this is the
  family's gap and not two workers' preference.
- Suggested fix for BeeUI: `onPress` on `TableRow` that renders the row as `role="button"`
  (or, on web, wraps every cell's content in one anchor when given `href`), plus the hover and
  focus affordance the pattern needs. Failing that, document the in-cell target as the
  sanctioned pattern so every app does not reinvent it.

### 14-32 · `SearchInput` exposes no way to focus it, so a keyboard shortcut has to go through the DOM
- Area: gap
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/components/search-input/>
- Expected: a search field a desktop app binds to a key (the direction doc puts `F3` on both
  the POS catalogue and the orders list) can be focused imperatively, through a forwarded ref,
  a `focus()` handle, or a controlled focus prop.
- Actual: the component takes `onSearch`, `placeholder`, `defaultValue` and friends; no ref
  forwarding is documented and there is no imperative handle.
- Repro: `const ref = useRef<TextInput>(null); <SearchInput ref={ref} />` has no documented
  contract, and `ref.current?.focus()` is not part of the published API.
- Workaround: the filter bar wraps the input in a `View nativeID="orders-search"` and the
  web-only `F3` handler does
  `document.getElementById('orders-search')?.querySelector('input')?.focus()`. It works
  because react-native-web renders the wrapper as a div around a real `<input>`, so the app
  now depends on a rendering detail of the family instead of on its API.
- Suggested fix for BeeUI: forward the ref to the underlying `TextInput`. Every design system
  that ships a search field ships this, because command palettes and `/` shortcuts are the
  main reason a search field exists.

### 14-33 · `ListItem` loses its accessible name as soon as a row needs two values on one line
- Area: a11y
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/components/list-item/> ("The synthesized
  accessible name is all-or-nothing: if `title`, `description` or `trailing` is anything but a
  plain string or number, no name is synthesized at all")
- Expected: the documented behaviour is at least honest, so this is a gap and not a defect.
  But the phone row this design (and most list designs) calls for is three lines with a badge
  and an amount in them, so `title` is a node, so every such row is nameless unless the caller
  repeats the whole row as a string.
- Actual: `title={<View>...}` produces a `role="button"` row with no accessible name.
- Repro: `<ListItem title={<View><Text>A</Text><Badge>B</Badge></View>} onPress={...} />`
- Workaround: every orders and customers row passes an explicit `accessibilityLabel` built
  from the same strings it renders, which duplicates the row's content and can fall out of
  sync silently.
- Suggested fix for BeeUI: synthesize the name by walking the rendered children's text (what
  the browser does for label-less buttons), or accept `titleText`/`descriptionText` string
  companions used only for the accessible name.

## Not filed (checked and rejected)
- Right aligned money columns: same wall as W-ADM's **14-21**, same fix
  (`className="items-end text-right"` on `TableHead` and `TableCell`). Not refiled.
- `Badge` stretching inside a `TableCell`: W-ADM's **14-22**. The orders and customers tables
  wrap each badge in `<View className="flex-row">` for the same reason. Not refiled.
- `Button labelClassName`: the destructive outline the mockup asks for (`variant="outline"` +
  `className="border-destructive"` + `labelClassName="text-destructive"`) is exactly what the
  docs describe, and it works. No finding.
- `Timeline`, `Stat`, `Pagination`, `Chip`, `Select`, `Dialog`, `AlertDialog`: used as
  documented, no friction worth logging.
