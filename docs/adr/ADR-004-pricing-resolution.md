# ADR-004 — Price books, applicability and deterministic price resolution

- Status: Proposed
- Date: 2026-09-13
- Related issue: #4
- Parent: #2

## Context

The prototype stores `salePrice` on Product. Real retail needs branch/channel/customer pricing, effective dates and later B2B extensions. A simple `StorePrice` override would encode one dimension and require repeated redesign.

## Decision

### 1. Selling prices are owned by Pricing, not Catalog

Canonical concepts:

```text
PriceBook
  id
  organizationId
  code/name
  currency
  priority
  validFrom?
  validTo?
  status
  applicability

PriceBookEntry
  priceBookId
  skuId
  uomId
  amount
  validFrom?
  validTo?
```

`Product` and `SKU` may expose a flattened current-price read model for UI, but do not own historical/canonical selling price.

### 2. Price resolution receives an explicit context

```text
PriceContext
  organizationId
  storeId
  channel
  customerGroupId?
  customerId?          // reserved for future account-specific pricing
  businessInstant
  currency
```

The resolver also receives `skuId`, sale UOM and quantity where quantity-tier support is later enabled.

No price may depend on implicit selected-store UI state.

### 3. Applicability is multi-dimensional

P1 supports these scopes:

- organization/default;
- channel;
- store;
- customer group.

The schema must remain compatible with future B2B/customer-account applicability without implementing full wholesale pricing now.

### 4. Resolution is deterministic

Candidate PriceBookEntries must be active, in validity window, currency-compatible and applicable to the request context.

Winner ordering:

1. higher explicit `priority` wins;
2. when priority ties, more specific applicability wins;
3. when specificity ties, more specific entry validity/scope may win only by a documented deterministic rule;
4. any remaining tie is a configuration error, not arbitrary selection.

Recommended specificity score for P1 is based on matched constrained dimensions, but production implementation must expose this as a tested resolver policy rather than rely on database row order.

PriceBook priority exists so business administrators can intentionally override specificity when required.

### 5. Base/default price is still a PriceBook

Every sellable SKU/UOM combination needs a resolvable default price for the organization profile used by the POS, unless the product is explicitly marked `priceOnRequest/manualPrice` with permission rules.

Do not add a second canonical `basePrice` field on SKU. The default organizational price book is the base commercial source.

### 6. Pricing is distinct from promotion and manual discount

The resolver returns the commercial unit price before automatic promotions, coupons/loyalty rewards and manual cashier discounts.

A markdown can be implemented either as a dated price-book entry or a promotion depending on business semantics. The rule is:

- if the intended shelf/list selling price itself changes for a scope/time, use Pricing;
- if eligibility/reward logic produces a benefit, use Promotion.

### 7. Money and rounding

Vietnam profile stores monetary amounts as integer VND. Pricing does not use floating-point arithmetic. UOM conversion must occur with the SKU/UOM rules from ADR-003 and produce a deterministic unit/extended price according to the configured rounding policy.

### 8. Finalized sales snapshot the resolved price provenance

Retail transaction lines persist at least:

- price-book/entry reference when available;
- resolved unit price;
- sale UOM and conversion snapshot;
- currency;
- later promotion/manual-discount components separately.

Re-running the current price resolver must never rewrite old transactions or determine an old refund value.

## Invariants

- exactly one deterministic pre-promotion unit price is returned or an explicit no-price/configuration-error result occurs;
- candidate ordering never depends on database insertion order;
- price books and entries are organization-scoped;
- expired/inactive prices are not selected for new transactions;
- historical transaction prices are immutable snapshots.

## Current-prototype migration

- existing `Product.salePrice` seeds an organization default PriceBook entry for each migrated SKU/base sale UOM;
- POS product grids consume a CurrentPrice read model/resolver result rather than reading Product directly;
- future store/channel prices are additional applicable price books, not extra columns on Product.

## Deferred

- customer-account-specific contract prices;
- quantity breaks;
- cost-plus formulas;
- wholesale price agreements;
- foreign currency/multi-currency selling in the Vietnam P1 profile.

## Validation examples

1. Default chain price is 12,000; HCM store book priority 100 sets 11,500, so HCM resolves 11,500 while HN remains 12,000.
2. A VIP customer-group book and a store book overlap; the documented priority/specificity rule always produces the same winner.
3. When an override expires at 23:59, a new sale after expiry resolves the fallback price; an earlier finalized receipt stays unchanged.
4. A promotion such as buy-2-get-1 does not alter the underlying resolved price returned by this module.
