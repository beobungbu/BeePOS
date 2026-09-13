# ADR-007 — Inventory movements as stock truth; StockPosition as read model

- Status: Proposed
- Date: 2026-09-13
- Related issue: #6
- Parent: #2

## Context

The prototype stores mutable `StockLevel { productId, storeId, onHand, reserved, minLevel }`. Production retail needs explainable stock history across sale, return, receipt, transfer, count, damage and future supplier returns. A mutable balance alone cannot answer how stock reached its current value or safely reconcile offline retries.

## Decision

### 1. InventoryMovement is the canonical operational stock event

Every posted stock change creates an immutable InventoryMovement with at least:

```text
InventoryMovement
  id
  organizationId
  skuId
  locationId
  quantityBaseUomSigned
  movementType
  occurredAt
  businessDate
  sourceType
  sourceId
  sourceLineId?
  correlationId?
  idempotencyKey?
  employeeId?
  registerId?
  reasonCode?
  lotId?/expiry?   // when tracking policy requires
```

Movements are never edited to correct stock. Corrections create new compensating/adjustment movements.

### 2. StockLocation is distinct from Store

P1 must support at least one inventory location per Store, but use an explicit `StockLocation` identity so future backroom/sales-floor/quarantine/warehouse locations do not require changing movement identity.

Default P1 setup may create one `SELLABLE` stock location per store and hide location complexity in the UI.

### 3. StockPosition is a derived/materialized read model

```text
StockPosition
  organizationId
  skuId
  locationId
  onHand
  reserved
  available
  inTransit?  // may be separate aggregate/read field depending transfer design
  updatedThrough / version
```

`onHand` derives from posted movements. `reserved` derives from reservation records/policies rather than destructive stock mutation. Recommended:

```text
available = onHand - reserved
```

with additional disposition-specific quantities (damaged/quarantine) represented by distinct locations or explicit inventory statuses rather than opaque arithmetic when those capabilities are implemented.

### 4. Movement sign conventions

Examples relative to a location:

- supplier/customer receipt to sellable location: positive;
- sale: negative;
- customer return accepted as sellable: positive;
- transfer out: negative at source;
- transfer in: positive at destination;
- supplier return: negative;
- count/adjustment: signed variance;
- damage write-off: negative from sellable, optionally paired with positive movement into a non-sellable location if disposition tracking is enabled.

Movement type explains business meaning; signed quantity explains effect.

### 5. Transfers are stateful documents plus immutable postings

A `StockTransfer` owns workflow (`draft → sent → partially_received/received/cancelled` as supported). Posting creates linked movements:

- source send: negative movement from source and transfer quantity considered in transit;
- destination receipt: positive destination movement for actual received quantity;
- discrepancies are explicit, not silently forced to requested quantity.

Do not model a transfer as directly decrementing/incrementing mutable balances without movement history.

### 6. Stock counts post variance; they do not replace history

A StockCount captures expected snapshot/version and counted quantity. Posting computes a variance and creates an adjustment movement with count document/line reference.

If stock changed after the count snapshot, posting must use an explicit policy (recalculate expected from snapshot/version, warn/recount, or manager override). It must not blindly set `onHand = counted` without an audit trail.

### 7. Negative stock is an organization/store policy

Default grocery production recommendation: warn/block sale that would create negative available stock when authoritative stock is sufficiently fresh, but permit a configurable controlled override for retail continuity/offline conditions with audit reason.

The ledger must represent negative balances if allowed; it must never fabricate stock to avoid them.

### 8. Idempotency is mandatory for stock-posting commands

A finalized sale, return, receipt, transfer receipt and count posting must not create duplicate movements on retry. Source document line + posting kind and/or explicit idempotency key must enforce uniqueness server-side.

### 9. Base UOM follows ADR-003

Movement quantity is stored in SKU base inventory UOM using deterministic fixed-scale/integer semantics. Source documents retain original entered UOM/quantity/conversion snapshots.

## Invariants

- a posted movement is immutable;
- the same idempotent business posting cannot create a second movement;
- movement organization/SKU/location scope is consistent;
- StockPosition can be rebuilt from canonical movements plus reservation state;
- stock-count posting creates explainable variance movement;
- transfer source and destination postings are correlated but individually auditable;
- no UI action directly assigns authoritative `onHand` without a posting event.

## Current-prototype migration

- current `StockLevel` becomes a compatibility/read model during transition;
- existing seed onHand values require opening-balance movements or a migration baseline event;
- receipts/transfers/counts domain functions change from balance mutation to movement creation + read-model projection;
- sale/refund code emits inventory posting commands after transaction finalization;
- UI routes can remain largely unchanged while consuming StockPosition views.

## Deferred

- costing/COGS valuation method (weighted average/FIFO) as a separate accounting/valuation decision;
- advanced warehouse bins/waves;
- full reservation/OMS orchestration;
- serial tracking UI;
- automated FEFO allocation.

## Validation examples

1. A sale retry after network timeout produces one sale movement, not two.
2. Count expected 10, counted 8 posts `-2` adjustment; history still shows prior receipt/sales.
3. Transfer sends 10, destination receives 9; source/destination and discrepancy remain explainable.
4. StockPosition can be recomputed from movements and matches the materialized view.
