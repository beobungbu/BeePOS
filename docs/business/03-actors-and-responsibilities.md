# BeePOS Business Actors and Responsibilities

## 1. Purpose

This document identifies business actors, what they are accountable for, where approvals are expected and where segregation-of-duty concerns arise.

It is a business operating-model document, not an application-permission specification.

## 2. Core actors

### 2.1 Chain Owner / General Manager

Accountable for:

- chain P&L and strategic targets;
- store network performance;
- sales, gross margin and working-capital targets;
- approval policy;
- major supplier / pricing / promotion decisions;
- material loss, shrinkage and cash-risk review.

Typical decisions:

- approve exceptional commercial policy;
- approve major stock write-off;
- approve high-value supplier / investment decisions;
- review monthly operating performance.

### 2.2 Retail Operations Manager

Accountable for:

- consistent store operations;
- SOP execution;
- store productivity;
- service quality;
- store availability and operational compliance;
- escalated store exceptions.

Typical activities:

- review store scorecard;
- investigate underperforming branches;
- review stock / cash / refund exceptions;
- standardize store opening, selling, closing and stock-control procedures.

### 2.3 Merchandise / Category Manager

Accountable for:

- category strategy;
- assortment;
- product introduction / delisting;
- selling-price and margin strategy;
- promotion planning;
- category performance.

Inputs:

- sales history;
- margin;
- competitor price;
- supplier proposal;
- inventory position;
- seasonality.

Outputs:

- approved assortment;
- price / markdown request;
- promotion plan;
- supplier negotiation requirement.

### 2.4 Buyer / Purchasing Officer

Accountable for:

- converting approved supply needs into purchase commitments;
- selecting approved suppliers;
- PO accuracy;
- order follow-up;
- supplier delivery performance.

Typical activities:

- review replenishment / purchase recommendation;
- create PO;
- communicate with supplier;
- monitor open orders;
- amend or cancel PO with authorization;
- follow up delayed delivery.

Control note:

Where practical, the buyer creating a PO should not independently approve high-value PO changes or confirm receiving discrepancies that benefit the supplier.

### 2.5 Supplier / Vendor

External actor responsible for:

- confirming purchase order;
- preparing / shipping goods;
- providing delivery documentation;
- resolving shortage / damage / cost discrepancy;
- issuing supplier credit where applicable.

### 2.6 Warehouse / Receiving Staff

Accountable for:

- physical receipt;
- counting;
- condition / expiry checks where relevant;
- discrepancy recording;
- staging / putaway;
- transfer dispatch / receiving.

Important control:

Receiving should record **actual physical fact**, not simply copy the PO quantity.

### 2.7 Inventory Controller

Accountable for:

- inventory accuracy;
- cycle / full counts;
- variance review;
- shrinkage investigation;
- stock-adjustment governance;
- expiry / damage control.

Should monitor:

- stock-count variance;
- negative stock;
- repeated manual adjustment;
- unusual shrinkage by store / SKU / employee.

### 2.8 Store Manager

Accountable for:

- daily store operation;
- store sales and service;
- employee supervision;
- local inventory accuracy;
- register / cash close;
- authorized overrides;
- escalated return / discount / stock exceptions.

Typical approvals:

- manual discount above cashier threshold;
- exceptional return;
- cash paid-out;
- stock adjustment above threshold;
- shift cash variance acknowledgment.

### 2.9 Cashier / Sales Associate

Accountable for:

- accurate selling transaction;
- correct tender collection;
- receipt handover;
- basic customer identification / loyalty operation;
- till custody during assigned shift;
- immediate reporting of discrepancy.

Should not normally be able to:

- approve own excessive discount;
- erase completed sale history;
- approve own cash variance;
- perform unrestricted stock write-off.

### 2.10 Stock / Store Floor Staff

Accountable for:

- store receiving support;
- backroom organization;
- shelf replenishment;
- shelf availability;
- FEFO/FIFO execution where required;
- price-label / promotion-material execution;
- physical stock count.

### 2.11 Customer

External actor who:

- selects goods;
- identifies self where loyalty applies;
- pays;
- receives receipt / invoice;
- initiates return / complaint.

### 2.12 Finance / Accountant

Accountable for:

- sales / tender reconciliation review;
- supplier payable review;
- cash / bank reconciliation;
- tax / invoice control;
- margin / cost reporting inputs;
- period-close control.

Should consume operational facts rather than silently rewrite store transactions.

### 2.13 Internal Audit / Loss Prevention

Accountable for independent review of:

- suspicious refund;
- voids;
- excessive discount;
- unusual cash movements;
- inventory shrinkage;
- high-value manual adjustment;
- repeated override behavior;
- process-control compliance.

### 2.14 Customer Service / CRM

Accountable for:

- complaint handling;
- loyalty / customer issue resolution;
- customer communication;
- approved customer-benefit adjustment.

## 3. Later-scope actors

### Wholesale / B2B

- B2B Sales Representative
- Sales Supervisor
- Credit Controller
- B2B Customer / Dealer
- Delivery Coordinator
- Accounts Receivable Accountant

### Distribution

- Distribution Manager
- Territory Manager
- Route Sales Representative
- Distributor / Dealer
- Transport Planner
- Driver / Carrier

## 4. Responsibility matrix for high-risk processes

| Process | Primary performer | Approval / review | Independent / downstream control |
|---|---|---|---|
| Product creation | Merchandise | Category manager | Data-quality review |
| Price change | Merchandise / Pricing | Authorized manager | Margin / exception review |
| Promotion setup | Marketing / Category | Commercial approver | Post-promotion analysis |
| Create PO | Buyer | Purchasing authority by threshold | Finance / supplier review |
| Receive goods | Receiver | Manager for discrepancy | AP / inventory reconciliation |
| Stock adjustment | Inventory / Store | Manager by threshold | Loss prevention / audit |
| Sale | Cashier | Manager override for exceptions | Sales audit |
| Manual discount | Cashier | Manager above threshold | Discount exception report |
| Refund | Cashier / manager | Policy-dependent manager approval | Refund audit |
| Paid-out | Store manager / authorized staff | Approval policy | Cash reconciliation |
| Shift close | Cashier count | Store manager review | Finance / operations variance review |
| Loyalty manual adjustment | Customer service / manager | Threshold approval | Loyalty adjustment audit |

## 5. Segregation-of-duty principles

The following combinations should be considered high risk:

1. **Create supplier + create PO + approve PO + receive goods + confirm supplier payment** by the same person.
2. **Perform stock count + approve own variance + post write-off** without review.
3. **Cashier sells + refunds own transaction + approves refund + approves own cash variance**.
4. **Create promotion + approve promotion + manually edit transaction outcome** without evidence.
5. **Change selling price retroactively** after completed sale.

Small retailers may not have enough people for perfect segregation. In that case use compensating controls:

- reason codes;
- manager PIN / approval;
- immutable audit trail;
- daily exception report;
- owner review of high-risk actions.

## 6. RACI starter for end-to-end flows

Legend: R = Responsible, A = Accountable, C = Consulted, I = Informed.

| Activity | Owner/GM | Ops | Category | Buyer | Receiver | Store Mgr | Cashier | Finance |
|---|---|---|---|---|---|---|---|---|
| Assortment decision | I | C | A/R | C | I | C | I | I |
| Purchase planning | I | C | C | A/R | I | C | I | C |
| PO approval | C/A by threshold | I | C | R | I | I | I | C |
| Receive goods | I | I | I | C | R | A at store | I | I |
| Stock-count approval | I | C | I | I | R | A | I | I |
| Sell transaction | I | I | I | I | I | A | R | I |
| Exceptional refund | I | C | I | I | I | A/R | R | I |
| Close shift | I | I | I | I | I | A | R | C |
| Cash variance review | I | C | I | I | I | R | I | A/C |
| KPI review | A | R | R | R | I | R | I | C |

This RACI is a research baseline and should be customized by business size and operating model.
