# 05 — Research-driven BeePOS roadmap

This roadmap replaces a simple feature-parity sequence with **domain-risk-first sequencing**.

## Gate 0 — Freeze the semantic baseline

Before implementing a large new feature wave:

- accept/revise the bounded contexts in `03-canonical-domain-model.md`;
- decide the product/SKU/UOM model;
- decide pricing applicability and precedence;
- decide retail transaction snapshot semantics;
- decide inventory movement/ledger semantics;
- decide organization/account/employee/register boundaries;
- approve provider-independent fiscal and peripheral ports.

Output: ADRs + domain types/contracts. UI can continue evolving, but no new persistent backend schema should predate these decisions.

## P1 — Production foundation

### 1. Tenant / organization / identity

Deliver:

- `Organization` + `orgId` isolation;
- account vs employee split;
- store assignments;
- explicit permissions;
- `Register` enrollment and active session context;
- unique cashier PIN and lock/unlock;
- audit log.

Why first: almost every later aggregate needs tenant/store/operator provenance.

### 2. Catalog normalization for grocery

Deliver:

- Product/SKU split;
- multiple identifiers/barcodes;
- UOM + conversion;
- merchandise/category hierarchy cleanup;
- tax category;
- lot/expiry policy fields even if lot UI is limited initially.

Why first: pricing, procurement, inventory, 2D barcode and wholesale all depend on this.

### 3. Pricing v1

Deliver:

- price books;
- effective windows;
- applicability to store/store group and customer group;
- channel dimension in the domain even if only POS is exposed initially;
- deterministic precedence;
- calculation trace;
- manager-controlled manual override policy.

Acceptance examples:

- same SKU has different price in HCM and HN;
- VIP group overrides branch price according to configured precedence;
- future price can be scheduled;
- transaction preserves the price source after the price book changes.

### 4. Inventory ledger migration

Deliver:

- immutable inventory movement model;
- derived/materialized stock position;
- migrate sale/refund/transfer/count/receipt posting to movements;
- movement history screen/API;
- idempotency keys for movement creation.

### 5. Supplier + purchasing v1

Deliver:

- supplier master;
- supplier item/cost;
- PO lifecycle;
- partial/full receiving;
- receipt-to-inventory posting;
- purchase variance basics.

### 6. Store cash controls

Deliver:

- paid-in/paid-out/cash drop;
- till count;
- expected vs actual cash;
- Z/end-of-day report;
- audit + manager override where needed.

### 7. Vietnam fiscal boundary

Deliver:

- provider-neutral fiscal domain;
- issue/status lifecycle;
- one reference adapter or sandbox integration only after provider research;
- transaction-to-fiscal-document linkage;
- retries/idempotency.

## P2 — Commercial rules and grocery depth

### Promotion engine v1

Start with:

- item/order amount and percent discounts;
- eligibility by store/customer group/channel/time;
- priority and stacking rules;
- buy-X-get-Y;
- coupons.

### Grocery inventory depth

- lot/expiry receiving and sale selection policy;
- expiry alerts;
- variable weight/quantity barcode handling;
- damage/shrinkage reasons;
- supplier return.

### Customer/loyalty v2

- customer groups;
- loyalty program configuration;
- points ledger;
- reward/redemption rules.

### Exchange workflow

Build on canonical retail transaction links rather than treating exchange as unrelated refund + sale UI.

## P3 — Platform reliability and ecosystem

- production local database;
- sync outbox/inbox and conflict policy;
- register/device provisioning;
- printer/scanner/scale/payment-terminal adapters;
- accounting connector framework;
- ecommerce/OMS connector framework;
- notification center;
- advanced reporting/projections.

Offline architecture should be designed during P1, even if full backend synchronization ships here.

## P4 — Wholesale / distribution extension

Do not overload the retail Sales context. Add dedicated B2B capabilities:

```text
B2B Account
Sales Order
Contract / Customer Price Agreement
Credit Limit
Payment Terms
AR / Debt
Delivery / Fulfillment
Sales Representative
Territory
```

Distribution extensions later:

```text
Distributor / Dealer hierarchy
Sell-in / sell-out
Route sales / van sales
Trade promotion / rebate
Commission
Distributor inventory
```

## Recommended issue decomposition

Create implementation epics only after Gate 0 approval:

```text
EPIC: Tenant & Identity Foundation
EPIC: Catalog / SKU / UOM Foundation
EPIC: Pricing Engine v1
EPIC: Inventory Ledger Migration
EPIC: Procurement v1
EPIC: Store Cash Controls
EPIC: Fiscal / E-Invoice Boundary
EPIC: Promotion Engine v1
EPIC: Grocery Lot / Expiry / Variable Measure
EPIC: Offline Synchronization
EPIC: Peripheral Integration
```

Each epic should include:

- domain decision reference;
- migration impact on current prototype;
- API/application contracts;
- UI stories;
- data migration;
- audit/security rules;
- unit/domain tests;
- end-to-end acceptance scenarios.

## Explicit non-goals before P1 stabilizes

Avoid spending core architecture effort on:

- dealer/distributor hierarchy;
- trade promotion management;
- advanced warehouse picking/waves;
- complex ERP accounting;
- manufacturing;
- multi-country fiscal rules;
- microservices decomposition.

Those are valid future directions but would make the current retail core harder to stabilize.
