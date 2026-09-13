# ADR-001 — Retail domain foundation before production backend

- Status: Proposed
- Date: 2026-09-13
- Decision owners: BeePOS maintainers
- Related: `docs/product-spec.md`, `docs/chain-multitenant-gap-analysis.md`, `docs/research/*`

## Context

BeePOS began as a UI/domain prototype for a Vietnamese grocery chain and now covers a broad set of store workflows. The next identified gaps—multi-tenant, supplier/PO, store/channel pricing, promotion, cash controls, audit, e-invoice, offline sync and hardware—are not independent features. They change the core data and transaction model.

Continuing to add fields to the current simplified entities risks locking production APIs/database schemas around prototype assumptions such as:

- one barcode and one unit per product;
- `salePrice` directly on product;
- `supplierName` on receipt instead of supplier/purchasing aggregates;
- `StockLevel` as primary stock truth;
- generic `Order` and `Payment` without retail/fiscal/reconciliation provenance.

Retail standards and competitor evidence show that these concerns need explicit rule and transaction models.

## Decision

Before implementing a production backend schema, BeePOS will adopt a canonical retail domain baseline with the following logical bounded contexts:

1. Organization & Identity
2. Catalog
3. Pricing
4. Promotion
5. Sales / Retail Transaction
6. Tender & Store Cash
7. Inventory
8. Procurement
9. Customer & Loyalty
10. Fiscal / Compliance
11. Reporting / Analytics

This is a **logical modular-monolith boundary**, not a decision to build microservices.

### Mandatory foundation decisions

The production domain will support:

- tenant-scoped aggregates through `Organization`/`orgId`;
- explicit `Register`/workstation separate from Store and Shift;
- account identity separate from employee/store assignment;
- Product/SKU/Identifier/UOM separation;
- price books/rules with applicability, validity and deterministic precedence;
- promotions separate from manual cashier discounts;
- finalized retail transactions preserving commercial/tax snapshots;
- inventory movements/ledger as auditable stock truth, with stock position as derived/read state;
- Supplier + PurchaseOrder + GoodsReceipt linkage;
- cash movement and reconciliation history;
- provider-independent fiscal/e-invoice boundary;
- peripheral adapters that do not leak vendor SDK types into domain modules;
- explicit offline idempotency/versioning semantics before full synchronization is implemented.

## Consequences

### Positive

- reduces future schema/API churn;
- makes procurement, grocery UOM, pricing and promotion additive rather than invasive;
- provides auditability for inventory, cash and pricing;
- improves compatibility with Vietnam fiscal integration and different providers;
- creates a clean path to later B2B/wholesale without polluting retail POS transactions.

### Negative / cost

- introduces more domain concepts than the current prototype needs;
- some current types/actions will require migration;
- product, inventory and order screens may need adapters/read models during transition;
- additional domain tests and state-machine tests become mandatory.

## Rejected alternatives

### A. Keep current model and add missing fields/screens

Rejected because `StorePrice`, `supplierName`, mutable stock balances and generic order/payment types would accumulate special cases quickly.

### B. Copy SAP/Oracle/ARTS schemas directly

Rejected because BeePOS does not need enterprise-suite breadth. Standards are reference vocabularies/coverage checks, not implementation schemas.

### C. Split immediately into microservices

Rejected. The product is too early for service-distribution overhead. Module boundaries and transaction contracts should be proven inside a modular monolith first.

## Validation gates

This ADR can move to Accepted after maintainers review and agree on:

- Product/SKU/UOM model;
- Pricing precedence;
- Retail transaction snapshot model;
- Inventory ledger mechanics;
- Organization/account/employee/register model;
- Fiscal provider port;
- offline identity/idempotency strategy.

No persistent production backend schema should be treated as stable before these gates are resolved.
