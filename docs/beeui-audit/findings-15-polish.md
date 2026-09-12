# Findings 15 · polish pass (BeePOS phase 3)

Worker: phase 3 polish · 2026-09-12 · app `@beemvp/beeui-*@0.86.2-rc.1`, Expo SDK 57 web.
Protocol: `docs/beeui-audit/protocol.md`. Ids continue the 14-xx block used by the restyle.

### 15-01 · `SafeArea` silently drops the padding it is given in `className`
- Area: web-runtime
- Severity: major
- Source consulted: <https://beeui.beemvp.com/docs/components/safe-area/> ("`className`: Extra
  utility classes, merged after the component's own via `cn(...)`, so they win on conflict",
  and "SafeArea is a pass-through to react-native-safe-area-context's own view").
- Expected (per docs): `<SafeArea className="px-4 py-6">` pads the surface by 16 and 24.
- Actual: the element renders with `padding-left: 0px` and `padding-right: 0px` on web. The
  pass-through view writes the inset padding as an inline style, and an inline style beats the
  class the utility generated, so a page gutter written this way is a silent no-op. On a phone
  browser every inset is 0, so the content sits flush against both screen edges.
- Repro: `<SafeArea className="flex-1 items-center justify-center px-4 py-6" edges={['top','bottom','left','right']}>`
  then read `getComputedStyle(el).paddingLeft` for that element: `0px`.
  Measured on `/login` at 375 pt: the store-code field spanned x=0 to x=375.
- Workaround: keep `SafeArea` for insets only and put the page gutter on a `View` inside it
  (`src/features/auth/auth-layout.tsx`). The field now starts at x=16 with 16 pt on both sides.
- Suggested fix for BeeUI: add the caller's padding to the inset padding instead of letting the
  inline inset style win, or document plainly that padding belongs on a child view.

### 15-02 · The documented type-scale tokens are not usable as `text-<step>` classes
- Area: web-runtime (also `docs-public`)
- Severity: major
- Source consulted: <https://beeui.beemvp.com/docs/reference/tokens/> and
  `@beemvp/beeui-tokens/theme.css`, which declares `--text-caption: 0.75rem`,
  `--text-label: 0.875rem`, `--text-heading: 1.125rem`, `--text-title: 1.5rem` inside `@theme`;
  <https://beeui.beemvp.com/docs/components/text/> ("Extra utility classes, merged after the
  component's own via `cn(...)`, so they win on conflict").
- Expected (per docs): `className="text-caption"` on `Text` sets 12 / 16 and wins over the
  component's `variant` default.
- Actual: `text-caption`, `text-label`, `text-heading` and `text-title` generate no CSS at all.
  The class reaches the DOM and the element still computes to the variant's size. BeeUI's own
  components do not use these names either: they emit the arbitrary form
  `text-[length:var(--text-body)] leading-[var(--text-body--line-height)]`. Where the app also
  passes a colour class, the `cn()` merge additionally treats `text-caption` as a colour and
  drops it, so the class is not even in the DOM.
- Repro: `<Text className="text-heading font-bold">NN</Text>` renders
  `class="... text-[length:var(--text-body)] ... text-heading font-bold"` with
  `font-size: 16px`; `<Text className="text-title font-bold text-foreground">BeePOS</Text>`
  renders without `text-title` at all, also 16px. `text-xs` (a built-in Tailwind step) works.
- Impact on this app: the whole five-step scale of `docs/design/design-direction.md` section 4
  is written as `text-caption` / `text-label` / `text-heading` / `text-title` across phase 2,
  so every one of those screens has been rendering at body size (16 / 24). It is why the 3
  column phone tile overlapped its own caption: the name box was sized for 2 x 16 while the
  name drew at 2 x 24.
- Workaround: use the `variant` prop on BeeUI `Text` (`variant="caption"`, measured 12 / 16),
  and the arbitrary-value form BeeUI itself emits where a plain RN `Text` is unavoidable. Applied here to the product tile, the stock badge, the 40 pt
  thumbnail, the cart line, the app header and the report period chips. The rest of the tree
  still writes the scale as classes; the phase 3 report lists it as follow-up.
- Suggested fix for BeeUI: ship the named utilities (`text-caption` and friends) from the token
  layer so the documented names work, or state in the tokens and Text docs that the scale is
  reachable only through `variant` and the arbitrary-value form that BeeUI itself emits.

### 15-03 · One invalid utility candidate anywhere in the project fails the whole export
- Area: web-runtime (Uniwind / Tailwind pipeline that BeeUI's styling depends on)
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/theming/>, `global.css`
  (`@import 'uniwind'` plus `@source` on the two BeeUI packages).
- Expected: a string that merely looks like a utility, in a file that is not app source (a
  markdown note in `docs/`), is ignored by the scanner.
- Actual: writing this findings file with a wildcard inside an arbitrary value
  (`text-` + `[length:var(--text-` + `*)]`) made `npx expo export --platform all` fail with
  `SyntaxError: SyntaxError in global.css: Unexpected token Delim('*')`. The message names
  `global.css`, which is six clean `@import` and `@source` lines, and never names the file that
  produced the candidate. Deleting that one line from the markdown fixed the export.
- Repro: put that literal in any `.md` under the project root, run `npx expo export`.
- Workaround: never write a wildcard inside a bracketed utility in any file under the project,
  documentation included.
- Suggested fix for BeeUI / Uniwind: skip candidates that do not parse instead of failing the
  build, and name the source file in the error.
