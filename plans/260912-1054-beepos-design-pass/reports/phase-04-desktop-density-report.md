# Phase 4 · desktop density (>= 1280) · worker report

Date: 2026-09-12 · scope: decisions 1 to 7 of
`plans/260912-1054-beepos-design-pass/phase-04-desktop-density.md`, desktop only.
Tablet (768 to 1279) and phone (< 768) are untouched by design and verified by spot capture.

## Result

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | pass |
| `npm test` | pass, 16 suites / 214 tests (3 new suites: preference storage, shell rail, dictionary parity) |
| `npm run qa:e2e` | 8 / 8 |
| `npx expo export --platform all` | pass (web 5.4 MB, ios 7.2 MB, android 7.5 MB) |
| console / page errors while capturing | none |

## Chrome before the first data row, 1440 x 900

Measured with Playwright against the running web build, `getBoundingClientRect().top` of
`table tbody tr` (first data row) and of `table thead tr` (shell chrome, i.e. everything the
screen draws above the table's own column header).

| Screen | Before, shell chrome | After, shell chrome | Before, incl. column header | After, incl. column header |
|---|---|---|---|---|
| `/inventory` | 419 pt · 46.6 % | **169 pt · 18.8 %** | 419 pt · 46.6 % | **209 pt · 23.2 %** |
| `/orders` | 308 pt · 34.2 % | **169 pt · 18.8 %** | 308 pt · 34.2 % | **209 pt · 23.2 %** |
| `/reports` | 639 pt · 71.0 % | 529 pt · 58.8 % | 639 pt | 569 pt · 63.2 % |
| `/products` | not baselined | **121 pt · 13.4 %** | | 161 pt · 17.9 % |

`/inventory` is 250 pt lighter, a 60 percent cut, and `/orders` 139 pt, a 45 percent cut. Both
now open with the same 169 pt: 48 pt header plus its border, 56 pt toolbar, 64 pt stat strip.
That is the arithmetic floor of decisions 2, 3 and 4, and matches the 168 pt the designer's
revised `docs/design/design-direction.md` (section 1, "Desktop density") predicts.

Acceptance read: `/inventory` <= 30 percent is met on both readings. `/orders` <= 20 percent is
met on shell chrome (18.8) and missed by 3.2 points once the table's own column-header row is
counted (23.2) — the same 23.1 percent the designer's inventory frame states for that reading,
so the two numbers agree and the target is only reachable by dropping one of the three mandated
bands. Flagged rather than silently resolved.

`/reports` keeps its stat cards on purpose (decision 4), so its first table row is still far
down the page; its toolbar did collapse from two rows to one.

## Decisions, as built

1. **Sidebar collapse.** `sidebarCollapsed` in `src/data/settings-store.ts`, persisted through
   the new `src/lib/preference-storage.ts` (`localStorage` on web, module memory on native, the
   same trade `remembered-store.ts` documents). Chevron `IconButton` at the bottom of both the
   sidebar and the rail, labelled `Thu gọn menu` / `Mở rộng menu`. `[` toggles on web and is
   ignored while focus is in an input or a contenteditable. Tablet keeps the rail and hides the
   toggle; phone keeps the tabs.
   Verified: `/pos` opens at 72 pt, `/orders` at 240 pt, `[` on `/orders` gives 72 pt and writes
   `beepos.sidebar-collapsed=true`, `[` with the search box focused changes nothing, and after a
   reload and a fresh login `/orders` is still 72 pt.
2. **Header, one 48 pt row.** Title with its subtitle inline and muted on the left; store
   switcher chip `HN01 · Tạp hoá Cầu Giấy` (a `DropdownMenu` with `variant="ghost"` trigger,
   items carrying each branch's address) and the avatar on the right. The address is gone from
   the desktop header. A screen that registers no title (the POS catalogue) falls back to the
   nav label for the route, not the store name the chip already carries. Phone and tablet keep
   the two-line header.
3. **Toolbar.** New `src/components/toolbar.tsx`: one 56 pt row on desktop that never wraps,
   filters left, actions right; below 1280 the same children wrap. Used by orders, products,
   inventory, customers, reports, stores and staff. The result count was removed from the orders
   filter bar and now appears only in the pagination footer.
4. **Stat strip.** New `src/components/stat-strip.tsx`: 64 pt, borderless, caption label over a
   heading value, vertical `Separator` between items. Used by orders, inventory and customers.
   Reports keeps its cards.
5. **Inventory low-stock chip.** The `AlertBanner` and the `Tồn kho / Sắp hết` `Tabs` pair are
   gone on desktop; a warning-tinted `17 sắp hết` chip in the toolbar carries both and toggles
   the filter, exposing `accessibilityState.selected`. Below 1280 the banner and the tab pair
   stay exactly as they were.
6. **POS category chips.** One horizontally scrolling row at desktop (phone already scrolled,
   tablet still wraps), with a chevron `IconButton` pinned at the right edge that advances the
   row by 240 pt. No gradient fade: `LinearGradient` is not a dependency of this app and a
   translucent overlay over `bg-surface` would have to hard-code a colour, which the token rules
   forbid.
7. **Row density and max width.** `src/components/table-row-density.ts` puts a `min-h-12` floor
   on desktop body rows (BeeUI exposes no table density prop, see the findings file). Admin
   content is capped at `max-w-[1600px]` and centred; POS keeps the full width.

## Extras taken from the designer's frames

The designer landed `docs/design/mockups/inventory.html` and the revised `pos.html` / `orders.html`
desktop frames before the styling step, so the inventory screen matches them rather than the
plainer phase text: a `Tìm tên hoặc SKU` search in the toolbar (desktop only), the document
actions reordered to `Kiểm kê`, `Chuyển kho`, `Nhập hàng` with only `Nhập hàng` primary, a
five-item stat strip that adds `Đang đặt trước`, and the 32 pt `ProductThumb` in the product
column.

Not taken from the frames, on purpose:
- the orders frame adds a `Xuất Excel` action and an `Đã huỷ` stat. Both are new behaviour
  (an export path, a void counter in `orderStats`) rather than density work, so they are left
  for a follow-up rather than smuggled into this phase.

## POS catalogue

5 columns at 1440 with the rail (tiles 178 pt), 4 with the sidebar expanded (tiles 184 pt), both
measured from the rendered tiles. `/pos*` opens in rail mode whatever the saved preference says;
the toggle inside POS flips a session-only override (`posSidebarCollapsed`, deliberately not
persisted) so expanding the sidebar to find a screen does not rewrite the admin preference, and
leaving POS re-arms the rail. This is decision 1 read literally ("forces the rail while
remembering the preference for other routes; the toggle still works inside POS"); a hard force
would have made the in-POS toggle a control with no effect and made the two POS captures
identical.

## Screenshots

`docs/design/after/`: `pos-1440-rail`, `pos-1440-expanded`, `orders-1440`, `inventory-1440`,
`reports-1440`, `products-1440`, `pos-1920`, `orders-1920`, plus the regression spot checks
`pos-768` (rail, wrapped chips, 4 columns, two-line header, unchanged) and `orders-375` (bottom
tabs, chip filters, compact stat row, unchanged).

## Files

New: `src/components/toolbar.tsx`, `src/components/stat-strip.tsx`,
`src/components/table-row-density.ts`, `src/components/shell/sidebar-toggle.tsx`,
`src/components/shell/use-shell-rail.ts`, `src/lib/preference-storage.ts`,
`src/lib/__tests__/preference-storage.test.ts`,
`src/components/shell/__tests__/use-shell-rail.test.ts`,
`src/i18n/__tests__/dictionary-parity.test.ts`,
`docs/beeui-audit/findings-17-desktop-density.md`.

Changed: the four shell files, `src/data/settings-store.ts`, the orders list screen, filter bar,
stats strip and table, the inventory screen, table and list utils, the products list screen,
toolbar and table, the customers list screen and table, the reports screen and period filter,
the stores and staff list screens, the POS screen, layout hook and category chips, and the six
`common` / `inventory` / `customers` / `pos` dictionaries (new keys in both locales:
`common.shell.collapseMenu`, `common.shell.expandMenu`, `inventory.lowStockChip`,
`inventory.searchPlaceholder`, `inventory.stat.reserved`, `customers.stats.*`,
`pos.categoryScrollNext`).

## BeeUI findings

`docs/beeui-audit/findings-17-desktop-density.md`, three entries: no per-table row density
(only the global three-step `applyDensity`), `DropdownMenuItem` has no secondary-line slot, and
`Chip` still has no tonal variant (evidence for the existing chip line, not a new issue).
Nothing was patched in the published packages.

## Open questions

- `/orders` at 20 percent needs one of the three mandated bands to go. Keep 23.2 percent with
  the column header counted, or drop the orders stat strip to reach it?
- The inventory search is desktop only, matching the mockup and the "tablet and phone unchanged"
  rule. Should tablet and phone get it in a follow-up?
