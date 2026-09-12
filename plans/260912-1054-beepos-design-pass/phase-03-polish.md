# Phase 3: polish after the restyle (app items done, two verification items open)

Collected from worker reports and Ambrose review of phase 2 (2026-09-12).
App items done 2026-09-12, see `reports/phase-03-polish-report.md`.

## App
- [x] Tendered amount input shows raw digits (`200000`); format live as `200.000 đ` on blur or keystroke.
- [x] SegmentedControl labels "Hôm nay" / "Tuỳ chọn" wrap at 375 on /reports; shorten or switch to chips on phone.
- [x] Three copies of the 40 pt product thumbnail (pos, orders, products) collapse into `src/components/product-thumb.tsx`.
- [x] `ShellHeader` should accept a screen title so screens stop rendering a second header row.
- [x] `Product.variantLabel` (e.g. `330ml · chai`) in types + seed so the tile shows the unit line the mockup has.
- [x] Desktop order strip fits 6 tabs at 1440; overflow scroll is there, confirm the active tab auto-scrolls when 7 or 8 are open. It did not; the strip now scrolls by measured position.
- [x] Phone: with 1:1 images only about 3 tiles are above the fold; check on a real device, consider 3 columns at 375 with smaller type. 3 columns under 400: 2 tiles above the fold became 6.
- [x] Login on phone has tight horizontal padding; align with the 16 pt page gutter. The gutter was 0: `SafeArea` drops the padding it is given (finding 15-01).
- [ ] Large Dynamic Type: content under the grown tab bar (carried over from day one).
- [ ] VoiceOver / TalkBack pass on POS with the order strip (roles: tab, close button labelled with the order name).

## Raised by the polish pass
- The five type steps are written as `text-caption` / `text-label` / `text-heading` / `text-title`
  class names, which generate no CSS (finding 15-02): every phase 2 screen renders at body size.
  Fixed in the components this phase touched; the rest of the tree needs a sweep to `variant`.

## Verification still owed
- iOS simulator and Android emulator happy path on the restyled build (login, open two orders, pay one, land on the next).

## BeeUI findings to file (from `docs/beeui-audit/findings-14-restyle-*.md`)
- 14-05 major: DialogTrigger variant="outline" keeps the primary label colour in dark (unreadable).
- 14-06, 14-07, 14-08, 14-20..14-23, 14-30..14-33: minor, umbrella 5.
