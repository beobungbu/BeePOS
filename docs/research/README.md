# BeePOS retail domain research baseline

Status: research baseline · 2026-09-13

## Why this exists

BeePOS already has a strong interactive prototype for store selling, refunds, shifts, catalog, stock, transfers, stock counts, customers, reports, stores and staff. The next feature wave can no longer be treated as isolated screens. Supplier, purchasing, pricing, promotion, fiscal/e-invoice, multi-tenant, audit, offline sync and hardware all change the core domain model.

This research package defines a reference model before those features are implemented.

## Product direction

BeePOS should evolve as a **retail operations platform with POS as the store-facing interaction surface**, not as one giant POS application that absorbs every ERP concern.

Working decomposition:

```text
Bee Retail Platform
├── Store / POS
│   ├── register
│   ├── cart / retail transaction
│   ├── tender / payment
│   ├── return / exchange / void
│   ├── shift / cash movement / Z report
│   └── offline + peripherals
├── Headquarters
│   ├── organization / business unit / store
│   ├── identity / employee / RBAC
│   ├── catalog / merchandise hierarchy
│   ├── pricing / promotion
│   ├── reporting / audit
│   └── configuration
├── Supply
│   ├── supplier
│   ├── purchase order
│   ├── receiving
│   ├── inventory ledger
│   ├── stock count / adjustment
│   └── transfer / replenishment
├── Customer
│   ├── customer / customer group
│   ├── loyalty
│   └── CRM-facing data
└── Fiscal / integrations
    ├── Vietnam e-invoice
    ├── payment providers
    ├── accounting
    └── commerce / OMS adapters
```

This is a logical domain split, not a microservice requirement. A modular monolith is the recommended first production architecture.

## Research set

1. [`01-reference-model.md`](./01-reference-model.md) — ARTS/OMG, GS1, APQC and SCOR crosswalk.
2. [`02-competitor-capability-matrix.md`](./02-competitor-capability-matrix.md) — evidence from KiotViet, Sapo, MISA eShop and Odoo.
3. [`03-canonical-domain-model.md`](./03-canonical-domain-model.md) — proposed bounded contexts, entities and invariants.
4. [`04-vietnam-compliance-and-platform.md`](./04-vietnam-compliance-and-platform.md) — e-invoice, offline, peripheral and integration requirements.
5. [`05-roadmap.md`](./05-roadmap.md) — research-to-build sequence and priority gates.
6. [`06-execution-backlog.md`](./06-execution-backlog.md) — Gate 0 dependency graph, implementation unblock matrix and backend-schema Definition of Ready.

## Architecture decision set

- [`ADR-001`](../adr/ADR-001-retail-domain-foundation.md) — retail-domain foundation and modular-monolith boundaries.
- [`ADR-002`](../adr/ADR-002-organization-identity-store-register.md) — Organization, UserAccount, Employee, Store and Register.
- [`ADR-003`](../adr/ADR-003-product-sku-identifier-uom.md) — Product, SKU, identifiers and UOM.
- [`ADR-004`](../adr/ADR-004-pricing-resolution.md) — PriceBook applicability and deterministic price resolution.
- [`ADR-005`](../adr/ADR-005-promotion-stacking-allocation.md) — promotion boundaries, stacking and allocation.
- [`ADR-006`](../adr/ADR-006-retail-transaction-snapshot.md) — immutable finalized retail transactions and returns.
- [`ADR-007`](../adr/ADR-007-inventory-ledger.md) — inventory movements as truth, StockPosition as read model.
- [`ADR-008`](../adr/ADR-008-cash-tender-business-day.md) — shifts, cash movements, tender reconciliation and business day.
- [`ADR-009`](../adr/ADR-009-offline-idempotency-sync.md) — offline identity, idempotency and sync contract.
- [`ADR-010`](../adr/ADR-010-vietnam-fiscal-provider.md) — Vietnam fiscal/e-invoice provider boundary.
- [`ADR-011`](../adr/ADR-011-business-audit-events.md) — business audit events.

All ADRs are currently **Proposed**, not silently treated as approved. Parent decision tracker: GitHub issue #2. Decision issues: #3–#12. Review checklist: #14.

## Decision principles

- **Domain first, screen second.** Screens are projections of workflows; they are not the domain boundary.
- **Retail standards inform naming and structure.** ARTS and GS1 are references, not schemas to copy wholesale.
- **Vietnam requirements are first-class.** Fiscal/e-invoice and local operational patterns must be designed into the platform rather than bolted on later.
- **Ledger over mutable balance for traceability.** Inventory and cash need immutable movement history with derived balances/snapshots.
- **Rules over columns.** Pricing and promotions need explicit applicability, priority and calculation rules rather than more `salePrice` fields.
- **Adapters at external boundaries.** Printer, scanner, payment, e-invoice and accounting providers must not leak into core domain types.
- **Offline semantics must be explicit.** Local persistence is useful but is not equivalent to production offline synchronization.
- **Historical facts are immutable.** Finalized commercial, stock, cash, fiscal and audit records are corrected with linked events, not silently rewritten.

## Primary references

- OMG / ARTS Operational Data Model 7.3: https://www.omg.org/retail-depository/arts-odm-73/introduction_and_overview.htm
- APQC Retail Process Classification Framework: https://www.apqc.org/process-frameworks
- GS1 2D Barcodes at Retail POS guideline: https://ref.gs1.org/guidelines/2d-in-retail/
- ASCM SCOR Digital Standard overview: https://www.ascm.org/corporate-solutions/standards-tools/scor-ds/
- KiotViet documentation: https://www.kiotviet.vn/huong-dan-su-dung-kiotviet/
- Sapo Help Center: https://help.sapo.vn/
- MISA eShop Help: https://helpeshop.misa.vn/
- Odoo 19 POS documentation: https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale.html
- Vietnam Government, Decree 70/2025/NĐ-CP: https://chinhphu.vn/?classid=1&docid=213179&orggroupid=2&pageid=27160

## Scope boundary for this wave

This baseline focuses on **retail/grocery chain operations**. Wholesale/distribution is deliberately kept as a later bounded context. The current model should not be distorted to support dealer credit, route sales, distributor rebates or trade-promotion management before the retail core is stable.
