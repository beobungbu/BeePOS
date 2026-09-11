# Findings 13 · iOS Simulator: keyboard avoidance and Dynamic Type (Ambrose, 2026-09-11)

Setup: iPhone 16 Pro simulator (iOS 18.6), BeePOS dev client, software keyboard enabled by setting `DevicePreferences.<udid>.ConnectHardwareKeyboard = 0` and restarting Simulator (typing through the host keyboard reconnects the hardware keyboard and suppresses the software one, so the PIN was entered by tapping the on-screen keys). Large text via `xcrun simctl ui booted content_size accessibility-large`. Screenshots: `docs/screenshots/ios-keyboard-*.png`, `ios-largetext-*.png`.

### 13-01 · KeyboardAwareScreen applies keyboard padding but does not scroll the focused input into view (iOS)
- Area: native-runtime
- Severity: major
- Source consulted: https://beeui.beemvp.com/docs/learn/forms-model/ ("kept the focused input above the keyboard"), https://beeui.beemvp.com/docs/components/keyboard-aware-screen/
- Expected (per docs): focusing an input that sits under the keyboard keeps it visible above the keyboard.
- Actual: on the product form (`KeyboardAwareScreen contentWidth="md"` inside the app shell with a bottom tab bar), tapping "Giá bán" (lower half of the screen) opens the numeric keyboard and the field is fully hidden behind it (`ios-keyboard-product-form.png`). A manual swipe then reveals it directly above the keyboard (`ios-keyboard-product-form-scrolled.png`), so the `KeyboardAvoidingView` padding is applied; what is missing is the scroll-to-focused-input step. Same for the top field "Tên sản phẩm" when the keyboard would not cover it (no issue) and for "Giá bán" at normal and large text sizes.
- Repro: any `KeyboardAwareScreen` form whose focused `Input` is below the keyboard line, iOS, Expo 57, hardware keyboard disconnected.
- Workaround: none in app code short of calling `scrollResponderScrollNativeHandleToKeyboard` on focus manually.
- Suggested fix for BeeUI: on `keyboardDidShow`, scroll the currently focused `TextInput` into view (measure via `TextInput.State.currentlyFocusedInput()` and `scrollTo`), or set `automaticallyAdjustKeyboardInsets` on the iOS ScrollView. Add a simulator smoke case with the field below the fold.

### 13-02 · BeeUI's own fixed heights and line heights clip text at large Dynamic Type
- Area: native-runtime / a11y
- Severity: major
- Source consulted: https://beeui.beemvp.com/docs/learn/accessibility-model/ ("No BeeUI component disables font scaling... Your fixed heights are what break it"), https://beeui.beemvp.com/docs/accessibility/large-text/
- Expected (per docs): BeeUI components grow with the OS text size; only consumer fixed heights clip.
- Actual at `accessibility-large`: `AppHeader` title is cut top and bottom (`h-16` + `py-3` in the installed `app-header.js`); `Input` values and `SearchInput` placeholder are cut (`h-control` / `h-touch` fixed heights with `leading-5` / `leading-6` fixed line heights in `input.js`); `Select` trigger value clipped similarly (`min-h-11` is fine, but the inner text line height is fixed); form labels are cut at the top edge. Screenshots `ios-largetext-pos.png`, `ios-largetext-product-form.png`, `ios-largetext-settings.png`. `SegmentedControl` and `Chip` wrap correctly.
- Repro: `xcrun simctl ui booted content_size accessibility-large`, open any screen with `AppHeader` and `Input`.
- Workaround: none from the app (heights are inside the components).
- Suggested fix for BeeUI: scale `h-control`, `h-touch`, `h-16` and the `leading-*` values with `PixelRatio.getFontScale()` on native (or use `min-h` plus `paddingVertical` and drop fixed `lineHeight`), and add a large-text case to the native smoke suite.

### BeePOS observations (app side)
- Bottom tab bar labels truncate at large text; fixed now: icons only when `fontScale >= 1.3` (labels remain as `accessibilityLabel`).
- At large text, list content rendered under the bottom tab bar on /pos and /settings (`ios-largetext-pos.png`): the shell's content area does not reserve the grown bar height. Open; needs a measured bar height or `BottomActionBar` with an opaque background and `onLayout`-driven padding. Logged for the next BeePOS pass.
