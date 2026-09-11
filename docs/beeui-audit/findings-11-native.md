# Phase 11 Part A - native iOS Simulator findings

BeeUI-level friction points found while driving BeePOS on the iOS Simulator (iPhone 16 Pro,
iOS 18.6, `97DF90D1-E5BC-4725-94D6-42D57AA3976A`, native `expo run:ios` build). BeePOS-only
bugs (not attributable to a BeeUI component or its docs) are in the report instead, per
`docs/beeui-audit/protocol.md`.

### 11-01 · DatePicker forwards a deprecated `onChange` to the native picker

- Area: component-behavior
- Severity: minor
- Source consulted: Metro dev-server log during `npx expo run:ios`; BeeUI's `DatePicker`
  (https://beeui.beemvp.com/docs/components/date-picker/) wraps
  `@react-native-community/datetimepicker@9.1.0`.
- Expected (per docs): BeeUI's `DatePicker` exposes `onValueChange` as its public change
  callback (BeePOS's own usage in `src/features/orders/components/order-filters-bar.tsx`
  only ever calls `onValueChange`, never `onChange`).
- Actual: tapping the "From date" field in Orders logs, every time the calendar renders:
  ```
  WARN  DateTimePicker: `onChange` is deprecated. Use `onValueChange`, `onDismiss`, and
  `onNeutralButtonPress` instead.
  ```
  Since BeePOS's own code never passes `onChange` to `DatePicker`, this means BeeUI's
  `DatePicker` internally still calls the underlying `@react-native-community/datetimepicker`
  component with its old `onChange` prop instead of migrating to that library's current
  `onValueChange`/`onDismiss`/`onNeutralButtonPress` API.
- Repro: open BeePOS on iOS, go to Orders, tap "From date" (or any `DatePicker` field);
  the warning appears in the Metro/Xcode console every time.
- Workaround: none needed from the consumer side; purely a console warning, no observed
  functional difference (the picker opens, selects, and closes correctly - see
  `docs/screenshots/ios-datepicker.png`).
- Suggested fix for BeeUI: update the internal `DateTimePicker` invocation to the current
  `@react-native-community/datetimepicker` 9.x API (`onValueChange`/`onDismiss`) to stop
  emitting a deprecation warning on every native consumer's console.

### 11-02 · No documented default screen position for Toast

- Area: docs-public
- Severity: nit
- Source consulted: https://beeui.beemvp.com/docs/components/toast/#state-and-behavior-contract
  (queue/duration contract only); observed native behavior via `docs/screenshots/ios-toast-position.png`.
- Expected: no documented placement to compare against - flagging the gap itself. A
  consumer building a bottom-tab-bar layout (as BeePOS does) has to guess whether toasts
  will render near the top or bottom of the screen.
- Actual: on iOS native, a toast triggered from the POS screen (`Added to cart`) renders
  docked at the very top of the screen, directly under the header, not near the bottom
  tab bar.
- Repro: on iOS, POS screen, tap a product card to add it to the cart; observe the toast
  appears at the top.
- Workaround: none needed; just a planning surprise for a bottom-nav layout.
- Suggested fix for BeeUI: document the default `Toast` viewport anchor (and whether it is
  configurable) on the component's docs page.

### 11-03 · Sheet-triggering Pressables did not visibly open Sheet content on iOS native (inconclusive root cause)

- Area: component-behavior
- Severity: major (if a real product bug: blocks viewing the cart via the mobile FloatingCartBar,
  and blocks the bottom-tab-bar "More" menu entirely on narrow iOS devices)
- Source consulted: manual interaction via the iOS Simulator MCP tool
  (`mcp__Claude_Code_iOS_Simulator__control`, action `tap`), against BeePOS's
  `src/features/pos/pos-screen.tsx` (`FloatingCartBar` -> `<Sheet open={sheetOpen}
  onOpenChange={setSheetOpen}>`) and `src/components/shell/more-sheet.tsx` (bottom tab
  bar "More" button -> `<Sheet>`), both consuming BeeUI's native `Sheet`
  (`@gorhom/bottom-sheet` adapter per ADR-006).
- Expected: tapping the cart summary bar (with items in cart) or the "More" tab opens the
  Sheet, matching the same interaction pattern that successfully opens `Dialog`/`AlertDialog`
  elsewhere in the app (refund dialog, checkout confirmation) and successfully toggles
  simple state (theme `SegmentedControl`, category `Chip`s, router-navigation tabs) in the
  same screens.
- Actual: many precisely-targeted taps (coordinates cross-checked against a native iOS
  system alert's Cancel button, which confirmed the tap-coordinate math was correct) on
  both Sheet triggers never produced a visible Sheet. No console error appeared in the
  Metro log either time.
- Repro: on iOS, POS screen, add >=1 product to cart, tap the orange `FloatingCartBar` bar
  at the bottom (narrow width, sheet-based cart entry point); or tap the "More" bottom-tab
  item. Neither opens a Sheet.
- Workaround used to keep testing: deep-linked directly to routes normally reached through
  a Sheet (`beepos://pos/checkout`, `beepos://reports`, `beepos://settings`, etc.) via
  `open_url`, bypassing the Sheet UI entirely.
- Caveat on root cause: `Dialog`/`AlertDialog` (React Native `Modal`-based) opened and
  closed correctly with the exact same tap mechanism, but `Sheet` (the `@gorhom/bottom-sheet`
  adapter, which relies on `react-native-gesture-handler` pan gesture recognizers to
  present) never did. This could be either a genuine native `Sheet` presentation defect, or
  a limitation of this session's automated/synthetic touch injection not satisfying
  gesture-handler's gesture-recognition requirements (a known category of flakiness for
  gesture-handler-based components under UI automation). Not confirmed with real
  finger/mouse input on physical hardware or via Xcode's own UI test recorder.
- Suggested fix for BeeUI: if reproducible with real input too, investigate whether the
  `Sheet` native adapter's initial mount/present sequence has a race with
  `GestureHandlerRootView`/`BottomSheetModalProvider` initialization; if not reproducible
  with real input, no action needed on BeeUI's side, but this is worth a documented note
  about `Sheet` not always responding to synthetic/automated taps.
- **Review note (Ambrose, 2026-09-11, independent reproduction on the same simulator):** confirmed and isolated, no longer inconclusive. (1) The cart bar `onPress` fires (console.log inside it prints) and `setSheetOpen(true)` runs; taps deliver (product taps mutate state). (2) With the installed `sheet.native.js` temporarily instrumented (restored afterwards), the open effect logs `open=true ref=true snap=["50%"]` and calls `present()`; an added gorhom `onChange` never fires; nothing renders; no warning. (3) Removing `overrideReduceMotion`, `backgroundComponent`, `backdropComponent`, `handleComponent` and swapping `ModalOverlayHost` for a Fragment changes nothing. (4) Same screen, raw `BottomSheetModal` with a padded `BottomSheetView` presents. (5) Raw modal mimicking BeeUI's `BottomSheetView style={{flex:1}}` with gorhom's default dynamic sizing fires `onChange 0` but is invisible (content measures 0); the same modal with `enableDynamicSizing={false}` presents at 50% (`docs/screenshots/ios-sheet-fixed.png`). Verdict: BeeUI native Sheet defect, Severity blocker for any consumer that ships a Sheet on iOS; root-cause lead is dynamic sizing plus `flex:1` content, with a possible second factor not bisected. Filed as BeeUI #584. Re-classified from "inconclusive" to `fails`.
