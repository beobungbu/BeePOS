# BeePOS chain + multi-tenant upgrade (phase 6)

Status: IN PROGRESS · 2026-09-13 09:10 · owner: Ambrose
Source: `docs/chain-multitenant-gap-analysis.md` (P1 list) and owner decisions of 2026-09-13 09:03:
6.1 proper auth; 6.2 prototype persistence accepted; 6.3 toolbar must stay one row, header must not eat content; 6.4 unify reports to the stat strip.

## Type contract (frozen for this phase; only W-A edits `src/domain/types.ts`, others request changes via report)
```ts
export interface Organization { id: string; code: string; name: string; plan: 'free' | 'pro' | 'enterprise'; currency: 'VND'; taxRate: number; receiptHeader: string; receiptFooter: string; createdAt: Date }
export type Permission =
  | 'pos.sell' | 'pos.refund' | 'pos.discount' | 'pos.void'
  | 'orders.view' | 'catalog.manage' | 'inventory.manage' | 'inventory.transfer'
  | 'customers.manage' | 'reports.store' | 'reports.chain'
  | 'stores.manage' | 'staff.manage' | 'settings.manage' | 'audit.view' | 'cash.movement';
export interface RoleDefinition { role: StaffRole; label: string; permissions: Permission[] }
export interface UserAccount { id: string; orgId: string; email: string; passwordHash: string; salt: string; staffId: string; status: 'active' | 'invited' | 'disabled'; mustChangePassword: boolean; lastLoginAt?: Date; createdAt: Date }
export interface Session { token: string; orgId: string; userId: string; staffId: string; storeId?: string; registerId?: string; issuedAt: Date; expiresAt: Date; lockedAt?: Date }
export interface Register { id: string; orgId: string; storeId: string; code: string; name: string; isActive: boolean }
export interface Supplier { id: string; orgId: string; name: string; phone?: string; address?: string; note?: string; isActive: boolean }
export interface StorePrice { orgId: string; storeId: string; productId: string; salePrice: number }
export type CashMovementType = 'in' | 'out';
export interface CashMovement { id: string; orgId: string; storeId: string; shiftId: string; type: CashMovementType; amount: number; reason: string; staffId: string; createdAt: Date }
export interface AuditEvent { id: string; orgId: string; storeId?: string; staffId: string; action: string; entity: string; entityId: string; summary: string; createdAt: Date }
```
Existing root entities (`Store`, `Staff`, `Product`, `Category`, `Customer`, `Order`, `Shift`, `GoodsReceipt`, `StockTransfer`, `StockCount`) gain `orgId: string`. `Staff.pin` becomes unique per org; `GoodsReceipt.supplierName` becomes `supplierId` (keep `supplierName` as a derived display).

## Waves
| Wave | Worker | Scope | Status |
|---|---|---|---|
| 1 | designer | Mockups: login (email + password), onboarding (create org + first store + first register), cashier switch / lock screen (PIN pad), staff invite, permissions matrix screen, supplier list, cash in/out sheet, Z report | IN PROGRESS |
| 1 | W-A auth + tenant | Types above, seed (org `chuoi-tap-hoa`, accounts, unique PINs, registers), auth domain (hash with PBKDF2 via `expo-crypto` or a pure TS SHA-256 fallback, sessions with expiry, `can(permission)`), stores, screens: login, onboarding, lock screen, change / forgot password (mock code), staff invite + status, permissions matrix, register picker after store; route guards by permission; persistence keyed by org; E2E login helper updated | IN PROGRESS |
| 1 | W-B density fixes | 6.3: toolbar collapses secondary filters into a "Bộ lọc" popover with active count when the row would wrap at >= 1280 (never two rows, never clipped); header stays 48 pt; 6.4: reports stat cards become the shared `StatStrip` with a delta line; verify at 1280 / 1440 / 1920 | DONE (report: `reports/w-b-toolbar-reports-report.md`) |
| 2 | W-C chain ops | Suppliers (CRUD, receipt picks supplier, purchase history), store prices (override screen + POS uses store price), cash in / out during shift + Z report (printable, shares the receipt print path), audit log screen + events written from POS void / refund / discount, staff PIN reset, price changes, stock adjustments | PENDING (after W-A) |
| 3 | integrator | gates, dark sweep of new screens, iOS smoke of login / lock / Z report, deploy, BeeUI batch, report | PENDING |

## Acceptance
- Login with email + password (seeded `owner@chuoi.vn` / `BeePOS@2026` etc. documented in README), session expiry and logout, lock screen unlock by the signed-in cashier's own PIN, cashier switch by another staff's PIN.
- Permission guards: cashier cannot open reports / staff / settings; manager cannot see chain reports; UI hides or disables per `can()`.
- Every root entity carries `orgId`; persistence keys include the org; seed has one org (a second org fixture only in tests).
- Toolbar never wraps or clips at >= 1280; reports use the strip.
- All gates green: tsc, jest, eslint, qa:e2e (specs updated for the new login), export all.
