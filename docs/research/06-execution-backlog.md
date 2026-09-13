# BeePOS — Gate 0 execution backlog and traceability

Status: working architecture backlog · 2026-09-13

This document turns the retail-domain research baseline into an execution graph. It is deliberately placed before production backend/schema work.

## 1. Gate 0 architecture decisions

| Issue | Decision | Main domains constrained | Blocks |
|---|---|---|---|
| #7 | Organization / UserAccount / Employee / Store / Register | tenancy, auth, RBAC, config | every tenant/store-scoped backend table and API |
| #3 | Product / SKU / Identifier / UOM | catalog, inventory, procurement, barcode | procurement schema, grocery depth, inventory detail |
| #4 | PriceBook / applicability / precedence | pricing, sales | production pricing API and sale pricing snapshot |
| #10 | Promotion / stacking / allocation | promotion, sales, returns | promotion engine and correct partial returns |
| #5 | Finalized RetailTransaction snapshot | sales, return/refund, fiscal | production order schema, receipts, fiscal documents |
| #6 | Inventory ledger / StockPosition | inventory, transfer, count, procurement | production stock schema and posting rules |
| #11 | Shift / cash movement / tender reconciliation / business day | store ops, payment, reports | cash-control and Z-report implementation |
| #9 | Offline IDs / idempotency / sync | platform, sales, inventory, payments | production API contracts and offline write path |
| #8 | Fiscal/e-invoice provider boundary | fiscal, sales, compliance | provider integrations |
| #12 | Business AuditEvent model | security, store ops, admin | production sensitive-action workflows |

Parent tracker: #2. Traceability meta issue: #13. ADR review checklist: #14.

## 2. Recommended decision order

The recommended critical path is:

```text
#7 Tenant / identity / register
  ↓
#3 Catalog / SKU / identifier / UOM
  ↓
#4 Pricing ───────────────┐
  ↓                      │
#10 Promotion            │
  ↓                      │
#5 RetailTransaction ◄───┘
  ↓
#6 Inventory ledger
  ↓
#11 Cash / tender / business day
  ↓
#9 Offline / idempotency / sync
  ↓
#8 Fiscal provider boundary
  ↓
#12 Audit envelope cross-check
```

This is not a strict waterfall. #12 should be cross-reviewed against every decision, and #9 must be checked while designing IDs in #7/#3/#5/#6. The sequence exists to minimize schema churn.

## 3. Cross-decision invariants

These invariants should hold across all Gate 0 ADRs.

### Tenant and scope

Every tenant-owned production record has an unambiguous `organizationId`. Store/register-scoped records also carry the narrowest operational scope required for authorization and audit. Tenant isolation is a server-side invariant, never only a client filter.

### Stable identity

Business records that may originate offline use stable globally unique IDs generated before server synchronization. External/provider IDs are references, not BeePOS primary identity.

### Historical truth

Finalized commercial, stock, cash and fiscal events are append-only or corrected through linked compensating events. Current master data must never silently rewrite historical receipts, returns, stock history or audit history.

### Determinism

Price resolution, promotion application, tax calculation, allocation, stock posting and cash reconciliation must be deterministic from explicit inputs. Hidden dependence on current UI/store state is prohibited.

### Money

Money stays integer VND for the Vietnam profile. Allocation algorithms must specify deterministic remainder handling. No floating-point money calculation in domain logic.

### Time

Store-local civil time and timezone are display/business-context data; persisted event timestamps use an unambiguous instant. `businessDate` is explicit for POS operations that may cross midnight.

### Idempotency

Any command that can be retried across network boundaries and can create financial, inventory, fiscal or loyalty side effects must have an idempotency contract.

### Auditability

Sensitive state changes expose enough actor/context/reason/correlation metadata to produce a business audit event without scraping generic application logs.

## 4. Implementation epic unblock matrix

Do not open these as implementation epics until the listed architecture decisions are accepted or explicitly waived.

| Future implementation epic | Required Gate 0 decisions |
|---|---|
| Tenant + real authentication | #7, #9, #12 |
| RBAC + route/action guards | #7, #12 |
| Register enrollment + lock/handoff | #7, #9, #11, #12 |
| Catalog v2 / SKU / barcode / UOM | #3, #7, #9 |
| Price books | #4, #7, #3, #12 |
| Promotion engine | #10, #4, #5, #9, #12 |
| Retail transaction v2 | #5, #3, #4, #10, #7, #9, #12 |
| Return/exchange v2 | #5, #10, #11, #8, #12 |
| Inventory ledger | #6, #3, #7, #9, #12 |
| Supplier + PO + receipt | #3, #6, #7, #9, #12 |
| Transfer/count/adjustment v2 | #6, #7, #9, #12 |
| Cash movement + reconciliation + Z | #11, #5, #7, #9, #12 |
| E-invoice integration | #8, #5, #7, #9, #12 |
| Offline outbox/sync engine | #9 plus IDs/invariants from #7/#3/#5/#6/#11 |
| Reporting warehouse/read models | #5, #6, #11, #7 |

## 5. Phase sequence after Gate 0

### P1A — platform identity and retail master data

1. Organization and tenant isolation
2. UserAccount / Employee / role/permission
3. Store / Register / configuration inheritance
4. Product / SKU / identifiers / UOM
5. migration compatibility layer from current prototype stores

### P1B — commercial engine

1. PriceBook resolution
2. Promotion evaluation
3. RetailTransaction v2 snapshots
4. return/refund allocation rules

### P1C — stock and procurement

1. InventoryMovement ledger
2. StockPosition read model
3. Supplier
4. PurchaseOrder
5. partial/full GoodsReceipt
6. transfer/count/adjustment posting through ledger

### P1D — store control and compliance

1. RegisterSession/Shift v2
2. CashMovement
3. TenderReconciliation
4. BusinessDay/Z report
5. FiscalProvider port
6. first Vietnam e-invoice adapter only after provider selection
7. AuditEvent coverage for every sensitive action above

### P1E — offline hardening

1. client-generated stable IDs
2. command idempotency
3. outbox
4. server acknowledgements/checkpoints
5. bounded-context conflict policies
6. stale reference-data policy
7. retry-safe payment/fiscal flows

## 6. Explicitly deferred from P1 core

To avoid turning BeePOS into an ERP before the retail core is correct, defer unless a real customer requires them:

- multi-organization switching for one account (model-compatible, UI deferred)
- complex warehouse bin/location optimization
- serial tracking except where a selected vertical requires it
- advanced trade-promotion management
- distributor/dealer territory and route sales
- B2B credit/AR/collections
- marketplace/e-commerce OMS orchestration
- manufacturing/MRP
- full accounting/general ledger

The domain should leave extension points for these capabilities without implementing them prematurely.

## 7. Definition of Ready for production backend schema

A production schema migration/ORM foundation is ready to become canonical only when:

- Gate 0 parent #2 has all architecture decisions accepted or explicitly waived with rationale;
- ADRs define entity ownership, scope and immutable/event boundaries;
- the transaction, inventory and cash invariants have executable examples;
- identifier/idempotency rules are fixed;
- the Vietnam fiscal boundary is provider-neutral;
- current prototype models have an explicit compatibility/migration strategy;
- implementation issues reference the accepted ADRs rather than restating competing domain assumptions.

Until then, the current TypeScript prototype model remains a UI/domain-prototype contract, not the canonical production database design.
