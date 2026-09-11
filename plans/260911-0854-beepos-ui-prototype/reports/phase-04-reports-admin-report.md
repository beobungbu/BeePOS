# Phase 04 - Reports dashboard, stores, staff, settings - report

Status: DONE
Date: 2026-09-11

## Scope covered

- `/reports`: period filter (Hom nay / 7 ngay / 30 ngay / Tuy chon via Popover+Calendar),
  store filter (Tat ca for owner/manager, locked to own store for cashier), 5 Stat cards
  with delta badges vs previous period, plain-View bar chart with accessible labels,
  revenue-by-store table with Progress share bars, top-10-products table, payment-mix list
  with Progress, cashier-performance table, export button -> toast. Two-column layout >=768px,
  stacked <768px.
- `/stores`, `/stores/[id]`, `/stores/new`: table/list (code, name, address, phone, staff
  count, active Switch), detail (DescriptionList, staff ListGroup, today Stat cards, inline
  edit form, deactivate/reactivate via AlertDialog), create form.
- `/staff`, `/staff/[id]`, `/staff/new`: list (avatar, name, role Badge, store Chips, status),
  detail (name/phone Fields, role RadioGroup, stores Checkbox list in FormGroup, active
  Switch, "Dat lai PIN" Dialog with two 4-digit OTPInputs), create form.
- `/settings`: extended the existing (working) theme/locale controls into 9 sections -
  Giao dien (theme + density via `applyDensity`), Ngon ngu, Cua hang mac dinh, Hoa don
  (Textarea header/footer + Switch show-logo + live receipt preview Card), Thue (0/5/8/10%),
  Thanh toan (VietQR bank fields), May in (mock Select + test-print toast), Ve ung dung
  (DescriptionList: app version from `app.json`, BeeUI version from `package.json`, Expo SDK
  from `expo/package.json`, all read via `require(...)` at build time), Dang xuat (AlertDialog
  driven by `SettingsItem`, controlled state instead of a nested trigger - see finding 04-06).

## Domain (tested, pure)

- `src/domain/reports.ts`: `periodRange`, `previousPeriod`, `filterOrders`, `totalRevenue`,
  `totalRefunds`, `averageBasket`, `grossProfit`, `deltaPercent`, `revenueByDay`,
  `revenueByStore`, `topProducts`, `paymentMix`, `cashierPerformance`. Revenue-recognition and
  gross-profit modeling assumptions are documented in the file header (no per-order refund
  amount field exists in the shared domain model, so refunds are approximated from fully
  `refunded` orders' `total`).
- `src/domain/org.ts`: `canAssignRole`, `roleOutranks`, `validatePin`/`pinsMatch` (return typed
  `errorCode`s, not hardcoded strings, so the UI localizes them), `staffForStore`,
  `storesForStaff`, `staffCountForStore`.

## Stores

- `src/data/settings-store.ts` (phase-0 skeleton, extended in place): added `defaultStoreId`,
  `receiptShowLogo`, `bankInfo`, `printerId` + setters, on top of the existing
  theme/locale/density/tax/receipt-text/currency fields.
- `src/data/org-store.ts` (new): stores + staff CRUD, seeded from `src/data/seed`; also tracks
  `staffActiveById` and `storeHoursById` as separate keyed maps rather than widening the
  shared `Staff`/`Store` domain types (those fields don't exist there and are owned by
  phase 0).
- Reports reads `order-store`, `catalog-store` (read-only, only currently-exported selectors),
  plus the new `org-store` for stores/staff.

## Files modified / created

Route files: `app/(app)/reports/index.tsx`, `app/(app)/stores/{index,[id],new}.tsx`,
`app/(app)/staff/{index,[id],new}.tsx`, `app/(app)/settings/index.tsx` (rewired to the new
`SettingsScreen`, same working theme/locale behavior preserved).

Feature code: `src/features/reports/**` (7 files), `src/features/stores/**` (6 files),
`src/features/staff/**` (6 files), `src/features/settings/**` (10 files). All files <300 lines
(largest is 130 lines).

Domain: `src/domain/reports.ts`, `src/domain/org.ts`,
`src/domain/__tests__/{reports,org}.test.ts`.

i18n: `src/i18n/{reports,stores,staff,settings}.{vi,en}.ts` (8 files); one-line-per-namespace
addition to the shared merge point `src/i18n/index.ts` (8 import lines total, alongside another
worker's `pos.vi`/`pos.en` lines added concurrently - no conflict).

Docs: `docs/beeui-audit/findings-04-reports-admin.md` (7 findings), 16 screenshots in
`docs/screenshots/phase-04-*.png`.

## Verification (real command output)

`npx tsc --noEmit` (via `npm run typecheck`, which also regenerates uniwind artifacts first):
exit 0, zero errors, across the whole repo (all four in-progress parallel phases included).

`npx jest`: `Test Suites: 8 passed, 8 total / Tests: 140 passed, 140 total` - phase 04 alone
contributes 37 of those (20 in `reports.test.ts`, 17 in `org.test.ts`), exceeding the >=20
acceptance bar on its own.

`npx expo export --platform web --output-dir dist-phase04`: succeeded - 3.1MB JS + 51KB CSS,
18 assets.

Playwright/Chromium (`npx playwright --version` -> `1.61.1`) drove the full flow at 1280px and
390px: login (HN01 / 1234) -> select-store (owner has all 4 stores) -> in-app client-side
navigation (sidebar at 1280, "Them" bottom-sheet at 390 - full page.goto() reloads were tried
first and silently bounced back to /login because session-store is in-memory only with no
persistence, so the script was rewritten to click through the shell instead) to Bao cao, Cua
hang (+ detail), Nhan vien (+ detail), Cai dat (light + dark via the working theme
SegmentedControl). `CONSOLE_ERRORS_COUNT: 0` across the whole run at both viewports. A separate
targeted run additionally confirmed zero console warnings on the staff detail (Radio/Checkbox)
screen and the full reset-PIN dialog flow (open -> fill two OTPInputs -> confirm -> toast ->
close), screenshotted at `/tmp/after-reset-pin.png` (not committed, ad hoc verification only).

## Manual cross-check of one day (acceptance requirement)

Ran a scratch jest test against the real seed data for "today" (2026-09-11, matching the
sandbox's actual UTC clock) with no store filter:

```
todayOrders count (all statuses): 6
paidToday count (paid + partial_refund): 5
paidToday: order-16 (store-2, 721146, partial_refund), order-50 (store-3, 815664, paid),
           order-129 (store-2, 425150, paid), order-244 (store-3, 317100, paid),
           order-209 (store-4, 1271160, paid)
totalRevenue: 3550220
averageBasket: 710044
grossProfit: 1095720
```

This matches the `/reports` dashboard screenshot exactly: Doanh thu 3.550.220 d, Don hang 6,
Gia tri TB/don 710.044 d, Loi nhuan gop 1.095.720 d. The scratch test file was deleted after
running (not part of the committed test suite).

## Acceptance checklist (phase-04 spec)

- [x] Dashboard numbers reconcile with seed (manual cross-check above).
- [x] Period switch updates all sections (domain functions are pure and re-derive from the
      selected range; verified visually via the 7-day toggle in the Playwright run).
- [x] Bar chart has accessible labels (each bar column carries `accessible
      accessibilityLabel="<date>: <formatted VND>"`).
- [x] Settings: theme + locale + density apply instantly (density confirmed functional, not a
      gap - see finding 04-02); receipt preview reflects header/footer text and the show-logo
      toggle live.
- [x] Screenshots 390 + 1280, light + dark for reports and settings (4 files each, 8 total,
      plus 8 more for stores/staff at both viewports = 16 total in `docs/screenshots/`).
- [x] Unit tests >=20 green (37 actual).
- [x] Findings logged: Stat API (04-... covered implicitly via component docs read), Progress
      (used, no issue), DatePicker range UX (04-01), OTPInput (04-07), FormGroup+Checkbox a11y
      (04-05), density support (04-02), SettingsItem (04-06). Plus Field+Switch (04-03) and
      Chip-as-tag (04-04).

## Issues encountered / deviations

- The phase spec assumed `DatePicker` works for the custom-range picker; it is native-only.
  Used `Popover` + `Calendar` instead (documented, see finding 04-01) - a deviation from the
  literal spec text but the only working option on web, and the one the BeeUI docs themselves
  recommend.
- Settings' receipt preview does not import `src/features/pos`'s real receipt component (that
  folder was being actively developed by a parallel phase-1 worker for this phase's entire
  duration); built a small local, self-contained preview instead. Documented in
  `receipt-preview.tsx` and in the findings file's cross-phase note.
- `Staff`/`Store` domain types (owned by phase 0) have no `active`/`hours` fields; tracked as
  separate keyed maps in `org-store.ts` rather than widening a type I don't own.
- `pinsMatch`/`validatePin` were refactored mid-implementation from hardcoded Vietnamese error
  strings to typed `errorCode`s so the UI can localize them for both `vi` and `en` - a
  correctness fix caught before commit, not left as a known gap.

## Commit

Staged only phase-04-owned paths (route files under `app/(app)/{reports,stores,staff,settings}`,
`src/features/{reports,stores,staff,settings}/**`, `src/domain/{reports,org}.ts` + tests,
`src/data/{settings-store,org-store}.ts`, `src/i18n/{reports,stores,staff,settings}.{vi,en}.ts`,
the one-line addition to `src/i18n/index.ts`, `docs/beeui-audit/findings-04-reports-admin.md`,
the 16 `docs/screenshots/phase-04-*.png` files, and this plan's status row / report). Commit
hash recorded in the final status message below.
