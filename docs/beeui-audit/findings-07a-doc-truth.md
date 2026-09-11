# Phase 07 Worker A: doc-truth verification findings

Machine-evidence findings from A1 (props-accuracy) and A3 (matrix reality
verdicts). Template and severity guide: `docs/beeui-audit/protocol.md`.
Full data: `docs/beeui-audit/props-accuracy.{md,json}`,
`docs/beeui-audit/behavior-claims.{md,json}`,
`docs/beeui-audit/docs-llms-matrix.{md,json}`.

### 07A-01 · `loading` prop's documented default is missing on 8 *Trigger/*Close Props tables
- Area: docs-public
- Severity: minor
- Source consulted: `dist/typescript/module/components/button.js` (compiled `Button`) via `AlertDialogActionProps`/`AlertDialogCancelProps`/`AlertDialogTriggerProps`/`DialogCloseProps`/`DialogTriggerProps`/`DropdownMenuTriggerProps`/`PopoverCloseProps`/`PopoverTriggerProps`/`SheetCloseProps`/`SheetTriggerProps`/`TooltipTriggerProps` — all of which are `= ButtonProps`-equivalent per their own docs pages ("`X is exactly ButtonProps`" / "`X is exactly DialogCloseProps`" chains)
- Expected (per docs): each of these Props tables should show a default for `loading`, matching Button's own documented "Defaults to false."
- Actual: every one of the 11 tables shows "—" (no default) for `loading`, even though the installed `.d.ts`'s JSDoc for the underlying `loading?: boolean` member says "Defaults to false" ( `node_modules/@beemvp/beeui-ui/dist/typescript/module/components/button.d.ts` )
- Repro: `https://beeui.beemvp.com/docs/components/alert-dialog/#alertdialogactionprops` -> Props table, `loading` row, Default column
- Workaround: none needed at runtime (behavior confirmed correct — BTN-01..06 in behavior-claims.json all hold); this is a docs gap only
- Suggested fix for BeeUI: the doc generator that renders "X is exactly ButtonProps" pages should inherit Button's own JSDoc defaults for shared props, not just the prop list

### 07A-02 · `Input`'s `disabled`/`invalid` documented defaults ("Defaults to false") are missing from the Props table
- Area: docs-public
- Severity: minor
- Source consulted: `node_modules/@beemvp/beeui-ui/dist/typescript/module/components/input.d.ts`
- Expected (per docs): `disabled` and `invalid` rows should show `false` in the Default column, matching the JSDoc comment on each (`/** ... Defaults to false. */`)
- Actual: both rows show "—" on `https://beeui.beemvp.com/docs/components/input/#inputprops`
- Repro: fetch the page, find the `disabled`/`invalid` rows
- Workaround: none needed (Input's runtime behavior matches the JSDoc; FI-04 in behavior-claims.json holds)
- Suggested fix for BeeUI: same generator gap as 07A-01 — prose "Defaults to X." in a prop's JSDoc comment is not being surfaced into the Default column for these two props specifically (`size`/`invalid` variant props DO get their `cva` defaultVariants shown correctly, but these two non-variant boolean props don't)

### 07A-03 · DatePicker/DateTimePicker/Calendar accessibility-label and `locale` defaults are undocumented
- Area: docs-public
- Severity: minor
- Source consulted: `node_modules/@beemvp/beeui-ui/dist/typescript/module/components/{date-picker,date-time-picker,calendar}.d.ts`
- Expected: `locale` ('en-US'), `clearAccessibilityLabel` ('Clear date' / 'Clear date and time'), `nextMonthAccessibilityLabel` ('Next month'), `previousMonthAccessibilityLabel` ('Previous month'), `placeholder` ('Select a date' / 'Select a date and time'), and (DateTimePicker only) `hourAccessibilityLabel` ('Hour'), `minuteAccessibilityLabel` ('Minute'), `periodAccessibilityLabel` ('AM or PM') should all show their documented default value
- Actual: every one of these 13 rows across the 3 pages shows "—"
- Repro: `https://beeui.beemvp.com/docs/components/date-picker/#datepickerprops`, `.../date-time-picker/#datetimepickerprops`, `.../calendar/#calendarprops`
- Workaround: none needed at runtime
- Suggested fix for BeeUI: same doc-generator gap; these are all plain (non-variant) props with a JSDoc "Defaults to `X`." comment that isn't reaching the table

### 07A-04 · `PaginationItemProps.page` marked "(required)" in docs, but the installed type makes it optional (discriminated-union shape not disclosed)
- Area: docs-public
- Severity: major
- Source consulted: `node_modules/@beemvp/beeui-ui/dist/typescript/module/components/pagination.d.ts`
- Expected (per docs): `page (required)` implies every `PaginationItem` must supply `page`
- Actual: `PaginationItemProps` is actually a union of a page-numeral variant (`page: number` required, `type?: 'page'`) and a navigation variant (`type: 'previous' | 'next'`, `page?: never` — page must be *omitted*). The docs table documents only the page-numeral branch and never states that `<PaginationItem type="previous" />` / `type="next"` must NOT supply `page`.
- Repro: `https://beeui.beemvp.com/docs/components/pagination/#paginationitemprops`; compare against the exported `PaginationItemType`/two-variant type in the `.d.ts`
- Workaround: infer the two-variant shape from the component's own runtime `type` prop semantics (confirmed at runtime: PAG-01..04 in behavior-claims.json)
- Suggested fix for BeeUI: document `PaginationItemProps` as two explicit variants (mirroring how the Dialog/Sheet/Popover family's controlled-vs-uncontrolled union is documented with a `never`-typed row for the non-applicable branch), or state explicitly that `page` is required only when `type="page"` (the default)

### 07A-05 · `BeeThemeScope`'s `appearance`/`brand` marked "(required)", `registry` default and `theme` prop undocumented
- Area: docs-public
- Severity: minor
- Source consulted: `node_modules/@beemvp/beeui-ui/dist/typescript/module/components/theme-scope.d.ts`
- Expected: docs state `appearance (required)` / `brand (required)` for the "registry selection" form; `registry` should show its default (`beeThemeRegistry`); the alternate "already-resolved runtime-theme name" form's `theme` prop should have its own row
- Actual: `BeeThemeScopeProps` is (per its own extensive JSDoc) a two-form union — "1. Registry selection — `brand`+`appearance`" or "2. [an already-resolved runtime-theme name via] `theme`" — so `appearance`/`brand` are only required in form 1, and `theme` (form 2) has no docs-table row at all; `registry`'s documented default (`beeThemeRegistry`) is missing
- Repro: `https://beeui.beemvp.com/docs/components/theme-scope/#beethemescopeprops`
- Workaround: none needed at runtime
- Suggested fix for BeeUI: split the Props table into the two documented forms (same pattern as 07A-04), and add the missing `registry` default + `theme` row

### 07A-06 · `Table`'s `TableCellProps`/`TableHeadProps` have an undocumented `columnIndex` prop
- Area: docs-public
- Severity: nit
- Source consulted: `node_modules/@beemvp/beeui-ui/dist/typescript/module/components/table.d.ts`
- Expected: every public prop on `TableCellProps`/`TableHeadProps` is listed
- Actual: `columnIndex?: number` is a real, exported member of both types (it is how `TableRow` threads column position down for the stacked-layout label lookup — confirmed in `dist/module/components/table.js`) but has no docs-table row and no "internal, do not set" note
- Repro: `https://beeui.beemvp.com/docs/components/table/#tablecellprops`
- Workaround: none — a caller who happens to pass `columnIndex` themselves would silently override `TableRow`'s own wiring; low real-world risk since it is not a prop anyone would guess to pass
- Suggested fix for BeeUI: either mark `columnIndex` as `@internal`/omit it from the public type (it is set by `React.cloneElement` from `TableRow`, not meant for direct callers), or document it explicitly as "set automatically by TableRow; do not pass directly"

### 07A-07 · `Text`'s `family`/`numeric` prop types are narrower named aliases (`FontFamily`, `NumericVariant`) that are not publicly resolvable
- Area: docs-public
- Severity: nit
- Source consulted: `node_modules/@beemvp/beeui-ui/dist/typescript/module/components/text.d.ts`
- Expected: the docs' `FontFamily`/`NumericVariant` type names should either be public (importable/inspectable) or the table should show their expansion
- Actual: the installed `.d.ts` resolves `family` to `"mono" | undefined` and `numeric` to `"tabular" | undefined` directly (each is a single-literal union) — `FontFamily`/`NumericVariant` are not exported from `@beemvp/beeui-ui`'s package index, so a consumer cannot `import type { FontFamily }` to check it themselves; they can only trust the docs table
- Repro: `https://beeui.beemvp.com/docs/components/text/#textprops`; `grep 'FontFamily\|NumericVariant' node_modules/@beemvp/beeui-ui/dist/typescript/module/index.d.ts` -> no match
- Workaround: use the literal values shown in the docs table (`'mono'`, `'tabular'`) directly
- Suggested fix for BeeUI: either export `FontFamily`/`NumericVariant` from the package index, or inline the literal union in the docs table instead of the internal type alias name

### 07A-08 · `SelectContentProps.maxHeight` default (320) is undocumented
- Area: docs-public
- Severity: nit
- Source consulted: `node_modules/@beemvp/beeui-ui/dist/typescript/module/components/select.d.ts`
- Expected: `maxHeight` row shows a default of `320`
- Actual: shows "—" on `https://beeui.beemvp.com/docs/components/select/#selectcontentprops`
- Workaround: none needed
- Suggested fix for BeeUI: same doc-generator gap as 07A-01/02/03

### 07A-09 · npm `dist-tags.latest` already equals `dist-tags.next`, contradicting /docs/start/'s "opt-in `@next`" framing
- Area: docs-public
- Severity: minor
- Source consulted: `npm view @beemvp/beeui-ui dist-tags` -> `{"next":"0.86.2-rc.1","latest":"0.86.2-rc.1"}`
- Expected (per docs): "Stable `latest` is not promoted yet, so every release-candidate install should use `@next`" (`/docs/start/`) implies an unqualified `npm install @beemvp/beeui-ui` would NOT resolve the current prerelease
- Actual: it already does — `latest` and `next` are the same version right now
- Repro: `npm view @beemvp/beeui-ui dist-tags --json`
- Workaround: keep using `@next` explicitly regardless (harmless, and correct once `latest` is eventually promoted to a real stable release)
- Suggested fix for BeeUI: either promote a real stable `latest` distinct from the RC, or soften the docs' framing to "there is currently no dedicated stable release; both `latest` and `next` resolve the same prerelease." Related to already-filed #561 (matrix row A013).

## Summary

- Props-accuracy: 62/62 components checked, 137 props-bearing types, 38 real diffs after removing tooling false-positives (see `docs/beeui-audit/props-accuracy.md` methodology notes): 3 missing-in-docs, 0 extra-in-docs, 2 type-mismatch, 30 default-mismatch, 3 required-mismatch.
- Behavior-claims: 80 claims total (72 executed via Jest + react-test-renderer against the installed package, 8 marked `untested-needs-browser` for Worker B — Select/Dialog/AlertDialog/Sheet/Toast, which need the real anchored-overlay/portal/gesture runtime this harness stubs out). All 72 executed claims **hold** — no behavioral contradictions found between the docs' "State and behavior contract" sections and the installed package's actual runtime logic for the components checked.
- Matrix reality verdicts (501/501 rows): both-right 214, docs-right 110, both-wrong 115 (almost entirely the pre-existing 115 broken llms*.txt link targets, category H), llms-right 4, reality-unknown 58 (Architecture/ADR + Accessibility-contract categories, and untested Setup-instruction presence checks — no independent public source to check them against beyond the two documents already being compared).
