# BeeUI audit findings — Phase 02 (products, categories, inventory)

Consumed only via https://beeui.beemvp.com, its `llms*.txt` files, the per-component
`/docs/components/<name>/` pages, `/docs/guides/table/`, and the installed npm packages
`@beemvp/beeui-*@0.86.2-rc.1`'s own shipped `.d.ts` files (inspected only through TypeScript
compiler diagnostics, per protocol's sanctioned reverse-engineering method, never by reading
BeeUI's repository source).

### 02-01 · TimelineStatus's valid values are not documented on the Timeline page
- Area: docs-public
- Severity: minor
- Source consulted: https://beeui.beemvp.com/docs/components/timeline/ (Props section, TimelineItemProps.status)
- Expected (per docs): Every other documented union prop on other component pages (e.g. Badge.variant, AlertBanner.variant) lists its full literal union inline in the Type column. Timeline's own guide pattern would suggest the same for status: TimelineStatus.
- Actual: The Type column just says "TimelineStatus" with no enumerated values, and the page has no "Related exported types" section for it (every other component page with an aliased union type does have one, e.g. Table's TableSortDirection, Pagination's PaginationItemType). Had to reverse-engineer the real union by writing a scratch probe (const probe: NonNullable<Props['status']> = 123;) in a temporary .tsx under the project and reading the TS2322 error from npx tsc --noEmit --noErrorTruncation, then bisecting candidate string literals one by one until only 'default' | 'success' | 'destructive' | 'primary' compiled without error.
- Repro: fetch /docs/components/timeline/, search for "Related exported types" following the Props section, absent, unlike every sibling component page.
- Workaround: Used the tsc-probe method (sanctioned by protocol.md's "public npm .d.ts via compiler diagnostics" rule) to discover TimelineStatus = 'default' | 'success' | 'destructive' | 'primary', then mapped stock-movement direction to 'success'/'destructive' in src/features/inventory/movement-history-dialog.tsx.
- Suggested fix for BeeUI: Add the "Related exported types" block to the Timeline page listing TimelineStatus's literal union, matching every other page that ships an aliased prop type.

### 02-02 · Field's label element also carries aria-label, making the field ambiguous to accessible-name queries
- Area: a11y
- Severity: minor
- Source consulted: runtime DOM captured via Playwright on web (expo start --web), https://beeui.beemvp.com/docs/components/field/
- Expected: A Field's rendered Label text and its child control (e.g. Input, Select) form one label/control accessibility relationship; a query for the field's accessible name should resolve to exactly one focusable/interactive node.
- Actual: Both the label div (aria-label="Cửa hàng nhận, required", no interactive role) and the control itself (role="combobox" aria-label="Cửa hàng nhận") independently expose an accessible name containing the field's label text, so a standards-based accessible-name query (Playwright's getByLabel, and equivalently any assistive-tech "find control named X" query) resolves to 2 elements and throws in strict mode.
- Repro: any Field+Select/Input composition, page.getByLabel('<field label>') on web resolves to 2 elements (strict mode violation).
- Workaround: Queried the underlying control directly by its own exposed role instead (page.getByRole('combobox', { name: '<label>' }) / getByRole('textbox', { name: /<label>/ })) in the phase's Playwright QA and functional-verification scripts.
- Suggested fix for BeeUI: Either drop the redundant aria-label from the label div (the label/control association already carries the name) or mark the label element so a "labelled control" query resolves to one node, matching native <label for> behavior.

### 02-03 · Accordion intentionally drops the shadcn-familiar type="single" | "multiple" prop; not called out for consumers coming from that convention
- Area: docs-public
- Severity: nit
- Source consulted: https://beeui.beemvp.com/docs/components/accordion/ (Props section, AccordionProps)
- Expected: Radix/shadcn's Accordion (the reference implementation most RN/web consumers know) requires a type: 'single' | 'multiple' prop to select single-vs-multi-open behavior. A consumer skimming BeeUI's own Accordion composition example without reading every prop row first reasonably assumes the same shape.
- Actual: BeeUI's Accordion has no type prop at all; it is always single-open, selected instead by whether value/defaultValue/onValueChange are a string | null. Passing type="single" (a natural first guess) fails tsc with "Property 'type' does not exist on type ...".
- Repro: <Accordion type="single" collapsible value={v} onValueChange={setV}> fails to type-check (TS2322, unknown prop 'type').
- Workaround: Removed type="single"; Accordion's single-open behavior is implicit and controlled purely via value/onValueChange's string | null shape, used as-is in src/features/products/categories-screen.tsx.
- Suggested fix for BeeUI: Add one sentence to the Accordion page's overview noting there is no type/multi-open variant, for consumers whose mental model comes from the shadcn/Radix API.

### 02-04 · Table's own row/cell primitives have no built-in press/navigation affordance
- Area: gap
- Severity: minor
- Source consulted: beeui-ui TableRowProps/TableCellProps prop surface (/docs/components/table/), /docs/guides/table/
- Expected: A common list-to-detail UX (click a table row to open its detail screen) is standard for any data-table component.
- Actual: TableRow's own prop surface carries Omit<ViewProps, 'children'> (a plain View), not Omit<PressableProps, ...> like almost every other interactive family (ListItem, DropdownMenuItem, SegmentedControlItem); there is no onPress on TableRow or TableCell. Passing onPress to TableRow fails to type-check.
- Repro: <TableRow onPress={...}> fails to type-check (TS2322, onPress does not exist on TableRowProps).
- Workaround: Wrapped only the first cell's content in a plain React Native Pressable (not a second BeeUI interactive primitive, to avoid the nested-interactive-element pitfall from findings-00-05) in every row-to-detail table used in this phase (src/features/inventory/receipts-list-screen.tsx, transfers-list-screen.tsx, counts-list-screen.tsx).
- Suggested fix for BeeUI: Either document the "wrap one cell's content in your own Pressable" pattern explicitly in the Table guide (not currently mentioned), or add a caller-opt-in onRowPress to TableRow mirroring ListItem's pressable contract.

### 02-05 · Nested-pressable pitfall (findings-00-05) generalizes beyond DropdownMenuTrigger; any pressable-in-a-pressable composition needs the same care
- Area: component-behavior
- Severity: minor
- Source consulted: own composition work in src/features/products/product-list-cards.tsx, src/features/inventory/inventory-cards.tsx, cross-referencing findings-00-05/00-07
- Expected: N/A, this is a generalization of an existing finding, logged so later phases do not have to rediscover it independently.
- Actual: ListItem's onPress makes the whole row a pressable; the product-spec's mobile "card with Switch" pattern (from the products/inventory screen spec) would put a second Switch/Badge-as-pressable in trailing, which is exactly the button-nested-in-button risk documented in findings-00-05 for DropdownMenuTrigger+IconButton, just via a different component pair.
- Repro: none new, same class of bug as findings-00-05, different composition.
- Workaround: Kept trailing/leading slots in every pressable row (ListItem product/inventory cards) to read-only content (Badge), moving the actual interactive control (status Switch, quick-adjust Dialog) to a non-pressable-row context (the detail screen, or the wide Table's own cell, which is not itself pressable, see findings-02-04).
- Suggested fix for BeeUI: Generalize findings-00-05's suggested fix from "one composition example" to a dedicated "composing inside a pressable row" guidance note on ListItem's page, since the same trap recurs for any interactive trailing/leading content, not just DropdownMenuTrigger.
