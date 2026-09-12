# Phase 1 report: research, design direction, wireframes

Date: 2026-09-12 · author: design · status: ready for owner review

## Delivered

| Deliverable | Path |
|---|---|
| POS survey, 4 products | `docs/design/research.md` |
| Design direction, phase 2 reference | `docs/design/design-direction.md` |
| Mockups, 5 screens x 3 widths | `docs/design/mockups/{index,login,select-store,pos,checkout,orders}.html` |
| Token and chrome CSS | `docs/design/mockups/{tokens,mockup}.css` |
| Before captures of the live build | `docs/design/current/*.png`, 15 files |
| Token dump from the shipped theme CSS | `docs/design/current/theme-vars.json`, 6 themes + 73 scale tokens |
| Mockup preview renders | `plans/260912-1054-beepos-design-pass/preview/*.png` |
| Helper scripts | `plans/260912-1054-beepos-design-pass/{capture-current,shoot-mockups,shoot-map,check-mockups}.js` |

Nothing under `src/`, `app/` or `package.json` was touched.

## What the before captures show

Captured at 375, 768 and 1440 against `https://beepos.beemvp.com`, logged in through the UI
with HN01 / 1234. The five worst problems, in order of cost to a cashier:

1. **Tablet at 768 is unusable for selling.** The sidebar card takes 490 of 768 pt, so every
   product name truncates to `Trà xan...` and the four Coca-Cola variants are
   indistinguishable. See `docs/design/current/tablet-03-pos.png`.
2. **The shift banner eats the fold.** On phone the `Chưa mở ca` block plus search plus four
   rows of chips consume roughly 900 of 812 visible pt, leaving 1.5 product rows.
   See `phone-03-pos.png`.
3. **No running total anywhere.** The cart is an empty 600 pt column on desktop with no
   header, no totals and no pay button; on phone there is no docked cart bar at all.
4. **Emoji are used as the icon system** in the sidebar and the bottom tab bar. They render
   differently per platform and carry no stroke weight.
5. **Stock is a bare number in a circle.** `23` next to `9.000 đ` reads as a second price.

## Decisions taken

- **Breakpoints** phone < 768, tablet 768 to 1279, desktop >= 1280. Tablet gets a 72 pt icon
  rail instead of a 240 pt sidebar; that single change returns roughly 170 pt to the catalog
  and buys a full extra column with untruncated names.
- **Two pane POS at 1280 and up only.** Below that the cart is a docked bar plus the pushed
  route `/pos/cart`, never a Sheet, because BeeUI Sheet does not present on iOS.
- **Colour is token only.** Every role in the direction doc maps to a token name that exists
  in the shipped theme CSS. Primary is spent once per screen. Low stock is `warning`, not
  primary.
- **Category colour comes from the chart tokens** (`--chart-series-1..4`, `--chart-highlight`)
  applied at 12 percent behind a 2 letter product monogram. This gives Loyverse style visual
  recognition without any product photography, which the seed catalog does not have.
- **Icons: `lucide-react-native`.** One family, stroke props, inherits token colours,
  tree shaken. 20 named icons listed in the direction doc. `@expo/vector-icons` rejected for
  mixing five families.
- **Payment methods are a 2x2 card grid at every breakpoint.** A `segmented-control` was
  built first and thrown away: `Chuyển khoản` wraps at 375 pt and breaks the control height.
  The direction doc records the reversal.
- **Table at >= 768, ListGroup below**, with the tablet order table folded from 6 columns to
  5 (time moves under the order code) because 6 columns overflow 696 pt.
- **The tile density rule** is the load bearing one for phase 2: the product name gets 2
  lines and is never clamped shorter. If 2 lines do not fit, drop a column.

## Verified against source, not assumed

- Token names and light/dark values were read out of the compiled theme the app already
  ships: `https://beepos.beemvp.com/_expo/static/css/global-e86eefa9cc3ac8ffcb53fddb416d5fe9.css`.
  They match the vocabulary documented at <https://beeui.beemvp.com/docs/reference/tokens/>.
- **`bg-card` and `bg-accent` are not BeeUI tokens.** No `--color-card` or `--color-accent`
  exists in `theme.css` and no `.bg-card` / `.bg-accent` rule is emitted. `src/` uses
  `bg-card` 3 times and `bg-accent` once; those are silent no-ops today. Correct tokens are
  `bg-surface` and `bg-muted`. Worth a line in the BeeUI audit findings.
- Product names, variants, prices, units, store codes, addresses, phone numbers and staff
  names in the mockups come from `src/data/seed/*`. Order codes follow the real
  `HD<yyyymmdd>-<nnnn>` format from `src/data/seed/orders.ts`.
- Mockups were checked programmatically: no page errors, no dangling `<use href>` icon
  references, 82 tagged regions across the five screens
  (`plans/260912-1054-beepos-design-pass/check-mockups.js`).

## Could not verify

- **`llms-tokens.txt` does not exist.** `https://beeui.beemvp.com/llms-tokens.txt` returns
  404. Only `llms.txt`, `llms-full.txt`, `llms-components.txt` and `llms-patterns.txt` are
  published. The phase brief assumed it.
- **`llms.txt` still claims BeeUI is UNPUBLISHED** while the app installs
  `@beemvp/beeui-ui@0.86.2-rc.1` from npm. Treating `/docs/start/` as the truth, per the
  existing note in the project memory.
- **The tokens reference page renders no hex values in the served HTML**, so the light and
  dark values in the direction doc come from the compiled CSS rather than the docs page.
  If BeeUI changes the theme, the doc drifts.
- **Enumerating custom properties from the live DOM returned nothing.** The stylesheet is
  same origin but the enumeration ran before the sheet was parsed. The values were obtained
  by fetching and parsing the CSS file directly, which is what
  `docs/design/current/theme-vars.json` now holds.
- **KiotViet and Sapo publish nothing about phone or tablet layout.** Both surveys are
  desktop and terminal accurate; their responsive behaviour is marked `unverified` in
  `research.md`. Neither vendor publishes tap target sizes or accessibility guidance, and
  Square and Loyverse publish none either.
- **Density and high contrast themes exist** (`violet-light`, `violet-dark`,
  `high-contrast-light`, `high-contrast-dark` are all in the shipped CSS) but are not
  designed for in this phase.

## Open questions for the owner

All six were answered by the owner on 12/09/2026; the decisions are recorded in Revision 2
at the end of this report. Kept here for the record.

1. **Is amber the brand, or the default?** The current theme primary is `#f59e0b`, which is
   also the low stock and warning hue family. The mockups keep amber but move low stock to
   `warning` and spend primary once per screen. If BeePOS should have its own brand colour,
   `BeeThemeScope` is the supported way and this is the moment to decide.
2. **Should the catalog have images later?** The monogram plus category colour works and
   needs no assets. If real product photos are coming, the tile spec changes and phase 2
   should build the image slot now rather than retrofit it.
3. **Three F keys or none?** F3 / F8 / F9 are drawn on the desktop frames. They are web only
   and add code. Confirm they are wanted before phase 2 wires them.
4. **Does the shift strip block selling?** The mockups treat `Chưa mở ca` as a nudge, not a
   gate, matching the current build. If the chain wants the shift enforced, the strip becomes
   a blocking empty state and the POS screen changes shape.
5. **Order preview pane on desktop `/orders`:** drawn as a 380 pt third column. It is extra
   scope beyond the spec's `/orders/[id]` route. Keep or drop for phase 2?
6. **Dark mode mockups were not produced.** The direction says same tokens, no special cases,
   which should make dark free. Worth one dark render in phase 2 to prove it.

## Suggested phase 2 order

1. Shell: rail at tablet, sidebar at desktop, lucide icons, remove emoji.
2. POS tile and grid density, stock badge, category chips.
3. Cart bar, cart pane, totals block, pay button carrying the total.
4. Checkout payment cards, quick cash chips, split payment.
5. Orders table and list, then the rest of the tables by the same rule.

---

# Revision 2 · 12/09/2026

Two rounds of owner feedback applied after the first hand-off.

## A. Several open orders at once

The sell screen now keeps up to 8 orders open and the cashier switches between them, the
KiotViet and Sapo `nhiều hoá đơn` pattern. Customer A wanders off for the fish sauce,
customer B is rung up, A comes back.

- `docs/design/mockups/pos.html`: an order tab strip at all three widths with 3 open orders
  (`Đơn 1 · 4 · 81.500 đ` active, `Đơn 2 · 1 · 185.000 đ`, `Đơn 3 · Trống`), a pinned `+`,
  and a close control on the active tab. A fourth column labelled CHI TIẾT draws the five
  tab states at 1:1, including the disabled `+` at 8 orders and the confirmation dialog. It
  is a component detail sheet, not a fourth device frame.
- Placement: the strip is shell chrome, so it sits in the same slot at every width, directly
  under the app header and above the shift strip. On desktop it spans the full working width
  instead of sitting on the cart pane, because 380 pt holds only 2 tabs, because the catalog
  is identical for every order, and because KiotViet places multi-bill tabs the same way.
- The cart bar and the desktop cart pane header now name the order.
- `checkout.html` carries a static `Đơn 1` badge and `Còn 2 đơn đang mở`, and states that
  finishing returns the cashier to `Đơn 2`, not to an empty screen. There is deliberately no
  tab strip on checkout: switching order mid payment is never correct.
- `docs/design/design-direction.md` section 6 `Nhiều đơn cùng lúc`: strip and tab spec,
  overflow by scrolling with no menu, 8 order cap with a toast, `Alt+1` to `Alt+8` plus
  `Alt+N` and `Alt+W` on web, and in-memory-only persistence with no copy that implies a
  save.
- `docs/design/research.md`: a `Multiple open orders` line per vendor with URLs, Square and
  Loyverse Open Tickets now cited; the pattern is adopted as items 13 and 14 and the
  named-and-saved ticket model is added to the rejected list.

**Component choice, and why it is not `Tabs`.** BeeUI `Tabs` documents that a trigger
"cannot carry its own press handler" and that "pressing the active tab does nothing"
(<https://beeui.beemvp.com/docs/components/tabs/>), which kills the close control precisely
where it has to live. `Chip`/`ChipGroup` documents no remove affordance and no leading or
trailing slot (<https://beeui.beemvp.com/docs/components/chip/>). `SegmentedControl` has
equal width segments and does not scroll. The strip is therefore an app-owned composite:
a horizontal `ScrollView` of `Pressable` rows using `Badge`, `Text` and `IconButton`. This
is the second real gap found in BeeUI during this phase and belongs in the audit.

**Accessibility exception, declared.** The close control is a 32 pt square, not 44 pt. On
touch the tabs sit next to each other and a close on every tab produces mis-taps, so only
the active tab carries one and closing a non-empty order always routes through an
`alert-dialog` naming the order, its line count and its total.

## B. Product images

- Tile is now image led at all three widths: image slot on top (1:1 phone and tablet, 4:3
  desktop, which is what keeps 4 columns at 1440), stock badge or in-cart counter overlaid
  on the image corner, then name on 2 lines, unit line, price loudest. Out of stock
  greyscales and dims the image and keeps the badge at full strength.
- Fallback when `imageUrl` is missing is the category monogram inside the same slot at the
  same size, so the grid never reflows. `Phô mai con bò cười` is drawn in the fallback state
  on purpose so the owner can see both side by side.
- Cart lines and the orders preview pane carry the same image as a 40 pt thumbnail with the
  same fallback.
- Phase 2 loading is specified: `expo-image`, `contentFit="cover"`, `transition={150}`, and
  a `placeholder` (blurhash if the catalog ever carries one, otherwise the accent tint). The
  slot is reserved before the image resolves; a tile is never sized from a loaded image.
- Mockup images are 8 inline SVG illustrations tinted per category (bottle, can, carton,
  sachet, bag, jar, box, multipack). No external image host, nothing to fetch.
- `research.md` gained an `Images on tiles` line per vendor. Square and Loyverse both fall
  back to a flat colour tile rather than an empty frame, which is what the monogram slot
  does here.

**Shared sprite.** All UI icons and the 8 product illustrations moved into
`docs/design/mockups/sprite.js`, which inserts the symbol sheet next to its own script tag
during parse. That keeps every `<use href="#...">` resolving under `file://`, where an
external `.svg` sprite would not load. The five screen files lost about 3.9 KB each;
`pos.html` is now 698 lines including the new tab strip and detail column.

## C. Fixes and consequences

- `orders.html` desktop: the preview pane was clipping the `Tổng tiền` column. The pane is
  now 320 pt and the table is 6 columns with the time folded under the order code, the same
  rule already used at 768. Every column is fully visible at 1440. The fold-or-drop rule is
  now written into direction section 8 so it is not rediscovered per screen.
- Payment method chooser became a 2x2 card grid at every width, including phone. A
  `segmented-control` was built first and thrown away because `Chuyển khoản` wraps at 375 pt
  and breaks the control height.
- Preview PNGs regenerated for all six pages plus `pos-map.png`, which shows the component
  map switched on.
- `design-direction.md` is at the 300 line cap and `research.md` at 226 of 250, so both
  absorbed the new sections by compressing existing prose rather than by growing.

## D. Owner decisions now closed

Brand stays BeeUI amber. Image slot is real and images are in. Shift strip stays a nudge.
Orders preview pane stays and no longer clips. F keys stay web only. Dark render deferred
to phase 2.

## E. New consequence to watch

A 1:1 image slot over 2 columns at 375 pt leaves roughly 3 tiles above the fold, down from
about 6 with the old monogram tile. That is the same trade Square and Loyverse make on
phone, and it is recorded in the tile spec. If it proves too slow at the till the fix is a
compact list mode with a 40 pt thumbnail, not a shrunken grid image. Worth watching in the
first phase 2 device test.
