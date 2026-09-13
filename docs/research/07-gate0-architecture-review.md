# BeePOS — Gate 0 cross-ADR architecture review

Status: review complete; ADRs remain Proposed pending maintainer acceptance · 2026-09-13

Reviewed set: ADR-001 through ADR-011, decision issues #3–#12, and the execution map in `06-execution-backlog.md`.

## Executive result

No structural contradiction was found across the proposed architecture. The ADRs now form one coherent transaction chain:

```text
Organization / Store / Register / Actor
            │
            ▼
Catalog: Product → SKU → Identifier/UOM
            │
            ▼
Pricing: PriceBook resolution
            │
            ▼
Promotion: eligibility/reward/allocation
            │
            ▼
Cart → immutable RetailTransaction
       │              │
       │              ├─ Tender / Cash / BusinessDay
       │              ├─ FiscalDocument operations
       │              └─ AuditEvent references
       │
       └─ Inventory posting → InventoryMovement → StockPosition

Every retryable side effect
       └─ stable ID + idempotency + offline outbox/sync contract
```

The proposed model is sufficiently coherent to review for acceptance before production backend schema work. It is **not** a recommendation to start coding every domain at once.

## 1. Cross-ADR consistency matrix

| Concern | Owning ADR | Cross-check | Result |
|---|---|---|---|
| Tenant security boundary | ADR-002 | all ADRs use organization scope | consistent |
| Store/register/actor provenance | ADR-002 | ADR-006/007/008/011 | consistent |
| Sell/stock identity | ADR-003 | ADR-004/006/007 | consistent: SKU is downstream identity |
| UOM conversion | ADR-003 | ADR-006/007 | consistent: source snapshot + base-UOM posting |
| Current price | ADR-004 | ADR-006 | consistent: resolved price is snapshotted |
| Promotion vs price | ADR-004/005 | ADR-006 | explicit separation |
| Discount allocation | ADR-005 | ADR-006 returns | consistent: historical allocation reused |
| Historical commercial truth | ADR-006 | fiscal/cash/audit | immutable boundary is clear |
| Stock truth | ADR-007 | sale/return/procurement | movement ledger + read model is coherent |
| Cash truth | ADR-008 | transaction/tender/audit | event/projection model is coherent |
| Business date | ADR-008 | ADR-006/007/011 | explicit historical field rather than recompute |
| Offline ID/retry | ADR-009 | transaction/stock/cash/fiscal | common idempotency contract |
| E-invoice boundary | ADR-010 | ADR-006/009 | downstream of immutable sale; retry-safe |
| Audit evidence | ADR-011 | every sensitive domain | separate from technical logs; references canonical records |

## 2. Review checklist results

### Domain vocabulary

**Pass.** The key ambiguous prototype concepts have been separated:

- account vs employee;
- store vs register;
- Product vs SKU;
- barcode vs identifier;
- price vs promotion vs manual discount;
- cart vs finalized transaction;
- stock movement vs stock balance;
- sale amount vs tender settlement;
- commercial receipt vs fiscal/e-invoice state;
- technical log vs business audit.

### Entity ownership and scope

**Pass.** Organization is the tenant root and server-side isolation boundary. Store/Register/Employee context is explicit where operational provenance matters.

### Immutable vs mutable records

**Pass.** The following become immutable once posted/finalized:

- RetailTransaction commercial snapshots;
- InventoryMovement;
- posted cash/tender events as historical records;
- finalized Z/day-close summary;
- FiscalOperation history;
- AuditEvent.

Corrections use linked/compensating records.

### Money and quantity

**Pass with implementation detail remaining.** Money is integer VND in the Vietnam profile. UOM/variable measure requires fixed-scale or integer-minor-unit semantics rather than binary floating point. Exact decimal library/storage type can be selected during implementation without changing the domain decision.

### Time and business date

**Pass.** Store-local businessDate is snapshotted while event timestamps remain unambiguous instants. Exact store cutoff configuration is implementation/business policy.

### Offline and idempotency

**Pass.** Stable client-generated IDs, durable outbox and side-effect idempotency are cross-domain requirements rather than a store-layer afterthought.

### Audit/security

**Pass.** ADR-011 defines the business audit envelope and explicit secret exclusions. ADR-002 keeps PIN/account identity separate. Production authorization remains server-side.

## 3. Important policies intentionally not hard-coded by Gate 0

These are real decisions, but they do not require changing the proposed bounded-context/entity boundaries and therefore can remain implementation/profile policies.

### 3.1 Tax calculation profile

Still needs executable rules for:

- tax-inclusive vs tax-exclusive prices;
- discount-before-tax/tax-base behavior under the Vietnam fiscal profile;
- line vs document rounding;
- invoice adjustment behavior.

This should be finalized before production fiscal/tax calculation, but it does not invalidate the transaction snapshot architecture. The snapshot already has room for tax base/rate/amount/provenance.

### 3.2 Exact UOM decimal storage

Choose database/runtime representation (for example integer minor measure or fixed-scale decimal) during schema design. The invariant is no binary-floating-point drift and deterministic conversion.

### 3.3 Negative stock policy

The ledger supports either block/warn/manager override. Product policy can default to block when authoritative stock is fresh and allow controlled override/offline continuity where configured.

### 3.4 Offline freshness windows

Maximum accepted age for cached catalog/price/promotion/tax data is a deploy/customer policy. ADR-009 requires recording reference provenance and never silently repricing finalized offline sales.

### 3.5 Fiscal queue legality/provider behavior

Which invoice operations may queue offline must be validated against current law and the selected provider at implementation time. The provider-neutral state machine remains valid either way.

### 3.6 Register vs physical device mapping

P1 can use one enrolled device per Register for simplicity, while keeping logical Register identity separate enough to replace hardware without rewriting history.

## 4. Follow-on architecture decisions that are not Gate 0 blockers

These should become later ADRs/issues before their corresponding production features are claimed complete.

### Inventory costing / COGS

The prototype has `costPrice` and reports margin, but a production margin figure requires an explicit valuation policy (for example moving average or FIFO), supplier cost history, landed-cost scope and return handling. This is a **reporting/accounting follow-on**, not a blocker for quantity ledger creation.

### Procurement lifecycle depth

ADR-001/003/007 establish the foundations for Supplier → PO → partial receipt → movement. A focused procurement ADR should define PO states, over/under receipt, cancellation, supplier return and cost capture before that implementation epic starts.

### Loyalty economics

Current points/tier behavior can remain a bounded follow-on. Before production loyalty, define earning/redemption ledger, expiry, manual adjustment, reversal on returns and offline limited-use semantics.

### Hardware/peripheral abstraction

The research baseline already requires adapters. A focused ADR is needed when real printer/scanner/scale/customer-display SDK integration starts, especially native Expo module strategy and capability detection.

### Reporting / analytics read models

Operational write models should not be distorted for dashboards. Once canonical events are implemented, define read-model/warehouse projections, refresh consistency and margin/stock valuation semantics separately.

## 5. No-go implementation shortcuts identified

The following should be rejected during PR review because they contradict the Gate 0 model:

- adding `storePrice` columns directly to Product instead of PriceBook resolution;
- adding additional barcode columns (`barcode2`, `barcode3`) instead of identifiers;
- mutating `StockLevel.onHand` without movement provenance;
- recalculating old refunds from current prices/promotions;
- treating `Order.status='refunded'` as the only refund history;
- using invoice/provider ID as the RetailTransaction primary key;
- using one server-generated integer ID scheme that prevents offline creation;
- retrying payment/fiscal/stock side effects without idempotency;
- recording passwords/PINs/tokens/provider secrets in AuditEvent;
- using technical logs as the only business audit history;
- introducing microservices merely because bounded contexts are defined.

## 6. Acceptance recommendation

Architecture review recommendation: **ADR-002 through ADR-011 are Ready for Maintainer Acceptance**, subject to project-owner review of the business-policy defaults above.

Acceptance should mean agreement on boundaries/invariants, not a promise to implement every deferred feature immediately.

After acceptance:

1. change ADR statuses to `Accepted`;
2. close the corresponding #3–#12 decision issues with links to accepted ADRs;
3. update ADR-001 to `Accepted` and Gate 0 #2 to complete;
4. open only the first implementation wave from `06-execution-backlog.md` (tenant/identity/register + catalog/SKU/UOM), not all modules simultaneously;
5. keep current prototype running behind compatibility adapters while the canonical backend/domain model is introduced incrementally.
