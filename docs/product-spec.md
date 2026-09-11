# BeePOS — product spec (UI-only interactive prototype)

Status: v0.1 · 2026-09-11 · owner: Ambrose (Hive Enterprise)

## Purpose
1. Production-grade interactive prototype of a POS for a **grocery chain** (chuỗi tạp hoá), management-oriented: one codebase for mobile (iOS/Android) and web.
2. Field test of **BeeUI** (https://beeui.beemvp.com) as an outside consumer: public docs, `llms*.txt`, and the correctness of the published npm packages. Every friction point is logged per `docs/beeui-audit/protocol.md`.
3. Customer showcase; UI + domain logic written so a backend can be plugged in later (no throwaway code).

Scope is UI + client-side domain logic + in-memory mock data. No backend, no auth server, no printer/scanner SDK. All data lives in seeded stores and resets on reload.

## Stack (decided)
| Concern | Choice | Why |
|---|---|---|
| Runtime | Expo SDK 57, React 19.2.3, RN 0.86.2, react-native-web 0.21.0 | exactly BeeUI's tested matrix |
| UI kit | `@beemvp/beeui-ui@0.86.2-rc.1` (+core, +tokens) from npm, pinned | the real customer path; tarballs only as documented fallback |
| Styling | Uniwind 1.10.1 + Tailwind 4.3.3, semantic tokens only | BeeUI contract; never literal brand colors |
| Navigation | expo-router 57.x | file-based, URL on web, tabs on mobile; BeeUI ships no router |
| State | zustand + pure TS domain modules | tiny, testable, backend-swappable |
| i18n | `src/i18n` dictionaries, `vi` default, `en` available | Vietnamese customers, international showcase |
| Tests | jest-expo unit tests for `src/domain`; `expo export` for all 3 platforms as build gate | machine-verifiable |

## Users and devices
- **Cashier / store staff** (mobile phone or tablet): sell, receive goods, stock count, shift open/close.
- **Store manager** (tablet or web): orders, inventory, customers, staff, store reports.
- **Chain manager / owner** (web, wide): multi-store dashboard, transfers, catalog and price management, settings.

One code base. Layout adapts by width: `< 768` bottom tabs + stacked screens; `>= 768` persistent left sidebar + content, POS uses two-pane (catalog | cart).

## Domain model (src/domain/types.ts)
- `Store { id, code, name, address, phone, isActive }`
- `Staff { id, name, role: 'owner'|'manager'|'cashier', storeIds[], pin }`
- `Category { id, name, parentId? }`
- `Product { id, sku, barcode, name, categoryId, unit, costPrice, salePrice, taxRate, imageUrl?, isActive, variants?: ProductVariant[] }`
- `StockLevel { productId, storeId, onHand, reserved, minLevel }`
- `Customer { id, name, phone, points, tier, totalSpent, createdAt }`
- `Cart { id, storeId, lines: CartLine[], customerId?, discount?: Discount, note? }`
- `CartLine { productId, qty, unitPrice, lineDiscount? }`
- `Discount { type: 'percent'|'amount', value, reason? }`
- `Order { id, code, storeId, cashierId, customerId?, lines, subtotal, discountTotal, taxTotal, total, payments: Payment[], status: 'paid'|'refunded'|'partial_refund'|'void', createdAt }`
- `Payment { method: 'cash'|'transfer'|'card'|'points', amount, ref? }`
- `Shift { id, storeId, cashierId, openedAt, closedAt?, openingCash, closingCash?, expectedCash, orderCount, revenue }`
- `GoodsReceipt { id, storeId, supplierName, lines: {productId, qty, unitCost}[], status: 'draft'|'received', createdAt }`
- `StockTransfer { id, fromStoreId, toStoreId, lines, status: 'draft'|'sent'|'received', createdAt }`
- `StockCount { id, storeId, lines: {productId, counted, expected}[], status: 'draft'|'posted', createdAt }`

Money: integer VND, no decimals. `src/domain/money.ts` owns formatting (`Intl.NumberFormat('vi-VN')`) and rounding.

## Screen inventory (route → purpose)
Auth
- `/login` — store code + staff PIN (mock), remember store; `/select-store` when staff has several stores.

POS (cashier)
- `/pos` — product grid with category chips + search + barcode entry field; cart panel (side pane on wide, sheet on mobile); qty stepper, line discount, order discount, customer attach, note.
- `/pos/checkout` — payment methods (cash with change calc, transfer with VietQR placeholder, card, points), split payment, confirm → receipt.
- `/pos/receipt/[orderId]` — receipt view, share/print placeholder, new sale.
- `/pos/shift` — open/close shift, cash count, summary.

Orders
- `/orders` — list with filters (store, date range, status, cashier), search by code/phone.
- `/orders/[id]` — detail, timeline, refund (full/partial) flow via AlertDialog.

Products
- `/products` — table on wide, list on mobile; search, category filter, active toggle, pagination.
- `/products/[id]` — detail + edit form (Field/Input/Select/Switch), variants, stock per store.
- `/products/new` — create.
- `/products/categories` — tree list, CRUD.

Inventory
- `/inventory` — stock levels by store, low-stock alert banner, filters.
- `/inventory/receipts`, `/inventory/receipts/[id]` — goods receipt (nhập hàng) create/confirm.
- `/inventory/transfers`, `/inventory/transfers/[id]` — inter-store transfer, send/receive.
- `/inventory/counts`, `/inventory/counts/[id]` — stock count (kiểm kê), variance, post.

Customers
- `/customers` — list, search by phone/name, tier badge.
- `/customers/[id]` — profile, points, order history, edit.

Reports
- `/reports` — chain dashboard: Stat cards (revenue today/7d/30d, orders, avg basket, margin), revenue by store table, top products, payment mix, cashier performance. Simple bar/line rendered with plain Views (no chart lib) or a tiny SVG.

Stores and staff
- `/stores`, `/stores/[id]` — store list, detail (staff, hours, status).
- `/staff`, `/staff/[id]` — staff list, role, store assignment, PIN reset (mock).

Settings
- `/settings` — theme (light/dark/system), language (vi/en), density, receipt header/footer text, tax rate, currency display, about (BeeUI version, app version).

## Non-functional
- Accessibility: every control has label/role; keyboard works on web; large text does not clip.
- Theme: light and dark both correct on every screen; theme switch is instant (Uniwind.setTheme).
- Performance: product grid uses FlatList/FlashList-equivalent; no jank at 500 products.
- Copy: no em-dash in user-facing copy (company rule); Vietnamese default.
- Everything under `src/domain` is pure and unit-tested.
