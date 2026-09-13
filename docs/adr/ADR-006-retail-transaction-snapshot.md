# ADR-006 — Immutable finalized retail transactions and return semantics

- Status: Proposed
- Date: 2026-09-13
- Related issue: #5
- Parent: #2

## Context

The current `Order` model is suitable for a prototype but production receipts must remain historically correct after product names, price books, tax rules, promotions, customer tiers, employees or store settings change. Returns and fiscal documents also need stable references to the original commercial facts.

## Decision

### 1. Cart and RetailTransaction are different lifecycle concepts

A Cart is mutable working state. A RetailTransaction is created/finalized only when the sale/return operation reaches the domain commit point.

Once finalized, commercial facts on the transaction are immutable. Corrections are represented by linked transactions/events, never by editing the original sale.

### 2. Transaction identity and context

A finalized transaction stores stable IDs and historical snapshots for:

- `id` generated according to the offline identity ADR;
- `organizationId`;
- `storeId`;
- `registerId`;
- `employeeId` / cashier reference;
- `shiftId` / register-session reference where applicable;
- `businessDate`;
- occurred/finalized timestamps;
- transaction type/status;
- customer reference when attached;
- original transaction references for return/exchange/correction.

Display receipt/document numbers are separate human/fiscal identifiers and do not replace the stable transaction ID.

### 3. Line snapshots preserve historical meaning

Each finalized line stores at least:

- `skuId` reference;
- SKU/product code and display description snapshot;
- sale UOM and quantity;
- UOM conversion snapshot to inventory base UOM when relevant;
- resolved/list unit price snapshot and pricing provenance;
- extended gross amount;
- automatic promotion applications/allocations;
- manual discount allocations and reasons where applicable;
- tax category/rate/base/amount snapshot according to fiscal profile;
- line net/payable totals;
- lot/serial references when the SKU policy requires them.

Current Catalog/Pricing data is not re-read to render historical commercial facts.

### 4. Totals are decomposed, not only stored as one discount total

Store sufficient components to reconcile:

```text
resolved gross/list amount
- automatic promotion allocations
- manual discount allocations
- loyalty monetary benefit where applicable
± rounding
+/- tax treatment according to configured tax profile
= transaction amount due
```

Tender/payment allocation is recorded separately so commercial totals and settlement remain distinct.

### 5. Return is a new linked transaction

A return/partial return creates a new RetailTransaction referencing the original transaction and original line IDs where available.

Return calculation uses original stored snapshots and allocation rules, not current prices/promotions.

For each returned quantity:

- refundable commercial amount is based on the original unit/line allocation snapshot;
- tax reversal follows the stored fiscal basis plus current legal adjustment rules where required;
- returned quantity cannot exceed eligible original quantity net of prior returns, unless an explicit manager-authorized no-receipt return policy is implemented separately;
- inventory restoration is posted by Inventory according to return disposition (resellable, damaged, etc.).

### 6. Void is not the same as post-finalization return

A pre-finalization cart cancellation has no RetailTransaction.

A same-session/pre-settlement void may be represented by an explicit void/cancel lifecycle only if no legally/fiscally irreversible side effect has occurred. Once finalized and externally/fiscally committed, reversal occurs through linked compensating transactions/documents.

The implementation must not use a generic mutable `status='void'` to erase business history.

### 7. Exchange is composition, not a special mutable order

P1 may implement exchange UX as:

```text
return transaction + new sale transaction
```

with a shared exchange/correlation reference. This preserves pricing, tax, inventory and tender auditability.

### 8. Money uses integer VND with deterministic allocation

All monetary snapshots for the Vietnam profile use integer VND. Line/order allocation remainders follow the deterministic algorithm defined by Pricing/Promotion/discount rules. Reversals consume the stored allocations.

## Invariants

- finalized commercial facts are immutable;
- sum of line/tax/discount/tender components reconciles to documented transaction totals;
- historical rendering does not depend on current Catalog/Pricing state;
- a returned quantity is traceable to original sale quantity where receipt-based return is used;
- every compensating transaction references its source/correlation chain;
- transaction ID is globally stable even if created offline.

## Current-prototype migration

- current `Order` evolves or maps to RetailTransaction for finalized orders;
- active carts remain a separate mutable type/store;
- current `OrderLine` gains immutable descriptive/UOM/pricing/promotion/tax snapshot fields;
- current `status: refunded|partial_refund|void` should migrate toward linked return/void/correction records rather than being the only historical evidence;
- UI can preserve the current Orders screen through read-model adapters.

## Deferred

- no-receipt return policy engine;
- cross-organization returns;
- complex exchange tender netting;
- advanced fiscal edge cases until a provider/legal implementation track is selected.

## Validation examples

1. Product name and price change tomorrow; yesterday's receipt still renders yesterday's name/price snapshot.
2. A campaign expires; a return next week refunds from the stored original promotion allocation.
3. Returning one of three units cannot exceed remaining eligible quantity after a prior partial return.
4. Exchange of size M for L creates a linked return and a new sale, preserving independent inventory and price history.
