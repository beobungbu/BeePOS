# Findings 16-native · what the defect-fix pass hit in BeeUI (BeePOS phase 3d, 2026-09-12)

Devices: iPhone 16 Pro simulator (iOS 18.6) at `content_size accessibility-large` (`fontScale` 2.143) and Android emulator `beeui` (`sdk_gphone64_arm64`, 1080x2400 @ 420 dpi) at `font_scale 1.5`. `@beemvp/beeui-*@0.86.2-rc.1`, Expo SDK 57, RN 0.86.3, new arch. Protocol: `docs/beeui-audit/protocol.md`. Ids use `16N-xx`.

Evidence: `docs/screenshots/ios-fix-*.png`, `docs/screenshots/android-fix-*.png`.

### 16N-01 · `ButtonLabel` clamps to one line and silently ignores `numberOfLines`
- Area: native-runtime / large text
- Severity: major
- Source consulted: https://beeui.beemvp.com/docs/components/button/ , https://beeui.beemvp.com/docs/accessibility/large-text/
- Expected: either the label wraps when it no longer fits (the button has a minimum height, not a fixed one), or `numberOfLines` is honoured so the consumer can choose. The prop is part of the accepted type: `<ButtonLabel numberOfLines={2}>` type-checks against `@beemvp/beeui-ui@0.86.2-rc.1` under `tsc --noEmit`.
- Actual: the label stays on one line and truncates. The checkout CTA `Thêm thanh toán · 13.200 đ` rendered as `Thêm thanh toán · 13.2…` at `accessibility-large`, so the amount lost both its last digits and its currency suffix, on the one control that commits a payment. Passing `numberOfLines={2}` changed nothing: it type-checks, renders, and has no effect on layout.
- Repro: iOS simulator, `content_size accessibility-large`, `/pos/checkout` with a cart. `docs/screenshots/ios-fix-03-checkout-accessibility-large.png` shows the state after the app-side workaround; the pre-fix truncation is described above.
- Workaround (taken): stop passing one string. Above `fontScale` 1.3 the CTA renders two `ButtonLabel` children inside a `View` and the button grows, so the verb and the amount each get their own full line (`src/features/pos/checkout-screen.tsx`). The button's own height stays a minimum, so nothing is clipped.
- Suggested fix for BeeUI: forward text props (`numberOfLines`, `adjustsFontSizeToFit`) from `ButtonLabel` to the underlying `Text` instead of overriding them, or wrap the label by default above a font-scale threshold. If triaged as the fixed-height family, attach to #589.

## Checked and not filed (BeeUI behaved as documented)
- `BottomActionBar` is laid out as a normal flex child, not an overlay. Measured on iOS at `fontScale` 2.143: shell content `y=167 h=628`, bar `h=45`, window `874`, bottom inset `34`; `167 + 628 + 45 + 34 = 874`. The content column loses exactly the bar's height, so a docked footer inside the content area cannot end up under the bar. This is what disproved BeePOS defect D-04.
- `Text` with `variant` grows correctly with the OS text size in every place the fix pass touched (tile name, totals rows, chips); the clipping that was filed as D-01..D-03 was all consumer-side (fixed `h-*` boxes, `flex-1` bases, unshrinkable rows).
- `Input` accepts and exposes `accessibilityLabel` (used for the per-store minimum-level column).
- `Button` accepts `accessibilityLabel` and it wins over the child label text, which is what let the POS floating bar announce the amount it has no room to print.
