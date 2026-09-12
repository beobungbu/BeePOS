# Phase 3b: native verification of the restyled build

Runs after the phase 3 polish lands. New native deps since the last native build: `react-native-svg` (lucide icons), `expo-image`. Both need a fresh dev client (`expo run:ios`, `expo run:android`), not just a Metro reload.

## Steps
1. iOS: `LANG=en_US.UTF-8 npx expo run:ios` on an iPhone 16 Pro simulator (iOS 18.6). If pods fail, `cd ios && LANG=en_US.UTF-8 pod install` and retry.
2. Android: emulator `beeui` (`emulator -avd beeui` with the Android Studio JDK, `android/local.properties` has the SDK path), then `npx expo run:android`.
3. Happy path on each, screenshots into `docs/screenshots/{ios,android}-restyle-NN-*.png`: login (single PIN field), select store, POS with two open orders (open a second via "+", add different items to each, switch back), pay the first order in cash with a quick chip, receipt, confirm the app lands on the second order, orders list shows the paid order, product edit screen, settings dark mode.
4. Dynamic Type at `accessibility-large` on iOS: POS, cart route, checkout; note any content hidden under the grown tab bar (a phase 1 carry-over) and any clipped text.
5. VoiceOver-equivalent check via the simulator accessibility tree (`inspect` action or `xcrun simctl accessibility` dump): order tab roles, close button name includes the order name, product tiles have a name, pay button announces the total.
6. Report `plans/260912-1054-beepos-design-pass/reports/phase-03b-native-report.md`: per platform pass/fail table, screenshot list, defects split into BeePOS (fix if under 30 minutes each, otherwise list) and BeeUI (write to `docs/beeui-audit/findings-15-native-restyle.md` per protocol).

## Known quirks (read before debugging)
- Metro on this Mac misses new files: restart `npx expo start --clear`.
- Simulator MCP `text` action reconnects the hardware keyboard; for keyboard tests tap on-screen keys, see memory note.
- A shell hook blocks Bash commands containing `node_modules` or `dist`.
- Sheet does not present on iOS (BeeUI #584); the app pushes `/pos/cart` and uses Dialog for the More menu. That is expected, not a defect.
