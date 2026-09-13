# BeePOS End-to-End Business Process Baseline

## 1. Purpose

This document describes the major end-to-end retail flows in business terms. Each flow includes trigger, actors, business documents, happy path, exceptions, controls and outcome.

These flows should later be decomposed into SOPs and BPMN swimlanes.

---

# E2E-01 Procure-to-Receive

## Business objective

Ensure the right goods are purchased from an approved supplier, at agreed terms, and physically received with quantity/cost discrepancies visible and controlled.

## Trigger

One or more of:

- replenishment recommendation;
- buyer manual requirement;
- new assortment launch;
- promotion stock build;
- emergency stock shortage;
- seasonal purchase plan.

## Primary actors

Buyer, Category Manager, Supplier, Receiver/Warehouse Staff, Store Manager, Finance.

## Business documents

Purchase Requirement / Recommendation → Purchase Order → Supplier Confirmation → Delivery Note → Goods Receipt → Discrepancy Record → Supplier Payable Evidence.

## Happy path

1. Buyer reviews stock need and commercial terms.
2. Buyer selects approved supplier / supplier site.
3. PO is created with items, quantity, UOM, purchase cost, destination, delivery expectation and terms.
4. PO is approved according to authority threshold.
5. PO is sent to supplier.
6. Supplier confirms quantity / date or proposes amendment.
7. Delivery arrives.
8. Receiver identifies supplier / PO and checks physical goods.
9. Receiver records actual delivered quantity and relevant quality/expiry information.
10. Accepted quantity is received into inventory.
11. Open PO quantity is updated.
12. Financial payable basis is created / updated.
13. PO closes when business completion rules are met.

## Key exceptions

### Partial delivery

Supplier delivers less than ordered.

Business decision:

- keep residual quantity open;
- backorder;
- cancel remainder;
- source elsewhere.

### Over-delivery

Supplier delivers more than ordered.

Business decision:

- reject excess;
- accept within tolerance;
- require manager approval / PO amendment.

### Wrong item

Do not silently receive against another SKU. Record discrepancy and either reject or formally substitute under approval.

### Damaged / expired / short-dated goods

Possible outcomes:

- reject;
- quarantine;
- accept with commercial claim;
- accept partial quantity.

### Cost mismatch

Purchase invoice / supplier price differs from agreed PO.

Possible outcomes:

- accept approved tolerance;
- request supplier credit;
- amend PO with approval;
- escalate to buyer / finance.

## Controls

- supplier must be approved;
- high-value PO approval;
- receiver records actual quantity independently;
- quantity / cost tolerance;
- discrepancy reason mandatory;
- no silent editing of completed receipt;
- supplier performance measured from PO versus actual receipt.

## KPIs

- supplier OTIF;
- PO cycle time;
- purchase price variance;
- receipt discrepancy rate;
- supplier fill rate;
- overdue PO value;
- rejected / damaged quantity rate.

---

# E2E-02 Replenish-to-Shelf

## Business objective

Maintain shelf availability while minimizing excess inventory.

## Trigger

- stock reaches replenishment threshold;
- forecast indicates future shortage;
- shelf gap detected;
- promotion / seasonal demand event;
- manager requests replenishment.

## Primary actors

Demand/Replenishment Planner, Buyer, Warehouse/DC, Store Manager, Store Stock Staff.

## Flow

1. Demand / inventory position is reviewed.
2. Replenishment requirement is calculated or manually identified.
3. Source is selected: supplier, DC, another store or existing backroom stock.
4. Constraints are considered: lead time, MOQ, case pack, target stock, shelf capacity, in-transit stock.
5. Purchase order or transfer is created / recommended.
6. Goods arrive at store.
7. Store receives quantity and resolves delivery discrepancies.
8. Goods are staged / placed in backroom.
9. Shelf replenishment need is identified.
10. Staff move stock to shelf.
11. FEFO/FIFO rules are applied where relevant.
12. Price label / promotion display is verified.
13. Shelf gap / unavailable stock is escalated if stock cannot be found.

## Key exceptions

- stock exists in system but not physically found;
- backroom stock exists but shelf empty;
- transfer delayed;
- supplier delivery delayed;
- case pack too large for demand;
- short expiry;
- store capacity insufficient;
- promotion demand exceeds plan.

## KPIs

- on-shelf availability;
- out-of-stock rate;
- days / weeks of supply;
- stock turn;
- replenishment lead time;
- shelf-gap resolution time;
- excess stock value.

---

# E2E-03 Store-to-Cash

## Business objective

Convert customer demand into an accurate, authorized and auditable sale with correct pricing and tender collection.

## Trigger

Customer presents goods / requests checkout.

## Primary actors

Customer, Cashier, Store Manager, Payment Provider / Bank, Finance downstream.

## Business documents

Basket / sale transaction → tender record → receipt / invoice → shift sales summary.

## Happy path

1. Cashier begins on an authorized register / shift.
2. Product is scanned / selected.
3. Quantity is confirmed.
4. Customer is identified if relevant.
5. Applicable selling price is determined.
6. Applicable promotions / loyalty benefits are applied.
7. Any manual discount follows authority policy.
8. Tax / payable total is calculated.
9. Customer chooses tender method.
10. Payment is accepted.
11. Change is provided for cash where applicable.
12. Sale is finalized.
13. Receipt / invoice is issued.
14. Inventory availability is reduced according to business rules.
15. Sale contributes to shift, store and chain reporting.

## Key exceptions

### Barcode not found

- search product;
- request price / product verification;
- do not invent untracked item unless business explicitly allows open-price item.

### Price dispute

- verify shelf / advertised price;
- follow price override / customer service policy;
- manager approval above threshold.

### Promotion not applied

- verify eligibility and promotion window;
- investigate rule/data issue;
- manual compensation only under policy.

### Payment failure

- retry safely;
- switch tender;
- avoid duplicate capture;
- sale completes only when required payment is confirmed or approved offline policy applies.

### Customer abandons basket

- suspend or cancel transaction without generating completed sale.

## Controls

- unique cashier accountability;
- manual discount threshold;
- manager override;
- completed sale cannot be silently erased;
- high-risk void / refund reported;
- tender amount reconciled to shift.

## KPIs

- net sales;
- transaction count;
- average basket value;
- units per transaction;
- gross margin;
- discount rate;
- promotion share;
- payment mix;
- void rate;
- cashier throughput.

---

# E2E-04 Return-to-Resolution

## Business objective

Resolve customer returns fairly while protecting margin, inventory integrity and fraud controls.

## Trigger

Customer requests return / exchange / refund.

## Primary actors

Customer, Cashier, Store Manager, Customer Service, Inventory Staff.

## Flow

1. Original sale is identified where possible.
2. Return policy eligibility is checked.
3. Product condition is inspected.
4. Original price / discount / promotion effects are identified.
5. Refund / exchange amount is determined.
6. Manager approval is requested for policy exceptions / high-value cases.
7. Refund / exchange is executed.
8. Loyalty effect is reversed / recalculated if required.
9. Returned unit is dispositioned:
   - saleable stock;
   - quarantine;
   - supplier return;
   - damage / disposal.
10. Return reason is recorded.
11. Transaction becomes available for return / fraud analysis.

## Key exceptions

- no receipt / unidentified sale;
- return outside window;
- item consumed / damaged;
- item from another store / channel;
- bundle or buy-X-get-Y partial return;
- loyalty points already spent;
- original tender unavailable;
- suspected fraud.

## Controls

- mandatory reason;
- manager approval by value / exception type;
- link to original sale when available;
- no negative refund beyond original commercial value without authorization;
- returned stock condition explicitly classified.

## KPIs

- return rate;
- refund value / sales;
- no-receipt return rate;
- repeated customer / cashier return patterns;
- recovery to saleable stock rate;
- damaged return rate.

---

# E2E-05 Transfer-to-Receive

## Business objective

Move inventory between stores / warehouse locations with clear ownership of dispatched, in-transit and received quantities.

## Trigger

- replenishment requirement;
- overstock balancing;
- store closure / opening;
- promotion allocation;
- emergency stock request.

## Actors

Source Manager, Source Stock Staff, Destination Manager, Destination Receiver, Operations / Inventory Control.

## Flow

1. Transfer need is identified.
2. Source stock availability is checked.
3. Transfer request / order is created.
4. Approval occurs if required.
5. Source picks actual quantity.
6. Source dispatches goods.
7. Goods become in transit.
8. Destination receives and counts actual quantity.
9. Shortage / damage is recorded.
10. Transfer is completed when dispatched and received quantities are resolved.

## Exceptions

- source shortage;
- dispatch quantity differs from request;
- transit loss / damage;
- destination receives partial quantity;
- wrong destination;
- transfer cancelled after picking / dispatch.

## KPIs

- transfer lead time;
- transfer fill rate;
- in-transit aging;
- transfer discrepancy rate.

---

# E2E-06 Count-to-Adjustment

## Business objective

Measure physical inventory accuracy and correct system stock with controlled evidence.

## Trigger

- scheduled full inventory count;
- cycle count;
- high-risk SKU investigation;
- negative stock;
- shrinkage investigation;
- store handover / closure.

## Flow

1. Count scope and timing are defined.
2. Count instructions / sheets are prepared.
3. Physical stock is counted.
4. Material differences are recounted.
5. Expected versus physical variance is reviewed.
6. Reason is investigated where practical.
7. Authorized adjustment is approved.
8. Inventory record is corrected.
9. Significant loss is escalated.
10. Root cause / corrective action is tracked.

## Controls

- blind count preferred for high-risk counts;
- recount threshold;
- independent approval above variance threshold;
- reason code;
- no retroactive rewriting of historical sales / receipts to hide variance.

## KPIs

- inventory accuracy;
- shrinkage rate;
- count variance value;
- adjustment frequency;
- repeat variance by SKU/location.

---

# E2E-07 Shift-to-Reconciliation

## Business objective

Ensure sales tender collected during a cashier/register session is accounted for and exceptions are investigated.

## Flow

1. Cashier receives / confirms opening float.
2. Shift opens.
3. Cash / non-cash sales occur.
4. Authorized paid-in / paid-out / safe-drop movements are recorded.
5. Shift stops selling.
6. Expected tender amounts are determined.
7. Physical cash is counted.
8. Non-cash settlement totals are compared where available.
9. Variance is recorded.
10. Store manager reviews / approves or escalates variance.
11. Cash handover / deposit preparation occurs.
12. Shift / business-day summary is produced.

## Controls

- no shared till accountability where avoidable;
- every cash movement has reason / actor;
- cashier does not approve own material variance;
- material difference investigation;
- completed reconciliation retained as audit evidence.

## KPIs

- cash over / short;
- variance by cashier / register;
- paid-out value;
- unresolved reconciliation count;
- payment settlement mismatch.

---

# E2E-08 Sales-to-Assurance

## Business objective

Ensure operational sales information is complete, consistent and suitable for management / finance use.

## Flow

1. Collect finalized sales transactions.
2. Check for missing transaction sequences / sessions where relevant.
3. Detect duplicate / repeated records.
4. Compare transaction total and tender total.
5. Identify suspicious void / discount / refund / adjustment patterns.
6. Reconcile register / shift totals.
7. Classify exception.
8. Investigate and correct through controlled business adjustment where required.
9. Release trusted data for KPI / finance consumption.

Oracle Retail Sales Audit is an enterprise benchmark for this process, explicitly validating missing, duplicate, erroneous and suspicious transaction data before downstream use.

## KPIs

- sales audit exception count;
- unresolved exception aging;
- duplicate / missing transaction rate;
- tender mismatch rate;
- suspicious transaction rate.

---

# E2E-09 Wholesale Order-to-Cash — later research

At minimum:

Customer / dealer → quotation → sales order → credit check → allocation → pick → delivery → invoice → collection → AR aging → return / credit note.

This flow should remain separate from store POS business analysis until the retail operating baseline is mature.
