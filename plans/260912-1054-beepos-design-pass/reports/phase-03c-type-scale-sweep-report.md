# Phase 03c · type scale sweep

Worker: phase 3c · 2026-09-12 · `@beemvp/beeui-*@0.86.2-rc.1`, Expo SDK 57 web.
Scope: replace the dead `text-<step>` classes of finding 15-02 with the mechanism that works,
across `src/` and `app/`, and refresh the design doc and the after shots.

## Result

`grep -rnE "(^|[^-[:alnum:]_])text-(caption|label|heading|title|body)([^-[:alnum:]_]|$)" src app`
excluding `var(--text-` hits: **0**. 171 occurrences in 38 files removed.

The plain grep from the brief still returns 2 lines, both of them the arbitrary-value form the
brief asked for (`text-[length:var(--text-label)]`), because `text-label` is a substring of
`--text-label`. No named utility is left.

## What each occurrence became

| kind | count | rewritten to |
|---|---|---|
| `<Text className="... text-step ...">` | 160 | `variant="step"`, other classes kept |
| `<Text>` with the step in a ternary | 3 | `variant="label"` / `variant={compact ? 'heading' : 'title'}` |
| `StatValue` (no `variant` prop) | 4 | `STAT_VALUE_CLASS` = `text-[length:var(--text-heading)] leading-[var(--text-heading--line-height)] font-bold` |
| `ListItem titleClassName` (a class string, not a `Text`) | 1 | same arbitrary form at the label step |
| doc comments naming the dead classes | 3 | prose ("the caption variant", "the title step") |

The 160 mechanical rewrites were done by a script that parses the `<Text>` tag, removes the
step token from the static part of `className`, and inserts `variant`; every one of them is in
the diff and was read back. Colour, weight, layout and `numeric` props were left untouched.
Where `cn()` had been dropping the step class as a colour, the colour class is still the only
colour on the element, so nothing changed there except the size.

## Measured font-size, 1440, before and after

Before = the deployed build at `beepos.beemvp.com` (the pre-sweep HEAD), after = local dev
server, same login (HN01 / 1234, Tạp hoá Cầu Giấy), same Chromium, viewport 1440 x 900.
`getComputedStyle(el).fontSize / lineHeight`.

| page | step | element | before | after |
|---|---|---|---|---|
| `/pos` | caption | `F3` hint in the search bar | 16 / 24 | 12 / 16 |
| `/pos` | label | `Tất cả` category chip | 16 / 24 | 14 / 20 |
| `/pos` | heading | `Đơn 1` cart pane header | 16 / 24 | 18 / 24 |
| `/pos` | title | grand total `0 đ` in the cart pane | 16 / 24 | 24 / 32 |
| `/orders` | caption | `15:55` time under the order code | 16 / 24 | 12 / 16 |
| `/orders` | label | `HD20260911-0016` code cell | 16 / 24 | 14 / 20 |
| `/orders` | heading | `721.146 đ` total in the preview pane | 16 / 24 | 18 / 24 |
| `/orders` | title | none on the list; the four `StatValue` figures were the only 24 pt text | 24 / 32 | 18 / 24 |

The last row is the one place where text got smaller. `StatValue`'s own default is the title
step; `order-stats-strip.tsx` asked for `text-heading`, which did nothing before and now
applies, so the stat figures drop from 24 to 18. That is what the source asks for; flag it if
the intent was 24 and the class was wrong.

## Weight: the one trap in the `variant` prop

`variant="label"` adds `font-semibold` of its own (measured: the class lands in the DOM even
when the app passes no weight). The other four variants add no weight. Taking the variant at
face value therefore turned every plain `text-label` row semibold, which flattened the orders
and customers tables: the code cell is deliberately 600 and the customer, cashier and payment
cells were 400, and after the first pass all four read 600.

Fix: the 38 swept `variant="label"` elements that carried no weight class now state
`font-normal`, plus 2 more where the weight lived in one branch of a ternary. Measured after
the fix: `Hoàng Ngọc Khoa` 14 / 20 weight 400, `HD20260911-0016` 14 / 20 weight 600, as
before the sweep. Section 4 of the design doc now says this in one line.

Untouched files that already used `variant="label"` with no weight (products, inventory,
reports, stores, 26 elements) keep rendering 600. They were like that in the shipped build;
changing them is outside this sweep.

## The one box that had to be fixed

`order-preview-pane.tsx` header: the order code at the heading step (18) no longer fits beside
a long status badge in the 320 pt pane, so it truncated to `HD20260911-0...`. The badge now
sits on its own row under the meta line and the code has the full pane width. Nothing else
overflowed: checkout at 1440 and 375, order detail at 375, customer detail at 1440, shift and
select-store at 375, POS at 375 and 1440 with and without a cart were all checked by
screenshot, and everything that grew (heading 18, title 24) fits.

## Docs

`docs/design/design-direction.md` section 4: the table's second column is now
`variant="caption"` ... `variant="title"` instead of the class names, with a paragraph on why
the named utilities are dead (no CSS, and `cn()` drops them as a colour), the arbitrary-value
fallback for targets that take only a class string, and the `variant="label"` weight note. The
class names further down (sections 4 and 5 prose, component specs) were rewritten the same way
so the doc no longer instructs anyone to write a dead class.

## Checks

- `npx tsc --noEmit`: clean.
- `npm test`: 12 suites, 193 tests, green.
- `npm run qa:e2e`: 8/8 green (7.4 min, wide and narrow, vi and en, light and dark).
- `npm run build:web`: exports clean, so nothing in the edits or in this report trips the
  Uniwind candidate parser of finding 15-03. The compiled CSS hash is unchanged
  (`global-b5f2a8b5...`), which also shows the arbitrary utilities were already in the sheet:
  BeeUI itself emits them.
- Screenshots refreshed at `docs/design/after/`: `pos-1440.png`, `orders-1440.png`,
  `products-1440.png`, `settings-375.png`. `docs/screenshots/e2e-*.png` were rewritten by the
  e2e run, as in every phase.

## For the audit owner (not filed)

BeeUI's own `Avatar` ships the dead class: the fallback renders
`text-[length:var(--text-label)] ... font-semibold text-caption` on the `sm` avatar and the
same with `text-label` on `md`. Both compute to 14 px, so the `sm` avatar's intended 12 px
never applies. This is the same defect as 15-02 but inside the package, which strengthens the
"ship the named utilities or document that they do not exist" ask. `StatValue` also has no
`variant` prop, so the arbitrary form is the only way to set its step.

## Files

38 files under `src/` (no `app/` file carried a step class), `docs/design/design-direction.md`,
4 PNGs under `docs/design/after/`. Nothing committed.
