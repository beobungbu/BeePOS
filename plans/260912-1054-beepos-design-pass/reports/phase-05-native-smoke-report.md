# Phase 5 · W-N · native smoke on iOS after the feature wave

Worker: W-N · 2026-09-13 (01:47) · nothing committed · read-only on `src/`, `app/`, `package.json`.

Build under test: wave 1 merged (`e25cb92`) plus W-R's review fixes as they landed in the
working tree. `src/theme/use-app-theme.ts` and `src/features/pos/components/customer-dialog.tsx`,
the two files behind the defects below, are unchanged from `e25cb92`, so both defects belong to
the feature wave and not to the in-flight review pass.

Devices: iPhone 16 Pro (402 x 874 pt) and iPad Pro 11-inch M4 (834 x 1210 pt), both iOS 18.6.

## Dev client

`@react-native-async-storage/async-storage@2.2.0` was not in `ios/Podfile.lock`, so a full
rebuild was required, not a reload:

```
LANG=en_US.UTF-8 RCT_METRO_PORT=8106 npx expo run:ios --port 8106 --device "iPhone 16 Pro"
```

`pod install` linked `RNCAsyncStorage`, the build finished with **0 errors and 1 warning** (the
warning text is not printed by the Expo CLI summary; phase 3b recorded the same count for the
duplicate `-lc++`), and the app bundled 4402 modules in 2065 ms. Metro ran on 8106
with a cold cache (the Metro cache directory was deleted before the run rather than passing
`--clear`, because `run:ios` starts its own bundler and the port has to be baked into the
build). The same `.app` was installed on the iPad with `xcrun simctl install`; it connects to
the same Metro, so the tablet checks needed no second build.

## Tooling deviation (the reason this run reads differently from phase 3b)

The Mac session was **screen-locked** for the whole run (`CGSSessionScreenIsLocked: true`,
frontmost app `loginwindow`). Phase 3b's two tools both depend on an unlocked session: CGEvent
injection would have gone to the lock screen, not to the Simulator, and the macOS AX bridge
returns a degenerate tree (`AXApplication` nested into itself, no windows). Injecting keystrokes
blind at a lock screen is not something to do to the owner's machine, so the driver was swapped:

- **Maestro 2.7.0** (already installed at `~/.maestro/bin/maestro`, run with the Homebrew
  `openjdk@17` that phase 3b recorded for Android) drives the simulator through its own XCTest
  runner, which does not care whether the desktop is locked. `maestro hierarchy` gives every
  element's accessibility label, value, bounds and selected/enabled state.
- `xcrun simctl` for screenshots, `terminate`, `launch` and `ui appearance`.
- AsyncStorage was read directly from the app container
  (`Library/Application Support/com.beemvp.beepos/RCTAsyncLocalStorage_V1/manifest.json`) to
  check what persistence actually wrote, independently of what the UI showed.

Cost of the swap: Maestro exposes labels but **not traits**, so the role-level assertions from
phase 3b (order chip announced as `AXButton` rather than a tab, D-05 stock inputs) could not be
repeated. Labels and selected state were checked instead.

## Concurrent-edit hazard

W-R was saving `src/` files while this smoke ran, and Fast Refresh pushed four broken bundles
into the running app (syntax errors in `command-palette.tsx`, `receipt-screen.tsx` and
`use-report-filters.ts`, plus one `shell-header.tsx` render error). Each cost a redo of the step
in flight. It was contained by turning the dev client's hot loading off
(`xcrun simctl spawn booted defaults write com.beemvp.beepos RCTDevMenu '{ hotLoadingEnabled = 0;
liveReloadEnabled = 0; }'`) and then taking new bundles deliberately, by relaunching the app when
a checkpoint was wanted. No red box appeared after that (one "Refreshing..." banner still showed
up, so the flag may only have suppressed the error surface rather than every push; either way the
app stayed usable). The last pass (cold start, customer dialog) was re-run at 01:41 against the
tree as it stood after W-R's report was complete: no red box, no render error.

## Result table

| # | Step | Result | Evidence |
|---|---|---|---|
| 1 | Fresh dev client with the new native module | PASS | build log, 0 errors |
| 2 | Cold start, bundle, POS renders | PASS | `ios-p5-01-cold-start.png`, `ios-p5-19-search-field.png` |
| 3 | Login HN01 / 1234 (single PIN field) | PASS | `ios-p5-02-login-pin.png` |
| 4 | Select store HN01 | PASS | `ios-p5-03-store-select.png` |
| 5 | Two orders, different lines | PASS | `ios-p5-04-order1-lines.png`, `ios-p5-05-two-orders.png` |
| 6 | `simctl terminate` + relaunch: both orders, same lines, same active tab, still signed in | **PASS** | `ios-p5-06-relaunch-orders-kept.png` + storage dump |
| 7 | Long press a tab, "Đặt tên đơn" → "Bàn 3" on tab, cart bar, checkout header | PASS | `ios-p5-07-rename-dialog.png`, `ios-p5-08-tab-renamed.png` |
| 8 | Customer quick-add from the cart dialog: phone validation, then attached | PASS with a layout defect (N-01) | `ios-p5-10-quickadd-validation.png`, `ios-p5-11-customer-attached.png`, `ios-p5-09-customer-dialog-overflow.png` |
| 9 | Receipt "Chia sẻ" opens the iOS share sheet with the plain-text receipt | PASS | `ios-p5-12-receipt.png`, `ios-p5-13-share-sheet.png` |
| 10 | Settings "Đặt lại dữ liệu mẫu" restores the seed | PASS in storage, FAIL in the live session (N-02, N-03) | `ios-p5-15-reset-confirm.png`, `ios-p5-18-relaunch-after-reset-seed.png` |
| 11 | Dark mode correct after the reset | **FAIL** (N-03) | `ios-p5-16-after-reset-login-dark.png`, `ios-p5-17-theme-system-stuck-dark.png` |
| 12 | Command palette button on tablet only | PASS (absent on phone, present and working on iPad) | `ios-p5-20-ipad-pos.png`, `ios-p5-21-ipad-palette.png`, `ios-p5-22-ipad-palette-nav.png` |
| 13 | Catalog search field still types and filters (the native wedge proxy) | PASS | `ios-p5-19-search-field.png` |
| 14 | Dark theme rendering itself (settings, login, store picker) | PASS | `ios-p5-14-settings-dark.png` |

Screenshots: `docs/screenshots/ios-p5-01..22-*.png`.

### Persistence, measured rather than inferred

After adding lines to two orders the app container held exactly three keys,
`beepos.persist.session`, `beepos.persist.settings`, `beepos.persist.carts`, with the carts slice
carrying both orders and `activeCartId`. Slices that never changed (orders, inventory, catalog,
customers, org) were never written, which is the intended behaviour and keeps the store small.
The session slice is written with `pin: ""`, so the till PIN is not on disk. A real process kill
(`simctl terminate`) followed by `simctl launch` came back signed in, on `/pos`, with both orders
and the active tab intact and no flash of seed data.

Not exercised: W-B's risk 2 (an app killed within the 300 ms debounce window loses that change).
Every kill in this run happened minutes after the last edit. A native `AppState` flush is still
the open item.

### What phase 3b filed and this build fixes

| phase 3b | now |
|---|---|
| D-06 POS floating bar announced "Thanh toán" only | now `Thanh toán · 127.600 đ` |
| D-07 tiles announced the name only | now `Nước ngọt Coca-Cola 330ml, 9.000 đ, Còn 23`, plus `Trong giỏ 2` when it is in the cart |
| D-11 product edit had no back affordance | back control in the header (seen on the iPad through the palette) |

D-01..D-04 (Dynamic Type) and D-05 (unlabelled stock inputs) were **not** re-tested in this
block: no font-scale pass was run and Maestro does not expose the traits D-05 was measured with.

## BeePOS defects (listed, not fixed: `src/` is another worker's this phase)

| id | severity | what | file hint |
|---|---|---|---|
| N-01 | major | The customer list in the POS customer dialog is a plain `View` capped with `max-h-80`. `maxHeight` does not clip on iOS, so three rows paint outside the dialog surface, over the cart totals and the tab bar, and there is no way to scroll to them: the only route to a customer past the cut is the search field. | `src/features/pos/components/customer-dialog.tsx:182` (make it a `ScrollView`, or add `overflow-hidden`) |
| N-02 | minor | "Đặt lại dữ liệu mẫu" throws the cashier back to the login screen. `resetDemoData()` deliberately puts the session back after resetting the stores, but for one render the session is null and the guard has already redirected. The session itself is fine: the next launch is signed in. | `src/data/persistence-bootstrap.ts` (`resetDemoData`) with `app/(app)/_layout.tsx:7` (`if (!staff) return <Redirect href="/login" />`) |
| N-03 | major | The theme override is sticky for the life of the process. After choosing "Sáng" or "Tối" once, switching back to "Theo hệ thống" keeps the chosen scheme, and the app then ignores the OS appearance entirely (toggled the simulator dark → light with "Theo hệ thống" selected: the app stayed dark). Same symptom after a demo-data reset: the store is back to `theme: 'system'` and the segmented control shows "Theo hệ thống" while the UI is still dark. A relaunch clears it. So "reset restores the default theme" is only true after a restart. | `src/theme/use-app-theme.ts`: `Uniwind.setTheme(resolved)` appears to pin React Native's colour scheme; when the mode is `system` the override has to be released (`Appearance.setColorScheme(null)` or the Uniwind equivalent), not just recomputed |
| N-04 | nit | The command palette opens on the tablet with its search field unfocused, so it takes two taps to start typing; its hint line offers arrow keys, Enter and Esc on a touch device that has none of them. | `src/components/command-palette.tsx` |
| N-05 | nit | The cart's customer row keeps its action labelled "Gắn khách hàng" after a customer is attached, where "Đổi khách hàng" is what the press now does. | `src/features/pos/components/customer-dialog.tsx:102-108` (the trigger row, `pos.cart.attachCustomer`) |

N-03 is the one that should not ship: it is reachable from the Settings screen in two taps, it
makes an advertised setting silently inert, and it makes the reset look broken.

## BeeUI findings

`docs/beeui-audit/findings-20-native-p5.md`:

- **20N-01 major** · `DialogContent` has no `overflow-hidden`, so on iOS overflowing children
  paint outside the rounded surface and over the page. This is the guard rail that would have
  contained N-01.
- **20N-02 minor** · `autoFocus` on an `Input` inside `DialogContent` does not focus the field or
  raise the keyboard on iOS (the RN `Modal` presentation race); both the rename dialog and the
  customer quick-add form open with no keyboard.

Neither is a duplicate of batches 13 to 16 (`grep`ed `docs/beeui-audit/findings-*.md` for
overflow and focus entries before writing).

## Unresolved questions

1. N-03: is the fix ours (release the override when the mode is `system`) or is
   `Uniwind.setTheme` supposed to accept a "follow the system" value? The uniwind package could
   not be read from this session (the scout hook blocks the dependency tree), so the root cause
   is empirical: the app follows the OS until the first explicit choice, and never afterwards.
2. Phase 3b's role-level a11y evidence (order chip announced as a button, not a tab) needs the
   macOS AX bridge and therefore an unlocked session; it should be re-run in daylight rather
   than assumed unchanged.
3. Should the Maestro route replace the CGEvent one for future native blocks? It works with the
   desktop locked and needs no coordinate maths, at the cost of the trait-level a11y data.

## Machine state left behind

The dev client's user defaults were put back
(`xcrun simctl spawn booted defaults delete com.beemvp.beepos RCTDevMenu`), so hot loading is at
its default again. The iPhone 16 Pro simulator is signed in on the seed data, the iPad simulator
is shut down, and Metro on 8106 is still up from the build command.
