# BeePOS — Business Operations Research Baseline

Status: Working research baseline · 2026-09-13

## Purpose

This package describes **how a retail / wholesale / distribution business operates** before deciding how BeePOS should implement it technically.

The focus is business analysis, not software architecture. Documents here should be readable by a retail owner, operations manager, buyer, store manager, warehouse manager, accountant, BA and product manager without needing to read source code.

## Scope

The research now covers four connected operating areas:

- **Retail/store operations:** merchandise, purchasing, receiving, inventory, replenishment, checkout, return, cash reconciliation, pricing/promotion and sales assurance.
- **Customer/channel operations:** customer/loyalty and omnichannel fulfillment.
- **Wholesale/distribution:** B2B order-to-cash, credit/AR, dealer/customer delivery, direct distribution and van/route settlement.
- **Finance-facing controls:** supplier settlement, AP matching, AR, cash/tender settlement, inventory-value/costing questions and operational close controls.

## Research principles

1. **Business process first.** Start from actors, triggers, activities, decisions, documents, exceptions, controls and KPIs.
2. **Separate process from software.** A business process may span POS, ERP, WMS, accounting, spreadsheets, paper and human approval.
3. **Document the happy path and exceptions.** Real retail operations are dominated by shortage, overage, partial delivery, price mismatch, return, damaged goods, credit hold and cash variance.
4. **Trace every process to business value.** Revenue, margin, availability, working capital, shrinkage, service level or compliance.
5. **Use industry references as a baseline, not as a product specification.**
6. **Preserve business facts.** Exceptions are evidence; do not rewrite dispatch, receipt, sale, count or tender history merely to make numbers match.
7. **Separate universal process logic from retailer policy.** Thresholds, tolerances, return windows, credit limits, approval levels and stacking rules belong in an explicit policy register.
8. **Prefer real-operator evidence over more feature comparison.** The next research maturity step is SOP/forms/interviews/observations from a real retailer.

## Reference framework families

The detailed, verified source map is maintained in [`09-professional-source-map.md`](./09-professional-source-map.md).

The research uses:

- APQC Retail / Cross-Industry Process Classification Frameworks for taxonomy, definitions and key measures;
- ASCM SCOR Digital Standard for supply-chain value streams/performance language;
- GS1 for retail/product/logistics identification concepts;
- Oracle Retail Merchandising, Pricing, Assortment Planning, Xstore, Sales Audit, Customer Engagement, Invoice Matching and Order Broker for mature enterprise retail operating references;
- SAP Retail / Credit Management / Last Mile Distribution for replenishment, B2B credit and direct-distribution references;
- KiotViet operational guides as Vietnamese-market workflow evidence.

## Core document set

1. [`01-business-capability-map.md`](./01-business-capability-map.md) — what capabilities a retail / wholesale / distribution operator needs.
2. [`02-process-catalogue.md`](./02-process-catalogue.md) — L0/L1/L2 catalogue of business processes.
3. [`03-actors-and-responsibilities.md`](./03-actors-and-responsibilities.md) — business actors, responsibilities and segregation-of-duty considerations.
4. [`04-end-to-end-processes.md`](./04-end-to-end-processes.md) — canonical end-to-end flows.
5. [`05-business-rules-controls-kpis.md`](./05-business-rules-controls-kpis.md) — rules, internal controls, exception conditions and operational KPIs.
6. [`06-business-glossary.md`](./06-business-glossary.md) — common retail terms and document definitions.
7. [`07-business-policy-decision-register.md`](./07-business-policy-decision-register.md) — retailer-specific policy questions that must be resolved with business owners.
8. [`08-process-control-kpi-traceability.md`](./08-process-control-kpi-traceability.md) — cross-process risk, control, evidence and KPI traceability.
9. [`09-professional-source-map.md`](./09-professional-source-map.md) — verified professional reference map and evidence-strength guidance.
10. [`10-real-retailer-validation-guide.md`](./10-real-retailer-validation-guide.md) — interview, evidence collection, observation and process-maturity field-validation pack.

## Detailed process specifications

These documents deepen core flows to SOP/BPMN-ready business level without prescribing tables, APIs or services.

### Retail / store / supply

1. [`processes/P01-procure-to-receive.md`](./processes/P01-procure-to-receive.md)
   - requirement → PO → supplier confirmation → receiving → discrepancy → closure.
2. [`processes/P02-inventory-to-availability.md`](./processes/P02-inventory-to-availability.md)
   - stock states, transfer, count, adjustment, shrinkage and in-transit responsibility.
3. [`processes/P03-replenish-to-shelf.md`](./processes/P03-replenish-to-shelf.md)
   - demand signal, target stock, source selection, store receiving, backroom-to-shelf and OSA.
4. [`processes/P04-store-to-cash.md`](./processes/P04-store-to-cash.md)
   - basket, price/promotion, override, tender, uncertain payment, receipt and completed-sale control.
5. [`processes/P05-return-to-resolution.md`](./processes/P05-return-to-resolution.md)
   - verified/unverified returns, promotion allocation, refund tender, disposition and fraud controls.
6. [`processes/P06-shift-to-reconciliation.md`](./processes/P06-shift-to-reconciliation.md)
   - opening float, cash movement, safe drop, blind count, over/short, electronic tender and business day.
7. [`processes/P07-pricing-and-promotion-lifecycle.md`](./processes/P07-pricing-and-promotion-lifecycle.md)
   - regular price, emergency price, markdown, campaign mechanics, stacking, stock readiness and evaluation.
8. [`processes/P08-sales-to-assurance.md`](./processes/P08-sales-to-assurance.md)
   - store-day completeness, missing/duplicate transactions, tender balancing, suspicious patterns and exception lifecycle.
9. [`processes/P09-supplier-to-settlement.md`](./processes/P09-supplier-to-settlement.md)
   - supplier approval, PO/receipt/invoice matching, discrepancy resolution, supplier claims and payment authorization controls.
10. [`processes/P10-category-assortment-product-lifecycle.md`](./processes/P10-category-assortment-product-lifecycle.md)
    - category strategy, assortment breadth/depth, NPI, ranging, lifecycle, delist and residual-stock exit.
11. [`processes/P11-grocery-quality-expiry-waste.md`](./processes/P11-grocery-quality-expiry-waste.md)
    - shelf life, FEFO, quarantine, expiry/waste, quality incidents and recall.
12. [`processes/P12-customer-loyalty-lifecycle.md`](./processes/P12-customer-loyalty-lifecycle.md)
    - enrollment, earning, redemption, tiers, expiry, return reversal, adjustments and abuse controls.

### Wholesale / distribution / omnichannel / finance

13. [`processes/P13-wholesale-order-to-cash.md`](./processes/P13-wholesale-order-to-cash.md)
    - B2B account/terms, credit check, allocation, delivery, invoice, collection, AR, returns and rebates.
14. [`processes/P14-distribution-route-to-settlement.md`](./processes/P14-distribution-route-to-settlement.md)
    - presales/van sales, route preparation, vehicle stock, visits, collections, truck transfers and settlement.
15. [`processes/P15-omnichannel-order-to-fulfillment.md`](./processes/P15-omnichannel-order-to-fulfillment.md)
    - enterprise availability, sourcing, store pick, pickup, ship-from-store, substitution, cancellation and cross-channel return.
16. [`processes/P16-finance-facing-retail-controls.md`](./processes/P16-finance-facing-retail-controls.md)
    - AP/AR, tender/bank settlement, inventory value/COGS policy questions, cutoff and finance-facing reconciliations.

## Research progression

```text
Reference frameworks / market evidence
             ↓
Business Capability Map
             ↓
Process Catalogue L0/L1/L2
             ↓
Actors / RACI / Segregation of Duties
             ↓
End-to-End Process Baseline
             ↓
Detailed SOP-level Process Specifications P01–P16
             ↓
Business Policy Decision Register
             ↓
Control / Evidence / KPI Traceability
             ↓
Professional Source Map
             ↓
Real-Retailer Validation Pack
             ↓
Future: current-state validation → BPMN swimlanes → approved target SOPs
```

## Acceptance standard for a mature business-process document

A process is not “done” merely because a happy path exists. A mature specification should include:

- purpose / business outcome;
- start/end boundary;
- process owner and actors;
- trigger / entry criteria;
- documents / evidence;
- happy path;
- business statuses / milestones;
- exception catalogue;
- approvals and authority points;
- business rules and tolerances;
- segregation of duties / controls;
- KPI definitions;
- real-world scenarios;
- upstream/downstream relationships;
- unresolved policy questions.

## Current research maturity

The current package is now a **strong desk-research / reference-model baseline**, but it is not yet a retailer-approved SOP set.

Before deriving definitive product requirements, the highest-risk processes should be validated using [`10-real-retailer-validation-guide.md`](./10-real-retailer-validation-guide.md): real operator interviews, anonymized SOP/forms/reports, observed workflow and at least one real exception case per important process.

## Important boundary

These documents intentionally do **not** decide database tables, APIs, services, event schemas, sync architecture or implementation technology. Those decisions must be derived later from an accepted and validated business model.
