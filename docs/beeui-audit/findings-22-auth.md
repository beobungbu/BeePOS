# BeeUI findings · phase 6 W-A (auth, tenant, permissions)

Screens built: login (email + password), store picker, register picker, lock screen with PIN
pad, change password, forgot password, onboarding wizard, staff invite dialog, permission
matrix. Components exercised: `PasswordInput`, `OTPInput`, `Stepper`/`StepperItem`,
`SegmentedControl`/`SegmentedControlItem`, `Switch`, `Field`, `FormGroup`, `Dialog`, `Table`,
`ListGroup`/`ListItem`, `Badge`, `Avatar`, `useToast`.

### 22-01 · PasswordInput renders a hardcoded English "Show" / "Hide"
- Area: a11y
- Severity: major
- Source consulted: <https://beeui.beemvp.com/docs/components/password-input/>
- Expected (per docs): `showLabel` / `hideLabel` localize the reveal toggle.
- Actual: they change only the accessible name. The docs say it outright: "the toggle's visible
  text is a hardcoded English Show/Hide inside a fixed-width button". A Vietnamese-first product
  therefore ships an English word on its login screen, and the word cannot be translated at all.
- Repro: `<Field label="Mật khẩu"><PasswordInput showLabel="Hiện mật khẩu" /></Field>` on a `vi`
  build renders "Show" beside the field.
- Workaround: both labels are passed for screen readers and the English visible text is accepted
  for now; the alternative was `Input secureTextEntry` plus a hand-rolled toggle, which loses the
  component's focus and masking behaviour.
- Suggested fix for BeeUI: render `showLabel` / `hideLabel` as the visible text (the button is
  already fixed width, so it can take a `labelClassName` and shrink), or ship an icon-only
  variant, which is what a localized app actually needs.

### 22-02 · Stepper's 1-based numbering lives only in the prose, and a 0 clamps silently
- Area: api-types
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/components/stepper/>
- Expected (per types): `currentStep: number`, `step: number` say nothing about the base, so a
  0-based array index is the obvious thing to pass.
- Actual: both are 1-based; `currentStep` is "clamped to [1, number of items]", so passing 0
  renders exactly the same as passing 1. The wrong integration is invisible: step 1 and step 2
  both look like step 1 until someone reads the prose.
- Repro: `<Stepper currentStep={0}><StepperItem step={0} title="A" /></Stepper>`.
- Workaround: `currentStep={index + 1}` and `step={index + 1}`.
- Suggested fix for BeeUI: say "1-based" in the JSDoc that reaches the `.d.ts`, and warn in dev
  when a `StepperItem` `step` is below 1 rather than clamping in silence.

### 22-03 · SegmentedControlItem takes children while Radio and Checkbox take `label`
- Area: api-types
- Severity: nit
- Source consulted: <https://beeui.beemvp.com/docs/components/segmented-control/>
- Expected: the same shape as the other selection controls in the library, which are
  `<Radio label="..." value="..." />` and `<Checkbox label="..." />`.
- Actual: `SegmentedControlItem` has `labelClassName` but no `label`; the text goes in children.
  Reaching for `label` first costs a type error and a lookup.
- Repro: `<SegmentedControlItem value="cashier" label="Thu ngân" />` fails to compile.
- Workaround: pass the text as children.
- Suggested fix for BeeUI: accept `label` as an alias for a string child, or drop
  `labelClassName` in favour of styling the child, so the two never look like a matched pair
  that is missing its half.

### 22-04 · No `Toast` export beside `useToast` and `ToastId`
- Area: api-types
- Severity: nit
- Source consulted: `@beemvp/beeui-ui@0.86.2-rc.1` type surface, <https://beeui.beemvp.com/llms-components.txt>
- Expected: a `Toast` type to annotate a helper that builds toast options.
- Actual: the package exports `ToastId` and `useToast` but no `Toast` (the editor suggests
  `ToastId`), so a shared "show this toast" helper has to infer its argument type.
- Repro: `import { Toast } from '@beemvp/beeui-ui'` → TS2724.
- Workaround: inline the `toast.show({...})` call at each site.
- Suggested fix for BeeUI: export the options type (`ToastOptions`) so callers can build one.

### 22-05 · Stepper is vertical only, with no orientation prop
- Area: gap
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/components/stepper/>
- Expected: an orientation choice. A three step wizard inside a 480 pt auth card wants the
  horizontal form the mockup drew (`1 Chuỗi — 2 Cửa hàng — 3 Tài khoản` on one line); vertical
  costs about 120 pt of the card before the first field.
- Actual: `Stepper` has `children`, `className`, `currentStep`, `disabled`, `onStepChange` and
  nothing about layout; it always stacks.
- Repro: `<Stepper currentStep={1}><StepperItem step={1} title="Chuỗi" /> ...</Stepper>` in a
  480 pt column.
- Workaround: kept vertical, the step names read fine and the wizard scrolls.
- Suggested fix for BeeUI: an `orientation="horizontal" | "vertical"` prop, with the horizontal
  form dropping `description` and showing the numbers plus connectors only.

### 22-06 · A disabled Switch looks the same on and off
- Area: a11y
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/components/switch/>, built screen at 375
- Expected: a read-only switch still reads as on or off at a glance.
- Actual: with `disabled`, both states are the same pale grey track and the only difference is
  the knob sitting left or right; no colour, and the contrast between knob and track is low. On
  the phone permission list ("Bán hàng tại quầy" allowed above "Hoàn tiền" denied) the two rows
  are hard to tell apart at arm's length.
- Repro: `<Switch value disabled />` beside `<Switch value={false} disabled />`.
- Workaround: the row carries the word ("Được phép" / "Không được phép") as its description and
  in the switch's accessible name, so the state never rests on the knob alone.
- Suggested fix for BeeUI: keep the on-state token (at a reduced opacity) when a switch is
  disabled, the way a disabled checked checkbox keeps its tick.
