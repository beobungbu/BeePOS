# BeeUI audit findings — Phase 04 (reports, stores, staff, settings)

Consumed via https://beeui.beemvp.com, its `llms*.txt` files, the per-component docs pages
(`/docs/components/<name>/`), and the installed npm package `@beemvp/beeui-*@0.86.2-rc.1`'s own
shipped `.d.ts` files. `~/workspace/BeeUI` was never opened during this phase.

### 04-01 · `DatePicker` cannot implement the spec's "two DatePickers" custom range picker on web
- Area: docs-public
- Severity: minor
- Source consulted: https://beeui.beemvp.com/llms-components.txt ("Platform behavior" section, ADR-008 reference)
- Expected (per phase spec): the phase-04 spec text says the custom period option should use "two `DatePicker`s".
- Actual: `llms-components.txt` itself documents (accurately, and clearly, unlike the components-page-linking gap found in phase 0) that `DatePicker`/`DateTimePicker` ship **only** as `*.native.tsx` — no `date-picker.web.tsx` exists, so on web they render nothing usable. The doc explicitly says to use `Calendar` (cross-platform) for web date selection instead (ADR-008).
- Repro: `import { DatePicker } from '@beemvp/beeui-ui'` and render it under `expo start --web` — no native picker module exists for web.
- Workaround: Built the reports custom-period picker with `Popover` + `Calendar` (two poppers, "Từ ngày"/"Đến ngày") instead of `DatePicker`, per `src/features/reports/components/period-filter.tsx`. This is the doc's own documented cross-platform pattern, not a guess.
- Suggested fix for BeeUI: none needed here — this is a case where the AI-facing doc entry point *did* carry the right information up front. Noting it because the phase spec (written before this was checked) assumed `DatePicker` works everywhere.

### 04-02 · Density guide is real and functional, not a gap
- Area: docs-public
- Severity: nit
- Source consulted: https://beeui.beemvp.com/docs/guides/density/
- Expected (per phase spec): "density `Select` compact/comfortable if BeeUI tokens expose density ... else log gap".
- Actual: Density is fully implemented and documented: `applyDensity(Uniwind, theme, mode)` from `@beemvp/beeui-tokens`, three modes (`compact`/`comfortable`/`spacious`), affecting `rowHeight`/`rowGap`/`formGap` only. Wired it in `src/features/settings/hooks/use-density-sync.ts`; `npx tsc --noEmit` and `npx expo export --platform web` both pass with the import, and the Select control works at runtime (see `docs/screenshots/phase-04-settings-*`).
- Repro: `import { applyDensity, type DensityMode } from '@beemvp/beeui-tokens'` typechecks and runs.
- Workaround: none needed.
- Suggested fix for BeeUI: none; documenting so future phase-N workers don't re-verify this from scratch.

### 04-03 · `Field` does not wire accessible-label relationships to `Switch`/`Checkbox`/`Radio`
- Area: a11y
- Severity: minor
- Source consulted: https://beeui.beemvp.com/docs/components/field/ ("wires accessible label/required/error relationships only to a wrapped text-entry control ... never to checkbox/radio/switch, which label themselves explicitly")
- Expected: wrapping a `Switch` in `Field label="Hiển thị logo trên hoá đơn"` visually places a label next to the control (as shown in the doc's own `component-gallery.tsx` "Notifications" example, `<Box><Text>Notifications</Text><Switch .../></Box>`, which does NOT use `Field` for this reason).
- Actual: no accessibility (`aria-labelledby`/`accessibilityLabelledBy`) relationship is created between `Field`'s label and a `Switch` child; the doc explicitly says so and the gallery's own switch example avoids `Field` for this reason.
- Repro: `<Field label="X"><Switch .../></Field>`, inspect the rendered `Switch`'s accessible name via devtools — it comes only from an explicit `accessibilityLabel` prop, not from `Field`.
- Workaround: passed `accessibilityLabel` explicitly on every `Switch` (receipt "Hiển thị logo", staff "Đang làm việc") instead of relying on `Field`'s label wiring.
- Suggested fix for BeeUI: either wire `Field`'s `labelNativeID` through to any child, or add a one-line callout on the `Field` doc page's "Do it" section warning against `<Field><Switch/></Field>` composition (currently only mentioned in the prose "Limitations", easy to miss).

### 04-04 · No plain non-interactive tag/chip component; `ChipGroup` repurposed with `disabled`
- Area: gap
- Severity: minor
- Source consulted: https://beeui.beemvp.com/docs/components/chip/
- Expected: a simple read-only "tag list" (e.g. showing which stores a staff member is assigned to, in the `/staff` list) without selection semantics.
- Actual: `Chip`/`ChipGroup` is the only tag-shaped primitive, and it always carries `radio`/`checkbox`/`radiogroup` accessibility roles per its own docs ("Roles this family assigns: button, checkbox, radio, radiogroup"). There is no plain `Tag`/`Label` chip variant.
- Repro: any static list of small pill-shaped labels needs either `Chip`/`ChipGroup` (wrong semantics for read-only display) or a hand-rolled `Badge`-based composite.
- Workaround: used `ChipGroup selectionMode="multiple" value={member.storeIds} disabled` in `src/features/staff/staff-list-screen.tsx` to render each staff member's assigned stores as static pills. This still exposes `checkbox`/`radiogroup` a11y roles on what is visually a read-only tag list — an accepted trade-off, logged here rather than hidden.
- Suggested fix for BeeUI: add a `variant="static"` (or similar) to `Chip`/`ChipGroup` that drops the selection-control accessibility roles for exactly this read-only-tag use case, or document `Badge` explicitly as the recommended read-only alternative.

### 04-05 · `FormGroup`'s legend/error/disabled context only reaches `RadioGroup`, not `Checkbox` lists
- Area: a11y
- Severity: minor
- Source consulted: https://beeui.beemvp.com/docs/components/form-group/ ("RadioGroup is the only component in the package that reads this group's context ... a checkbox, switch or input nested in a form group is unaffected and has to be wired by hand")
- Expected: the phase spec's "stores multi-select via `Checkbox` list inside `FormGroup`" implies `FormGroup`'s `required`/`invalid`/`legend` wiring would reach the `Checkbox` list the way it reaches `RadioGroup`.
- Actual: confirmed via the doc's own limitations note — only `RadioGroup` consumes `FormGroup`'s context. The `Checkbox` list in `src/features/staff/components/staff-form-fields.tsx` (store assignment) gets `FormGroup`'s visible legend/error text, but no accessibility relationship links the checkboxes to that legend/error.
- Repro: `<FormGroup legend="X" invalid error="Y"><Checkbox label="a" .../><Checkbox label="b" .../></FormGroup>`, inspect a11y tree — no `accessibilityLabelledBy` on the checkboxes.
- Workaround: none applied beyond what the doc itself recommends (visual-only wiring is the documented contract, not a bug); logging so the next Checkbox-in-FormGroup consumer does not assume the RadioGroup behavior extends further.
- Suggested fix for BeeUI: extend the `form-group-context` consumption to `Checkbox`/`Switch` alongside `RadioGroup`, or state the RadioGroup-only scope in the FormGroup page's opening summary (currently only in "Limitations", after several paragraphs).

### 04-06 · `SettingsItem` inside `ListGroup` composed with a controlled `AlertDialog`, not a nested `AlertDialogTrigger`
- Area: component-behavior
- Severity: nit
- Source consulted: docs/beeui-audit/findings-00-scaffold.md finding 00-05 (nested-pressable hydration warning from `IconButton` inside `DropdownMenuTrigger`)
- Expected: n/a — this is a preventive application of a phase-0 finding, not a new bug report.
- Actual: `SettingsItem`'s `onPress` and `AlertDialogTrigger` are both full pressables (`ListItem`/`SettingsItem` render a `button` role on web per its own a11y section; `AlertDialogTrigger` is `ButtonProps`-based). Nesting one inside the other's row would very likely reproduce 00-05's nested-`<button>` hydration warning, so it was avoided rather than reproduced.
- Repro: not reproduced (avoided by design) — see `src/features/settings/components/logout-section.tsx`, which drives a `<AlertDialog open={open} onOpenChange={setOpen}>` from `SettingsItem`'s own `onPress`, with no `AlertDialogTrigger` child.
- Workaround: controlled `AlertDialog` (`open`/`onOpenChange` state owned by the screen) instead of an inline `AlertDialogTrigger`.
- Suggested fix for BeeUI: same as 00-05's original suggestion — ship one composition example for "list row that opens a confirm dialog" so this isn't left to each consumer to work out from first principles.

### 04-07 · `OTPInput`'s documented `onChange` shape (finding 00-05) confirmed working for a second, independent use (PIN reset, two fields)
- Area: component-behavior
- Severity: nit
- Source consulted: https://beeui.beemvp.com/docs/components/otp-input/, docs/beeui-audit/findings-00-scaffold.md finding 00-05
- Expected/Actual: matches — `onChange={(e) => setValue(e.nativeEvent.text)}` worked for both PIN fields in `src/features/staff/components/reset-pin-dialog.tsx` (new PIN + confirm PIN), including on web, with zero console errors/warnings in a full Playwright run of open dialog -> fill both -> confirm -> toast -> close.
- Repro/Workaround: n/a, confirmation only.
- Suggested fix for BeeUI: none; recording as positive confirmation evidence per the audit protocol ("log every friction point... even small things").

## Cross-phase note (not a BeeUI finding)

The phase-04 spec suggested the settings receipt preview "reuse the receipt component from
`src/features/pos` if exported". `src/features/pos` was being actively edited by a parallel
phase-1 worker for the entire duration of this phase, so importing from it would have created
an unreviewable, unstable coupling point across two in-flight workers. Built a small local,
self-contained `ReceiptPreview` in `src/features/settings/components/receipt-preview.tsx`
instead (documented in that file's header comment). Revisit in phase 5 (QA/publish) once both
phases are stable, if a shared receipt-preview primitive is wanted.
