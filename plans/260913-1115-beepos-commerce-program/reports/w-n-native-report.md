# W-N · native verification and the native follow-ups (phase 7, wave 2)

Worker W-N · 2026-09-13, 14:37 to 16:20 · nothing committed.
Device: iPhone 16 Pro, iOS 18.6 (402 x 874 pt). Dev client rebuilt for this phase.
Driver: Maestro 2.7.0 plus `xcrun simctl`; the macOS session was **locked all session**
(`CGSSessionScreenIsLocked: true`), so the AX bridge and CGEvent typing were unavailable again
and the trait-level VoiceOver pass fell back to Maestro's accessibility tree, as in phase 5.

## 1. Dev client

`expo-crypto` was not in `ios/Podfile.lock`, so a full rebuild was needed:
`LANG=en_US.UTF-8 RCT_METRO_PORT=8133 npx expo run:ios --port 8133 --device "iPhone 16 Pro"` →
pods installed `ExpoCrypto`, **0 errors, 1 warning**, app installed. The bundle that run served
was red (W-R was mid-edit: `shell-header.tsx` duplicate `AppIcon`, then `org-switch.ts` importing
a file Metro had not seen), so Metro was restarted on its own: `npx expo start --dev-client
--port 8133 --clear`. Two Metro lessons worth keeping:

- `CI=1` (used at first to stop W-R's saves from pushing broken bundles) **disables Metro's
  watcher**, so later source edits are silently not served. One verification round was wasted on
  a stale bundle before this was spotted; the fix is a plain `npx expo start --dev-client`.
- The known watcher gap (memory note) reproduced: a brand-new file (`src/data/active-org.ts`) was
  unresolvable until Metro was restarted with `--clear`.

## 2. Result table

| # | Step | Result | Evidence |
|---|---|---|---|
| 1 | Fresh dev client with `expo-crypto` | PASS | build log, 0 errors |
| 2 | Cold start, bundle, login screen | PASS | `ios-p7-00-boot.png` |
| 3 | Login `owner@chuoi.vn` / `BeePOS@2026` | PASS, with defect P7-01 | `ios-p7-01-login-submitted.png` |
| 4 | Store picker, 4 branches | PASS | `ios-p7-02-store-select.png` |
| 5 | Register picker (`Quầy 1 · Đang mở ca`) | PASS, with defect P7-06 | tree dump |
| 6 | Lock screen, unlock with PIN 1000 | PASS | `ios-p7-05-lock-screen.png` |
| 7 | Cashier switch to PIN 3001 (Vũ Thị Giang) and back to 1000 | PASS | `ios-p7-06-cashier-switch.png`, header read `Vũ Thị Giang · Thu ngân` |
| 8 | Auto-lock after idle | PASS (fired unprompted mid-run, unlocked with 1000) | tree dump |
| 9 | Company customer attached at the till (`Cty TNHH Thương mại Minh Long`) | PASS | `ios-p7-14-wholesale.png` |
| 10 | "Bán sỉ" switch: group, term, rep, price source | PASS (9.000 → 7.000 đ, `Giá riêng`, `Đại lý A · hạn 30 ngày`) | `ios-p7-14-wholesale.png` |
| 11 | Unit `thùng 24` **from the product tile** | PASS (tile price 7.000 → 168.000 đ) | `ios-p7-16-pos-wholesale-grid.png` |
| 12 | Unit / quantity **on the cart line** | **FAIL** (P7-02) | `ios-p7-15-unit-selector.png`, `ios-p7-15b-cart-scrolled.png` |
| 13 | Wholesale cart line `1 thùng x 24 chai = 24 chai`, min-order note clears | PASS | `ios-p7-17-cart-carton.png` |
| 14 | Checkout: VAT invoice block, payment methods | PASS | `ios-p7-18-checkout.png` |
| 15 | On-account ("Ghi nợ"): limit 80.000.000, owed 52.400.000, left 27.415.200, due 13/10/2026 | PASS (arithmetic checks out) | `ios-p7-19-on-account.png` |
| 16 | Order completes as `HD-HN01-20260913-001`, B2B stepper `Báo giá → Đã xác nhận → Đang giao → Đã giao` | PASS | tree dump |
| 17 | Retail cash sale → receipt → "Chia sẻ" → iOS share sheet with the plain-text receipt | PASS | `ios-p7-36-share-sheet.png` |
| 18 | Returns screen, order loaded by code, line table with reason / disposition | PASS, with defect P7-07 | `ios-p7-37-returns.png`, `ios-p7-38-returns-order.png` |
| 19 | Open a shift with a 500.000 đ float | PASS, with defect P7-03 (needs two taps) | `ios-p7-23-shift-open.png` |
| 20 | Cash-in 500.000 đ from the shift screen | **FAIL** (P7-04: form clears, nothing is recorded) | `ios-p7-25-cash-in-filled.png`, `ios-p7-27-shift-after-cashin.png`, `ios-p7-28-money.png` |
| 21 | Z report renders and shares as text | PASS | `ios-p7-39-z-report.png`, `ios-p7-40-z-share.png` |
| 22 | Reaching the shift screen once a shift is open | **FAIL** (P7-05: no entry point; reached by deep link `beepos:///pos/shift`) | — |
| 23 | Notification bell → `/notifications`, 14 unread, grouped list | PASS | `ios-p7-51-notifications.png` |
| 24 | Org switch to `Chuỗi Minh Châu` (confirm dialog warns about the parked order) | PASS | `ios-p7-41-org-switch.png` |
| 25 | Org switch **survives a real kill and relaunch** | PASS after the M6 fix below | `ios-p7-44-second-org-stores.png` |
| 26 | Dark mode across POS, cart, settings, notifications | PASS | `ios-p7-50-scan-final.png`, `ios-p7-51-notifications.png` |
| 27 | AppState flush of a debounced write | PASS, A/B proven | section 3 |
| 28 | Hardware key capture without a focused field | PASS as a mechanism, see section 4 | section 4 |
| 29 | iPad pass of the pricing / receivables tables | NOT RUN (out of time; the phase 5 route is `simctl install` of the same `.app`) | — |

## 3. AppState flush (item 2) — `src/data/persist.ts`

Native has no `pagehide`, so `persistStore` now keeps a registry of every store it created and,
on native only, subscribes once to `AppState`. On `background` or `inactive` every registered
store flushes; `stop()` removes the store from the registry and drops the subscription with the
last one. Web is untouched and keeps its `pagehide` / `visibilitychange` path in
`persistence-bootstrap.ts` (react-native-web maps `AppState` onto the same event, so subscribing
there would only double it).

Unit tests: `src/data/__tests__/persist-background-flush.test.ts`, 7 cases — one subscription
however many stores register, a flush on `background` and on `inactive`, no flush on `active`,
per-store isolation after `stop()`, a rejecting storage that must not take the app down, and the
subscription torn down with the last store.

**Device A/B.** The 300 ms window cannot be hit from outside (a Maestro round trip is about a
second), so the debounce default was temporarily raised to 10 s in the same file, making the race
observable, and the sequence was run twice:

| build | action | `beepos.persist.settings` after `simctl terminate` |
|---|---|---|
| with the AppState flush | theme set to "Tối", app backgrounded (`simctl launch com.apple.Preferences`) then killed ~1 s later | `"theme":"dark"` — **the change survived** |
| with `watchAppState()` stubbed out | theme set back to "Sáng", same timing | still `"theme":"dark"` — **the change was lost** |

Both temporary edits were reverted (debounce back to 300 ms, subscription restored) and
`tsc`, `eslint` and `jest` re-run green afterwards.

## 4. Hardware barcode scanner spike (item 3)

**Candidates, checked on npm rather than assumed.**

| module | last publish | verdict |
|---|---|---|
| `react-native-keyevent` | 2023-12-11 | Android only, unmaintained for 2.5 years. No. |
| `react-native-hw-keyboard-event` | 2022-05-14 | dead. No. |
| `react-native-external-keyboard` 1.1.0 | 2026-09-12 | maintained, New Arch and Expo ready, but its key events are **focus-scoped** (`K.Pressable` / `K.View`), so it solves focus ergonomics, not global capture, and it is a native module: a prebuild plus a pod install plus a rebuild before anything can be tested. |
| `react-native-key-command` 1.0.16 | 2026-09-02 | maintained, iOS side is `UIKeyCommand`, so it registers a **fixed list of key commands** rather than a keystream; a 13-digit EAN burst would mean registering every digit as a command, and it is equally a native module. |

**What was implemented** (`src/native/hardware-key-capture.tsx`, new, plus
`src/features/pos/hooks/use-barcode-scan.ts`): the POS-terminal pattern, no native module. An
off-screen 1 x 1 transparent `TextInput` with `showSoftInputOnFocus={false}`, `caretHidden` and
`submitBehavior="submit"` claims the keyboard focus whenever `TextInput.State` reports no other
focused input, feeds every character into the same `scanBuffer` rule the web listener uses, and
treats `onSubmitEditing` as the closing Enter. The hook now returns that element on native
(`null` on web); `pos-screen.tsx` renders it (that one line was requested through the
coordinator and had already landed when the device check ran).

**Proof on device** (instrumented build, logs read from Metro):

```
[probe] claimFocus {"focused":"null"}      → input.focus()
[probe] after focus [object Object]        → the capture is first responder
[probe] onChangeText "9" → feed 9 {"digits":"9","lastAt":439176557.9}
… 11 more digits, 32-34 ms apart, all inside the 50 ms burst rule …
[probe] feed Enter {"digits":"","lastAt":null}   → burst closed, code handed to handleScan
```

So with no field focused anywhere on the sell screen, every keystroke and the trailing Enter
reach the app, the burst assembles, and the code reaches `handleScan` (an unknown code raises the
"không tìm thấy mã vạch" toast). The instrumentation was removed afterwards and the final build
re-checked: nothing visible on screen, no soft keyboard while typing
(`ios-p7-50-scan-final.png`).

**Limits, all measured, not assumed.**
1. The simulator cannot be driven fast enough to land a clean happy path: Maestro's XCTest typing
   has ~700 ms of latency on the first character and jitters either side of the 50 ms gap rule, so
   the emitted code came out as `930000000019`, `00000019`, `19` on successive runs. A real wedge
   scanner types 5-15 ms per character. `pasteText` was tried as a single-chunk substitute and
   never reached the field (Maestro pastes through the edit menu, which this input hides).
2. Nothing suppresses a scan while a modal is open on native. Web has `isOverlayOpen()`; there is
   no native equivalent, so the sell screen should pass `enabled={false}` when it opens a dialog
   that is not a text form. Left to the owner of `pos-screen.tsx`.
3. A real field always wins the focus, so the catalogue search and dialog inputs still work, but
   while the capture holds focus iOS shows no caret anywhere: the cashier has no visual hint that
   the till is "listening". That matches every POS terminal I have seen; worth a deliberate design
   call rather than an accident.
4. Android is untested (optional per the brief, and the iOS work used the time).

## 5. M6 from the review: the org scope was never read on native

`src/data/active-org.ts` read the scope with `getItemSync`, which only web storage implements, so
every native launch resolved to the demo chain: the switch wrote `chuoi-demo-2`, the UI said the
second chain was active, and the next launch was back in `org-1` — measured before the fix, with
the app writing `beepos.persist.org-1.*` keys while `beepos.persist.active-org` said
`chuoi-demo-2`.

Fixed by resolving the scope asynchronously before anything is derived from it:

- `active-org.ts` keeps the synchronous read for web and adds `loadActiveOrgId()` for native.
- `persistence-bootstrap.ts` no longer builds its keys and registers its slices at import. Web
  still does both at import (its storage answers synchronously, so the first frame is still the
  saved state); native registers inside `runHydration()`, after `await loadActiveOrgId()` and
  after the org store has been re-seeded for the chain actually in use. `PERSISTED_KEYS` became
  `persistedKeys()` for the same reason (it had no other caller).
- `org-store.ts` exports `seedForActiveOrg()` so the bootstrap can put the right chain's shops,
  staff and credentials back.

Proven on device: switch to `Chuỗi Minh Châu` → `simctl terminate` → relaunch → the app comes up
on `chuoi-demo-2`, signs in to "Minh Châu Quận 7", and writes `beepos.persist.chuoi-demo-2.*`
(`ios-p7-44-second-org-stores.png`). Switching back to `Chuỗi tạp hoá Bee` and relaunching
returns the demo chain intact. Unit test: `src/data/__tests__/active-org.test.ts`.

Two things this change does **not** fix, both worth a decision:
- A chain other than the demo one inherits the demo catalogue with **zero stock**, so every tile
  reads "Hết hàng" and nothing can be sold in it (W-A's phase 6 concern 2, still open). The
  notification bell also shows the demo chain's 14 unread rows in the second chain.
- `setActiveOrgId()` still writes without awaiting. A kill in the millisecond after the switch
  would lose it; the user is told to relaunch, so the window is small, but making `switchOrg`
  await the write would close it.

## 6. BeePOS defects (listed, not fixed: outside my file ownership)

| id | severity | what | file hint |
|---|---|---|---|
| P7-01 | minor | The login screen does not avoid the keyboard. Tapping the password field covers "Đăng nhập" with the keyboard, and the form does not scroll, so the only way to submit is the return key or dismissing the keyboard first. Return does submit, which is what saved the flow. | `src/features/auth/login-screen.tsx` (wrap in a `KeyboardAvoidingView` / scrollable container) |
| P7-02 | **major** | In wholesale mode on a phone the cart line list collapses to about 67 pt (it was 223 pt in retail), and the rest of the line — price-source badge, min-order note, **unit selector and quantity stepper** — paints outside the list and under the totals panel, where it takes no taps. On a phone there is then no way to change the quantity or the unit of a wholesale line; the only route is the unit control on the product tile. The same control works in the tile, so this is layout, not the control. | `src/features/pos/components/cart-panel.tsx` with `wholesale-header.tsx`: the header (customer, group, rep `Select`) is taking the flex space the line list needs, and the list needs `overflow-hidden` plus a minimum height |
| P7-03 | minor | A form button needs two taps while a field has the keyboard: the first is swallowed dismissing the keyboard. Seen on "Mở ca" and reproducible on any of these forms; a cashier reads it as "the button did nothing". | the screen `ScrollView`s want `keyboardShouldPersistTaps="handled"`: `src/features/pos/shift-screen.tsx`, `cash-movement-screen.tsx`, `checkout-screen.tsx` |
| P7-04 | **major** | Cash-in from the shift screen records nothing. The form accepts type, amount 500.000, reason "Nộp tiền", the preview line says "Sau giao dịch này 1.000.000 đ", and the submit clears the form as if it had worked, but the shift still says "Thu khác 0 đ · 0 giao dịch thu chi trong ca này", the Z report prints "Thu khác (0)" and the cash book (26 rows, newest 10/09) never gains the entry. | `src/features/pos/cash-movement-screen.tsx` / `src/features/pos/components/cash-movement-dialog.tsx` submit path vs `src/data/cash-movement-store.ts`; suspect the movement is written with a shift or store id the shift summary and cash book do not read back |
| P7-05 | **major** | Once a shift is open the shift screen is unreachable on a phone. `/pos/shift` is only linked from `no-shift-banner.tsx`, which is exactly what disappears when a shift exists; the More sheet, the avatar menu and the tab bar have no entry. Cash in/out, the Z report and closing the shift are all behind it. Reached in this pass only with `xcrun simctl openurl booted beepos:///pos/shift`. | `src/features/pos/components/no-shift-banner.tsx` (the only `router.push('/pos/shift')`), `src/components/shell/more-sheet.tsx` or the POS header chip |
| P7-06 | minor | The register picker offers "Quầy 1 · Đang mở ca" and the POS header then says "Chưa mở ca", because the seeded open shift belongs to another staff member. Two screens, two answers about the same till. | `src/features/auth/select-register-screen.tsx` vs `src/data/shift-store.ts` (`Shift.registerId` filter) |
| P7-07 | minor | The returns line table is wider than the phone: the "Xử lý" column sits at x 387-443 against a 402 pt screen, and the horizontal scroll bar reports one page, so the disposition control is off-screen. | `src/features/returns/…` return line table, phone layout |
| P7-08 | minor · a11y | The Z report is one accessibility element labelled "Báo cáo Z": every figure inside the monospaced roll is hidden from VoiceOver. | `src/features/pos/z-report-screen.tsx:227-230` — build the label from the key figures, or expose a labelled summary next to the roll |
| P7-09 | nit · a11y | The lock screen's PIN progress is not announced: the dots are not in the accessibility tree, so a VoiceOver user has no feedback that a digit landed. | `src/features/auth/components/pin-pad.tsx` (an `accessibilityValue` such as "2 trên 4 chữ số") |
| P7-10 | nit · a11y | Cart line quantity is announced as bare "1" between "Xoá dòng" and "Tăng số lượng"; customer rows in the POS dialog announce the name only, without the phone number the row shows. | `src/features/pos/components/cart-panel.tsx`, `customer-dialog.tsx` |

P7-04 and P7-05 are the two that should not ship: together they mean a till can take cash all day
and never reconcile, and the cashier cannot close the shift without a deep link.

## 7. VoiceOver / trait pass (item 4)

The macOS session was locked, so the AX bridge was unavailable and traits could not be read; what
follows is from Maestro's accessibility tree (labels, values, selected state) across the login,
lock, POS, cart, checkout, on-account, receipt, returns, shift, Z report, notification and org
switch screens.

Good: every actionable control on the new screens carries a Vietnamese label ("Đổi khách hàng",
"Giảm giá dòng", "Chia sẻ báo cáo Z", "Thu / chi tiền"); the wholesale switch reports
`checked` / `unchecked`; tiles announce name, price, stock, cart count and the price source
("Nước ngọt Coca-Cola 330ml, 7.000 đ, Còn 23, Trong giỏ 1, Giá riêng"); the bell announces the
unread count; tab and chip selection is exposed.

Gaps: P7-08, P7-09, P7-10 above, and BeeUI 30N-02 (a labelled `Input` hides its value). The
role-level questions left open since phase 3b (the order chip announced as a button rather than a
tab, D-05 stock inputs) still need an unlocked session and are still unanswered.

## 8. Files touched

| file | what |
|---|---|
| `src/data/persist.ts` | AppState background flush: store registry, one subscription, `flushRegisteredStores()` |
| `src/data/__tests__/persist-background-flush.test.ts` | new, 7 cases |
| `src/native/hardware-key-capture.tsx` | new, the off-screen capture field |
| `src/features/pos/hooks/use-barcode-scan.ts` | returns the capture element on native, web listener unchanged |
| `src/data/active-org.ts` | M6: `loadActiveOrgId()` for native, scope no longer fixed at import |
| `src/data/persistence-bootstrap.ts` | M6: lazy key building and slice registration; `persistedKeys()` |
| `src/data/org-store.ts` | M6: `seedForActiveOrg()` exported |
| `src/data/__tests__/active-org.test.ts` | new, 2 cases |
| `docs/beeui-audit/findings-30-native-p7.md`, `docs/screenshots/ios-p7-*.png`, this report | evidence |

`src/lib/preference-storage.ts` was in my ownership and needed no change: its native writes are
immediate, never debounced. Three of the M6 files (`active-org.ts`, `persistence-bootstrap.ts`,
`org-store.ts`) are outside the ownership I started with; the coordinator asked for M6 after W-R
finished, which is what put them in scope.

## 9. Gates

| gate | result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm test` | 49 suites, 697 tests passed (9 new) |
| `npx eslint src app` | 0 errors on every file touched |
| `npm run qa:e2e` | **76 passed**, 26 skipped, 0 failed (6.5 min), including the web org-switch spec, after the bootstrap change |
| iOS build | 0 errors, 1 warning |

## 10. Machine state left behind

iPhone 16 Pro simulator: booted, signed into the demo chain at HN01 / Quầy 1 with a shift open
(500.000 đ float, one 13.200 đ cash sale), theme back on "Theo hệ thống", app unlocked. Storage
holds both chains' slices plus two orphaned pre-scope keys (`beepos.persist.carts`,
`beepos.persist.session`) left by the build from before W-R's scoping change. Metro is up on 8133
(`npx expo start --dev-client`, watcher on). The dev client is current; JS-only changes need no
rebuild. Nothing committed.

## Unresolved questions

1. P7-04: is the cash movement written against the wrong shift or simply never written? It needs
   ten minutes in `cash-movement-store.ts` by whoever owns it; the symptom is silent success.
2. Should the second chain get its own catalogue and stock seed, or should a fresh chain start
   with an empty catalogue and an import? Today it inherits the demo catalogue at zero stock,
   which is neither.
3. The native scanner needs `enabled={false}` while a non-form modal is open. Who owns that call,
   `pos-screen.tsx` or a small `useIsOverlayOpen()` in the shell?
4. Trait-level VoiceOver evidence (phase 3b's open item) still needs an unlocked Mac session.
