# ADR-011 — Business audit events for sensitive retail actions

- Status: Proposed
- Date: 2026-09-13
- Related issue: #12
- Parent: #2

## Context

Production BeePOS must answer business questions such as who changed a price, adjusted stock, refunded a sale, moved cash, changed permissions, closed a shift or performed a fiscal correction. Generic application logs are optimized for diagnostics, may be sampled/rotated, and do not provide a stable business-control contract.

## Decision

### 1. Introduce append-only AuditEvent distinct from technical logs

Canonical envelope:

```text
AuditEvent
  id
  organizationId
  occurredAt
  businessDate?
  actorUserAccountId?
  actorEmployeeId?
  storeId?
  registerId?
  action
  targetType
  targetId
  reasonCode?
  reasonText?
  approval/override reference?
  correlationId?
  commandId/idempotencyKey?
  source: ONLINE | OFFLINE_SYNC | SYSTEM | INTEGRATION
  metadata (allow-listed, non-secret)
```

Audit events are immutable after append.

### 2. AuditEvent is business evidence, not event sourcing for the whole application

BeePOS does not adopt full event sourcing. Domain aggregates can use ordinary persistence plus immutable domain records where appropriate. AuditEvent records sensitive actions/outcomes required for traceability.

Technical logs/traces continue separately for diagnostics.

### 3. P1 mandatory audited action families

At minimum audit:

**Identity/security**
- employee/account invite/disable/reactivate;
- role/permission/store-scope change;
- PIN reset/change by administrator;
- register enroll/disable/reassign;
- sensitive login/lockout/security events as appropriate without logging secrets.

**Catalog/pricing/promotion**
- SKU activation/deactivation;
- identifier/UOM material changes;
- price-book create/change/activate/deactivate;
- promotion create/change/activate/deactivate;
- manager price/manual-discount override where supported.

**Sales/customer**
- void/return/refund/exchange approval;
- manual discount above configured threshold;
- loyalty manual adjustment;
- customer-sensitive-data administrative changes where policy requires.

**Inventory/procurement**
- stock adjustment/count posting;
- transfer discrepancy/override;
- goods receipt posting/correction;
- supplier return;
- negative-stock override.

**Cash/tender**
- shift open/close;
- paid-in/paid-out/safe drop/correction;
- cash difference/manager approval;
- tender reversal/manual reconciliation.

**Fiscal/config**
- fiscal issue adjustment/replacement/cancel operation;
- provider/config change (without secrets);
- tax/fiscal/store configuration change;
- reset/destructive maintenance action.

### 4. Audit records outcomes, not just intent

For important actions, the audit event indicates whether the business operation was accepted/completed/rejected as appropriate. Failed authorization attempts may have separate security audit events.

When a domain record is immutable and already carries actor/source metadata (for example InventoryMovement), AuditEvent may reference it rather than duplicate the full payload.

### 5. Before/after data is allow-listed and minimal

Do not dump arbitrary serialized objects into audit history.

Allowed metadata should contain only fields needed to explain the business change, for example:

```text
oldPrice/newPrice
oldStatus/newStatus
counted/expected/variance
permissionCodesAdded/Removed
cashDifference
```

Never audit:

- plaintext password/PIN/hash;
- access/refresh tokens;
- full payment-card secrets;
- provider API credentials;
- private cryptographic material;
- unrestricted request headers/bodies;
- unnecessary sensitive customer data.

### 6. Offline audit events retain original actor/time plus server receipt time

An offline action can create a stable local audit/business correlation identity. On sync the server validates and stores authoritative audit evidence including original occurredAt plus server received/accepted time as needed.

Offline ordering uses stable IDs/timestamps/correlation but must not pretend distributed client clocks create a total global order. Business causality should use source transaction/command references and aggregate versions.

### 7. Override/approval relationships are explicit

Where a manager override is required, preserve:

- initiator;
- approver/overriding employee;
- reason;
- action/target;
- correlation to resulting transaction/movement/cash event.

Do not replace the original cashier identity with the approving manager.

### 8. Access and retention

Audit history is permission-protected and tenant-scoped. P1 should support searchable filters by date/action/actor/store/target and an export path later.

Retention duration is configuration/compliance policy and should be selected before production deployment; deletion/retention jobs must not make historical financial/fiscal records internally inconsistent.

## Invariants

- AuditEvent is append-only;
- every event belongs to exactly one organization;
- secrets are never audit payload data;
- sensitive domain actions listed for P1 produce traceable audit evidence;
- offline sync cannot duplicate the same audit event/side effect;
- approver identity never obscures initiator identity;
- technical logging configuration does not determine business audit retention.

## Current-prototype migration

- prototype can continue without a server audit store, but new production application-service contracts should expose actor/context/correlation data from the start;
- existing domain/store mutation functions should not become the permanent production write boundary because they lack standardized authorization/audit context;
- seeded/demo reset remains a local prototype action; production destructive maintenance must be permissioned/audited.

## Deferred

- SIEM streaming;
- tamper-evident hash chaining/WORM storage;
- automated anomaly/fraud detection;
- complex dual-control approval workflow beyond the initial override relationship.

## Validation examples

1. Manager approves a 20% manual discount: audit shows cashier initiator, manager approver, reason and finalized transaction reference.
2. Stock count posts -2 variance: audit references the count and immutable inventory movement rather than storing a secret/full object dump.
3. Admin changes a price book from 12,000 to 11,500: old/new amount and actor are searchable.
4. PIN reset is audited as an action but the PIN/hash never appears in metadata.
