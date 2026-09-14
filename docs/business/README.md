# BeePOS — Business Operations Research Baseline

Status: Full SOP-level documentation coverage · desk-research baseline · 2026-09-13

## Purpose

This package describes how a retail / wholesale / distribution business operates **before software implementation design**.

It is business analysis, not backend/schema/API architecture. The documents are intended to be readable by owners, COO/operations, category, procurement, warehouse, store, finance, sales, BA and product teams.

## Coverage status

The business matrix now has **100% SOP-level documentation coverage**:

- 16/16 Level-1 business domains covered;
- all Level-2 process families in the three-level matrix have dedicated SOP ownership;
- 27 detailed SOP-level process specifications exist: **P01–P27**;
- no `Baseline` or `Capability-only` label remains in `11-three-level-business-matrix.md`.

Important: **SOP-level coverage does not mean retailer-approved SOP.**

Current maturity:

```text
Professional desk-research SOP
          ↓
Real-retailer validation
          ↓
Validated SOP
          ↓
Approved / Operational SOP
```

Retailer-specific thresholds, tolerances, legal operating detail, authority levels and commercial policies remain subject to validation.

## Research principles

1. Business process first: actors, triggers, evidence, decisions, exceptions, controls and KPIs.
2. Separate business process from software implementation.
3. Preserve business facts and discrepancies rather than editing history to force reconciliation.
4. Separate common/reference process logic from retailer-specific policy.
5. Treat exceptions as first-class workflow, not edge notes.
6. Use professional references as evidence, not as a schema to copy.
7. Prefer real-operator evidence as the next maturity step.

## Core business-analysis documents

1. [`01-business-capability-map.md`](./01-business-capability-map.md) — Level-1 capability/domain map.
2. [`02-process-catalogue.md`](./02-process-catalogue.md) — process taxonomy backbone.
3. [`03-actors-and-responsibilities.md`](./03-actors-and-responsibilities.md) — actors, RACI and segregation of duties.
4. [`04-end-to-end-processes.md`](./04-end-to-end-processes.md) — cross-domain E2E flows.
5. [`05-business-rules-controls-kpis.md`](./05-business-rules-controls-kpis.md) — rules, controls and KPI tree.
6. [`06-business-glossary.md`](./06-business-glossary.md) — normalized business vocabulary.
7. [`07-business-policy-decision-register.md`](./07-business-policy-decision-register.md) — retailer-policy decisions still to validate.
8. [`08-process-control-kpi-traceability.md`](./08-process-control-kpi-traceability.md) — process → risk → control → evidence → KPI.
9. [`09-professional-source-map.md`](./09-professional-source-map.md) — professional source/evidence map.
10. [`10-real-retailer-validation-guide.md`](./10-real-retailer-validation-guide.md) — interview/observation/evidence pack.
11. [`11-three-level-business-matrix.md`](./11-three-level-business-matrix.md) — Level 1 → Level 2 → Level 3 coverage matrix.

## SOP catalogue P01–P27

### Retail / store / supply core

- `P01-procure-to-receive.md`
- `P02-inventory-to-availability.md`
- `P03-replenish-to-shelf.md`
- `P04-store-to-cash.md`
- `P05-return-to-resolution.md`
- `P06-shift-to-reconciliation.md`
- `P07-pricing-and-promotion-lifecycle.md`
- `P08-sales-to-assurance.md`
- `P09-supplier-to-settlement.md`
- `P10-category-assortment-product-lifecycle.md`
- `P11-grocery-quality-expiry-waste.md`
- `P12-customer-loyalty-lifecycle.md`

### Wholesale / distribution / omnichannel / finance

- `P13-wholesale-order-to-cash.md`
- `P14-distribution-route-to-settlement.md`
- `P15-omnichannel-order-to-fulfillment.md`
- `P16-finance-facing-retail-controls.md`

### Coverage-completion SOPs

- `P17-strategy-to-performance.md`
- `P18-supplier-return-to-credit.md`
- `P19-demand-planning-and-allocation.md`
- `P20-warehouse-inbound-storage-crossdock.md`
- `P21-store-open-to-close.md`
- `P22-customer-service-to-recovery.md`
- `P23-customer-analytics-to-targeting.md`
- `P24-workforce-lifecycle-and-scheduling.md`
- `P25-risk-compliance-and-continuity.md`
- `P26-master-data-reporting-kpi-governance.md`
- `P27-trade-promotion-and-dealer-management.md`

## Reference framework families

The detailed source map is in `09-professional-source-map.md`.

Main references include:

- APQC PCF 8.0 for enterprise process taxonomy and key measures;
- ASCM SCOR Digital Standard for supply-chain process/performance language;
- GS1 for retail/product/logistics identification standards;
- Oracle Retail and Oracle WMS for merchandising, assortment, pricing, receiving, warehouse, POS, sales audit, loyalty, AP matching and omnichannel patterns;
- SAP Retail / Credit Management / Last Mile Distribution / Trade Promotion references for B2B credit, route/van sales and rebates;
- KiotViet operational guides for Vietnamese retail workflow evidence;
- official Vietnam Government legal sources for current fiscal/e-invoice requirements, including Decree 254/2026/NĐ-CP effective 1 July 2026.

## Acceptance standard for an SOP-level document

A dedicated SOP should contain the relevant subset of:

- purpose and boundary;
- owner and actors;
- trigger / entry criteria;
- business evidence/documents;
- lifecycle/statuses;
- normal flow;
- exception catalogue;
- decisions and approvals;
- rules and tolerances;
- segregation of duties / controls;
- KPIs;
- worked example;
- upstream/downstream relationship;
- open retailer-policy questions;
- professional research anchors.

## Next maturity step

Do **not** move directly from this coverage milestone into code.

Use `10-real-retailer-validation-guide.md` to validate P01–P27 against:

- real operator interviews;
- current SOPs/forms/reports;
- observed work;
- at least one normal case and one exception case;
- policy/authority/tolerance values;
- legal/fiscal operating practice;
- real management KPIs and evidence.

Only then should an SOP be promoted from **Desk-Research SOP** to **Validated SOP** and eventually **Approved / Operational SOP**.

## Boundary

These documents do not authorize or prescribe database tables, APIs, services, event schemas, sync architecture or implementation technology.
