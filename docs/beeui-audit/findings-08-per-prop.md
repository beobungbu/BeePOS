# Phase 08 findings: per-prop, per-value executable verification

Reality source: the installed `@beemvp/beeui-ui@0.86.2-rc.1` npm package, exercised through
`react-test-renderer` (scripts/audit/props/test-driver.tsx) — not source read from `~/workspace/BeeUI`.

## Fails (docs promise something the installed package does not do)

### 08-01 · Text.numeric
- Area: component-behavior
- Severity: major
- Source consulted: https://beeui.beemvp.com/docs/components/text/
- Docs description: "'tabular' opts numeric content into equal-width figures so columns of amounts/KPIs/timers align. Omit for normal proportional figures."
- Observed: an undocumented (non-TypeScript-valid) literal value crashes at render: numericVariantFontVariants[numeric] is not iterable

## Docs too vague to test

A documented prop whose description could not be turned into any assertion beyond "renders without
throwing" — either empty/near-empty, or an identical boilerplate sentence repeated across 5+ unrelated
components (BeeUI's docs-generator template text, not a component-specific behavioral claim).

3 props (of 570 modelled).

| Component | Prop | Reason | Description |
|---|---|---|---|
| TableCell.TableCellProps | columnIndex | empty | (empty) |
| TableHead.TableHeadProps | columnIndex | empty | (empty) |
| BeeThemeScope.BeeThemeScopeProps | theme | empty | (empty) |

## Corroboration of already-filed findings (#579 required-mismatch, #580 default-undocumented)

Phase 07 (`props-accuracy.json`) found these statically from the .d.ts/docs tables; this pass adds
*dynamic* evidence — what the installed package actually does at render time — for the same props.

| Component | Prop | Phase 07 classification | Phase 08 dynamic evidence |
|---|---|---|---|
| AlertDialogAction.AlertDialogActionProps | loading | default-mismatch | curated accessibility/prop check confirmed loading=true \| curated accessibility/prop check confirmed loading=false |
| AlertDialogCancel.AlertDialogCancelProps | loading | default-mismatch | curated accessibility/prop check confirmed loading=true \| curated accessibility/prop check confirmed loading=false |
| AlertDialogTrigger.AlertDialogTriggerProps | loading | default-mismatch | curated accessibility/prop check confirmed loading=true \| curated accessibility/prop check confirmed loading=false |
| Breadcrumb.BreadcrumbProps | separator | default-mismatch | sentinel node is mounted in the rendered tree |
| Calendar.CalendarProps | locale | default-mismatch | native prop `locale` passthrough === "fx-sentinel-locale" |
| DatePicker.DatePickerProps | clearAccessibilityLabel | default-mismatch | native prop `clearAccessibilityLabel` passthrough === "fx-sentinel-clearAccessibilityLabel" |
| DatePicker.DatePickerProps | locale | default-mismatch | native prop `locale` passthrough === "fx-sentinel-locale" |
| DatePicker.DatePickerProps | nextMonthAccessibilityLabel | default-mismatch | native prop `nextMonthAccessibilityLabel` passthrough === "fx-sentinel-nextMonthAccessibilityLabel" |
| DatePicker.DatePickerProps | placeholder | default-mismatch | native prop `placeholder` passthrough === "fx-sentinel-placeholder" |
| DatePicker.DatePickerProps | previousMonthAccessibilityLabel | default-mismatch | native prop `previousMonthAccessibilityLabel` passthrough === "fx-sentinel-previousMonthAccessibilityLabel" |
| DateTimePicker.DateTimePickerProps | clearAccessibilityLabel | default-mismatch | native prop `clearAccessibilityLabel` passthrough === "fx-sentinel-clearAccessibilityLabel" |
| DateTimePicker.DateTimePickerProps | hourAccessibilityLabel | default-mismatch | native prop `hourAccessibilityLabel` passthrough === "fx-sentinel-hourAccessibilityLabel" |
| DateTimePicker.DateTimePickerProps | locale | default-mismatch | native prop `locale` passthrough === "fx-sentinel-locale" |
| DateTimePicker.DateTimePickerProps | minuteAccessibilityLabel | default-mismatch | native prop `minuteAccessibilityLabel` passthrough === "fx-sentinel-minuteAccessibilityLabel" |
| DateTimePicker.DateTimePickerProps | nextMonthAccessibilityLabel | default-mismatch | native prop `nextMonthAccessibilityLabel` passthrough === "fx-sentinel-nextMonthAccessibilityLabel" |
| DateTimePicker.DateTimePickerProps | periodAccessibilityLabel | default-mismatch | native prop `periodAccessibilityLabel` passthrough === "fx-sentinel-periodAccessibilityLabel" |
| DateTimePicker.DateTimePickerProps | placeholder | default-mismatch | native prop `placeholder` passthrough === "fx-sentinel-placeholder" |
| DateTimePicker.DateTimePickerProps | previousMonthAccessibilityLabel | default-mismatch | native prop `previousMonthAccessibilityLabel` passthrough === "fx-sentinel-previousMonthAccessibilityLabel" |
| DialogClose.DialogCloseProps | loading | default-mismatch | curated accessibility/prop check confirmed loading=true \| curated accessibility/prop check confirmed loading=false |
| DialogTrigger.DialogTriggerProps | loading | default-mismatch | curated accessibility/prop check confirmed loading=true \| curated accessibility/prop check confirmed loading=false |
| DropdownMenuTrigger.DropdownMenuTriggerProps | loading | default-mismatch | curated accessibility/prop check confirmed loading=true \| curated accessibility/prop check confirmed loading=false |
| Input.InputProps | disabled | default-mismatch | curated accessibility/prop check confirmed disabled=true \| curated accessibility/prop check confirmed disabled=false |
| Input.InputProps | invalid | default-mismatch | rendered tree differs from the opposite boolean value (structural evidence of an effect) \| rendered tree differs from the opposite boolean value (structural evidence of an effect) |
| PaginationItem.PaginationItemProps | page | required-mismatch | native prop `page` passthrough === 12345 \| omitting this documented-required prop renders with no thrown error and no dev warning (runtime-optional in practice) |
| PopoverClose.PopoverCloseProps | loading | default-mismatch | curated accessibility/prop check confirmed loading=true \| curated accessibility/prop check confirmed loading=false |
| PopoverTrigger.PopoverTriggerProps | loading | default-mismatch | curated accessibility/prop check confirmed loading=true \| curated accessibility/prop check confirmed loading=false |
| SelectContent.SelectContentProps | maxHeight | default-mismatch | native prop `maxHeight` passthrough === 12345 |
| SheetClose.SheetCloseProps | loading | default-mismatch | curated accessibility/prop check confirmed loading=true \| curated accessibility/prop check confirmed loading=false |
| SheetTrigger.SheetTriggerProps | loading | default-mismatch | curated accessibility/prop check confirmed loading=true \| curated accessibility/prop check confirmed loading=false |
| TableCell.TableCellProps | columnIndex | missing-in-docs | rendered without throwing; sentinel value not found verbatim in the rendered tree |
| TableHead.TableHeadProps | columnIndex | missing-in-docs | rendered without throwing; sentinel value not found verbatim in the rendered tree |
| Text.TextProps | family | type-mismatch | native prop `family` passthrough === "mono" |
| Text.TextProps | numeric | type-mismatch | an undocumented (non-TypeScript-valid) literal value crashes at render: numericVariantFontVariants[numeric] is not iterable |
| BeeThemeScope.BeeThemeScopeProps | appearance | required-mismatch | omitting this documented-required prop renders with no thrown error and no dev warning (runtime-optional in practice) |
| BeeThemeScope.BeeThemeScopeProps | brand | required-mismatch | omitting this documented-required prop renders with no thrown error and no dev warning (runtime-optional in practice) |
| BeeThemeScope.BeeThemeScopeProps | registry | default-mismatch | object/other-kind prop (ThemeRegistry<{ readonly bee: { readonly light: "light"; readonly dark: "dark"; }; readonly violet: { readonly light: "violet-light"; readonly dark: "violet-dark"; }; }> \| undefined); rendered without throwing, no generic checkable effect for this kind |
| BeeThemeScope.BeeThemeScopeProps | theme | missing-in-docs | object/other-kind prop (RegistryRuntimeTheme<{ readonly bee: { readonly light: "light"; readonly dark: "dark"; }; readonly violet: { readonly light: "violet-light"; readonly dark: "violet-dark"; }; }> \| undefined); rendered without throwing, no generic checkable effect for this kind |
| TooltipTrigger.TooltipTriggerProps | loading | default-mismatch | curated accessibility/prop check confirmed loading=true \| curated accessibility/prop check confirmed loading=false |

## Coverage caveats (renders-only, honestly)

`renders-only` means the harness rendered the prop under test without throwing but found no
generically-derivable evidence (a `cva` class-set match, a native-prop passthrough, a mounted sentinel,
a curated accessibility-state check, or a structural difference from the opposite boolean value) that
the documented effect actually occurred. It is not a claim that the prop is broken — most commonly it
is a `cva` variant value defined through a shared constant (e.g. `size: semanticTypographyClasses.label`
in button.tsx) rather than a literal class string the oracle can compare against, or an internal
positioning/behavior flag (e.g. Popover/Select/Tooltip's `direction`/`align`/`collisionPadding`/`flip`/
`shift`) consumed by internal layout math with no observable prop/class/accessibility reflection under
`react-test-renderer`.
