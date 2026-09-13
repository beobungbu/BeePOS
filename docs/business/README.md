# BeePOS — Business Operations Research Baseline

Status: Working research baseline · 2026-09-13

## Purpose

This package describes **how a retail / wholesale / distribution business operates** before deciding how BeePOS should implement it technically.

The focus is business analysis, not software architecture. Documents here should be readable by a retail owner, operations manager, buyer, store manager, warehouse manager, accountant, BA and product manager without needing to read source code.

## Scope of this wave

Primary scope:

- multi-store grocery / general retail;
- purchasing and supplier operations;
- receiving and inventory control;
- replenishment and store transfers;
- selling at store / POS;
- returns and refunds;
- pricing and promotion operations;
- cashier shifts and store cash control;
- chain sales assurance and operational controls.

Secondary scope, documented only at capability level in this wave:

- wholesale / B2B sales;
- distribution / dealer operations;
- warehouse / distribution-center operations;
- accounts payable / accounts receivable;
- omnichannel fulfillment;
- customer and loyalty lifecycle.

## Research principles

1. **Business process first.** Start from actors, triggers, activities, decisions, documents, exceptions, controls and KPIs.
2. **Separate process from software.** A business process may span POS, ERP, WMS, accounting, spreadsheets, paper and human approval.
3. **Document the happy path and exceptions.** Real retail operations are dominated by shortage, overage, partial delivery, price mismatch, return, damaged goods and cash variance.
4. **Trace every process to business value.** Revenue, margin, availability, working capital, shrinkage, service level or compliance.
5. **Use industry references as a baseline, not as a product specification.**
6. **Preserve business facts.** Exceptions are evidence; do not rewrite dispatch, receipt, sale, count or tender history merely to make numbers match.
7. **Separate universal process logic from retailer policy.** Thresholds, tolerances, return windows, approval levels and stacking rules belong in an explicit policy register.

## Reference frameworks

### APQC Retail Process Classification Framework

APQC PCF is used as the top-level process taxonomy. APQC positions the PCF as a hierarchical process framework used for process definition, benchmarking and content management. Retail-specific PCF covers customer experience, marketing, merchandising and product delivery, while cross-industry PCF fills finance, HR, IT, governance and other enterprise processes.

Sources:

- https://www.apqc.org/process-frameworks
- https://www.apqc.org/resource-library/resource-listing/apqc-process-classification-framework-pcf-retail-pdf-version-721
- https://www.apqc.org/resource-library/resource-collection/pcf-version-80-process-definitions-and-key-measures-collection

### ASCM SCOR Digital Standard

SCOR is used for supply-chain flows and performance language. SCOR DS organizes supply chain around **Orchestrate, Plan, Order, Source, Transform, Fulfill and Return**.

Source:

- https://www.ascm.org/globalassets/documents--files/corporate-transformation/scor-ds-digital-guide_final.pdf

### Oracle Retail / SAP Retail

Oracle Retail Merchandising, Pricing, Xstore and Sales Audit plus SAP Retail documentation are used to validate enterprise workflows such as purchasing, receiving, replenishment, store supply, return processing, pricing, inventory, cashier/store-day balancing and sales assurance.

Sources:

- https://docs.oracle.com/en/industries/retail/retail-merchandising-foundation-cloud/latest/
- https://docs.oracle.com/en/industries/retail/retail-pricing-cloud/latest/
- https://docs.oracle.com/en/industries/retail/retail-xstore-point-of-service/25.0/
- https://docs.oracle.com/en/industries/retail/retail-merchandising-foundation-cloud/latest/rmsoa/sales-audit.htm
- https://help.sap.com/docs/SAP_S4HANA_CLOUD_BEST_PRACTICES/213926733b2ca93ae8f209142315cfe1/12648c82fa6746b8b5978e5e565c1124.html

### Vietnam market evidence

KiotViet operating guides are used to validate common Vietnamese retail workflows, especially supplier ordering, receiving, stock count, transfers, returns and promotions.

Sources:

- https://www.kiotviet.vn/huong-dan-su-dung-kiotviet/retail-giao-dich/dat-hang-nhap/
- https://www.kiotviet.vn/huong-dan-su-dung-kiotviet/retail-hang-hoa/kiem-kho/
- https://www.kiotviet.vn/huong-dan-su-dung-kiotviet/retail-hang-hoa/chuyen-hang/
- https://www.kiotviet.vn/huong-dan-su-dung-kiotviet/retail-tra-hang/tra-hang/
- https://www.kiotviet.vn/huong-dan-su-dung-kiotviet/retail-khuyen-mai/khuyen-mai/

## Core document set

1. [`01-business-capability-map.md`](./01-business-capability-map.md) — what capabilities a retail chain needs.
2. [`02-process-catalogue.md`](./02-process-catalogue.md) — L0/L1/L2 catalogue of business processes.
3. [`03-actors-and-responsibilities.md`](./03-actors-and-responsibilities.md) — business actors, responsibilities and segregation-of-duty considerations.
4. [`04-end-to-end-processes.md`](./04-end-to-end-processes.md) — canonical end-to-end flows.
5. [`05-business-rules-controls-kpis.md`](./05-business-rules-controls-kpis.md) — rules, internal controls, exception conditions and operational KPIs.
6. [`06-business-glossary.md`](./06-business-glossary.md) — common retail terms and document definitions.
7. [`07-business-policy-decision-register.md`](./07-business-policy-decision-register.md) — retailer-specific policy questions that must be resolved with business owners.
8. [`08-process-control-kpi-traceability.md`](./08-process-control-kpi-traceability.md) — cross-process risk, control, evidence and KPI traceability.

## Detailed process specifications

The following documents deepen the highest-risk flows to SOP/BPMN-ready level. They remain business documents and deliberately do not prescribe tables, APIs or services.

1. [`processes/P01-procure-to-receive.md`](./processes/P01-procure-to-receive.md)
   - purchase requirement, PO, supplier commitment, receiving, partial/over/wrong/damaged/short-dated delivery, tolerance, supplier-performance controls.
2. [`processes/P02-inventory-to-availability.md`](./processes/P02-inventory-to-availability.md)
   - stock states, transfer, count, adjustment, shrinkage, in-transit and discrepancy responsibility.
3. [`processes/P03-replenish-to-shelf.md`](./processes/P03-replenish-to-shelf.md)
   - demand signal, target stock, source selection, store receiving, backroom-to-shelf, OSA and FEFO/FIFO.
4. [`processes/P04-store-to-cash.md`](./processes/P04-store-to-cash.md)
   - basket, price/promotion, override, tender, failed/uncertain payment, receipt and completed-sale control.
5. [`processes/P05-return-to-resolution.md`](./processes/P05-return-to-resolution.md)
   - verified/unverified return, promotion allocation, refund tender, condition/disposition and fraud controls.
6. [`processes/P06-shift-to-reconciliation.md`](./processes/P06-shift-to-reconciliation.md)
   - opening float, cash movement, safe drop, blind count, over/short, electronic tender and business day.
7. [`processes/P07-pricing-and-promotion-lifecycle.md`](./processes/P07-pricing-and-promotion-lifecycle.md)
   - regular price, emergency price, markdown, campaign mechanics, stacking, stock readiness and evaluation.
8. [`processes/P08-sales-to-assurance.md`](./processes/P08-sales-to-assurance.md)
   - store-day completeness, missing/duplicate transactions, tender balancing, suspicious patterns and exception lifecycle.

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
Detailed SOP-level Process Specifications
             ↓
Business Policy Decision Register
             ↓
Control / Evidence / KPI Traceability
             ↓
Future: real-operator validation, BPMN swimlanes and approved target SOPs
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

## Important boundary

These documents intentionally do **not** decide database tables, APIs, services, event schemas or implementation technology. Those decisions must be derived later from an accepted and validated business model.
