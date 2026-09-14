# BeePOS Real-Retailer Business Validation Guide

Status: Field-validation pack · 2026-09-13

## 1. Purpose

Desk research is now broad enough that the next quality improvement should come from **real retailer evidence**, not additional software feature comparison.

This guide defines how to validate the BeePOS business-process baseline with an actual retail / wholesale / distribution operator.

The goal is to distinguish:

- industry-standard process logic;
- the retailer's current actual process;
- undocumented workarounds;
- retailer-specific policy;
- target/future process;
- problems the product should eventually solve.

This is business discovery, not technical requirements gathering.

## 2. Validation evidence hierarchy

For each important process/rule, collect evidence in this order where possible:

1. approved SOP / policy;
2. approval authority matrix;
3. real transaction documents/forms;
4. current KPI / exception report;
5. observed real workflow;
6. interview explanation;
7. system screenshot/demo;
8. anecdotal example.

A system screen shows what software allows; it does not automatically prove what the business policy intends.

## 3. Evidence-request checklist

Ask for anonymized/redacted samples where necessary.

### Procurement / supplier

- supplier onboarding form;
- approved supplier list;
- PO sample;
- PO approval matrix;
- supplier confirmation;
- delivery note;
- goods receipt;
- discrepancy/claim form;
- supplier invoice;
- credit note;
- supplier scorecard;
- AP aging / unmatched invoice report.

### Inventory / replenishment

- store stock report;
- transfer request/dispatch/receipt;
- cycle/full count sheet;
- adjustment form/reason list;
- shrinkage report;
- negative-stock report;
- replenishment/min-max report;
- stockout/OSA report;
- aging/expiry report;
- damaged/quarantine report.

### Store operations / sales

- cashier opening/closing sheet;
- cash paid-in/out form;
- Z/store-day report;
- receipt sample;
- price override / discount approval evidence;
- promotion brief;
- return/refund form;
- high-return/void/discount exception report;
- bank/card/QR reconciliation report.

### Commercial / merchandising

- category hierarchy;
- assortment/range file;
- new-product setup form;
- new-product approval checklist;
- regular price change approval;
- markdown/clearance file;
- promotion calendar/brief;
- post-promotion performance report;
- delisted-product report.

### Customer / loyalty

- enrollment form/flow;
- earn/redeem rules;
- tier rules;
- points adjustment process;
- customer merge/recovery SOP;
- return/points reversal example;
- loyalty performance report.

### B2B / wholesale / distribution

- customer credit application;
- customer price/contract terms;
- sales order;
- delivery note / POD;
- AR aging;
- credit-hold report;
- route plan/manifest;
- van load sheet;
- route cash/stock settlement;
- customer return/empties form;
- rebate agreement.

## 4. Interview method

Do not ask only “How do you do X?” Use four layers:

### A. Normal process

“What normally happens from start to finish?”

### B. Exceptions

“What happens when quantity/price/payment/stock does not match?”

### C. Authority

“Who can approve the exception, at what threshold?”

### D. Evidence

“What document/report proves it happened?”

For every major process, request at least one **real exception from the last 3–6 months**. Exception stories usually expose more business requirements than the happy path.

## 5. CEO / Owner interview

Objective: understand operating model and business priorities, not detailed clicks.

Questions:

- What channels generate revenue: store, wholesale, dealer, ecommerce, direct distribution?
- Which channel has highest margin? Highest working-capital need?
- What business problem hurts most: stockout, excess stock, shrinkage, debt, supplier reliability, cash control, margin leakage?
- Centralized vs decentralized purchasing/pricing/replenishment?
- Which decisions can stores make locally?
- What does management review daily, weekly, monthly?
- Which 5 KPIs determine whether operations are healthy?
- Where do you distrust current data?
- What exceptions require your personal approval today?
- Which processes depend on Excel/Zalo/paper despite having software?
- What would prevent you from opening 2× more stores/dealers?

Outputs:

- business-channel map;
- decision-rights map;
- executive KPI tree;
- top pain-point register.

## 6. COO / Retail Operations interview

Questions:

- How is store performance reviewed?
- What defines an acceptable store day?
- How are cash shortages, high refunds, high discounts handled?
- How often are stores physically counted/audited?
- How are store transfers approved?
- What causes most customer complaints?
- How is shelf availability measured?
- How do you detect that stock exists in backroom but shelf is empty?
- What store actions are considered high risk?
- Which store processes vary by region/format?
- How is new-store opening stock planned?
- How are store managers held accountable for inventory/cash?

Walkthrough request:

Observe one store from opening through closing if possible.

## 7. Category Manager / Merchandiser interview

Questions:

- How is merchandise hierarchy defined?
- How do assortments differ by store/cluster/channel?
- What is required before new SKU launch?
- How do you decide initial stock and stores?
- Who owns regular price?
- What margin floor exists?
- What triggers markdown/delist?
- How do you plan promotions and stock uplift?
- How are supplier-funded promotions tracked?
- How do you measure campaign success?
- What happens to residual delisted stock?
- How often do stores execute wrong labels/signage?

Evidence:

category plan, range file, price calendar, campaign brief, SKU performance report.

## 8. Buyer / Procurement interview

Questions:

- What triggers buying: forecast, min/max, store request, manual judgment?
- Central or store purchasing?
- Who approves supplier/PO/cost variance?
- Can stores receive without PO?
- What quantity/cost tolerance exists?
- What supplier MOQ/case-pack constraints matter most?
- How are supplier confirmations managed?
- How are partial deliveries/backorders handled?
- How are damaged/short-dated/wrong items claimed?
- How is supplier performance measured?
- What invoice discrepancies occur most?
- How long do supplier claims remain unresolved?

Evidence:

real PO→receipt→invoice discrepancy case.

## 9. Receiving / Warehouse interview + observation

Observe a real delivery.

Questions:

- Do receivers see ordered quantity when counting?
- How do they identify PO/shipment?
- What is counted: cases, inner packs, eaches, weight?
- How are damaged goods separated?
- Which categories require expiry/lot/temp checks?
- What happens when delivery is over/short?
- Can receiver change cost?
- How are no-PO deliveries handled?
- Where does rejected/quarantined stock physically go?
- What is the most common receiving mistake?

Record timestamps for truck arrival → receiving start → completion where practical.

## 10. Replenishment / Supply Planner interview

Questions:

- What determines reorder/min/max/safety stock?
- Which items are automatic vs manual?
- How is forecast adjusted for promotion/seasonality?
- How are open POs and transfers considered?
- What pack/MOQ constraints create excess stock?
- Who can override recommendation?
- Are overrides measured?
- How are store stockouts prioritized?
- When is inter-store transfer used?
- How are new items planned without history?
- How do you detect excess/slow/near-expiry stock?

Evidence:

one stockout case and one overstock/expiry case.

## 11. Inventory Controller interview

Questions:

- Full count vs cycle count frequency?
- Is count blind?
- What triggers recount?
- What adjustment threshold needs approval?
- Top shrinkage reasons?
- How are negative stocks handled?
- How are in-transit discrepancies investigated?
- How is known waste separated from unexplained shrinkage?
- Which employees/stores/items are highest risk?
- How are count results tracked over time?

Evidence:

count variance report and one completed investigation.

## 12. Store Manager interview

Questions:

- What can you change locally: price, discount, transfer, purchase, stock adjustment, return?
- What requires regional/HQ approval?
- How are cashiers assigned to tills?
- How are shift shortages investigated?
- How do you handle shelf price disputes?
- How do you handle a promotion that fails at checkout?
- How do you handle no-receipt returns?
- What happens if system says stock exists but staff cannot find it?
- What happens if card/QR payment status is uncertain?
- What reports do you check before leaving each day?

Observe manager exception handling, not only routine sale.

## 13. Cashier interview + checkout observation

Questions:

- Most frequent scan/product issues?
- How often does shelf price differ?
- What discounts can you apply yourself?
- What requires supervisor?
- How are suspended baskets handled?
- How are split payments handled?
- What do you do on QR/card timeout?
- How are returns verified?
- Can multiple cashiers share one drawer?
- Do you know expected cash before count?
- Which steps slow the queue most?

Measure a small sample of checkout times only as supporting evidence, not as sole design driver.

## 14. Finance / AP interview

Questions:

- Is PO/receipt/invoice matching used?
- What discrepancy tolerances exist?
- What is most common mismatch: quantity, price, tax, duplicate?
- Who resolves each mismatch?
- How are supplier credit notes/claims tracked?
- What is the invoice/payment approval chain?
- How are supplier bank-detail changes controlled?
- Which operational exceptions delay month close?
- What inventory costing method is used?
- How are landed costs treated?
- How is supplier promotion/rebate funding accounted/reconciled operationally?

Evidence:

one unmatched invoice and one supplier credit resolution.

## 15. Finance / Cash / Sales Audit interview

Questions:

- What defines business day/store day?
- What makes a store day “clean”?
- What exceptions block downstream reporting/accounting?
- How are cash over/short thresholds handled?
- How are card/QR settlements reconciled?
- How are provider fees/timing differences treated?
- How are missing/duplicate transactions detected?
- Who can correct transaction/store-day data?
- What exception-aging KPI exists?

Evidence:

one store-day reconciliation pack.

## 16. B2B Sales / Credit Control interview

Questions:

- How are B2B accounts approved?
- Who sets price/discount/payment terms?
- Who sets credit limit?
- What blocks an order?
- Who may release credit hold?
- How are partial deliveries/backorders handled?
- What POD is required before invoicing?
- How are payments allocated?
- What are common AR disputes?
- Are customer volume rebates used?
- How are returns/credit notes approved?

Evidence:

one order held by credit and later resolved.

## 17. Route Sales / Distribution interview + ride-along

If direct distribution exists, a ride-along is high value.

Questions:

- Presales, van sales or hybrid?
- How is route planned?
- How is vehicle stock loaded/count accepted?
- Can drivers sell extra items not preordered?
- How are collections for old AR handled?
- How are returns/empties tracked?
- Are truck-to-truck transfers allowed?
- How are remaining stock and cash reconciled at check-in?
- What route variance is tolerated?
- What happens on breakdown/missed customer?

Evidence:

route manifest/load sheet + final settlement.

## 18. Ecommerce / Omnichannel interview

Questions:

- Which locations can fulfill online orders?
- How is available-to-promise determined?
- How is walk-in inventory protected?
- How often does picker fail to find supposedly available stock?
- What substitution rules exist?
- What are pickup/delivery cutoffs?
- What happens to uncollected orders/perishables?
- When is customer charged?
- How are partial cancellations/refunds handled?
- Are cross-channel returns allowed?

Evidence:

one failed pick, one failed pickup/delivery and one cross-channel return.

## 19. Observation protocol

When observing a workflow, record:

- actor/role;
- trigger;
- start time/end time;
- document/evidence used;
- handoffs;
- system + paper/Excel/Zalo used;
- decisions;
- exceptions;
- rework;
- approvals;
- waiting time;
- data duplicated manually;
- workaround;
- downstream consequence.

Do not redesign during observation. First capture current-state truth.

## 20. Exception-sampling method

For each major process, request examples from the last 3–6 months:

- one normal case;
- one small exception within tolerance;
- one material exception requiring approval;
- one unresolved/failed case if available.

Examples:

- partial supplier delivery;
- cash shortage;
- store transfer discrepancy;
- no-receipt return;
- promo failure;
- duplicate payment;
- overdue B2B customer;
- van route stock shortage.

## 21. Process maturity scoring

Score each process 0–5:

| Score | Meaning |
|---|---|
| 0 | process not defined / person-dependent |
| 1 | ad hoc but repeatable by experienced staff |
| 2 | informal common practice |
| 3 | documented SOP / ownership exists |
| 4 | controls and KPI/exception review operate consistently |
| 5 | evidence-based continuous improvement / forecasting/optimization |

Also record **variation by store/region/channel**, because average maturity can hide serious local differences.

## 22. Gap classification

Each finding should be tagged as one of:

- **Policy gap** — no business rule/authority exists;
- **Process gap** — rule exists but workflow is unclear/broken;
- **Control gap** — process operates but risk is not controlled;
- **Data gap** — business cannot measure/trace needed facts;
- **Training gap** — process exists but staff do not execute consistently;
- **Tool gap** — current tools create avoidable manual work/error;
- **Integration gap** — handoff between systems/teams breaks information;
- **Reporting gap** — outcome exists but management cannot see it.

This prevents every problem from being mislabeled “need a new feature”.

## 23. Validation output template

For each process produce:

```text
Process:
Process owner:
Current-state maturity:
Observed variants:
Validated standard steps:
Validated exception paths:
Policy decisions confirmed:
Policy decisions missing:
Controls present:
Controls missing:
Evidence collected:
KPIs currently used:
Data/report gaps:
Manual workarounds:
Top pain points:
Target-state changes desired:
Open questions:
```

## 24. Exit criteria for business-research phase

Before converting research into product requirements, the most important processes should have:

- at least one real operator interview;
- at least one real document/evidence sample;
- at least one exception case validated;
- policy owner identified;
- unresolved policy questions explicitly listed;
- current-state vs target-state separated;
- process controls and KPI ownership confirmed;
- material differences from reference models documented.

Only then should business requirements be treated as retailer-validated rather than desk-research assumptions.
