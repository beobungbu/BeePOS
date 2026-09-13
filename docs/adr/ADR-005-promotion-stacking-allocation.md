# ADR-005 — Promotion boundaries, stacking and discount allocation

- Status: Proposed
- Date: 2026-09-13
- Related issue: #10
- Parent: #2

## Context

Retail promotions affect what the customer pays, but they are not the same thing as base/resolved price, manual cashier discount, loyalty redemption or payment tender. Conflating them makes return allocation, tax, reporting and campaign analysis unreliable.

## Decision

### 1. Promotion is a separate bounded context

Canonical concepts:

```text
Promotion
  id
  organizationId
  name/code
  status
  validFrom/validTo
  priority
  stackPolicy
  scope/eligibility
  conditions[]
  rewards[]

PromotionApplication
  promotionId
  affected lines
  reward amount/quantity
  allocation details
```

The engine evaluates a cart/transaction candidate after ADR-004 price resolution.

### 2. P1 promotion types

Support the domain model for these P1 families:

- percentage off eligible lines;
- fixed amount off eligible lines/order;
- spend threshold → percentage/fixed reward;
- buy X quantity → get Y quantity/free/discounted item;
- simple bundle/set price or bundle discount.

Coupon codes may act as eligibility tokens for a Promotion; they are not a second pricing engine.

Advanced trade-promotion funding, supplier rebates and personalized ML offers are deferred.

### 3. Stacking is explicit

Every promotion declares one of:

- `exclusive`: if selected, incompatible promotions on the affected scope are excluded;
- `stackable`: may combine according to ordering rules;
- `best_of_group`: only the best reward in a configured exclusivity group applies.

Evaluation order is deterministic:

1. establish eligible candidates;
2. order by explicit promotion priority, then stable promotion ID as deterministic tie-break only after configuration validation;
3. apply exclusivity/best-of-group rules;
4. calculate rewards using the documented base for each promotion;
5. allocate order-level rewards to lines.

A stable ID tie-break prevents non-deterministic execution but a business-significant unresolved tie should surface as a configuration warning.

### 4. Pricing markdown vs promotion

Use Pricing when the shelf/list selling price itself is different for a scope/time. Use Promotion when qualification generates a reward/benefit.

This means a scheduled 10,000 → 9,000 shelf price can be a dated PriceBook entry, while “buy 2 get 1” or “members get 10% this weekend” is Promotion.

### 5. Manual cashier discount remains separate

Manual line/order discounts require explicit permission and reason and are represented separately from automatic PromotionApplication records.

P1 calculation sequence:

```text
resolved line price
→ automatic promotions
→ coupon-triggered promotions
→ authorized manual discounts
→ loyalty redemption/benefit according to loyalty policy
→ tax/final totals according to fiscal profile
```

The exact tax interaction is profile-specific and must be tested against Vietnam fiscal rules; transaction snapshots preserve each component rather than only a final discount total.

### 6. Order-level reward allocation is deterministic

Any order-level monetary discount is allocated back to eligible transaction lines proportionally to their qualifying extended amounts using integer money.

Remainder handling uses a deterministic largest-remainder strategy with a stable line-order tie-break. The sum of allocated line discounts must equal the order-level reward exactly.

This allocation is stored in the finalized transaction and reused for returns; it is never recomputed from current promotion rules.

### 7. Free/reward items remain transaction lines

A free gift or buy-X-get-Y reward is represented as a normal transaction line or linked reward line with:

- SKU/UOM/quantity snapshot;
- commercial list/resolved price snapshot;
- promotion discount that reduces payable amount as applicable;
- source PromotionApplication reference.

Do not represent free stock as an invisible inventory decrement.

### 8. Usage/redeem side effects require idempotency

Coupon redemption, limited-use campaigns and future customer-specific usage counters are side effects and must use the offline/idempotency contract from ADR-009. P1 offline policy may restrict promotions whose eligibility cannot be safely validated offline.

## Invariants

- price resolution can be explained independently from promotion evaluation;
- every discount/reward on a finalized sale has provenance;
- monetary allocations sum exactly to their source reward;
- returns use the stored historical allocation;
- free items generate inventory movements through ordinary finalized transaction lines;
- promotion evaluation is deterministic for the same input snapshot.

## Current-prototype migration

- existing line/order manual `Discount` remains a manual-discount concept;
- do not silently reinterpret current manual discounts as campaigns;
- new automatic promotion results are added as separate application/allocation structures;
- existing total-calculation functions need compatibility adapters and expanded tests.

## Deferred

- supplier-funded promotion settlement;
- complex mix-and-match optimization across very large baskets;
- personalized/AI promotion selection;
- external coupon marketplaces;
- multi-stage marketing attribution.

## Validation examples

1. A 10% member promotion and an exclusive buy-2-get-1 conflict exactly according to configured stack policy.
2. A 30,000 order discount across 100,000 and 200,000 eligible lines allocates exactly 10,000 and 20,000.
3. A partial return uses the original line allocation even after the campaign expires.
4. A free gift appears on the receipt and decreases stock through the normal sale posting path.
