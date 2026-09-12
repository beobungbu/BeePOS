# Findings 20 · native smoke of the feature wave (iOS)

Phase: `plans/260912-1054-beepos-design-pass/phase-05-feature-upgrade.md`, block W-N.
Surface exercised: `Dialog`/`DialogContent`, `AlertDialog`, `Input`, `SearchInput`, `Field`,
`Button`, `IconButton`, `SegmentedControl`, `Avatar`, `ListItem`, on the real iOS runtime
(iPhone 16 Pro and iPad Pro 11-inch M4, iOS 18.6, fresh dev client with
`@react-native-async-storage/async-storage` linked).

Nothing in the published packages was patched. Both entries are worked around in app code or
carry a suggested app-side guard, named in the entry.

### 20N-01 · `DialogContent` does not clip its children, so overflowing content paints over the page
- Area: bug
- Severity: major
- Source consulted: <https://beeui.beemvp.com/docs/components/dialog/>
- Expected (per docs): `DialogContent` is the dialog surface: a bordered, rounded panel that
  holds the dialog body. Content that does not fit should stay inside that surface (clipped or
  scrolled), the way a modal panel behaves on web.
- Actual: the panel's own classes are `w-full max-w-lg gap-4 rounded-xl border border-border
  bg-surface p-5` with no `overflow-hidden`. React Native's default `overflow` is `visible` on
  iOS, so a child taller than the panel is drawn past the rounded border, over the dimmed
  backdrop and over the page behind it. The rows are still hit-testable, so the user sees list
  rows floating on top of the cart totals and the tab bar with no surface under them.
- Repro: iPhone 16 Pro, iOS 18.6. POS with one line in the cart, open the cart, tap the
  customer row: the customer list (BeePOS renders it in a `View` capped with `max-h-80`) spills
  three rows below the dialog surface and sits on top of the screen behind it.
  Evidence: `docs/screenshots/ios-p5-09-customer-dialog-overflow.png`.
- Workaround: app side, the offending list has to be a `ScrollView` (or carry
  `overflow-hidden`) rather than a height-capped `View`; a `maxHeight` alone does not clip on
  iOS. Filed against BeePOS as well, because the app should not lean on the dialog to contain
  it.
- Suggested fix for BeeUI: add `overflow-hidden` to the `DialogContent` panel (and to
  `AlertDialogContent`), so the rounded surface is the clip boundary on every platform. It is
  one utility and it turns a silent visual break into a visible, scrollable overflow.

### 20N-02 · `autoFocus` on `Input` inside `DialogContent` does nothing on iOS
- Area: bug
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/components/input/>,
  <https://beeui.beemvp.com/docs/components/dialog/>
- Expected (per docs): `Input` forwards the `TextInput` props, so `autoFocus` should focus the
  field when it mounts and the platform's keyboard should follow. (The web behaviour was not
  measured in this block: the e2e fills the field with `fill()`, which does not need focus.)
- Actual: on iOS the field mounts unfocused and no keyboard appears. The dialog opens, the
  cashier types nothing until they tap the field. `DialogContent` renders inside React Native's
  core `Modal`; a `TextInput` that asks for focus while the modal is still being presented
  loses it, which is the known RN pitfall `Modal` consumers have to work around with
  `onShow` / a delayed `focus()`.
- Repro: iPhone 16 Pro, iOS 18.6. Long-press an order tab to open "Đặt tên đơn"
  (`src/features/pos/components/order-tab-strip.tsx:262`, `autoFocus` on the `Input`): no
  keyboard, no caret (`docs/screenshots/ios-p5-07-rename-dialog.png`). Same in the customer
  quick-add form (`src/features/pos/components/customer-dialog.tsx:125`,
  `docs/screenshots/ios-p5-10-quickadd-validation.png` was reached by tapping each field
  first).
- Workaround: none applied; the flows stay usable with one extra tap. An app-side fix would be
  a `useEffect` + `ref.focus()` behind a short timeout, which is the kind of guess the
  component should not push onto every consumer.
- Suggested fix for BeeUI: focus the first `autoFocus` descendant from the dialog's own
  `onShow` (or document that `autoFocus` is web-only inside `Dialog` and give a
  `initialFocusRef`-style prop).
- Related, not duplicate: 14-W-POS ("nothing documents ref forwarding, a `focus()` handle or
  `autoFocus` on `SearchInput`") and 19-03 (`SearchInput` ref does not reach the `TextInput`,
  filed as evidence on BeeUI #597) are both about programmatic focus on the web build. This
  entry is the declarative `autoFocus` prop on `Input`, inside `Dialog`, on iOS. Fold it into
  #597 if the maintainers see one root cause.
