# ADR-003 — Product, SKU, Identifier and unit-of-measure model

- Status: Proposed
- Date: 2026-09-13
- Related issue: #3
- Parent: #2

## Context

The prototype puts barcode, unit, cost price and sale price directly on `Product`. That works for UI testing but breaks down for grocery and real retail where one commercial product can have variants, multiple identifiers, purchase/sell units, case packs, weighed goods and future lot/expiry data.

## Decision

### 1. Product is descriptive/commercial identity; SKU is the stock/sell identity

```text
Product
  id
  organizationId
  name
  brandId?
  merchandise/category references
  status

SKU
  id
  organizationId
  productId
  code
  variant attributes?
  baseUomId
  inventoryPolicy
  status
```

Inventory, price-book entries, purchase-order lines and finalized sale lines reference `skuId`, not only `productId`.

For a simple item with no variants there is still one Product + one SKU. This keeps downstream domains uniform.

### 2. Identifiers are one-to-many from SKU

Use an explicit `SkuIdentifier` concept:

```text
SkuIdentifier
  id
  organizationId
  skuId
  type: GTIN | EAN | UPC | PLU | INTERNAL | SUPPLIER | OTHER
  value
  packagingUomId?
  isPrimary
  activeFrom?
  activeTo?
```

A SKU may have multiple identifiers. BeePOS does not assume one permanent barcode field.

Uniqueness:

- scan-resolvable active retail identifiers must be unambiguous within an organization;
- global GTIN validation may be applied where relevant, but BeePOS primary identity remains `skuId`;
- supplier-specific codes may repeat across suppliers and therefore require supplier context rather than global organization uniqueness.

### 3. UOM is explicit and inventory has one base UOM per SKU

```text
UnitOfMeasure
  id
  organizationId?  // null/system for standard units where implementation chooses
  code
  kind: count | mass | volume | length | other
  precision

SkuUom
  skuId
  uomId
  factorToBase
  purchaseAllowed
  saleAllowed
  barcode/identifier associations via SkuIdentifier
```

Every SKU has exactly one base inventory UOM. All ledger quantities are normalized to that base UOM. User-facing purchase/sale quantities may use an allowed alternate UOM and carry the explicit conversion factor snapshot used by the transaction.

Examples:

```text
water bottle SKU
base = EA
pack6 = 6 EA
case24 = 24 EA

rice bulk SKU
base = GRAM (or another selected canonical mass unit)
sale display can be KG with deterministic conversion
```

The exact standard base unit for weighed goods is an implementation choice, but once selected it must avoid floating-point ambiguity.

### 4. Quantity representation is decimal-safe, never binary floating point

Counts that are strictly integral may use integers. Variable-measure quantities require fixed-scale decimal or integer minor units appropriate to the UOM. Domain APIs must not use binary `number` arithmetic where it can create non-deterministic quantity results.

### 5. Variable-measure items are a SKU policy

A SKU may declare a variable-measure policy, including:

- measure kind (mass/other);
- permitted sale UOMs;
- whether barcode payload can contain encoded weight or price;
- rounding/precision constraints.

BeePOS should parse GS1/scale/retailer barcode payloads through an identifier/parser boundary rather than embedding parsing rules in cart UI.

### 6. Lot/expiry/serial are extensions of SKU inventory policy, not Product identity

P1 grocery compatibility requires the domain to leave extension points for:

- lot/batch tracking;
- expiry/best-before dates;
- FEFO guidance;
- serial tracking for future verticals.

These attributes belong to inventory units/movements or stock lots. They are not separate Products merely because the same SKU has different batches.

### 7. Pricing and cost are removed from Product identity

`Product`/`SKU` do not own the canonical selling price. Selling price resolves through Pricing (ADR-004). Purchase cost/history belongs to procurement/inventory valuation concerns, not a mutable `costPrice` field on Product as historical truth.

A convenience current-price read model may be exposed to UI, but it is not the canonical catalog field.

## Invariants

- every active SKU belongs to exactly one Product and Organization;
- every SKU has exactly one base UOM;
- inventory ledger quantities normalize to the SKU base UOM;
- an active POS-scannable identifier resolves deterministically within organization context;
- finalized business documents snapshot SKU code/name/UOM/conversion data needed for historical interpretation;
- changing a Product/SKU description or identifier never changes historical transaction text/data.

## Current-prototype migration

- each existing Product creates one initial SKU;
- `Product.sku` maps to the initial SKU code;
- `Product.barcode` becomes one initial `SkuIdentifier`;
- `Product.unit` becomes base UOM / SkuUom mapping;
- `Product.salePrice` migrates to the initial base PriceBook, not SKU;
- `Product.costPrice` becomes seed/procurement cost data or a temporary compatibility field until purchasing/valuation migration;
- `StockLevel.productId` migrates conceptually to `skuId`.

Feature screens may continue showing a flattened ProductView during transition.

## Deferred

- full GS1 master-data implementation;
- complex catch-weight supplier settlement;
- serial tracking UI;
- advanced packaging hierarchy logistics;
- GDSN synchronization.

## Consequences

Positive: grocery packaging, multiple barcodes, purchasing UOM, weighed items, pricing and inventory can evolve without repeatedly changing product identity.

Cost: more entities/read models and a migration layer for the current simple product UI.

## Validation examples

1. A drink can be bought as a case of 24, stocked as eaches and sold as either each or permitted pack without creating fake products.
2. An old EAN can remain historically referenced while a new active identifier is introduced.
3. A weighed SKU can add 0.735 kg to a cart without floating-point stock drift.
4. Two flavors are separate SKUs under one Product when variant grouping is desired.
5. A batch expiring next month remains the same SKU as a later batch; lot/expiry lives in inventory state.
