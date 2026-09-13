# Findings 32 · from the wave 3 product gaps

Worker wave-3-gaps · 2026-09-13 · BeeUI `0.86.2-rc.1` · react-native-web 0.21.2, Chromium
headless at 1280 x 800 and 390 x 844. Raised while closing the seven gaps in
`plans/260913-1115-beepos-commerce-program/reports/wave3-gaps-report.md` (supplier bill on
credit, cash book, loyalty, retail tile quote, wholesale grid memo, chain scoping, scanner
capture).

## Nothing new to file

**No new BeeUI finding came out of this pass.** That is the honest result rather than a skipped
step: the work was almost entirely store, domain and screen wiring, and the only new UI is one
`SegmentedControl` in a `Field`, one `AlertDialog` and one `Input` on an existing form. Each of
those behaved as its docs page says, on both viewports and in both themes.

Surfaces exercised, with what was checked:

| Surface | Used for | Result |
|---|---|---|
| `SegmentedControl` / `SegmentedControlItem` | the "Trả ngay / Ghi nợ" choice on the goods receipt | value, `onValueChange` and `accessibilityLabel` behave as documented; the E2E reaches it through the role query the other segmented controls use |
| `Field` with `description` | the supplier payment term, and the note under the payment choice | renders the hint under the control as on the docs page; same shape as `customer-business-fields.tsx` and `onboarding-screen.tsx` already use |
| `AlertDialog*` | confirming "Ghi nhận công nợ" on a receipt already received | title, description and footer behave as in the receive dialog beside it |
| `Input` with `keyboardType="number-pad"` | the partner payment term in days | as documented |
| `Text` with `numeric="tabular"` | the receipt value and the points row on the receipt | as documented |

Deduped against `docs/beeui-audit/findings-*.md` by grep: `SegmentedControl` already appears in
02, 11, 13, 14, 15, 17, 20, 21, 22, 25, 26, 28, 30 and 31; `Field` in 02 to 05, 14, 15, 20, 22,
25, 26 and 28; `AlertDialog` in 01, 03, 04, 05, 07a, 08, 11, 14, 18, 20, 25 and 28. Nothing
observed here adds to any of them, and filing a duplicate would cost the BeeUI team the triage
without adding evidence.

## Two notes that are BeePOS's own, not BeeUI's

Recorded here only so the next worker does not re-investigate them as kit problems.

1. **The Z report roll is one monospaced `Text`**, not label-and-value nodes, so a test reads a
   figure off it by finding the line and taking the trailing amount. The first attempt took
   every digit on the line and read "Thu khác (1) 250.000 đ" as 1.250.000. That is the app's own
   composition choice (it prints at 32 columns), not a `Text` behaviour.
2. **The hardware-scanner capture is app code** (`src/native/hardware-key-capture.tsx`), so
   parking it while a dialog with a field is open is a BeePOS concern. It is now driven by
   `src/features/pos/lib/capture-lock.ts`, a counter the dialogs hold, rather than by anything
   the kit exposes about overlay state. If BeeUI ever publishes "is an overlay open" as a hook,
   that file becomes three lines; it is deliberately not filed as a gap, because the web path
   already answers it from the DOM and only native needs the flag.
