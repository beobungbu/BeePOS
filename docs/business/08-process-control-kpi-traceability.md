# BeePOS Process / Control / KPI Traceability Matrix

Status: Working business-analysis artifact · 2026-09-13

## 1. Purpose

This matrix connects the detailed operating processes to their main business risks, controls, evidence and KPIs.

It is intended for:

- business analysts;
- retail operations;
- internal control / audit;
- product owners;
- future SOP owners.

It does not prescribe software implementation.

## 2. Traceability matrix

| Process | Primary business value | Main risk | Key preventive control | Key detective control | Core evidence | Headline KPIs |
|---|---|---|---|---|---|---|
| P01 Procure-to-Receive | availability, purchase cost, supplier service | buy wrong qty/cost; receive less/worse than paid | approved supplier, PO approval, tolerance policy | receipt discrepancy and supplier performance review | PO, confirmation, delivery note, goods receipt, discrepancy | OTIF, fill rate, PPV, discrepancy %, overdue PO |
| P02 Inventory-to-Availability | stock accuracy, working capital, shrinkage | book stock differs from physical; loss hidden | transfer/count/adjustment authority, stock-status rules | cycle count, variance trend, in-transit aging | transfer, count sheet, adjustment, variance investigation | inventory accuracy, shrinkage, adjustment %, transfer discrepancy |
| P03 Replenish-to-Shelf | sales availability, inventory efficiency | stockout or excess; stock trapped in backroom | replenishment policy, source/pack/capacity rules | OSA walk, stockout/excess monitoring | recommendation, PO/transfer, shelf-gap exception | OSA, OOS %, fill rate, lead time, stock turn, expiry |
| P04 Store-to-Cash | revenue, customer service, tender integrity | wrong price, unauthorized discount, unpaid/duplicate payment | operator authority, pricing/promo rules, tender controls | void/discount/payment exception review | completed sale, tender evidence, receipt, override reason | sales, basket, margin, discount %, void %, payment fail rate |
| P05 Return-to-Resolution | customer trust, fraud/margin protection | over-refund, duplicate return, unsafe resale | return policy, original-sale verification, approval thresholds | return pattern/fraud analysis | original sale, return transaction, reason, approval, disposition | return %, no-receipt %, recovery %, refund value |
| P06 Shift-to-Reconciliation | cash accountability, payment control | till cash leakage; unexplained tender mismatch | cashier/till accountability, paid-in/out authority | blind count, shift/store-day reconciliation | opening float, cash movements, count, variance review | over/short, unresolved variance, tender mismatch, close time |
| P07 Pricing & Promotion | margin, demand shaping, customer trust | margin erosion, wrong/overlapping offers, execution failure | commercial approval, conflict/margin rules, effective periods | shelf/POS price checks, promotion post-analysis | price event, promo brief, approval, store execution evidence | margin, promo uplift, ROI, stockout %, price accuracy |
| P08 Sales-to-Assurance | trusted management/finance data | missing/duplicate/incorrect store-day data | store-day closure discipline, standardized event evidence | sales audit rules, exception queue, tender balancing | store-day totals, exceptions, correction approval | first-pass clean %, missing/duplicate rate, exception aging |

## 3. Cross-process control chains

### 3.1 Procure → Receive → Inventory → Pay

The control chain should preserve the ability to compare:

```text
Commercial commitment (PO)
        ↓
Physical fact (Receipt)
        ↓
Inventory fact
        ↓
Supplier financial claim
```

If these facts are collapsed into one editable record, the business loses the ability to detect shortage, over-delivery or invoice mismatch.

### 3.2 Price → Sell → Return

```text
Approved price / promotion
        ↓
Actual sale commercial outcome
        ↓
Return/refund entitlement
```

A return cannot be governed reliably if the original commercial outcome is lost.

### 3.3 Sell → Tender → Shift → Store Day

```text
Completed transactions
        ↓
Tender activity
        ↓
Cashier/register reconciliation
        ↓
Store-day sales assurance
```

A clean store-day view depends on shift/tender evidence, not only item sales totals.

### 3.4 Inventory → Shelf → Sales → Replenishment

```text
Inventory position
        ↓
On-shelf availability
        ↓
Customer sales / lost-sales signal
        ↓
Replenishment decision
```

Poor inventory accuracy contaminates replenishment decisions; poor store execution can create shelf stockouts even when recorded inventory is healthy.

## 4. Business evidence catalogue

| Evidence | Produced by | Consumed by |
|---|---|---|
| Purchase requirement | Replenishment/Buyer | Purchasing approval |
| Purchase order | Buyer | Supplier, Receiving, Finance |
| Supplier confirmation | Supplier/Buyer | Purchasing, Receiving |
| Goods receipt | Receiving | Inventory, Finance, Supplier performance |
| Discrepancy record | Receiving | Buyer, Manager, Finance, Supplier review |
| Transfer request/order | Operations | Source/Destination inventory teams |
| Dispatch evidence | Source location | Destination, Inventory Control |
| Transfer receipt | Destination | Inventory Control |
| Stock count | Store/Warehouse | Manager, Inventory Control |
| Adjustment approval | Manager/Control | Inventory, Audit |
| Replenishment recommendation | Planner | Buyer/DC/Store |
| Shelf-gap exception | Store | Replenishment, Inventory Control |
| Price event | Commercial | Store/Channel operations |
| Promotion brief | Commercial/Marketing | Stores, Customer-facing operations |
| Override reason | Cashier/Manager | Store Control, Sales Audit |
| Sale transaction | Store | Inventory, Customer, Finance, Reporting |
| Tender evidence | Store/Provider | Shift reconciliation, Finance |
| Return/refund | Store | Inventory, Finance, Customer, Audit |
| Shift close | Cashier/Manager | Store-day reconciliation |
| Cash movement | Store | Shift reconciliation, Audit |
| Store-day exception | Sales Audit/Finance | Store Manager, Finance, Control |
| Business correction approval | Finance/Manager | Downstream trusted reporting |

## 5. KPI ownership matrix

| KPI family | Primary owner | Supporting actors |
|---|---|---|
| Supplier OTIF / fill rate | Procurement | Receiving, Replenishment |
| Purchase price variance | Procurement / Finance | Category |
| Inventory accuracy / shrinkage | Inventory Control / Operations | Stores, Finance |
| On-shelf availability | Store Operations | Replenishment, Category |
| Stock turn / excess / expiry | Supply Chain / Category | Finance, Stores |
| Net sales / basket / units | Retail Operations / Commercial | Finance |
| Gross margin | Commercial / Finance | Procurement |
| Discount / promotion performance | Commercial / Marketing | Finance, Operations |
| Return rate | Customer Service / Operations | Category, Quality |
| Cash over-short | Store Operations / Finance | Internal Control |
| Tender mismatch | Finance / Payments | Store Operations |
| Store-day clean rate | Finance / Sales Audit | Store Operations, IT support |
| Exception aging | Process owner / Finance | Store/Control teams |

## 6. Leading versus lagging indicators

### Leading indicators

Useful for preventing future failure:

- overdue PO quantity;
- projected stockout;
- shelf gap with backroom stock;
- expiring stock exposure;
- unclosed shift;
- unresolved tender status;
- price event not yet executed at store;
- promotion stock coverage risk.

### Lagging indicators

Useful for evaluating realized outcome:

- lost sales / OOS rate;
- shrinkage;
- return rate;
- gross margin;
- cash over-short;
- supplier OTIF;
- promotion ROI;
- sales audit exception rate.

A mature management pack should combine both, rather than only report last month's results.

## 7. Suggested management dashboard layers

### Daily store operations

- sales vs target;
- OSA / stockouts;
- open/late shifts;
- cash/tender variance;
- urgent receiving/transfer exceptions;
- high-value returns/discounts.

### Weekly operations

- supplier OTIF;
- replenishment fill rate;
- inventory accuracy;
- shrinkage/adjustments;
- transfer aging;
- return trends;
- price/promotion execution exceptions.

### Monthly management

- sales and gross margin;
- stock turn / working capital;
- supplier performance;
- category profitability;
- promotion ROI;
- shrinkage;
- store productivity;
- audit/control exception trends.

## 8. Control maturity scale

For each process/control, assess maturity:

1. **Ad hoc** — depends on individual experience;
2. **Repeatable** — common practice but weak documentation;
3. **Defined** — SOP/rule and ownership documented;
4. **Controlled** — approvals, evidence and exception monitoring exist;
5. **Measured** — KPI and root-cause trends are managed;
6. **Optimized** — policy adjusted using evidence, forecasting and continuous improvement.

This is useful when BeePOS is later used with a real chain: the product should not assume every retailer is already at maturity 5–6.

## 9. Process acceptance criteria for future BA work

A process should not be called “fully specified” until all of the following exist:

- purpose and boundary;
- actors and accountable owner;
- trigger / entry criteria;
- happy path;
- business statuses / milestones;
- documents / evidence;
- exception catalogue;
- decision/approval points;
- business rules;
- controls / segregation of duties;
- KPI definitions;
- open policy questions resolved or explicitly deferred;
- at least 3 real-world scenarios / examples;
- consistency with upstream/downstream processes.

## 10. Next research gaps

The current matrix exposes the next business domains needing the same treatment:

- Supplier Management and Supplier-to-Settlement;
- Category / Assortment / Product Lifecycle;
- Customer & Loyalty Lifecycle;
- Grocery expiry / waste / quality management;
- Wholesale Order-to-Cash;
- Distribution / dealer / route-sales operations;
- Omnichannel Order-to-Fulfillment;
- Finance-facing AP/AR/stock valuation processes.

These should remain business-research work until their actors, rules and controls are understood.
