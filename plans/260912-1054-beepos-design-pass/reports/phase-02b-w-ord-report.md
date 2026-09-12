# Phase 2B report · W-ORD, orders and customers · 2026-09-12

Worker: W-ORD. Working tree left uncommitted. Ownership respected: every edit is inside
`src/features/orders/**`, `src/features/customers/**`, `src/i18n/orders.*.ts`,
`src/i18n/customers.*.ts`, plus this report and `docs/beeui-audit/findings-14-restyle-w-ord.md`.
`app/(app)/orders/**` and `app/(app)/customers/**` are one-line re-exports and needed no change.
Nothing under `scripts/qa/e2e/**`, `src/components/**`, `src/domain/**`, `src/data/**` or
`src/i18n/common.*` was touched.

## What changed

### Orders list (`/orders`)
Rebuilt as a three-band screen: title block, filter bar, stat cards, data area, pagination
footer, with the data area filling the remaining height from tablet up so the footer stays put.

- **Filter bar** (`components/order-filters-bar.tsx`). Phone: search plus one horizontally
  scrolling chip row carrying the date presets and the statuses, split by a rule. Tablet:
  search, date preset select, status select. Desktop: 320 pt search with the `F3` hint, store,
  date preset, status and cashier selects, then the result count. The old pair of `DatePicker`
  fields did not disappear: they appear under the row when the preset is `Tuỳ chọn`.
- **Date presets** are a real filter value now (`today` / `days7` / `days30` / `custom`) with
  the range derived from the local calendar day, not `toISOString()`.
- **Stat cards** (`components/order-stats-strip.tsx`). Four cards from tablet up (Số đơn,
  Doanh thu, Trung bình mỗi đơn, Hoàn trả), 2 x 2 at 768 so the revenue figure is never
  clipped, one row at desktop. Phone gets the mockup's compact three-figure strip.
- **Table** (`components/order-table.tsx`). Six columns at desktop, five at tablet (Thu ngân
  is the one that goes), time folded under the order code, status as a worded badge, total
  right aligned and tabular, cancelled totals struck through and muted.
- **Preview pane** (`components/order-preview-pane.tsx`, desktop only, 320 pt). Header with
  the code, date, cashier and status, the customer row, the lines with 40 pt thumbnails,
  totals, the order timeline, a link to the full detail route, and `In lại hoá đơn` plus
  `Hoàn tiền` (destructive outline) in the footer. Pressing a row at desktop selects it here;
  at tablet and phone the same target opens `/orders/[id]`.
- **Phone rows** (`components/order-list-group.tsx`) follow the direction doc's three-line
  format: code and total, then time and customer, then the status badge and payment method,
  with a chevron trailing. Day headers appear only when the active range spans more than a day.
- **Pagination footer**: `Hiển thị 1 đến 12 trong 56 đơn` next to the pager. Page size follows
  the band (20 phone, 10 tablet, 12 desktop, matching the mockup).

### Order detail (`/orders/[id]`)
Back control, code and status badge with a date, cashier and store caption, and the three
actions on one row. Content is one column on phone and a 3:2 split from tablet up: items with
thumbnails and the totals block on the left, order summary and timeline on the right. The
line `Table` is gone; the same `OrderLinesList` renders in the detail, the preview pane and
nothing else, so the two views cannot drift.

### Customers (`/customers`, `/customers/[id]`)
Same rules. Table from 768 up with an avatar in the name cell, right aligned points and
spend, and `Đơn gần nhất` dropped at tablet rather than clipped. Phone rows are three lines
(name and spend, phone and points, tier badge and last order). The detail screen leads with a
card carrying the avatar, name, tier badge, phone and three stat cards, then the existing
orders / points / info tabs; the order history rows now match the orders list rows exactly,
and the info form is capped at 480.

### Shared, inside the feature
- `hooks/use-order-actions.ts`: one place for refund, void and reprint, so the detail screen
  and the preview pane run the same sequence (record refund, restock, move status, correct the
  customer) instead of two copies.
- `lib/order-presentation.ts` and `lib/fill.ts`: date presets, average order value, page range,
  `12/09/2026` and `14:32` formats, payment summary, placeholder substitution. 17 unit tests.
- `components/order-timeline.tsx`, `components/order-totals.tsx`, `components/order-lines-list.tsx`,
  `components/order-line-thumb.tsx`, `lib/initials.ts` (customers).
- Destructive confirmations name their object: `Huỷ đơn HD20260912-0007?`,
  `Xoá khách hàng Vũ Minh Nga?`.
- Deleted: `src/features/orders/hooks/use-is-wide.ts` and
  `src/features/customers/hooks/use-is-wide.ts`. Both screens use `useBreakpoint()` now, so no
  feature invents its own threshold.
- i18n: new keys in both locales (date presets, result counts, pagination, preview pane, stat
  labels, row accessibility labels, the two named confirmations); dead keys from the old
  layouts removed. `vi` and `en` are key-for-key equal (108 orders keys, 81 customers keys).

## Deviations from the mockup, and why

1. **Desktop rows select instead of navigating.** The mockup shows both a preview pane and a
   table; a row press cannot do two things. At desktop the press selects the pane (and the
   pane header links to the full detail); at tablet and phone it opens the detail route, as
   the direction doc's table rule asks. Verified that this keeps the e2e journey's orders step
   working, see "E2E contract" below.
2. **The press target is the first cell, not the whole row.** BeeUI's `TableRow` takes no press
   handler and the web renderer emits a real `<table>`, so a row-wide target would need one
   `Pressable` per cell and one accessible name per cell. Filed as 14-31.
3. **`Hoàn trả` in the preview pane footer reads `Hoàn tiền`.** The app names this action
   `Hoàn tiền` everywhere else and the e2e journey clicks it by that exact name. Two words for
   one action would be a copy defect, and the mockup's label is the only place it appears.
4. **Status text stays `Hoàn một phần`, not the mockup's `Hoàn 1 phần`.** The e2e journey
   asserts on this string and the brief froze the status badge text.
5. **`Xuất Excel` is not built.** There is no export in this prototype; a button that does
   nothing is a lie about the product, the same call 2A made about "Quên mã PIN?".
6. **The screen title lives in the screen, not the app header.** The mockup's header carries
   `Đơn hàng` over `Tạp hoá Cầu Giấy · 12/09/2026`; the shipped `ShellHeader` (2A, not mine)
   carries the store name and address. Rather than edit a file I do not own, each screen renders
   its own title block and its subtitle drops the store name to avoid repeating the header.
   Write request below.
7. **Default range is `7 ngày`, not `Hôm nay`.** It preserves the pre-restyle behaviour, it
   keeps the list populated (seed orders spread over 30 days across five stores), and the
   order created during the e2e journey is inside it either way.
8. **The result count sits under the desktop filter row**, not at its right edge: five controls
   plus a 320 pt search already fill 1152 pt of working width at 1440.
9. **`AlertBanner` for "cannot delete a customer with orders" is gone.** The direction doc
   allows one banner per screen and only on `/inventory`. The condition is permanent, so the
   delete control is disabled and explains itself through `accessibilityHint`.

## E2E contract (not run here, W-POS owns `scripts/qa/e2e/**`)

The journey's orders and customers steps were replayed against this build with the journey's
own locators, at the wide project's 1280 viewport and at 390:

- `page.locator('a[href^="/orders/"], [role="button"]').filter({ hasText: /^HD/ }).first()`
  still resolves to the newest order's row at 375, 768, 1280 and 1440.
- Clicking it opens `/orders/<id>` at 375 and 768, and selects the preview pane at 1280/1440.
- Exactly one element matches `getByRole('button', { name: 'Hoàn tiền', exact: true })` at
  every width, so the strict-mode click cannot become ambiguous.
- The whole partial refund chain (`Hoàn tiền` to `Hoàn theo dòng` to `Tăng số lượng hoàn` to
  `Xác nhận hoàn tiền` twice) completes from the preview pane at 1280, and `Hoàn một phần`
  becomes visible afterwards.
- `/customers`: `getByPlaceholder(/.*/).first()` is still the search field, typing
  `Vũ Minh Nga` and clicking the name lands on `/customers/<id>`, and `/điểm|points/i` is
  visible there.
- Zero console errors at 375, 768, 1440 and in dark mode at 1440.

## Gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | pass, no errors anywhere in the tree |
| `npm test` | pass, 182 tests in 11 suites (17 new in `src/features/orders/lib/__tests__`) |
| `vi` / `en` dictionary parity | pass, identical key sets for both namespaces |
| `bg-card` / `bg-accent` / em-dash / emoji in owned files | none |
| Console errors on web, 375 / 768 / 1440 / dark 1440 | 0 |

`npx expo export --platform all` and `npm run qa:e2e` were left to the integrator: both build
the whole tree, which currently contains two other workers' in-flight edits.

## Screenshots

`docs/design/after/`: `orders-{375,768,1440}.png`, `order-detail-{375,768,1440}.png`,
`customers-{375,768,1440}.png`, `customer-detail-{375,768,1440}.png`, plus
`orders-dark-1440.png`. Dark mode reads cleanly: no unreadable text, badges and the selected
row tint both hold up.

## BeeUI findings

`docs/beeui-audit/findings-14-restyle-w-ord.md`:
- **14-30 major** `TableRow selected` sets `aria-selected` and paints nothing, although the
  docs call it a "Visual highlight". Proven with computed styles.
- **14-31 major** no table row can be pressable or linked, so a list of records cannot open its
  detail route the way `ListItem` does. W-ADM hit the same wall independently.
- **14-32 minor** `SearchInput` forwards no ref, so the `F3` shortcut has to reach the DOM node.
- **14-33 minor** `ListItem` synthesizes no accessible name once `title` is a node, which is
  every three-line row in this design.
- Not refiled: W-ADM's 14-21 (right aligned money needs `items-end text-right`, adopted here)
  and 14-22 (`Badge` stretches inside a `TableCell`, wrapped in a `flex-row` View here).

## Write requests (files I do not own)

1. **`src/domain/money.ts`.** `formatVND` returns `9.000 ₫` (U+20AB). The copy rule in
   `docs/design/design-direction.md` section 10 is `9.000 đ`, lowercase `đ` (U+0111), and it
   is what every mockup renders. The non-breaking space is already right. One-line fix in a
   file no 2B worker owns; it changes every money string in the app, so it needs one owner.
2. **`src/components/product-thumb.tsx`.** Three copies of the 40 pt thumbnail now exist
   (`features/products`, `features/orders`, and whatever W-POS built for the cart line) because
   the three features were restyled in parallel and `src/components/` belongs to none of them.
   They should collapse into one after 2B merges. The orders copy is
   `src/features/orders/components/order-line-thumb.tsx` and carries a comment saying so.
3. **`src/components/shell/shell-header.tsx`.** The mockups put the screen title in the app
   header. Letting `AppShell` take a title (or reading it from the route) would remove the
   title block every 2B screen now renders for itself, and stop the store name and the screen
   title stacking.
