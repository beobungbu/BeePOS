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
- customers and loyalty;
- chain reporting and operational controls.

Secondary scope, documented only at capability level in this wave:

- wholesale / B2B sales;
- distribution / dealer operations;
- warehouse / distribution-center operations;
- accounts payable / accounts receivable;
- omnichannel fulfillment.

## Research principles

1. **Business process first.** Start from actors, triggers, activities, decisions, documents, exceptions, controls and KPIs.
2. **Separate process from software.** A business process may span POS, ERP, WMS, accounting, spreadsheets, paper and human approval.
3. **Document the happy path and exceptions.** Real retail operations are dominated by shortage, overage, partial delivery, price mismatch, return, damaged goods and cash variance.
4. **Trace every process to business value.** Revenue, margin, availability, working capital, shrinkage, service level or compliance.
5. **Use industry references as a baseline, not as a product specification.**

## Reference frameworks

### APQC Retail Process Classification Framework

APQC PCF is used as the top-level process taxonomy. APQC positions the PCF as a hierarchical process framework used for process definition, benchmarking and content management. Retail-specific PCF covers customer experience, marketing, merchandising and product delivery, while cross-industry PCF fills finance, HR, IT, governance and other enterprise processes.

Sources:

- https://www.apqc.org/process-frameworks
- https://www.apqc.org/resource-library/resource-listing/apqc-process-classification-framework-pcf-retail-excel-version-0

### ASCM SCOR Digital Standard

SCOR is used for supply-chain flows and performance language. SCOR DS organizes supply chain around **Orchestrate, Plan, Order, Source, Transform, Fulfill and Return**.

Source:

- https://www.ascm.org/globalassets/documents--files/corporate-transformation/scor-ds-digital-guide_final.pdf

### Oracle Retail / SAP Retail

Oracle Retail Merchandising and SAP retail documentation are used to validate real enterprise workflows such as item management, purchasing, replenishment, store supply, receiving, inventory, sales audit and financial tracking.

Sources:

- https://docs.oracle.com/en/industries/retail/retail-merchandising-foundation-cloud/latest/
- https://docs.oracle.com/en/industries/retail/retail-merchandising-foundation-cloud/latest/rmpug/replenishment.htm
- https://help.sap.com/docs/SAP_S4HANA_CLOUD_BEST_PRACTICES/213926733b2ca93ae8f209142315cfe1/12648c82fa6746b8b5978e5e565c1124.html

### Vietnam market evidence

KiotViet operating guides are used to validate common Vietnamese retail workflows, especially supplier, purchase-order, receiving, supplier debt and store operations.

Sources:

- https://www.kiotviet.vn/huong-dan-su-dung-kiotviet/retail-giao-dich/dat-hang-nhap/
- https://www.kiotviet.vn/huong-dan-su-dung-kiotviet/retail-giao-dich/nhap-hang/

## Document set

1. `01-business-capability-map.md` — what capabilities a retail chain needs.
2. `02-process-catalogue.md` — L0/L1/L2 catalogue of business processes.
3. `03-actors-and-responsibilities.md` — business actors, responsibilities and segregation-of-duty considerations.
4. `04-end-to-end-processes.md` — canonical end-to-end flows such as Procure-to-Pay, Replenish-to-Shelf, Store-to-Cash and Return-to-Resolution.
5. `05-business-rules-controls-kpis.md` — rules, internal controls, exception conditions and operational KPIs.
6. `06-business-glossary.md` — common retail terms and document definitions.

## Important boundary

These documents intentionally do **not** decide database tables, APIs, services, event schemas or implementation technology. Those decisions must be derived later from the accepted business model.
