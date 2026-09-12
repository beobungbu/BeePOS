# Phase 3: polish after the restyle (backlog, not started)

Collected from worker reports and Ambrose review of phase 2 (2026-09-12).

## App
- Tendered amount input shows raw digits (`200000`); format live as `200.000 đ` on blur or keystroke.
- SegmentedControl labels "Hôm nay" / "Tuỳ chọn" wrap at 375 on /reports; shorten or switch to chips on phone.
- Three copies of the 40 pt product thumbnail (pos, orders, products) collapse into `src/components/product-thumb.tsx`.
- `ShellHeader` should accept a screen title so screens stop rendering a second header row.
- `Product.variantLabel` (e.g. `330ml · chai`) in types + seed so the tile shows the unit line the mockup has.
- Desktop order strip fits 6 tabs at 1440; overflow scroll is there, confirm the active tab auto-scrolls when 7 or 8 are open.
- Phone: with 1:1 images only about 3 tiles are above the fold; check on a real device, consider 3 columns at 375 with smaller type.
- Login on phone has tight horizontal padding; align with the 16 pt page gutter.
- Large Dynamic Type: content under the grown tab bar (carried over from day one).
- VoiceOver / TalkBack pass on POS with the order strip (roles: tab, close button labelled with the order name).

## Verification still owed
- iOS simulator and Android emulator happy path on the restyled build (login, open two orders, pay one, land on the next).

## BeeUI findings to file (from `docs/beeui-audit/findings-14-restyle-*.md`)
- 14-05 major: DialogTrigger variant="outline" keeps the primary label colour in dark (unreadable).
- 14-06, 14-07, 14-08, 14-20..14-23, 14-30..14-33: minor, umbrella 5.
