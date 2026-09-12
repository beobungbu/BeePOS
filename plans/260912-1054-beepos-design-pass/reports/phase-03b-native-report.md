# Phase 3b · native verification of the restyled build (2026-09-12)

Build under test: `c9e3a70` (polish) with the type-scale sweep landing live via Fast Refresh.

Devices: iPhone 16 Pro simulator, iOS 18.6, fresh dev client (Build Succeeded, 0 errors, 1 warning duplicate `-lc++`). Android emulator `beeui` (`sdk_gphone64_arm64`, 411 dp wide), fresh dev client (BUILD SUCCESSFUL in 1m 33s).

Build environment fixes (no source or config touched): `expo run:android --device emulator-5554` is rejected (flag wants the AVD name; omit it). No Android Studio JDK on this Mac: built with `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home`.

Tooling: iOS driven by CGEvent injection (guarded on Simulator frontmost) + `xcrun simctl`; a11y tree from the macOS AX bridge. Android via `adb shell input` and `uiautomator dump`. Helper scripts stayed in the session scratchpad.

## Result table
| # | Step | iOS | Android |
|---|---|---|---|
| 1 | Fresh native build with react-native-svg + expo-image | PASS | PASS (after JDK fix) |
| 2 | Boot, bundle, lucide icons + product images render | PASS | PASS (LogBox error at start, D-08) |
| 3 | Login HN01 / 1234 | PASS | PASS |
| 4 | Select store | PASS | PASS |
| 5 | POS, two open orders, different items, switch back | PASS | PASS |
| 6 | Pay order 1 cash via "Đủ tiền" chip | PASS | PASS |
| 7 | Receipt | PASS | PASS |
| 8 | Lands on the second order | PASS | PASS |
| 9 | Orders list shows the paid order | PASS | PASS with ~4 s delay (D-09) |
| 10 | Product edit | PASS | PASS |
| 11 | Settings dark mode | PASS | PASS |
| 12 | Dynamic Type accessibility-large: POS / cart / checkout | FAIL (D-01..D-04) | font_scale 1.5: same tile clipping (D-01) |
| 13 | A11y tree: order tab roles, close names, tiles, pay button | PARTIAL (D-05..D-07) | PARTIAL, identical |
| 14 | Light-theme status bar legibility | PASS | FAIL (D-10) |

Expected, not defects: Sheet does not present on iOS (#584); phone catalog is 2 columns at 402 pt / 411 dp (3 columns only under 400); at large font scale the bottom tab bar drops labels by design.

Screenshots: `docs/screenshots/ios-restyle-01..16-*.png`, `docs/screenshots/android-restyle-01..12-*.png`.

## BeePOS defects (listed, not fixed)
| id | severity | what | file hint |
|---|---|---|---|
| D-01 | major | Product tile name box is a fixed `h-8` / `h-10`; at accessibility-large and font_scale 1.5 the second line is cut through the glyphs. Scale min-height by `PixelRatio.getFontScale()` or drop the fixed box. | `src/features/pos/components/product-card.tsx` |
| D-02 | major | Quick cash chips keep four on one row (`flex-1` + fixed `h-11`); at large text they read "Đủ ti", "100.", "200.", "500.". `flex-1` prevents the existing `flex-wrap`. | `src/features/pos/components/quick-cash-chips.tsx` |
| D-03 | major | Totals rows drop the currency suffix at large text ("TỔNG CỘNG 13.200", CTA "Thêm thanh toán · 13.200"). Amount text needs shrink or wrap. | `src/features/pos/components/order-totals-panel.tsx`, checkout CTA |
| D-04 | major | Carry-over: at large text the checkout helper line sits under the grown tab bar; shell content area does not reserve the measured bar height. | `src/components/shell/*` |
| D-05 | minor | Per-store "Định mức tối thiểu" inputs have no accessibilityLabel. | `src/features/products/product-stock-table.tsx` |
| D-06 | minor | POS floating cart bar pay button announces "Thanh toán" only; cart screen announces "Thanh toán · 13.200 đ". | `src/features/pos/components/floating-cart-bar.tsx` |
| D-07 | minor | Product tiles announce the name only; price, stock and in-cart qty absent. | `src/features/pos/components/product-card.tsx` |
| D-08 | major | Android logcat at cold start: "Can't perform a React state update on a component that hasn't mounted yet", raised on the login screen, LogBox toast every cold start. Candidates: theme/settings store applied in render, remembered-store read. | `src/features/auth/login-screen.tsx`, `remembered-store.ts`, `src/data/settings-store.ts` |
| D-09 | minor | Android orders tab shows three grey placeholder blocks ~4 s before rows appear; iOS immediate. | `src/features/orders/*` |
| D-10 | major | Android light theme: white status bar icons over a white surface, invisible on every light screen; correct in dark. | `app/_layout.tsx` / expo-status-bar |
| D-11 | nit | Product edit (pushed route) has no back affordance in the shell header. | product edit route + shell header |

## Accessibility evidence (both platforms agree)
Order chip `AXButton "Chuyển sang Đơn 2"` selected=true (role button, not tab). Close button "Đóng Đơn 2". Tiles named (name only). Pay button: cart "Thanh toán · 13.200 đ", POS bar "Thanh toán". Tab bar buttons with selected state. Form fields labelled with the ", required" suffix (15N-02) and unlabelled stock inputs (D-05).

## BeeUI findings
`docs/beeui-audit/findings-15-native-restyle.md`: 15N-01 major, 15N-02 minor, 15N-03 evidence for #589.

## Unresolved questions
1. Record the Homebrew `openjdk@17` path in the Android runbook, or install Android Studio on this Mac?
2. D-08 exact source needs a debugger session.
