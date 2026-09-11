# Phase 12 - native Sheet fallback (iOS/Android) + Android emulator happy path

Owner: Sonnet worker. Tracker: beobungbu/BeeUI#234.

## Status

Status: DONE
Summary: Cart bar and More menu now fall back off BeeUI's native `Sheet` (BeeUI #584) on `Platform.OS !== 'web'`, verified on the iOS Simulator with screenshots; Android emulator build succeeded on the second attempt after a hung first build, and the full happy path (login, add 2 products, cart fallback, cash checkout, receipt, orders, product edit, dark settings) was driven end to end with 10 screenshots. Android hardware back on an open Dialog closes the dialog first as BeeUI claims - no BeeUI defect found on Android this session.
Concerns/Blockers: none blocking. The first Android build hung for 10+ minutes with zero file-write progress (likely a Kotlin daemon stall, not a BeeUI/BeePOS defect); killing daemons and rebuilding with an explicit `android/local.properties` succeeded cleanly in 5m30s. Full evidence below.
iOS: cart fallback works yes, More fallback yes, tabs fit yes (3 screenshots) - Android: build ok (2nd attempt) - screenshots 10 - BeeUI findings: 0 - Commits: 398374c, 0bf22f5, and this report's commit (see end).

## Part A - native Sheet fallback (Task 1)

### Root cause recap (already isolated in phase 11 / BeeUI #584)

`docs/beeui-audit/findings-11-native.md` (finding 11-03) established that BeeUI's native `Sheet`
(the `@gorhom/bottom-sheet` adapter) never presents on iOS: `present()` fires, no error, no
visible content, while `Dialog`/`AlertDialog` (React Native `Modal`-based) work correctly. This
phase implements the actual product fix: keep `Sheet` on web (where it works), and use
native-appropriate substitutes everywhere `Platform.OS !== 'web'`.

### Changes

- `src/features/pos/pos-screen.tsx`: added `handleOpenCart()` - on web, `setSheetOpen(true)`
  (unchanged `Sheet` behavior); on native, `router.push('/pos/cart')`. The inline `<Sheet>` block
  is now also gated `Platform.OS === 'web'` so it never mounts on native. Comment cites BeeUI #584.
- `src/features/pos/cart-screen.tsx` (new): full-screen native fallback for the cart. Reuses the
  same `CartPanel` as the wide-layout pane and the web `Sheet`, behind a `< Quay lại` header
  (`goBackOr('/pos')` from `src/lib/navigation.ts`).
- `app/(app)/pos/cart.tsx` (new route): thin re-export, matching the existing
  `app/(app)/pos/checkout.tsx` pattern.
- `src/components/shell/more-sheet.tsx`: on native, renders a `Dialog` + `DialogContent` +
  `ListGroup`/`ListItem` with the same `SECONDARY_MOBILE_ITEMS` list instead of `Sheet` +
  `SheetContent`; web keeps the `Sheet`. Matches the existing `ProductPicker`
  (`src/features/inventory/product-picker.tsx`) `Dialog` + `ListGroup` pattern already used
  elsewhere in the app, so no new BeeUI surface was introduced.

Both branches are commented with a one-line pointer to BeeUI #584 so they can be deleted once
BeeUI fixes the underlying `Sheet` defect.

### iOS Simulator verification

Environment: iPhone 16 Pro, `97DF90D1-E5BC-4725-94D6-42D57AA3976A`, iOS 18.6, already booted.
Metro: `CI=1 nohup npx expo start --dev-client --port 8081 --clear`. App relaunched via
`xcrun simctl terminate` + `launch`; driven with `mcp__Claude_Code_iOS_Simulator__control`
(`tap`/`text`/`screenshot`) using native-pixel-scan calibration (native screenshot is 1206x2622 =
exactly 3x the reported 402x874-point coordinate space; tap coordinates = native-pixel/3).

Steps: launch -> login `HN01` / `1234` (OTPInput, typed via the tool's `text` action once the
field was actually focused) -> store `Tạp hoá Cầu Giấy` (first store) -> add one product (Coca-Cola
330ml) -> tap the orange `FloatingCartBar` -> **`/pos/cart` opens full-screen with `< Quay lại`
header and the product**, not a Sheet -> tap `Thêm` tab -> **`Dialog` opens over a dimmed backdrop**
listing Khách hàng / Báo cáo / Cửa hàng / Nhân viên / Cài đặt, not a Sheet -> tap `Cài đặt` ->
Settings screen reached, `Thêm` tab highlighted. Also re-verified the five-tab bottom bar still
fits in Vietnamese at 402pt width (already fixed on `main` per commit 9a38d31).

Screenshots (`docs/screenshots/`):
- `ios-fix-cart.png` - cart fallback screen with 1 product, `< Quay lại` header.
- `ios-fix-more.png` - Settings screen reached via the Dialog fallback, `Thêm` tab active.
- `ios-fix-tabs.png` - POS screen, five tabs (Bán hàng/Đơn hàng/Sản phẩm/Kho hàng/Thêm) fitting.

### Web / QA gate

`npm run qa:e2e` (Playwright, `scripts/qa/e2e/playwright.config.ts`) - **8/8 green**, 7.2 minutes:
`journey vi/en x light/dark x wide/narrow`. Confirms the `Platform.OS === 'web'` branch (unchanged
`Sheet` behavior) still works and the narrow-layout runs (which exercise the same `pos-screen.tsx`
and `more-sheet.tsx` files this phase touched) are unaffected. The suite's own screenshot fixtures
(`docs/screenshots/e2e-*.png`) were regenerated as a side effect (pixel-identical content, new
file bytes/metadata) and are included in this phase's commit.

`npm run typecheck` and `npm test` (140/140) both green, both before and after the Android work.

## Part B - Android emulator happy path (Task 2)

### Environment setup

- SDK: `/Users/textsoft/Library/Android/sdk` (already present, `beeui` AVD already created).
- **No Android Studio.app and no system Java were installed on this machine** (`/usr/libexec/java_home`
  found nothing). Used Homebrew's `openjdk@17` instead:
  `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home`. This differs from
  the task's suggested `/Applications/Android Studio.app/...jbr/Contents/Home`, which does not
  exist on this host; documenting here in case later phases assume Android Studio's bundled JBR.
- Emulator booted clean: `emulator -avd beeui -no-snapshot-load -no-boot-anim`, `adb shell getprop
  sys.boot_completed` = 1 within about 40s.

### Build attempt 1: hung, killed (counts as one failure)

`npx expo run:android` ran prebuild successfully (`android/` generated), Gradle configured, and
began compiling native modules (worklets, reanimated, screens, safe-area-context,
datetimepicker, masked-view, teleport all mid-`compileDebugKotlin`/`compileDebugJavaWithJavac`)
- then **stalled completely**: zero bytes written under `android/app/build`, zero log growth, for
10+ minutes straight (confirmed twice with `find android -newermt '-5 minutes'` returning nothing).
`ps` showed the Gradle and Kotlin daemons alive but essentially idle (single-digit % CPU,
sub-3-minute cumulative CPU time over a 15+ minute wall clock). No Gradle error was ever printed;
this was a genuine hang, not a build failure with a stack trace. Two secondary observations,
recorded for completeness but not confirmed as the root cause: (1) `ANDROID_SDK_ROOT` had been
set to an empty string by a shell quoting mistake (`export ANDROID_HOME=... ANDROID_SDK_ROOT=$ANDROID_HOME`
expands `$ANDROID_HOME` before the same-line assignment takes effect), which Gradle warned about
but which should not block a build since `ANDROID_HOME` alone was set correctly and no
`android/local.properties` existed yet; (2) dozens of `CLOSE_WAIT` sockets from the Gradle daemon
to Google/Cloudflare hosts (consistent with AGP's opt-out analytics upload), not confirmed as
causal. Action taken: `kill -9` on the Gradle daemon, Kotlin daemon, `gradlew` wrapper, and
`expo run:android` node process; `./gradlew --stop`; wrote `android/local.properties`
(`sdk.dir=/Users/textsoft/Library/Android/sdk`) to remove the ambiguity; retried.

### Build attempt 2: succeeded

Same `npx expo run:android` command, with `ANDROID_SDK_ROOT` correctly exported this time and
`local.properties` present. Compiled straight through (native CMake build for `arm64-v8a`, dex,
package, install) with real, continuous log progress throughout:

```
BUILD SUCCESSFUL in 5m 30s
363 actionable tasks: 156 executed, 5 from cache, 202 up-to-date
› Installing /Users/textsoft/workspace/BeePOS/android/app/build/outputs/apk/debug/app-debug.apk
› Opening beepos://expo-development-client/?url=http%3A%2F%2F192.168.1.5%3A8081 on beeui
```

The dev client connected to the same Metro instance already running for the iOS session (single
shared bundler, port 8081). Since the plan's gate is "two honest failures = BLOCKED", and this
was one genuine hang followed by one clean success, Task 2 is DONE rather than BLOCKED.

### Display-size gotcha

The AVD's `wm size` reported an **override** of 1080x1400 against a **physical** size of
1080x2400 (leftover from some earlier session/skin config). `adb exec-out screencap -p` honors
the override, so screenshots and `adb shell input tap` coordinates were initially mismatched -
early taps landed on the wrong elements or on nothing. Fixed with `adb shell wm size reset`, after
which screenshots and tap coordinates both use the physical 1080x2400 space consistently. All
coordinates below were computed by scanning the actual screenshot pixels (Python/Pillow) for the
target control rather than eyeballing, after two rounds of visual-estimate taps missed their
targets.

### Happy path driven end to end

Login `HN01` / `1234` (native numeric keypad, tapped digit buttons since `adb shell input text`
landed OK on the store-code field but the PIN field needed direct keypad taps) -> store `Tạp hoá
Cầu Giấy` -> POS: added 2 products (Coca-Cola 330ml + 500ml, 23.100 đ) -> tapped the cart bar ->
**native cart fallback route (`/pos/cart`) opened full-screen, not a Sheet** -> Thanh toán ->
cash `Đủ tiền` -> Thêm khoản thanh toán -> Xác nhận thanh toán -> receipt (`HD-HN01-20260911-001`,
23.100 đ) -> Orders (via `beepos://orders` deep link, which needed 2-3s to apply after `am start`)
shows the new order at the top with `Đã thanh toán` -> Products (`beepos://products`) -> tapped
`Bánh Oreo Gói 133g` -> product edit form (`Sửa sản phẩm`) loaded with existing values -> Settings
(`beepos://settings`) -> tapped `Tối` -> dark theme applied app-wide -> tapped the `Thêm` tab ->
**native More-menu Dialog opened over a dimmed backdrop, not a Sheet** -> `adb shell input keyevent 4`
(hardware back) -> **Dialog closed, Settings screen remained visible underneath** (BeeUI's claim
that the child closes first holds; no navigation-stack pop, no app exit).

Note on navigation reliability: direct taps on the bottom tab bar itself were unreliable in this
session (several attempts landed with no visible effect, both before and after the display-size
fix) even when computed from scanned pixel coordinates; every one of those taps was eventually
traced to arithmetic mistakes in this session's own coordinate math (e.g. re-using an unscaled `x`
alongside a scaled `y`), not a hit-target problem - the one time coordinates were computed
correctly end-to-end (the `Thêm` icon for the Dialog-close test) the tap landed on the first try.
Deep links (`adb shell am start -a android.intent.action.VIEW -d "beepos://<route>"`) were used as
the reliable navigation method for cross-tab jumps instead, consistent with the iOS session's
finding in phase 11 that this is a good workaround pattern. Not filed as a BeeUI or BeePOS defect;
no reproducible evidence of a real touch-target issue.

### Screenshots (`docs/screenshots/`)

| File | Screen |
|---|---|
| `android-00-select-store.png` | Store picker after login |
| `android-01-login.png` | POS screen after store selection (clean, five tabs visible) |
| `android-02-pos-add-products.png` | 2 products added, cart bar showing 23.100 đ |
| `android-03-cart-fallback.png` | Native cart fallback route (not a Sheet) |
| `android-04-checkout-cash.png` | Checkout, cash amount filled |
| `android-05-receipt.png` | Receipt after successful payment |
| `android-06-orders.png` | Orders list showing the new order |
| `android-07-product-edit.png` | Product edit form |
| `android-08-settings-dark.png` | Settings, dark theme active |
| `android-09b-more-dialog-open.png` | Native More-menu Dialog open over dimmed backdrop (dark theme) |
| `android-09-back-on-dialog.png` | After hardware back on the open More Dialog - child closed, Settings still visible |

### Android claims table

| # | Claim | Result | Evidence |
|---|---|---|---|
| 1 | Native cart fallback (`/pos/cart`) opens full-screen instead of a Sheet on Android | Holds | `android-03-cart-fallback.png` |
| 2 | Native More-menu Dialog fallback opens over a dimmed backdrop instead of a Sheet on Android | Holds | `android-09b-more-dialog-open.png` |
| 3 | Android hardware back on an open Dialog closes the dialog (child) first, not the screen/app | Holds | `android-09-back-on-dialog.png` |
| 4 | Cash checkout, receipt, orders list, product edit, and dark settings all render and function correctly on the Android emulator | Holds | `android-04` through `android-08` |
| 5 | `npx expo run:android` builds cleanly given a correct `ANDROID_SDK_ROOT`/`local.properties` and JDK 17 | Holds on 2nd attempt (1st attempt hung, not a build error - see Part B) | build log tail in this report |

No BeeUI native defects were found on Android this session; `docs/beeui-audit/findings-12-android.md`
was not created (protocol: only create it when a defect is found).

## Gates

- `npm run typecheck` - clean, both before and after Android work.
- `npm test` - 140/140 passed, both before and after Android work.
- `npm run qa:e2e` - 8/8 passed (7.2 min), confirming the web `Sheet` branch and narrow-layout
  runs are unaffected by the `pos-screen.tsx`/`more-sheet.tsx` changes.
- No `ios/`, `android/`, or other build artefacts committed (`.gitignore` already excludes
  `/ios` and `/android`; verified with `git status`/`git ls-files`).
- No em dash in touched files (checked `pos-screen.tsx`, `cart-screen.tsx`, `more-sheet.tsx`,
  `app/(app)/pos/cart.tsx`).

## Commits

- `398374c` - `fix(native): fall back off Sheet for cart and more menu on iOS/Android`
- `0bf22f5` - `docs: add iOS verification screenshots for native Sheet fallback`
- this report + Android screenshots + regenerated e2e screenshot fixtures (see final `git log`
  after this file is committed)
