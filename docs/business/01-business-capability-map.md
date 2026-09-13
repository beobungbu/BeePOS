# BeePOS Business Capability Map

## 1. Purpose

A capability map describes **what the business must be able to do**, independent of organization chart or software modules.

This map is intended for a multi-store retailer that may later expand into wholesale and distribution.

## 2. Level 0 capability domains

1. Strategy & Performance Management
2. Merchandise & Category Management
3. Supplier & Procurement Management
4. Demand, Replenishment & Allocation
5. Inventory & Stock Control
6. Warehouse & Distribution Operations
7. Store Operations
8. Selling & Customer Service
9. Pricing & Promotion Management
10. Customer & Loyalty Management
11. Finance & Cash Control
12. Workforce & Access Management
13. Risk, Compliance & Audit
14. Data, Reporting & Master Data
15. Wholesale & Distribution
16. Omnichannel & Fulfillment

## 3. Capability decomposition

### 3.1 Strategy & Performance Management

- corporate / chain strategy;
- store network planning;
- sales and margin target setting;
- annual / monthly operating plan;
- budget and expense control;
- KPI target management;
- store benchmarking;
- exception and action tracking.

Business outcomes:

- profitable growth;
- improved store productivity;
- better capital allocation.

### 3.2 Merchandise & Category Management

- merchandise hierarchy management;
- category strategy;
- assortment planning;
- product onboarding / delisting;
- brand management;
- product lifecycle management;
- shelf / space considerations;
- seasonal assortment;
- vendor assortment review.

Key questions:

- What should we sell?
- In which store/channel?
- For how long?
- What role does the SKU play in its category?

### 3.3 Supplier & Procurement Management

- supplier onboarding and qualification;
- supplier terms and commercial agreement;
- supplier-item relationship;
- cost and purchase terms maintenance;
- purchase planning;
- purchase-order creation and approval;
- order transmission / confirmation;
- delivery monitoring;
- receiving;
- supplier return;
- supplier payment / debt visibility;
- supplier performance review.

Oracle Retail treats purchasing, item management, inventory, replenishment and financial tracking as tightly related core merchandising capabilities. KiotViet's Vietnamese retail workflow similarly links purchase ordering, receiving, supplier history and supplier debt.

### 3.4 Demand, Replenishment & Allocation

- demand forecasting;
- min/max / target stock management;
- reorder-point management;
- safety-stock management;
- replenishment recommendation;
- automatic replenishment;
- warehouse-to-store allocation;
- supplier-to-store replenishment;
- replenishment exception handling;
- shortage / overstock management.

SAP describes store replenishment as calculating dates and quantities based on demand, stock, planned receipts and target stock. Oracle also supports replenishment that results in supplier purchase orders, warehouse transfers or both.

### 3.5 Inventory & Stock Control

- stock visibility by location;
- goods receipt;
- stock transfer;
- stock reservation;
- stock adjustment;
- stock count / cycle count;
- damage / spoilage / shrinkage recording;
- lot / expiry tracking where applicable;
- stock status management;
- stock valuation inputs;
- inventory aging;
- negative-stock exception handling.

Business outcomes:

- high inventory accuracy;
- lower shrinkage;
- lower out-of-stock;
- lower working capital.

### 3.6 Warehouse & Distribution Operations

- inbound scheduling;
- receiving;
- quality / quantity check;
- putaway;
- storage;
- replenishment to picking location;
- picking;
- packing;
- dispatch;
- cross-docking;
- store delivery;
- returns handling;
- transport coordination.

SCOR is particularly useful here: Source, Fulfill and Return provide the supply-chain process spine.

### 3.7 Store Operations

- store opening / closing;
- register opening;
- cashier handover;
- shelf replenishment;
- receiving at store;
- local stock movement;
- price-label execution;
- merchandising execution;
- stock count;
- cash handling;
- safety / loss prevention;
- end-of-day reconciliation;
- store issue / exception management.

### 3.8 Selling & Customer Service

- item lookup / scan;
- basket management;
- customer identification;
- price determination;
- promotion application;
- discount approval;
- payment / tender;
- receipt / invoice;
- suspend / resume transaction;
- void;
- return / exchange / refund;
- customer complaint / service recovery;
- special order / reservation where applicable.

### 3.9 Pricing & Promotion Management

- regular price setting;
- store / channel / customer-group pricing;
- effective-date price management;
- markdown;
- promotion planning;
- promotion eligibility;
- coupon / voucher;
- bundle / threshold offers;
- promotional funding tracking;
- approval and publication;
- store execution validation;
- promotion effectiveness review.

### 3.10 Customer & Loyalty Management

- customer profile;
- consent / contact preferences;
- customer segmentation;
- loyalty enrollment;
- earn / redeem points;
- tier management;
- purchase history;
- targeted promotion;
- customer service history.

### 3.11 Finance & Cash Control

- cash float;
- paid-in / paid-out;
- shift cash expectation;
- cash count;
- tender reconciliation;
- bank deposit preparation;
- sales settlement;
- supplier payable visibility;
- customer receivable visibility for B2B;
- gross sales / net sales / tax / discount reconciliation;
- cost and margin reporting.

### 3.12 Workforce & Access Management

- employee onboarding;
- store assignment;
- role assignment;
- shift scheduling / attendance integration;
- cashier authorization;
- manager override;
- separation of duties;
- performance review.

### 3.13 Risk, Compliance & Audit

- transaction audit;
- price override audit;
- refund audit;
- stock adjustment audit;
- cash variance investigation;
- fraud / anomaly review;
- tax / e-invoice compliance;
- approval controls;
- business continuity / offline procedure;
- audit evidence retention.

Oracle Retail's Sales Audit explicitly addresses missing, duplicate, erroneous and suspicious sales transactions before downstream use, which is a useful benchmark for this capability.

### 3.14 Data, Reporting & Master Data

- product master;
- supplier master;
- store / location master;
- employee master;
- customer master;
- price / promotion master;
- reason-code master;
- operational reporting;
- management dashboard;
- exception reporting;
- data-quality management;
- KPI definitions and governance.

### 3.15 Wholesale & Distribution

Later-wave capability family:

- B2B customer / dealer management;
- quotation / sales order;
- contract pricing;
- credit limit;
- payment terms;
- AR / aging;
- delivery planning;
- sales territory;
- sales representative;
- route sales / van sales;
- sell-in / sell-out;
- rebate / trade promotion;
- distributor stock visibility.

### 3.16 Omnichannel & Fulfillment

Later-wave capability family:

- ecommerce order capture;
- order orchestration;
- inventory availability;
- click-and-collect;
- ship-from-store;
- home delivery;
- online return to store;
- cross-channel customer / promotion consistency.

## 4. Proposed BeePOS research priority

### Tier A — must understand deeply before product scope is expanded

- Store Operations
- Selling & Customer Service
- Inventory & Stock Control
- Supplier & Procurement
- Pricing & Promotion
- Finance & Cash Control
- Risk / Audit

### Tier B — next

- Merchandise / Category
- Demand / Replenishment
- Customer / Loyalty
- Reporting / Master Data

### Tier C — later expansion

- Warehouse / DC depth
- Wholesale / Distribution
- Omnichannel

## 5. Reference basis

- APQC Retail PCF: process taxonomy and benchmarking structure.
- ASCM SCOR DS: Orchestrate, Plan, Order, Source, Transform, Fulfill, Return.
- Oracle Retail Merchandising: item, inventory, replenishment, purchasing, sales audit, finance.
- SAP Retail replenishment: demand, inventory position, planned receipts and target stock.
- KiotViet Retail: purchase ordering, goods receipt, supplier debt and practical Vietnamese retail workflow.
