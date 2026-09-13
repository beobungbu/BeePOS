# Findings 30 · native pass on the phase 7 build (iOS 18.6, iPhone 16 Pro)

Worker W-N · 2026-09-13 · BeeUI `0.86.2-rc.1` · driven with Maestro 2.7.0 (the macOS session was
locked, so no AX bridge and no CGEvent typing; labels and values come from `maestro hierarchy`).

Deduped against `docs/beeui-audit/findings-*.md`: `SegmentedControl` appears in 02, 11, 13, 14,
17 and 28 (overflow with 8 items, tap targets, large text, item API), `Input` in 13, 22 and 25;
neither of the two below is one of those entries.

### 30N-01 · SegmentedControlItem breaks its label mid-word in a narrow container
- Area: component-behavior
- Severity: minor
- Source consulted: https://beeui.beemvp.com/docs/components/segmented-control ,
  `llms-components.txt` (`SegmentedControl`, `SegmentedControlItem`)
- Expected (per docs): the item takes `children` and the control lays segments out in a row; the
  docs say nothing about a label that does not fit, so the reasonable default is shrink-to-fit or
  ellipsis, as `Chip` and `Button` do.
- Actual: each segment keeps its equal share of the row and the label wraps **inside a word**. In
  a 160 pt product tile the unit control renders `cha / i`, `lốc 6`, `thù / ng 24`, two lines each,
  with the break in the middle of "chai" and "thùng".
- Repro:
  ```tsx
  <View style={{ width: 160 }}>
    <SegmentedControl value="chai">
      {['chai', 'lốc 6', 'thùng 24'].map((u) => <SegmentedControlItem key={u} value={u}>{u}</SegmentedControlItem>)}
    </SegmentedControl>
  </View>
  ```
- Workaround: none applied in BeePOS; the labels are data (unit name plus factor). A caller can
  pass `<Text numberOfLines={1}>` as the child, but then the label is clipped with no ellipsis.
- Suggested fix for BeeUI: `numberOfLines={1}` with `ellipsizeMode="tail"` on the item label, or a
  documented shrink behaviour; at minimum document the wrap.
- Evidence: `docs/screenshots/ios-p7-30-account-menu.png` (unit control under the first tile).

### 30N-02 · An `Input` with `accessibilityLabel` stops exposing the text the cashier typed (iOS)
- Area: a11y
- Severity: major
- Source consulted: https://beeui.beemvp.com/docs/components/input , `llms-components.txt`
- Expected (per docs): `accessibilityLabel` names the field. Naming a field should not remove its
  value: on iOS label and value are separate accessibility attributes, and a money field read out
  as its name only leaves the cashier no way to check what they entered.
- Actual: with a label set, the accessibility tree carries `accessibilityText: "Tiền đầu ca"`,
  `hintText: "0"` (the placeholder) and **no value**, while the same build's `SearchInput`, which
  has no explicit label, reports the typed text as its value (`"Minh Long"`). Typing `500000` into
  the open-shift float field changes nothing in the tree; the digits are on screen.
- Repro: `<Input accessibilityLabel="Tiền đầu ca" placeholder="0" value={text} onChangeText={…} />`,
  type into it, then dump the iOS accessibility tree.
- Workaround: none in BeePOS. The label is what names the field for VoiceOver and is worth more
  than the value, so the value is what was lost.
- Suggested fix for BeeUI: set `accessibilityValue={{ text: value }}` (or leave the native value in
  place) whenever an `accessibilityLabel` is provided, and say so in the docs.
- Evidence: `docs/screenshots/ios-p7-22-shift-opened.png` plus the tree dump in
  `plans/260913-1115-beepos-commerce-program/reports/w-n-native-report.md`.

## Confirmed working, worth recording

- `Switch`, `SegmentedControl`, `Select`, `Dialog`, `Sheet`, `Table` and the share sheet all render
  and behave on iOS 18.6 at 402 x 874 in both themes; no red box in a 90 minute session.
- 20N-01 (`DialogContent` overflow) did not reproduce anywhere in this pass: the POS customer
  dialog clips and scrolls correctly after the phase 5 fix.
- A `TextInput` with `showSoftInputOnFocus={false}` does become first responder on iOS 18.6 and
  receives hardware key events, Enter included through `onSubmitEditing`, without raising the soft
  keyboard. That is plain React Native rather than BeeUI, and it is what the barcode capture in
  `src/native/hardware-key-capture.tsx` relies on.
