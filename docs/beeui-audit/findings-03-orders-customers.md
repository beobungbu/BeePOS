# BeeUI audit findings, Phase 03 (orders, refunds, customers)

Consumed only via https://beeui.beemvp.com per-component docs pages
(`/docs/components/<name>/`, fetched with curl and stripped of HTML tags per the phase
brief), `/docs/guides/table/`, `/docs/guides/date-time/`, `llms-components.txt`, and the
installed npm packages `@beemvp/beeui-*@0.86.2-rc.1`. `~/workspace/BeeUI` was never opened;
the per-component pages carried full Props tables for every component used in this phase
(Table, Select, DatePicker, Calendar, Dialog, AlertDialog, Tabs, Timeline, Pagination,
ListGroup, ListItem, Stat, Skeleton, DescriptionList, Chip/ChipGroup, Avatar, Badge, Field,
Textarea, SearchInput, Toast), so the public docs were fully sufficient this phase.

## 03-01, llms-components.txt and llms-full.txt claim DatePicker is native-only with no web
file; the canonical dates-times guide and the component's own Platform-behavior section say
the opposite
- Area: llms
- Severity: major
- Source consulted: `https://beeui.beemvp.com/llms-components.txt` ("Native-only: DatePicker
  / DateTimePicker are the system pickers and ship only as `*.native.tsx` (no
  `date-picker.web.tsx`) - on Web they render nothing usable. Use Calendar ... for date
  selection on Web (ADR-008).") vs. `https://beeui.beemvp.com/docs/guides/date-time/`
  ("DatePicker ... Web: Calendar in a Popover. Native: the OS system picker.") and
  `https://beeui.beemvp.com/docs/components/date-picker/` Platform-behavior section: "This
  family is split by platform and renders from `date-picker.native.tsx` (iOS and Android),
  `date-picker.web.tsx` (Web)."
- Expected (per `llms-components.txt`, the agent-facing entry point the phase-00 report
  documents workers reaching first): `DatePicker` has no usable web behavior at all; a web
  consumer must reach for `Calendar` directly.
- Actual: `DatePicker` ships a real `date-picker.web.tsx` that renders a `Calendar` inside a
  `Popover`, fully interactive with keyboard grid navigation, `min`/`max`, `isDateDisabled`,
  `clearable`, and `Field` integration, exactly as used for the orders list's date-range
  filters and the customer birthday field in this phase. Verified empirically, not just from
  docs: `DatePicker` renders and opens on Chromium web in `/orders` (date-range filters,
  default last-7-days) and the "Thêm khách hàng"/"Thông tin" birthday field, screenshots in
  `docs/screenshots/phase-03-orders-wide-light.png` show the two date triggers formatted as
  "5 thg 9, 2026" / "11 thg 9, 2026" after `locale="vi-VN"`, and clicking one opens a working
  calendar popover with no console errors (Playwright run, `CONSOLE_ERRORS_COUNT: 0`).
- Repro: read `llms-components.txt`'s `date-picker` line and its "Platform behavior (summary)"
  callout in isolation, without ever following a link to `/docs/components/date-picker/` or
  `/docs/guides/date-time/` (`llms-components.txt` links only to the repo source path, not the
  docs site page); an agent following only the AI entry point would incorrectly avoid
  `DatePicker` on web and reimplement a Popover+Calendar composite that BeeUI already ships.
- Workaround: used `DatePicker` directly per the guide/per-component page, ignoring
  `llms-components.txt`'s claim.
- Suggested fix for BeeUI: regenerate `llms-components.txt`'s "Platform behavior (summary)"
  section (or the whole file) to match the current `date-picker.web.tsx` implementation and
  the dates-times guide; today it actively steers AI agents away from a component that works.

## 03-02, IconButtonProps omits `size`, confirmed independently (see also phase-01 finding
01-01)
- Area: api-types
- Severity: minor
- Source consulted: `https://beeui.beemvp.com/docs/components/icon-button/` Props table.
- Expected: the refund dialog's per-line qty +/- controls are `IconButton`s in a dense row;
  expected a `size="sm"` like every other Button-family trigger.
- Actual: `IconButtonProps` carries `Omit<ButtonProps, 'accessibilityLabel' | 'children' |
  'labelClassName' | 'size'>` - `size` is explicitly removed, confirmed by `tsc --noEmit`
  rejecting `size="sm"` with TS2322 on first attempt.
- Repro: `<IconButton accessibilityLabel="x" size="sm" onPress={...}>-</IconButton>` in
  `src/features/orders/components/refund-dialog.tsx` fails to typecheck.
- Workaround: dropped `size` from both qty-stepper `IconButton`s; accepted the fixed
  footprint.
- Suggested fix for BeeUI: same as 01-01 - either expose `size` on `IconButton` or document
  the fixed-size constraint outside the Props table's `Omit<...>` type signature.

## 03-03, `DatePicker`'s `locale` prop formats a *selected* value but does not localize the
built-in `placeholder` / month-nav accessibility labels
- Area: docs-public
- Severity: minor
- Source consulted: `https://beeui.beemvp.com/docs/components/date-picker/` Props table
  (`placeholder` default `'Select a date'`, `nextMonthAccessibilityLabel` default `'Next
  month'`, `previousMonthAccessibilityLabel` default `'Previous month'`, all three
  documented as fixed English defaults, separate from `locale`, which the same table
  describes only as "Explicit-only (ADR-008) ... Defaults to `'en-US'`" for value
  formatting).
- Expected: passing `locale="vi-VN"` to fully localize the birthday `DatePicker` in the
  "Thêm khách hàng" dialog, matching the app's Vietnamese-default copy.
- Actual: with only `locale="vi-VN"` set and no value selected, the trigger displays the
  English default "Select a date" (confirmed via Chromium screenshot before the fix, taken
  during this phase's QA). The three strings are independent props from `locale`, not
  derived from it, a plausible trap since every other locale-aware prop on this component
  (`formatValue`, weekday grid) does follow `locale`.
- Repro: `<DatePicker locale="vi-VN" value={null} onValueChange={...} />`, no value selected
  -> trigger reads "Select a date" in English.
- Workaround: explicitly pass `placeholder`, `nextMonthAccessibilityLabel`, and
  `previousMonthAccessibilityLabel` with Vietnamese strings (see
  `src/i18n/customers.vi.ts` / `.en.ts`, `addDialog.selectDate` / `.nextMonth` /
  `.previousMonth`).
- Suggested fix for BeeUI: either derive these three strings from `locale` via a small
  built-in dictionary (en/vi at minimum), or state explicitly in the `locale` prop's
  description that it only affects value formatting, not the component's own copy.

## 03-04, ChipGroup (`selectionMode="single"`) has no built-in "clear selection" affordance
for an optional filter
- Area: gap
- Severity: minor
- Source consulted: `https://beeui.beemvp.com/docs/components/chip/` Props table (`ChipGroup`
  `selectionMode="single"` renders `accessibilityRole="radiogroup"`, each `Chip` a radio).
- Expected: the orders list's status filter and the customers list's tier filter both need an
  "any status/tier" state as well as four/four concrete choices - a common filter-bar
  pattern.
- Actual: `ChipGroup` in `single` mode is radiogroup semantics with no documented "tap the
  selected item again to deselect" behavior, and no fifth "none" state without a caller-owned
  synthetic option.
- Workaround: added an explicit `all`-valued `Chip` (`t('orders.filters.allStatuses')` /
  `t('customers.tier.all')`) as one of the group's members and map it to `undefined` in the
  domain filter, rather than trying to model "no selection" as ChipGroup's native empty
  state.
- Suggested fix for BeeUI: document the "add an explicit all/any option" pattern in the Chip
  page's composition notes, since it is the only supported way to get an optional single-select
  filter today.

## 03-05, `TimelineStatus`'s allowed literal values are not published anywhere on the public
page
- Area: docs-public
- Severity: nit
- Source consulted: `https://beeui.beemvp.com/docs/components/timeline/` - `TimelineItemProps`
  documents `status: TimelineStatus` (default `'default'`) but, unlike `Pagination`
  (`PaginationItemType`), `Chip` (`ChipSelectionMode`), or `Table`
  (`TableSortDirection`), the Timeline page has no "Related exported types" section
  spelling out `TimelineStatus`'s members.
- Expected: same "Related exported types" callout every other multi-value prop's page has.
- Actual: absent; the only values visible anywhere on the page are the two used in the
  Showcase code excerpt (`'success'`, `'primary'`).
- Repro: fetch `/docs/components/timeline/`, search for "Related exported types" - zero
  matches, versus the same search on `/docs/components/pagination/` or `/docs/components/chip/`.
- Workaround: inferred `'default' | 'success' | 'destructive'` from the Showcase excerpt and
  a badge/alert-banner-style semantic-tone guess, then confirmed all three compile clean via
  `tsc --noEmit` against the order detail Timeline (created/paid/refund/void events).
- Suggested fix for BeeUI: add the same "Related exported types" section to the Timeline page
  that every other enum-prop component page already has.

## 03-06, an inline `.filter()`-that-returns-a-new-array inside a zustand selector crashes
React with "Maximum update depth exceeded" (not a BeeUI bug, but a real crash hit while
wiring this phase's screens to the phase-0 store pattern, worth flagging for other phases
sharing the same `useOrderStore`/`useCustomerStore` convention)
- Area: gap
- Severity: major
- Source consulted: none (own repro, React 19 + zustand 5.0.15 + `useSyncExternalStore`
  behavior).
- Expected: `useOrderStore((state) => state.refunds.filter((r) => r.orderId === id))` looked
  like the same "derive from a store field" pattern phase 0's own stores already use with
  `.find()`.
- Actual: `.filter()` (unlike `.find()`) always returns a brand-new array reference, so
  `useSyncExternalStore`'s snapshot comparison sees a "changed" value on every single
  read, which triggers an immediate re-render, which reads again, forever - manifests as a
  React "Uncaught Error: Maximum update depth exceeded" overlay, caught live via Chromium
  screenshot while QA-ing the customer detail screen (Đơn hàng tab) and the order detail
  screen (refund history / Timeline).
- Repro: `useCustomerStore((state) => state.orders.filter((o) => o.customerId === id))`
  rendered inside `CustomerDetailScreen` -> infinite loop, "Maximum update depth exceeded",
  `app/(app)/customers/[id].tsx (4:10)`.
- Workaround: select the raw array (`state.orders`, a stable reference) and derive the
  filtered list with a component-level `useMemo(() => allOrders.filter(...), [allOrders,
  id])` instead of filtering inside the selector. Fixed in
  `src/features/orders/screens/order-detail-screen.tsx` (refunds) and
  `src/features/customers/screens/customer-detail-screen.tsx` (orders).
- Suggested fix: not a BeeUI issue: worth a one-line note in whatever "store conventions"
  doc phase 0 or phase 5 maintains, since every phase's screens read from the same
  `src/data/*-store.ts` files and the trap is easy to hit again (`filter`/`map`/`sort`
  directly inside a zustand selector).

## Not filed (already covered)
Nothing else from `docs/beeui-audit/issue-index.md`'s existing entries applies to components
first used in this phase; `Table`, `Select`, `Dialog`/`AlertDialog`, `Tabs`, `Pagination`,
`ListGroup`/`ListItem`, `Stat`, `Skeleton`, `DescriptionList`, `Avatar`, `Badge`, `Field`,
`Textarea`, `SearchInput`, and `useToast` all behaved exactly as documented, with no console
warnings/errors across the full orders + customers flow (login -> orders list -> filter ->
order detail -> refund (full and partial-by-line) -> void-eligibility gating -> customers
list -> add customer (with VN phone validation) -> customer detail -> points tab (manual
adjust) -> info tab; `CONSOLE_ERRORS_COUNT: 0` on every Playwright/Chromium run at both
1280px and 390px, light and dark).
