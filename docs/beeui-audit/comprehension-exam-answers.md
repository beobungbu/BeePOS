# BeeUI Comprehension Exam - Fresh Reader Answers

**Date:** 2026-09-11
**Role:** React Native developer, no prior BeeUI knowledge, answering from public docs only.

## Rules followed

- Read only these URL families on `https://beeui.beemvp.com`: `/docs/learn/**`, `/docs/guides/**`, `/docs/theming/`, `/docs/accessibility/**`, `/docs/reference/**`.
- Did not open `/docs/components/**`, `/docs/start/**`, `/docs/patterns/**`, any `llms*.txt`, GitHub, npm, or any local file other than this output file.
- Fetched every page with `curl -sS URL | sed 's/<[^>]*>/ /g' | tr -s ' \n'`; content read after the second "Select theme Dark Light Auto" marker (sidebar repeats on every page).
- URL list obtained from `https://beeui.beemvp.com/docs/sitemap-0.xml`, filtered to the allowed families.
- No subagents were used. No prior knowledge about BeeUI was used; every answer is grounded in a quoted sentence from a fetched page. Where a page did not answer a question, that is stated as "not found" with the pages checked.
- Time-boxed to roughly 90 minutes of work.

## Total minutes spent

Approximately 70 minutes (sitemap retrieval, fetching 31 pages, reading, cross-referencing, and writing this file).

## Every URL opened (31 pages)

- https://beeui.beemvp.com/docs/sitemap-0.xml (index only, to build the URL list)
- https://beeui.beemvp.com/docs/learn/
- https://beeui.beemvp.com/docs/learn/accessibility-model/
- https://beeui.beemvp.com/docs/learn/composition-model/
- https://beeui.beemvp.com/docs/learn/cross-platform-model/
- https://beeui.beemvp.com/docs/learn/forms-model/
- https://beeui.beemvp.com/docs/learn/foundations/
- https://beeui.beemvp.com/docs/learn/overlays-and-runtime/
- https://beeui.beemvp.com/docs/learn/ownership-model/
- https://beeui.beemvp.com/docs/learn/responsive-model/
- https://beeui.beemvp.com/docs/learn/state-model/
- https://beeui.beemvp.com/docs/guides/
- https://beeui.beemvp.com/docs/guides/branding/
- https://beeui.beemvp.com/docs/guides/cli-source-ownership/
- https://beeui.beemvp.com/docs/guides/current-release/
- https://beeui.beemvp.com/docs/guides/date-time/
- https://beeui.beemvp.com/docs/guides/density/
- https://beeui.beemvp.com/docs/guides/migration-versioning/
- https://beeui.beemvp.com/docs/guides/table/
- https://beeui.beemvp.com/docs/guides/troubleshooting/
- https://beeui.beemvp.com/docs/theming/
- https://beeui.beemvp.com/docs/accessibility/
- https://beeui.beemvp.com/docs/accessibility/keyboard-focus/
- https://beeui.beemvp.com/docs/accessibility/large-text/
- https://beeui.beemvp.com/docs/accessibility/native-assistive-tech/
- https://beeui.beemvp.com/docs/accessibility/reduced-motion/
- https://beeui.beemvp.com/docs/accessibility/rtl/
- https://beeui.beemvp.com/docs/reference/
- https://beeui.beemvp.com/docs/reference/cli/
- https://beeui.beemvp.com/docs/reference/core/
- https://beeui.beemvp.com/docs/reference/registry/
- https://beeui.beemvp.com/docs/reference/styling/
- https://beeui.beemvp.com/docs/reference/tokens/

---

## 1. Wrapping every component in a "house" component "just in case"

The docs call this an anti-pattern directly: judging BeeUI by application-framework criteria "leads to the anti-pattern of wrapping every BeeUI component in a house component 'just in case', which duplicates the contract, hides the upgrade path, and makes the component reference useless to your own team." The recommendation is to compose BeeUI components directly and add a wrapper "only when it encodes a genuine product rule" - i.e., when the wrapper captures real product policy (like `CurrencySelect` wrapping a whole compound family), not as blanket insurance.

**URL(s):** https://beeui.beemvp.com/docs/learn/foundations/
**Quote:** "add a wrapper only when it encodes a genuine product rule."
**Confidence:** 5

## 2. The three packages in the layer stack, and where Patterns sit

The layer stack (bottom to top, authority downward) is: `@beemvp/beeui-core` (engine-neutral utilities and geometry contracts - cn, dates, anchored-overlay/overlay-runtime primitives), `@beemvp/beeui-tokens` (semantic color, typography, spacing, density, breakpoints), and `@beemvp/beeui-ui` (React Native components: behavior, variants, a11y contract). Patterns/Demo sit above the component package, between it and "your application," and are explicitly "reference composition, never as a runtime dependency of your app" - i.e. patterns are copy-and-adapt evidence, not a package your app imports.

**URL(s):** https://beeui.beemvp.com/docs/learn/foundations/
**Quote:** "the pattern library sits above the component package as reference composition, never as a runtime dependency of your app."
**Confidence:** 5

## 3. Header and content both pushed down by the status bar on iOS

This is the "safe area duplicated" symptom: two nested components (or a blanket wrapper) each claim the same edge, so it gets padded twice. The rule broken is "one owner per system edge" - exactly one `SafeArea` should claim `top`. The fix is to assign each physical edge to exactly one `SafeArea`; the verified shape is `edges={['top','left','right']}` on the outer shell, leaving `bottom` to whatever bottom bar actually renders there.

**URL(s):** https://beeui.beemvp.com/docs/guides/troubleshooting/ ; https://beeui.beemvp.com/docs/learn/ownership-model/
**Quote:** "Fix: assign each physical edge to exactly one SafeArea. The verified starter shape is edges={['top', 'left', 'right']} on the outer shell..."
**Confidence:** 5

## 4. A global toast store "to track toasts"

This is called out explicitly as an ownership violation: BeeUI's toast runtime already owns the queue, so a parallel application-global toast store creates two sources of truth. "Do not mirror runtime state" is listed as a rule, with the toast store named as the canonical example.

**URL(s):** https://beeui.beemvp.com/docs/learn/ownership-model/
**Quote:** "Do not mirror runtime state. BeeUI's toast runtime already owns the queue; a parallel application-global toast store produces two sources of truth..."
**Confidence:** 5

## 5. SelectTrigger moved into a shared header, SelectContent left in the screen

This is the named "common misconception" for compound components: hoisting a trigger out of its family. It type-checks and the button renders, but "the overlay positions against the window instead of the anchor, or Escape closes the wrong layer" - anchoring, dismissal arbitration and focus restoration all break at once because those depend on shared React context that only exists inside the root.

**URL(s):** https://beeui.beemvp.com/docs/learn/composition-model/
**Quote:** "Moving SelectTrigger into a shared header component and leaving SelectContent behind breaks anchoring, dismissal arbitration and focus restoration at once."
**Confidence:** 5

## 6. SelectItem doesn't look right - write your own?

No. The docs say composition is where you customize, not replacement: "If SelectItem does not do what you need, put your content inside it rather than writing a substitute - the accessibility semantics and selection reporting live in the part you replaced." `children` is the documented extension point.

**URL(s):** https://beeui.beemvp.com/docs/learn/composition-model/
**Quote:** "If SelectItem does not do what you need, put your content inside it rather than writing a substitute..."
**Confidence:** 5

## 7. `checked` passed to Checkbox without `onCheckedChange`

The control becomes read-only - it renders the value you passed but can never change it, because a controlled prop needs its paired callback. In development, BeeUI warns about this; in production it does not fail, it just silently stays read-only ("BeeUI warns about this in development builds rather than failing silently in production" - read as: dev gets a warning, prod gets the silent read-only behavior with no warning).

**URL(s):** https://beeui.beemvp.com/docs/learn/state-model/
**Quote:** "Pass value (or checked, or open) without the matching onValueChange/onCheckedChange/onOpenChange and the control becomes read-only... BeeUI warns about this in development builds rather than failing silently in production."
**Confidence:** 4

## 8. `<Dialog open={isOpen}>` with no `onOpenChange`

Compile error, not a runtime bug. The overlay families (Dialog, Popover, DropdownMenu, Sheet, Tooltip) type their props as a discriminated union: supplying `open` makes `onOpenChange` required (and rejects `defaultOpen`); omitting both makes `defaultOpen` available. "A controlled dialog that cannot close is therefore a compile error rather than a bug report."

**URL(s):** https://beeui.beemvp.com/docs/learn/state-model/
**Quote:** "A controlled dialog that cannot close is therefore a compile error rather than a bug report."
**Confidence:** 5

## 9. Accordion with `defaultValue="shipping"` inside a conditionally hidden/shown container

"Shipping" will be open again - back to the default - because `defaultValue` is a seed read only at mount, and a conditionally rendered root unmounts and remounts, which resets uncontrolled state and re-reads the seed. Any interaction the user did in between (opening a different item) is lost.

**URL(s):** https://beeui.beemvp.com/docs/learn/state-model/
**Quote:** "defaultValue is a seed, not a sync... remounting is the only thing that re-reads it - which is why a conditionally rendered root silently resets."
**Confidence:** 5

## 10. Toast fires with no error but never appears

The named cause is the toast-runtime nesting asymmetry: unlike the overlay runtime (which yields to a parent provider), a nested `BeeUIProvider` always establishes its own toast runtime with its own queue and viewport. `useToast()` resolves to the nearest runtime, so a toast raised under a nested provider queues and renders in that nested viewport - which may be offscreen, clipped, or unmounted - not in the root viewport.

**URL(s):** https://beeui.beemvp.com/docs/learn/overlays-and-runtime/
**Quote:** "It is also the explanation for a bug that otherwise looks impossible: a toast that fires without an error and never appears. It went to a nested runtime whose viewport is offscreen, clipped or unmounted."
**Confidence:** 5

## 11. Popover opened from inside a Dialog

It is positioned against the dialog (the nearest host), not the window: "Geometry is measured against the nearest host. An overlay opened inside a Dialog positions against the dialog, not the window." Dismissal resolves to the deepest active scope, so one Escape press closes the innermost overlay - the Popover - not the Dialog underneath it.

**URL(s):** https://beeui.beemvp.com/docs/learn/overlays-and-runtime/
**Quote:** "Dismissal resolves to the deepest active scope... One Escape... therefore closes the innermost overlay, not the outermost."
**Confidence:** 5

## 12. Does nesting a second BeeUIProvider scope overlays? Scope toasts?

No and yes. The overlay runtime detects a parent runtime and yields to it (renders children, installs nothing) - it does not scope. The toast runtime always establishes a new runtime with its own queue and viewport when nested - it does scope. This asymmetry is called out as "the single most surprising thing on this page."

**URL(s):** https://beeui.beemvp.com/docs/learn/overlays-and-runtime/
**Quote:** "the overlay runtime yields to the parent - while it silently does scope toasts."
**Confidence:** 5

## 13. `error="Enter a valid email"` on Field never shows

Most likely cause: `invalid` was not also set to `true`. Field shows the error only when both `invalid` is true and `error` is a non-empty string; otherwise it renders the `description` instead. This exact mistake is named as "the most common reason an error 'does not appear'."

**URL(s):** https://beeui.beemvp.com/docs/learn/forms-model/
**Quote:** "invalid and error work together. Field shows the error only when invalid is true and error is a string; otherwise it shows the description. Setting one without the other is the most common reason an error 'does not appear'."
**Confidence:** 5

## 14. Three checkboxes inside one Field to share a label

Wrong: this produces one control whose accessible name points at several inputs at once, because the rule is "one control per Field." Use `FormGroup` with a legend instead when several related controls need a shared label and shared error.

**URL(s):** https://beeui.beemvp.com/docs/learn/forms-model/
**Quote:** "The related anti-pattern is putting a whole group of controls inside a single Field to get one label... Use FormGroup for grouping and keep one control per Field."
**Confidence:** 5

## 15. Does Field associate the label, decide validation timing, announce the error, own submission?

Field associates the label and announces the error (as a polite live region when invalid+error are set). It does not decide when to validate - "Decide validation timing yourself" is explicitly the caller's job - and it does not own submission; BeeUI ships no form engine, so values, dirty flags and submit lifecycle stay in the application's state or form library.

**URL(s):** https://beeui.beemvp.com/docs/learn/forms-model/
**Quote:** "It never looked at the value, never decided when to validate, and never owned submission."
**Confidence:** 5

## 16. Release reviewed only from the Web export

The missing evidence class is Class 4 - Simulator & device runtime. Web (Chromium browser interaction) evidence never proves native runtime behavior. Two things only Class 4 can prove: real system-inset/safe-area behavior on a device, and hardware back-button dismissal (also assistive-technology behavior such as VoiceOver/TalkBack). The docs give a concrete failure: reviewing a release from the Web export only, then discovering on first device build that shell surfaces double-inset and an overlay dismisses the wrong layer.

**URL(s):** https://beeui.beemvp.com/docs/learn/cross-platform-model/
**Quote:** "4. Simulator & device runtime... What it proves: Native runtime behavior: insets, keyboard avoidance, dismissal, hardware back, assistive technology."
**Confidence:** 5

## 17. Components with platform-split implementations - does the split change props/behavior?

Named platform splits: `Sheet`, `Tooltip`, `DatePicker`, `DateTimePicker`, `Table`'s Web surface, and the overlay portal transport (`.web.tsx` vs `.native.tsx`, bundler-resolved). The split does not change the exported name, props, types or documented behavior - only the underlying rendering primitive differs. "The important part is what the split does not change: the exported name, the props, the types and the documented behavior stay identical."

**URL(s):** https://beeui.beemvp.com/docs/learn/cross-platform-model/
**Quote:** "Today that split exists for Sheet, Tooltip, DatePicker, DateTimePicker, Table's Web surface, and the overlay portal transport."
**Confidence:** 5

## 18. Named breakpoints, where to read them, and useWindowDimensions

BeeUI ships exactly two named breakpoints - `breakpoint.medium` (768px) and `breakpoint.expanded` (1280px) - with anything below `medium` being the implicit compact base. Read them from `@beemvp/beeui-tokens` rather than restating the numbers. `useWindowDimensions()` should be reserved for the one structural decision CSS utilities cannot express: "which subtree renders" - not for cosmetic/width-driven styling, which should use responsive utility variants instead.

**URL(s):** https://beeui.beemvp.com/docs/learn/responsive-model/ ; https://beeui.beemvp.com/docs/reference/tokens/
**Quote:** "Reserve a useWindowDimensions() read for the one structural decision utilities cannot express: which subtree renders."
**Confidence:** 5

## 19. Under reduced-motion, what must stay and what may reduce?

Decorative/transitional animation should reduce or disappear. State, focus, loading and success/error feedback must remain available - motion "may clarify state; it may never carry it." Replacing an animation with an invisible state change (dropping the animation without preserving the semantic announcement/final visual state) is explicitly called a regression, not a fix.

**URL(s):** https://beeui.beemvp.com/docs/accessibility/reduced-motion/
**Quote:** "Do not replace an animation with an invisible state change: preserve semantic announcements and final visual state."
**Confidence:** 5

## 20. Who owns text scaling, and what in your own code breaks it?

The platform owns it: iOS/Android Dynamic Type on native (React Native's Text/TextInput auto-scale as long as `allowFontScaling` stays at its default `true`), and browser zoom / OS text-size preferences on Web (via rem-based CSS custom properties, not pixel literals). What breaks it in application code: setting `allowFontScaling={false}` or reading `PixelRatio.getFontScale()` to fork rendering (a repo-wide guard test fails if these reappear), and hard-coding fixed heights around text-bearing controls, which clip at larger scales.

**URL(s):** https://beeui.beemvp.com/docs/accessibility/large-text/
**Quote:** "No BeeUI component sets allowFontScaling={false} or reads PixelRatio.getFontScale() to fork rendering - a repo-wide guard test fails if either ever reappears."
**Confidence:** 5

## 21. Switching density app-wide vs. one subtree; does density change the touch-target floor?

App-wide: call `applyDensity(Uniwind, runtimeTheme, mode)` once per named runtime theme (e.g. loop over `'light'` and `'dark'`). Per-subtree: not supported today - the docs explicitly say "There is no BeeDensityScope," density is "Global per runtime theme, never per subtree." Density never lowers the touch-target floor: `rowHeight` can never drop below 44px (compact sits exactly at that minimum), and `ListItem` carries a defensive native floor so rendered height cannot regress below 44px even under further shrinkage.

**URL(s):** https://beeui.beemvp.com/docs/guides/density/
**Quote:** "Global per runtime theme, never per subtree. There is no BeeDensityScope."
**Confidence:** 5

## 22. Who owns sort/selection state in Table; virtualization and data-grid stance

Your application owns row data, sort direction/comparator, and row selection - Table is "a composable primitive family, not a data grid," with no `columns` prop and no `data` prop. `TableHead`'s `sortDirection`/`onSortChange` is a controlled value plus a bare notification; selection is a plain `Set` of ids passed to ordinary `Checkbox` components. Table ships no default virtualization - `TableBody` renders every row supplied - and BeeUI intentionally does not bundle a virtualization/data-grid library; consumers should measure first, then memoize row content or reach for a dedicated virtualization/data-grid library once their data scale exceeds the measured envelope (~100-500 rows sub-millisecond on the reference host).

**URL(s):** https://beeui.beemvp.com/docs/guides/table/
**Quote:** "BeeUI's Table is a composable primitive family, not a data grid. You keep your rows, your sort state, and your selection set..." and "Table ships no default virtualization. TableBody renders every TableRow you supply."
**Confidence:** 5

## 23. DatePicker's timezone; who converts business-calendar rules

DatePicker's value (`CalendarDate`) carries no timezone at all - it is a plain `{year, month, day}` object, "like a birthday," with no offset and no hidden `Date` inside. The only sanctioned boundary to a timezone-bearing `Date` (`toLocalDate`/`fromLocalDate`) always uses the device's local zone, explicitly. Converting to a different IANA zone, and all business-calendar rules (holidays, fiscal periods, working days), are the application's job - expressed as an `isDateDisabled` predicate; BeeUI does none of this.

**URL(s):** https://beeui.beemvp.com/docs/guides/date-time/
**Quote:** "Which timezone is a CalendarDate in? None. It is a calendar day, like a birthday." and "Where do business-calendar rules - holidays, fiscal periods, working days - live? Your application."
**Confidence:** 5

## 24. Where brand colors live; literal brand color usage; which component scopes a subtree theme

Brand colors live in runtime theme token values (applied via `defineThemeOverrides` + `applyThemeOverrides`, or a registered brand theme via `defineThemeRegistry`) - never as literal hex values inside a component. Using a literal brand color inside a reusable component is a named anti-pattern ("Hard-coding brand hex in a component. It cannot follow appearance, scope, or an override"); the escape hatch for places `className` cannot reach (SVG, chart libs) is the `useBeeToken` hook, which reads the resolved token, not a hardcoded color. `BeeThemeScope` is the component that scopes a subtree to a different brand/appearance while keeping semantic roles.

**URL(s):** https://beeui.beemvp.com/docs/guides/branding/ ; https://beeui.beemvp.com/docs/theming/
**Quote:** "Anti-patterns... Hard-coding brand hex in a component. It cannot follow appearance, scope, or an override." and "Use BeeThemeScope when one subtree needs a different supported brand/appearance while preserving semantic roles."
**Confidence:** 5

## 25. Token families carrying layout vocabulary besides breakpoints

Three more token families carry the layout vocabulary alongside `breakpoint`: `pageGutter` (horizontal page-edge padding), `contentWidth` (bounded measure on wide viewports), and `controlSize` (the minimum interactive target). The full reference inventory lists 21 token groups in total; these three plus `breakpoint` are the ones the Responsive model page names explicitly as the layout vocabulary.

**URL(s):** https://beeui.beemvp.com/docs/learn/responsive-model/ ; https://beeui.beemvp.com/docs/reference/tokens/
**Quote:** "Alongside the breakpoints, three more token families carry the layout vocabulary: pageGutter for horizontal page-edge padding, contentWidth for bounded measure on wide viewports, and controlSize for the minimum interactive target."
**Confidence:** 5
