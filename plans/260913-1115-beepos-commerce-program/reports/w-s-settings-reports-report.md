# W-S report: promotions, loyalty, reports, notifications, org switch, per store settings

Status: DONE_WITH_CONCERNS
Date: 2026-09-13 · worker: W-S (wave 1) · branch: main (not committed)

Row G is in, plus the promotions and loyalty half of row B. Seven report cuts share one period
filter, the notification centre is live behind a bell that runs the `notify.ts` rules on boot
and after every relevant store write, the avatar menu switches chain, and every branch can
override what it prints and charges. All five gates are green.

One acceptance item is only partly met and needs a decision: an org switch re-points the
storage scope correctly, but the second chain has no store, staff or account of its own, so it
cannot be signed into. Detail in section 7.

## Gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm test` | 47 suites, 676 tests passed (58 of them new here) |
| `npx eslint src app` | 0 errors, 2 warnings (both pre-existing `Array<T>` nits in other workers' files) |
| `npm run qa:e2e` | 62 passed, 10 skipped, 5.2 min (`--output /tmp/claude-501/pw-ws`, `BEEPOS_E2E_BASEURL=http://localhost:8124`) |
| `npx expo export --platform all` | web + android + ios bundles built |

Screenshots at 375 and 1440 in `docs/design/after/commerce/`: `promotions`, `loyalty`,
`report-category`, `report-hour`, `report-product-profit`, `report-debt`, `valuation-history`,
`notifications`, `org-switch`, `store-settings` (20 files). They are produced by
`scripts/qa/e2e/specs/commerce-settings-shots._discover.spec.ts`, which is outside the gate.

## 1. Promotions (`/promotions`, `/promotions/[id]`)

List and editor on one screen from 768 up, because editing a programme is always a comparison
with the ones already running; the phone keeps the list and pushes the editor. Ended programmes
stay at 55 percent opacity so next season can clone them, and `Cộng dồn` is its own column
because stacking is the main cause of a wrong price.

- Status is four states, not two: `isActive` says whether the chain wants it to run, the window
  says whether it can. `active / scheduled / paused / expired`
  (`src/features/promotions/lib/promotion-status.ts`).
- The window is inclusive of its last day: a programme ending on the 30th runs until the 30th
  closes. `formToPromotion` stores `endsAt` at 23:59:59.999.
- The preview prices one real product in the scope through `applyPromotion`, at the quantity the
  offer needs (three units under buy 2 get 1), and prices the form as typed rather than as
  saved, so the figure moves while the value is being edited.
- Scope is `Toàn bộ / Theo danh mục / Theo sản phẩm`; branches are chips, and picking none means
  the whole chain, which is what the record's absent `storeIds` means.

## 2. Loyalty (Settings, `Tích điểm`)

Four blocks in the mockup's order: earn, redeem, per tier multiplier, tier thresholds, each with
a worked example in real money. The form asks "cứ mỗi 10.000 đ, khách nhận 1 điểm" and stores
`earnPerVnd = points / amount`, because that is how a shop owner states the rate and not how the
record holds it. The multiplier example reads
`Đơn 250.000 đ của khách hạng Vàng tích 25 x 1,5 = 37 điểm, làm tròn xuống` and is computed with
`pointsEarnedFor`, so it can never drift from what the till will award.

## 3. Reports: seven cuts, one period

`/reports` keeps the overview it had. Six sibling routes were added: `/reports/category`,
`/reports/hours`, `/reports/products`, `/reports/staff`, `/reports/inventory-valuation`,
`/reports/debt`. The period and branch filters moved into a module store
(`use-report-filters.ts`), so picking "30 ngày" on one cut and opening another keeps the
question the same; `ReportsFrame` draws the chips, the filters and the export action once.

- **By category**: horizontal bars, share percentage per row, and a line stating the rows add up
  to the period revenue. A line whose product left the catalogue lands in an `other` bucket
  rather than being dropped, so they still do.
- **By hour**: one column per trading hour between the first and last hour that sold anything,
  peak in `primary` and the rest in `series-1`. Hours are read on the **device clock**, not in
  UTC like the rest of the reports: "when is the shop busy" is a wall-clock question, and a
  grocer opening at 06:30 must not read the peak at 11:00.
- **Product gross profit**: rows come from W-M's `productGrossProfit` /`grossProfitTotals`
  (`src/features/money/lib/gross-profit.ts`) as they asked, so this report and the money screens
  are the same arithmetic off the same `unitCostSnapshot`. This screen resolves names and SKUs
  and passes the revenue-recognised orders in.
- **By staff**: credits the sales rep named on the order and falls back to the cashier, with a
  totals row that can be checked against the overview by hand.
- **Inventory valuation**: weekly points plus today, current point in `primary`, and a per store
  table of current against 30 days ago with a chain total. See the caveat in section 8.
- **Debt summary**: receivable and payable with their overdue halves and both aging tables,
  narrowed to a branch through `entriesForStore` when the branch filter is set.

Everything is in `src/features/reports/lib/report-analytics.ts` (pure, 20 unit tests).

## 4. Notification centre

- **Bell** in the shell header at every width, with an unread badge. Tablet and desktop open a
  popover with the five newest rows plus "Đánh dấu đã đọc tất cả" and "Xem tất cả thông báo";
  the phone goes straight to the screen, which is what the spec asks for.
- **`/notifications`** groups by day (`Hôm nay`, `Hôm qua`, then the date), carries the kind as a
  semantically coloured badge, a relative time, and a second line with a concrete number.
  Reading a row marks it read and navigates to what it is about; a row whose ref has no screen
  still marks itself read rather than navigating to a 404.
- **Copy comes from `kind` + `templateKey` + `params`**, never from the stored strings, so a row
  written in Vietnamese renders in English after a language switch (tested). Two additions on
  top of W-T's API, both in the presentation layer: money params (`overdue`, `balance`) are
  formatted before the template is filled, and a lot whose `days` has gone negative renders an
  `expiredLot` template instead of "hết hạn còn -3 ngày". A stored `templateKey` is validated
  against `TEMPLATE_KEYS_BY_KIND` before it is trusted to name a dictionary entry.
- **The runner** (`src/features/notifications/notification-runner.ts`) is registered once from
  `AppShell`, subscribes to the nine source stores, debounces 400 ms and caps each rule at 5
  rows. A rule that throws is caught and logged; the bell keeps showing what it had.

## 5. Org switch

The avatar menu lists the chains the signed-in account belongs to
(`orgsForMember(memberships, orgDirectory, accountId)`) with their store count, ticks the
current one, and warns before switching, naming how many parked orders stay behind. Confirming
calls `setActiveOrgId(orgId)`, drops the session and reloads into `/login`. Dropping the session
is not a shortcut: the session slice is itself chain-scoped, so the chain being switched to has
none, and keeping the old one would mean a till signed into one chain writing orders into
another's storage.

## 6. Per store settings and `effectiveStoreSettings`

`/stores/[id]` gained a `Cài đặt cửa hàng` section: receipt header, receipt footer, tax rate,
opening hours, printer. An empty field means inherit, never "print nothing", and the chain's
value is the placeholder so the reader can see what they are inheriting. A badge counts what
this branch overrides.

**For W-P and W-I**, as promised:

```ts
import { effectiveStoreSettings } from '../settings/lib/effective-store-settings';
const s = effectiveStoreSettings(orgId, storeId);
// { receiptHeader, receiptFooter, taxRate /* fraction, 0.1 is ten percent */,
//   openingHours, printerName?, overrides: StoreSettingField[] }
```

- `resolveStoreSettings(storeSettings, storeId, chain)` is the pure form the tests drive;
  `useEffectiveStoreSettings(storeId)` is the hook for a screen that must re-render.
- The receipt screen and the Z report should read this, not `useSettingsStore` directly: branch
  first, chain second.
- `taxRate` is stored as a fraction to match the chain setting; the form takes percent.
- Opening hours are written to `StoreSettings` **and** to the org store's `storeHoursById`,
  because the store form above the section edits the same fact and two fields disagreeing about
  when a shop opens is worse than either being wrong.
- Printer names come from `src/features/settings/lib/printers.ts`, now shared by the chain
  setting and the branch override so a branch cannot name a printer the chain list lacks.

## 7. Nav, palette and shortcuts

`NAV_ITEMS` gained `Khuyến mãi` (`/promotions`, `catalog.manage`) and `Tiền` (`/money`,
`reports.store`), both `primaryOnMobile: false`, so the phone tab bar stays at four areas plus
`Thêm`. `SUB_NAV_ITEMS` gained `Giá bán` (`/pricing`), `Thông báo` (`/notifications`),
`Đơn đặt hàng` (`/inventory/purchase-orders`), `Lô sắp hết hạn` (`/inventory/expiring`),
`Nhập sản phẩm từ CSV` (`/inventory/import`) and `Trả / đổi hàng` (`/pos/returns`). The command
palette reads both lists, so all of them are reachable by `Cmd/Ctrl+K` and the route guard knows
what each costs. No new keyboard shortcut, so the shortcut sheet is unchanged.

**One deliberate deviation from W-I's snippet**: `/pos/returns` is registered with `pos.refund`
rather than `pos.sell`. A return is a refund, the order-detail refund action is already gated on
`pos.refund`, and a cashier who may not refund should not reach the same outcome by typing the
URL. Cashiers do not hold `pos.refund` in `ROLE_DEFINITIONS`, so this hides the screen from
them; say the word and it is a one line change.

Four glyphs the shell needed (`bell`, `tag`, `percent`, `wallet`, plus `check`) live in
`src/components/shell/shell-icons.tsx` rather than in `src/components/icons.tsx`: that file is
shared by every feature this phase and four workers editing one `as const` map is a merge
conflict per worker. `ShellIcon` takes an app icon name or one of these. Fold them into the app
set during integration.

## 8. Concerns

1. **The second chain cannot be signed into (acceptance item "switch org and see the second
   org's store").** The switch itself works and is proved by E2E: the menu lists both chains with
   their store counts, the confirmation warns about parked orders, and
   `beepos.persist.active-org` is `chuoi-demo-2` afterwards. What cannot work today is arriving
   anywhere useful: the seed gives `chuoi-demo-2` a directory entry and a membership but no
   `Store`, `Staff` or `UserAccount`, and `useSessionStore.login` resolves the staff record from
   `account.staffId` rather than through `OrgMembership` for the active chain. So signing in
   after the switch lands on the demo chain's four branches. Both files are outside W-S's
   ownership (`src/data/seed/**`, `src/data/session-store.ts`). The fix is two small pieces:
   seed one store, one staff row and the owner's membership staff id for the second chain, and
   have `login` (and `currentOrgId`) pick the staff record via the membership for the active
   org. Please assign to W-T or the integrator.
2. **The valuation curve is flat on seed data, correctly.** Every seeded goods receipt line is
   priced at `product.costPrice` (`src/data/seed/operations.ts`), so the weighted average never
   moves and all six weekly points are the same figure. The screen says out loud that quantities
   are today's and the series shows how cost moved; if a more convincing demo is wanted, W-T
   need only price a few receipt lines above or below the catalogue cost.
3. **No stock history exists**, so a weekly valuation point values today's quantities at the
   cost in force on that date. The report states this rather than implying a measurement the
   data cannot support. A real stock-history slice would be a foundation change.
4. **`/money` and `/pricing` nav entries were added before those screens existed** (W-M and W-P
   have since landed them). If either route ever moves, the entry has to move with it; the route
   guard reads the same list, so a stale entry is a silent redirect rather than a 404.
5. **The desktop notification popover shows the five newest rows only.** The mockup's 400 pt
   popover shows five, so this matches, but there is no "unread only" filter inside the popover;
   that lives on the screen.

## 9. Files

Created: `src/features/promotions/**` (screen, detail screen, form, list, preview, editor hook,
`lib/{promotion-status,promotion-form-state,promotion-labels}.ts`, 18 tests) ·
`src/features/notifications/**` (screen, runner, `lib/notification-presentation.ts`, 13 tests) ·
`src/features/reports/{category,hours,product-profit,staff,valuation,debt}` screens,
`components/{reports-frame,horizontal-bars,hour-columns}.tsx`,
`lib/{report-analytics,format}.ts` and 18 tests ·
`src/features/settings/components/loyalty-section.tsx`,
`src/features/settings/lib/{effective-store-settings,printers,org-switch}.ts` and 7 tests ·
`src/features/stores/components/store-settings-section.tsx` ·
`src/components/shell/{shell-icons,notification-bell}.tsx` ·
`src/i18n/{promotions,notifications}.{vi,en}.ts` ·
`app/(app)/promotions/{index,[id]}.tsx`, `app/(app)/notifications/index.tsx`,
`app/(app)/reports/{category,hours,products,staff,inventory-valuation,debt}.tsx` ·
`scripts/qa/e2e/specs/commerce-settings.spec.ts` (10 tests) and
`scripts/qa/e2e/specs/commerce-settings-shots._discover.spec.ts` ·
`docs/beeui-audit/findings-28-settings.md`.

Modified: `src/components/shell/{nav-items,shell-header,app-shell,sidebar,nav-rail,bottom-tab-bar,more-sheet}.tsx`
· `src/features/reports/{report-screen,use-report-filters}.ts(x)` ·
`src/features/settings/{settings-screen,components/printer-section}.tsx` ·
`src/features/stores/store-detail-screen.tsx` ·
`src/i18n/{common,reports,settings,stores}.{vi,en}.ts` and `src/i18n/index.ts` (two namespace
registrations).

Untouched: `src/domain/**`, `src/data/**` except through their public APIs, every other
feature, `src/components` outside `shell/`, all BeeUI packages. Nothing committed.

## Open questions

1. Concern 1 above is the only blocking one: who takes the second chain's seed and the
   membership-aware login?
2. `/pos/returns` on `pos.refund` instead of `pos.sell`: confirm, or I flip it.
3. The loyalty form asks for one earn rate per amount ("cứ mỗi 10.000 đ → 1 điểm"). If the owner
   ever wants a rate per branch, `LoyaltyRule` is chain-wide today and that is a type change.
