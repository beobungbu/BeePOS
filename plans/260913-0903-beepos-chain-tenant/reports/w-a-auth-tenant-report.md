# W-A · auth and tenant (phase 6, wave 1)

Status: DONE_WITH_CONCERNS · 2026-09-13 · worker W-A

## What landed

**Domain.** `src/domain/auth.ts` is new and is the only authority on credentials, sessions and
permissions: a pure TypeScript SHA-256 (checked against Node's `crypto` and the published
vectors), `hashPassword` = SHA-256 over `salt:password` stretched by 10 000 further digests,
`verifyPassword` with a length-independent compare, salts and reset codes, session issue /
expiry / lock / unlock / auto-lock, and the `RoleDefinition` matrix behind `can(role, permission)`.
The first digest goes through `expo-crypto`'s `digestStringAsync` where the module exists and
falls back to the TS digest otherwise; both are SHA-256, so a hash made on a device verifies in
Node and in the test runner. Anything that is not 64 hex characters falls back rather than being
trusted, which is what keeps the jest auto-mock (it answers with an empty string) from producing
hashes that would never verify on a real device.

**Role matrix** (as decided by the coordinator, `ROLE_DEFINITIONS`):

| Role | Permissions |
|---|---|
| owner | all 16 |
| manager | all except `reports.chain`, `stores.manage`, `settings.manage` |
| cashier | `pos.sell`, `pos.discount`, `orders.view`, `customers.manage`, `cash.movement` |

Nav lists (`visibleNavItems`), the command palette and the route guard in
`app/(app)/_layout.tsx` all read the same `NavItem.permission`, so a hidden item and a blocked
route cannot disagree. A cashier sees Bán hàng, Đơn hàng, Khách hàng and nothing else; typing
`/reports` lands back on `/pos`.

**Tenant.** Every root entity carries `orgId`; the seed has one chain (`org-1`,
code `chuoi-tap-hoa`) with 4 stores, 12 staff, 2 registers per store and 12 accounts.
Persisted data keys are `beepos.persist.<orgId>.<slice>`; the chain itself and the device
preferences (theme, language, density) stay unscoped, and a tiny `beepos.persist.active-org`
key records which chain the data keys address.

**Screens.** `/login` (email + password, remember, forgot, "Khởi tạo chuỗi mới"),
`/select-store` (branch, with the till count and the recent branch), `/select-register` (till,
each row saying whether a shift is open on it and who has it), `/lock` (PIN pad with 72 pt keys,
plus "Đổi thu ngân" which takes the incoming cashier's PIN and changes only who the next orders
belong to), `/change-password` (also forced after an invite), `/forgot-password` (email, 6 digit
code shown in a toast, new password), `/onboarding` (chain, first store with its first till,
owner account), `/staff` (invite by email, account status badges), `/staff/permissions` (matrix
from 768 up, one role at a time with switch rows on a phone). Settings gained a Bảo mật section
with the auto-lock minutes and a way into the password change. The avatar menu gained
"Khoá màn hình".

## Seeded credentials

Password for every account: `BeePOS@2026` (documented demo value, README section "Signing in";
only its salted hash is stored). PINs are unique per chain.

| Email | Staff | Role | Stores | PIN | Account |
|---|---|---|---|---|---|
| `owner@chuoi.vn` | Nguyễn Văn An | owner | HN01, HN02, HCM01, DN01 | 1000 | active |
| `binh@chuoi.vn` | Trần Thị Bình | manager | HN01 | 2001 | active |
| `cuong@chuoi.vn` | Lê Văn Cường | manager | HN02 | 2002 | active |
| `dung@chuoi.vn` | Phạm Thị Dung | manager | HCM01 | 2003 | active |
| `em@chuoi.vn` | Hoàng Văn Em | manager | DN01 | 2004 | active |
| `giang@chuoi.vn` | Vũ Thị Giang | cashier | HN01 | 3001 | active |
| `hai@chuoi.vn` | Đặng Văn Hải | cashier | HN01 | 3002 | active |
| `hoa@chuoi.vn` | Bùi Thị Hoa | cashier | HN02 | 3003 | active |
| `khoa@chuoi.vn` | Ngô Văn Khoa | cashier | HN02 | 3004 | active |
| `lan@chuoi.vn` | Đỗ Thị Lan | cashier | HCM01, DN01 | 3005 | active |
| `minh@chuoi.vn` | Phan Văn Minh | cashier | HCM01 | 3006 | active |
| `nga@chuoi.vn` | Trịnh Thị Nga | cashier | DN01 | 3007 | invited, must set a password |

The twelve stretched hashes are precomputed constants in `src/data/seed/accounts.ts` (10 000
rounds is about 70 ms each, so hashing them at import would cost most of a second on every cold
boot). `src/domain/__tests__/auth.test.ts` re-derives one and checks every salt, so the
constants cannot drift away from the hashing code.

## Type contract deviations

Applied exactly as frozen, with three additions, all additive:

1. `GoodsReceipt.supplierId?: string` is **optional** and `supplierName` stays. The contract has
   `supplierName` becoming `supplierId`, but the `Supplier` entity, its CRUD and the receipt's
   supplier picker are wave 2 (W-C). Making it required now would have meant building the picker
   inside W-A's scope and breaking the inventory E2E in between. `Supplier` itself is in
   `types.ts` as specified, so W-C can switch the field over and drop the optional marker.
2. `Shift.registerId?: string` added. The register picker has to say "ca đang mở · Vũ Thị Giang"
   on the till that is occupied, and without a register on the shift nothing can attribute it.
   Optional because a shift opened before this phase has none. `shift-store.ts` stamps it from
   the session, and the seed alternates tills so both states are visible. W-C's Z report will
   want the same field.
3. `Organization` has no tax-code field, so the mockup's "Mã số thuế" input is not in the
   onboarding wizard. The contract is frozen; add `taxCode?: string` if the wizard should ask.

Everything else matches the contract, including `Permission`, `RoleDefinition`, `UserAccount`,
`Session`, `Register`, `Supplier`, `StorePrice`, `CashMovement` and `AuditEvent`.

## Gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | pass |
| `npm test` (jest) | pass, 334 tests in 24 suites (48 of them new in `auth.test.ts` and `session-store.test.ts`) |
| `npx eslint src app` | 0 errors, 2 warnings, both pre-existing `Array<T>` style warnings outside this scope |
| `npm run qa:e2e` | 22 passed, 3 skipped, 1 failed: `reports-settings.spec.ts` custom range at the wide viewport, see below |
| `npx expo export --platform all` | pass (web, ios, android bundles) |
| Screenshots | `docs/design/after/auth/{login,select-register,lock,permissions,onboarding}-{375,1440}.png` |

`eslint` could not run at all before this phase: `eslint.config.js` requires `eslint/config` and
`eslint-config-expo/flat`, and neither package was in `package.json`. Both are now
devDependencies (`eslint@^9`, `eslint-config-expo@^57`), which is the only dependency change
besides `expo-crypto`.

## Concerns

1. **One E2E failure, W-B's area.** `[wide] reports and settings › report period switch and a
   custom range` cannot find the `Từ ngày` / `Đến ngày` buttons at 1280. W-B's in-flight change
   moves the reports period filter into the `Bộ lọc` popover at desktop widths
   (`src/components/toolbar.tsx`, `report-screen.tsx`), so the buttons are behind a popover the
   spec never opens. The narrow project passes the same test. The spec needs W-B's update; no
   auth or tenant code is involved (the login inside it succeeds and the 30 day step passes).
2. **A new chain still boots on the seeded catalogue.** Onboarding creates the chain, stores,
   register, owner account and points the persisted data keys at the new `orgId`, so its orders,
   stock and carts start empty. The catalogue, customers and stock *stores* still seed themselves
   from `src/data/seed/**`, which is stamped `org-1`, so a brand new chain sees the demo
   catalogue until org-filtered selectors land (the gap analysis lists that under Tenant, and it
   touches every data store, which is outside this worker's file ownership).
3. **The persistence scope is resolved at import time.** Creating a chain writes the new scope
   and reloads on web; on native the old scope stays until the next launch. Fine for a
   prototype, worth revisiting if two chains on one device becomes a real flow.
4. **`PasswordInput` shows an English "Show" / "Hide".** BeeUI renders that text hardcoded and
   `showLabel` / `hideLabel` only change the accessible name (its own docs say so). The mockup
   note asked for `PasswordInput`, so it stayed, with both labels passed in Vietnamese for screen
   readers. Logged as `docs/beeui-audit/findings-22-auth.md`, 22-01, the only visible English
   string in the auth flow.

## BeeUI findings

`docs/beeui-audit/findings-22-auth.md`: 22-01 PasswordInput's untranslatable toggle text
(major, a11y), 22-02 Stepper's undocumented-in-types 1-based numbering that clamps silently,
22-03 SegmentedControlItem takes children where Radio and Checkbox take `label`, 22-04 no
toast-options type exported, 22-05 Stepper has no horizontal orientation, 22-06 a disabled
Switch looks identical on and off.

## Files owned and touched

New: `src/domain/auth.ts`, `src/data/seed/{org,registers,accounts}.ts`,
`src/features/auth/{lock,select-register,change-password,forgot-password,onboarding}-screen.tsx`,
`src/features/auth/{routes,password-reset,use-auto-lock}.ts`,
`src/features/auth/components/pin-pad.tsx`,
`src/features/staff/{permissions-screen.tsx,invite-staff.ts}`,
`src/features/staff/components/invite-staff-dialog.tsx`,
`src/features/settings/components/security-section.tsx`, `src/i18n/auth.{vi,en}.ts`,
`app/(auth)/{select-register,lock,change-password,forgot-password,onboarding}.tsx`,
`app/(app)/staff/permissions.tsx`, `src/domain/__tests__/auth.test.ts`,
`docs/beeui-audit/findings-22-auth.md`, `scripts/qa/e2e/specs/auth-shots._discover.spec.ts`.

Changed beyond the auth scope, all of it the `orgId` stamp on entity creation (one line each):
`src/data/{customer-store,shift-store}.ts`, `src/features/pos/checkout-screen.tsx`,
`src/features/inventory/{count,receipt,transfer}-detail-screen.tsx`,
`src/features/products/{categories-screen,product-form-screen}.tsx`,
`src/features/stores/{store-new,store-detail}-screen.tsx`,
`src/features/customers/screens/customers-list-screen.tsx`, plus `orgId` in the fixtures of six
existing test files. No file owned by W-B (`toolbar.tsx`, `stat-strip.tsx`,
`src/features/reports/**`) was touched.
