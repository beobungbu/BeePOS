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
