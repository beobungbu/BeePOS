# Findings 14 · Restyle 2A, foundation (icons, shell, auth, multi-cart) · 2026-09-12

Context: phase 2A of the design pass builds the icon layer, the responsive shell (bottom tabs
/ rail / sidebar), the login and select-store screens, and the multi-order cart store. Public
sources only: <https://beeui.beemvp.com/docs/> and `@beemvp/beeui-*@0.86.2-rc.1`.

### 14-02 · `OTPInput` cannot produce the segmented PIN the design calls for
- Area: gap
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/components/otp-input/>
- Expected (per the BeePOS design direction section 7 and the login mockup): a 4 cell PIN
  entry, one box per digit, focus ring on the cell being typed.
- Actual: the family renders one text field. The docs say so plainly, so this is a feature
  gap, not a documentation defect: "One text field, not one box per digit: there is no
  per-character slot, caret or focus movement, so a segmented OTP appearance has to be built
  by the caller."
- Repro: `<OTPInput length={4} secureTextEntry />` renders a single bordered input with
  letter spacing.
- Workaround: BeePOS ships the single field for now. It keeps the numeric keyboard, the
  `length`/`onComplete` contract and the `Field` label binding the e2e suite relies on, and it
  is honest about what the component is. Building four fake cells over a hidden input would
  duplicate caret and focus behaviour the family owns.
- Suggested fix for BeeUI: an opt-in `cells` (or `appearance="segmented"`) prop that renders
  `length` boxes over the same single input, keeping one caret and one value. Every design
  system that ships an OTP input ships this appearance; without it the component solves the
  parsing half of the problem and none of the visual half.

### 14-03 · `Switch` logs a Uniwind accent warning on web
- Area: web-runtime
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/components/switch/> ("Track and thumb
  colors come from tokens and cannot be set per instance")
- Expected: rendering `<Switch value onValueChange />` with no `className` produces no console
  output.
- Actual: every mount logs twice, from inside the family (the app passes no `accent-*` class):
  `Uniwind - className 'accent-muted-foreground' was provided to extract accentColor but no
  color was found. Make sure the className includes a color utility (e.g. 'accent-red-500').`
- Repro: `<Switch value={true} onValueChange={() => {}} />` on web, watch the console.
- Workaround: none needed; it is noise, not a failure. BeePOS's e2e suite asserts zero console
  *errors*, so a warning does not fail the gate, but it now sits in every run's warning list.
- Suggested fix for BeeUI: the family passes `accent-muted-foreground` to Uniwind's accent
  extractor, which resolves semantic token classes to nothing. Either map the token to a real
  colour before handing it over, or stop routing the track colour through `accent-*`.

### 14-04 · `DropdownMenuTrigger` is a full `Button`, so an avatar trigger inherits button chrome
- Area: api-types
- Severity: nit
- Source consulted: `@beemvp/beeui-ui` types, `DropdownMenuTriggerProps = ButtonProps`
- Expected: wrapping an `Avatar` in a trigger yields a bare pressable region.
- Actual: the trigger renders the default `Button` variant, so the avatar arrives inside a
  bordered, padded, primary-tinted button and the composed header control reads as a button
  with a picture in it.
- Repro: `<DropdownMenuTrigger accessibilityLabel="..."><Avatar fallback="VG" /></DropdownMenuTrigger>`
- Workaround: `variant="ghost"` plus `className="p-0"`, which the type allows because it is a
  `ButtonProps`.
- Suggested fix for BeeUI: say so on the dropdown-menu page. One line ("the trigger is a
  `Button`; use `variant=\"ghost\"` for icon or avatar triggers") removes the surprise.

### Not filed (checked and rejected)
- `accessible={false}` on a lucide icon reaches the DOM as a non-boolean `accessible`
  attribute on web and React rejects it. That is `react-native-svg` prop forwarding, not
  BeeUI; the app guards it with `Platform.OS === 'web' ? { 'aria-hidden': true } : ...` in
  `src/components/icons.tsx`.
- `useBeeToken('colors.<token>')` did exactly what its documentation promises for SVG stroke
  colours. No finding.
- `AppHeader` accepted a composed `title` node, a `leading` mark and a `trailing` cluster with
  no fighting; `min-h-14` overrode its default `min-h-16` cleanly. No finding.
