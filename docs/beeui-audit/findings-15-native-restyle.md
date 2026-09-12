# Findings 15-native · restyled build on device (BeePOS phase 3b, 2026-09-12)

Devices: iPhone 16 Pro simulator (iOS 18.6, fresh `expo run:ios` dev client) and Android emulator `beeui` (`sdk_gphone64_arm64`, 1080x2400 @ 420 dpi, fresh `expo run:android`). `@beemvp/beeui-*@0.86.2-rc.1`, Expo SDK 57, RN 0.86.3, new arch. Protocol: `docs/beeui-audit/protocol.md`. Ids use `15N-xx` so they do not collide with `findings-15-polish.md`.

Evidence: `docs/screenshots/ios-restyle-*.png`, `docs/screenshots/android-restyle-*.png`. Accessibility trees: macOS AX bridge of the simulator (after `xcrun simctl spawn booted defaults write com.apple.Accessibility ApplicationAccessibilityEnabled -int 1`) and `adb shell uiautomator dump`.

### 15N-01 · SegmentedControl truncates its labels at accessibility-large instead of wrapping
- Area: native-runtime / a11y
- Severity: major
- Source consulted: https://beeui.beemvp.com/docs/accessibility/large-text/ , https://beeui.beemvp.com/docs/components/segmented-control/
- Expected (per docs): components grow with the OS text size; only consumer fixed heights clip. Findings 13-02 recorded "SegmentedControl and Chip wrap correctly" at the same setting.
- Actual: at `accessibility-large` the three-segment theme control on `/settings` ("Sáng / Tối / Theo hệ thống") renders as "Sá", "T", "Theo h": each label cut horizontally mid-glyph, no wrap, no shrink, no ellipsis. Segment widths stay at the 1x equal split while the label grows.
- Repro: `xcrun simctl ui booted content_size accessibility-large`, open `/settings` (`docs/screenshots/ios-restyle-14-dynamic-type-settings-clipped.png`).
- Workaround: none from app code.
- Suggested fix for BeeUI: let segment labels wrap or stack above a font-scale threshold, or size segments from the measured label instead of an equal split. If triaged as the fixed-height root cause, attach to #589.

### 15N-02 · `Field required` appends the untranslated word "required" to the accessibility label
- Area: a11y / i18n
- Severity: minor
- Source consulted: https://beeui.beemvp.com/docs/components/field/ (`required`), https://beeui.beemvp.com/docs/learn/accessibility-model/
- Expected: the required state reaches assistive tech without injecting copy the app cannot localise.
- Actual: every `<Field required>` exposes an accessibility label `"<label>, required"`. In a Vietnamese UI VoiceOver reads "Tên sản phẩm, required", "SKU, required", "Giá bán, required", with no prop to translate the word.
- Repro: `/products/<id>` on iOS, AX dump: `Role='AXTextField' Description='Tên sản phẩm, required' Value='Bánh Oreo Gói 133g'`. App side: `src/features/products/product-form-screen.tsx` `<Field label={t('products.form.fieldName')} required>`.
- Workaround: drop `required` and hand-write the label (loses the asterisk).
- Suggested fix for BeeUI: use the platform required trait, or accept a `requiredLabel` and localise the default through BeeUI's own mechanism.

### 15N-03 · Fixed heights still clip text at large Dynamic Type after the restyle (evidence for #589)
- Not a new issue. On the restyled build at `accessibility-large` (iOS) and `font_scale 1.5` (Android): `AppHeader` title and subtitle cut top and bottom and the trailing `Avatar` clipped by the screen edge; `Input` / `SearchInput` placeholders cut at the bottom; `Field` labels lose their top edge; `Select` trigger values clipped. Screenshots `ios-restyle-11..14-*.png`, `android-restyle-12-fontscale-150-pos.png`. #589 stays open as written.

## Checked and not filed (BeeUI behaved as documented)
- `Sheet` still does not present on iOS (#584); the push-to-`/pos/cart` route and the Dialog "Thêm" menu work on both platforms.
- `ListItem` `onPress` inside `ListGroup` fires on both platforms (an early suspicion was a mis-measured tap).
- `Dialog` centring, scrim and dismissal correct on both platforms, light and dark.
- `Table` / `TableRow` in the product stock table renders and scrolls on both platforms.
- Tab bar, order chips, close buttons and product tiles expose names on both platforms; remaining gaps are app-side (phase 3b report).
- `expo-image` thumbnails and `react-native-svg` icons render in both fresh dev clients, no link errors.
