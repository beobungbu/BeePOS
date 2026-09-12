# Phase 3d · BeePOS native defect fix (2026-09-12)

Scope: D-01 to D-11 of `reports/phase-03b-native-report.md`. BeeUI is not patched; what it cost us is in `docs/beeui-audit/findings-16-native-fix.md`.

Devices: iPhone 16 Pro simulator (iOS 18.6) and Android emulator `beeui` (`sdk_gphone64_arm64`, 1080x2400 @ 420 dpi), both on the existing dev clients over Metro 8097. No native rebuild was needed. Dynamic Type: iOS `content_size accessibility-large` (`fontScale` 2.143), Android `font_scale 1.5`; both reset afterwards (`medium` / `1.0`).

## Result table
| id | status | what changed | evidence |
|---|---|---|---|
| D-01 | FIXED | Tile name box is no longer `h-8`/`h-10`. It reserves `2 x line-height x PixelRatio.getFontScale()` as a **min** height, so tiles stay uniform at a given text size and the box grows with the text instead of cutting the second line. | `android-fix-01-pos-tiles-font-scale-1-5.png`, `ios-fix-01-pos-tiles-accessibility-large.png` |
| D-02 | FIXED | Quick cash chips use `grow` + `min-h-11` instead of `flex-1` + `h-11`. `flex-1` bases every chip at 0 width, which is what forced four onto one line; with a content base size the existing `flex-wrap` finally wraps. | `android-fix-02-quick-cash-chips-wrap.png` (3 + 1, every label whole) |
| D-03 | FIXED | Totals rows: label may shrink and wrap, amount is `shrink-0`, row may wrap. CTA: BeeUI clamps a button label to one line (16N-01), so above `fontScale` 1.3 the verb and the amount are stacked as two labels and the button grows. | `android-fix-03-checkout-cta-stacked.png`, `ios-fix-03-checkout-accessibility-large.png` ("TỔNG CỘNG 9.900 đ" and "Thêm thanh toán / 9.900 đ", suffix intact) |
| D-04 | LEFT (not reproducible; premise disproved) | See "D-04 in detail" below. Measured, not argued: the shell content area already loses exactly the tab bar's height, and the checkout footer including the helper line fits inside it. No code change; no tab-bar-height store was left behind as dead weight. | `ios-fix-04-helper-line-clear-of-tab-bar.png`, `android-fix-04-helper-line-clear-of-tab-bar.png` |
| D-05 | FIXED | Per-store minimum-level inputs announce `Định mức tối thiểu, <store name>` instead of one repeated column label. | `src/features/products/product-stock-table.tsx` |
| D-06 | FIXED | POS floating cart bar pay button carries `accessibilityLabel="Thanh toán · <total>"`, so it announces what the cart screen announces without printing an amount the phone bar has no room for. | `src/features/pos/components/floating-cart-bar.tsx` |
| D-07 | FIXED | Tiles announce `<name>, <price>, <stock text>, <in-cart qty>`. The stock wording is now one helper (`stock-label.ts`) shared by the pill and the label, so the two can never drift. | `src/features/pos/components/product-card.tsx`, unit test `stock-label.test.ts` |
| D-08 | LEFT (upstream, dev only) | Proved it is not BeePOS code. See "D-08 in detail". | stack trace below |
| D-09 | FIXED | The orders list no longer fakes a loading state on first mount; the skeleton is kept for filter and sort changes, where it is honest. Rows are on screen immediately on entering the tab. | `c4` run: rows visible 3 s after the tab tap, no placeholder blocks |
| D-10 | FIXED | `expo-status-bar` `style` is driven by the resolved theme in the root layout: `dark` glyphs on the light theme, `light` on the dark theme. `useAppTheme()` now returns what it resolved so the status bar and Uniwind cannot disagree. | `android-fix-10-light-status-bar.png`, `android-fix-10-dark-status-bar.png` |
| D-11 | FIXED | Product edit, product new, order detail, customer detail and receipt/transfer/count detail register `useScreenHeader({ backTo })`. The in-body back buttons and duplicate titles they replace were removed, per the direction doc's "a screen registers its title instead of drawing a second header row". | `android-fix-11-product-edit-back-control.png` |

## D-04 in detail: the premise does not hold
D-04 said "the shell content area does not reserve the measured bar height". Measured on iOS at `fontScale` 2.143 with `onLayout`:

- shell content area: `y=167 h=628`; bottom tab bar `h=45`; window `874`; bottom safe-area inset `34`.
- `167 + 628 + 45 + 34 = 874`. The bar is a normal flex child and the content column loses exactly its height.
- checkout footer inside that content area, with the helper line rendering: `y=511 h=117`, so it ends at `628` - flush with the bottom of the content area and clear of the bar.

Both platforms show the helper line "Hoàn tất sẽ quay về Đơn 1" in full above the tab bar at large text. One transient reading during a Fast Refresh remount did show the footer overflowing (`y=620 h=106` against a stale `724` content height), which is the most likely origin of the original observation; it settles on the next layout pass and is not reachable by a user.

Consequence: the measured-height store the fix brief asked for was written, used to take these measurements, and then removed rather than left in the tree with no consumer. If a future docked footer does need it, it is ten lines and the measurement above is the starting point. Flagging this as a judgement call to reverse if you would rather keep the hook in place.

## D-08 in detail: expo-router, not BeePOS
The LogBox toast on every Android cold start is `Can't perform a React state update on a component that hasn't mounted yet`. Captured with a temporary `console.error` wrapper posting to a local sink (removed again), the stack is unambiguous:

```
at dispatchSetState
at anonymous (expo-router/entry.bundle:139355)   <- onUnhandledLinking(extractExpoPathFromURL(prefixes, url))
at tryCallOne (InternalBytecode.js)              <- Linking.getInitialURL() promise
```

That line is inside expo-router's vendored `useLinking`: `Linking.getInitialURL()` resolves as a promise on Android, and its `.then` calls `onUnhandledLinking`, which is `setLastUnhandledLink` on the navigation container that is still rendering its first pass. No BeePOS module is on the stack; the login screen only appears in the component stack because that is what is mounting. It does not reproduce on iOS, where the initial URL is available synchronously.

It is a `__DEV__`-only warning, harmless in a release build, and fixing it means patching a dependency. Left as is, and deliberately not worked around in app code.

## Notes on D-09
The "~4 s" was not one cause. Measured on a cold Android process: the route module is fetched lazily from Metro on first navigation (dev-server cost, absent from a release build), then the screen rendered in ~400 ms, then the artificial `FILTER_LOADING_DELAY_MS = 300` skeleton ran, then the rows committed in ~350 ms. Only the artificial delay is product code, and it is what put grey blocks over data that was already in memory, so that is what was removed for the first pass.

## Files changed
```
app/_layout.tsx                                       status bar per theme
src/theme/use-app-theme.ts                            returns the resolved theme
src/hooks/use-large-text.ts                           new: one fontScale >= 1.3 threshold
src/components/shell/bottom-tab-bar.tsx               uses the shared threshold
src/features/pos/lib/stock-label.ts                   new: shared stock wording
src/features/pos/lib/__tests__/stock-label.test.ts    new: 4 cases
src/features/pos/components/product-card.tsx          D-01, D-07
src/features/pos/components/stock-badge.tsx           uses the shared wording
src/features/pos/components/quick-cash-chips.tsx      D-02
src/features/pos/components/order-totals-panel.tsx    D-03 rows
src/features/pos/checkout-screen.tsx                  D-03 CTA
src/features/pos/components/floating-cart-bar.tsx     D-06
src/features/products/product-stock-table.tsx         D-05
src/features/orders/screens/orders-list-screen.tsx    D-09
src/features/products/product-form-screen.tsx         D-11
src/features/orders/screens/order-detail-screen.tsx   D-11
src/features/customers/screens/customer-detail-screen.tsx  D-11
src/features/inventory/{receipt,transfer,count}-detail-screen.tsx  D-11
src/i18n/pos.vi.ts, src/i18n/pos.en.ts                `inCart`, one key each side
```

## Gates
| gate | result |
|---|---|
| `npx tsc --noEmit` | pass |
| `npm test` | 13 suites, 197 tests, pass (4 new) |
| `npm run qa:e2e` | 8/8 pass (7.3 m) |
| `npx expo export --platform all` | pass, web + ios + android bundles written |
| `npx expo lint` | unchanged from HEAD: 2 pre-existing errors (`set-state-in-effect` in `orders-list-screen` `setPage(1)` and in `qty-stepper`), no new warnings |

## Unresolved questions
1. D-04: keep the removal, or land the measured tab-bar-height store anyway as a guard for future docked footers?
2. Staff and store detail/new are pushed routes with the same missing back control as D-11, but were outside the listed scope. Fix in the next pass?
3. 16N-01 (`ButtonLabel` ignores `numberOfLines`) needs filing against BeeUI; the app-side stacking workaround is in place either way.
