# P16 — Finance-Facing Retail Controls

Status: Business process specification · working baseline

## 1. Business purpose

Finance-Facing Retail Controls define how operational retail facts become trustworthy financial evidence without turning store operations into an accounting system design exercise.

The process connects:

- purchasing and supplier liability;
- inventory and stock value;
- sales and tender;
- wholesale receivables;
- cash/bank settlement;
- returns/credits;
- store-day close;
- period-end reconciliation.

The objective is that financial reporting can explain **why money, inventory and commercial obligations changed** using operational evidence.

## 2. Scope

Includes business control relationships for:

- accounts payable (AP);
- accounts receivable (AR);
- cash/tender settlement;
- inventory valuation/cost evidence;
- cost of goods sold (COGS) concept;
- returns/credits;
- store-day close;
- period-end stock/sales reconciliation;
- management margin reporting.

Does not prescribe chart of accounts, journal schemas, ERP APIs or tax-accounting implementation.

## 3. Actors

| Actor | Responsibility |
|---|---|
| Finance Controller | owns financial control policy and close readiness |
| Accounts Payable | supplier invoice validation/payment authorization |
| Accounts Receivable / Credit Control | customer invoices, collections and aging |
| Store Manager / Cash Office | daily sales/tender/cash evidence |
| Sales Audit | validates store-day transaction quality |
| Inventory Control | quantity/value reconciliation evidence |
| Procurement | PO/commercial terms and supplier dispute support |
| Commercial / Category | margin/markdown/promotion commercial interpretation |
| Treasury | bank/cash settlement and deposit control |
| Internal Audit / Control | independent review of material exceptions |

## 4. Finance-facing evidence chain

A mature retailer should be able to trace major financial movements to operational evidence.

### Purchasing / AP

```text
PO / commercial agreement
      ↓
Goods receipt / accepted quantity
      ↓
Supplier invoice / credit note
      ↓
Verified liability
      ↓
Payment authorization
```

### Store sales

```text
Completed retail transactions
      ↓
Tender activity
      ↓
Shift/register reconciliation
      ↓
Store-day sales assurance
      ↓
Cash/bank settlement evidence
```

### Wholesale / AR

```text
Approved B2B order
      ↓
Delivered/accepted quantity
      ↓
Customer invoice
      ↓
Open receivable
      ↓
Collection / payment allocation
```

### Inventory

```text
Opening inventory position/value
+ accepted receipts / cost additions
+ authorized transfers/returns effects
- sales/COGS effects
- approved waste/damage/shrinkage
= expected closing inventory position/value
```

Exact costing method is a retailer/accounting-policy decision.

## 5. Accounts Payable control flow

1. Supplier invoice is received.
2. Supplier/document validity is checked.
3. Invoice is linked to commercial/receipt evidence.
4. Quantity/cost/tax discrepancies are identified.
5. Tolerance/approval policy is applied.
6. Credit/debit claims are resolved.
7. Verified liability is approved for payment.
8. Payment terms/due date are monitored.
9. Payment execution is reconciled to authorized liability.
10. Unmatched/aged items remain visible.

Key rule: supplier invoice alone should not be treated as sufficient evidence of merchandise receipt where PO/receipt control is required.

## 6. Accounts Receivable control flow

Relevant primarily to wholesale/B2B or other credit sales.

1. Customer invoice is based on approved delivered/commercial facts.
2. Due date/payment terms are applied.
3. Open receivable enters aging.
4. Customer payment is received.
5. Payment is allocated to invoice(s).
6. Short/over/unidentified payment is investigated.
7. Credit exposure is updated.
8. Overdue debt enters collection/credit-hold process.
9. Approved credit note reduces receivable when justified.
10. Write-off requires separate authority/evidence.

## 7. Store cash and tender settlement

Finance should distinguish at least:

- POS sales/tender amount;
- physical cash counted;
- cash handed to safe/cash office;
- cash deposited to bank;
- card/QR/electronic provider gross settlement;
- fees/charges;
- timing differences;
- refunds/chargebacks;
- unresolved payment exceptions.

The bank statement is not always expected to equal POS gross sales for the same calendar date because of fees and settlement timing.

## 8. Store-day close relationship

Finance-facing store-day readiness should consider:

- all material shifts closed or explained;
- sales totals complete;
- returns/refunds included;
- tender totals balanced within policy;
- material cash variance reviewed;
- missing/duplicate transaction exceptions resolved or accepted;
- electronic tender exceptions visible;
- business date assigned correctly.

A store day with unresolved critical exception should not silently enter “clean” management reporting.

## 9. Inventory valuation concepts

Inventory has both **quantity** and **financial value**.

Potential business costing policies include:

- weighted/moving average;
- FIFO;
- standard cost with variance;
- other locally approved accounting method.

The choice affects:

- inventory asset value;
- COGS;
- gross margin;
- return costing;
- write-off value;
- transfer valuation;
- supplier price variance interpretation.

BeePOS business research should not select a universal method; the retailer/accounting policy owner must decide.

## 10. Landed cost concept

Purchase price may not equal full inventory acquisition cost.

Potential landed costs:

- freight;
- import duty;
- customs/clearance;
- insurance;
- handling;
- other allocable acquisition costs.

Retailers with imported/distributed goods need an explicit policy for whether/how such costs are allocated to inventory/product margin.

## 11. Cost of Goods Sold (COGS)

For management purposes:

```text
Net Sales
- COGS
= Gross Margin
```

But COGS should derive from the retailer's accepted costing policy, not merely a mutable “current cost” attached to product master.

If purchase cost changes after a historical sale, historical gross margin should remain explainable under the chosen costing policy.

## 12. Returns and financial treatment

A return/refund may affect:

- sales revenue;
- tender/cash/bank;
- customer receivable;
- inventory quantity;
- inventory value;
- COGS/margin;
- loyalty liability;
- tax/fiscal position;
- supplier claim if defect-related.

Returned goods are only restored to normal inventory value if their disposition is saleable according to policy.

## 13. Promotion / rebate / supplier funding

Commercial benefit may originate from different parties:

- retailer-funded customer discount;
- supplier-funded promotion;
- retrospective supplier rebate;
- wholesale customer rebate;
- marketing allowance.

These should remain distinguishable for true profitability analysis.

Example:

A 10% customer promotion fully funded by supplier has different margin economics from a 10% retailer-funded discount even if checkout price is identical.

## 14. Period-end inventory control

Typical business controls:

1. Identify material negative/unresolved stock positions.
2. Review unposted/unfinished receipts/transfers/counts.
3. Review in-transit aging.
4. Review material inventory adjustments.
5. Review expired/damaged/quarantine value.
6. Reconcile inventory subledger/operational evidence to finance control totals where applicable.
7. Investigate material differences.
8. Confirm cutoff around receipts/sales/transfers.

## 15. Cutoff concept

Period-end reporting depends on assigning transactions to the correct period.

Examples:

- goods physically received 30 Sep but invoice arrives 3 Oct;
- supplier invoice dated 29 Sep but goods arrive 2 Oct;
- store transaction at 00:30 belongs to business day 30 Sep under store-day policy;
- wholesale delivery occurs before/after invoice date.

Operational and finance policy must agree what event creates the relevant business obligation and period recognition.

## 16. Reconciliation catalogue

| Reconciliation | Compare |
|---|---|
| PO / receipt / invoice | ordered vs accepted vs billed |
| Store sale / tender | payable vs collected tender |
| Shift cash | expected vs physical cash |
| POS electronic tender / provider | transaction capture vs provider settlement |
| Provider / bank | gross settlement vs bank net/timing/fees |
| Wholesale invoice / collection | receivable vs allocated payment |
| Inventory book / physical | expected vs counted stock |
| Operational inventory / finance | quantity/value control totals |
| Promotion funding | customer benefit vs supplier/marketing funding claim |

## 17. Material exception types

- unmatched supplier invoice;
- aged goods receipt without invoice;
- duplicate supplier invoice;
- payment to changed bank account;
- unallocated customer payment;
- overdue customer debt;
- unexplained cash over/short;
- electronic tender mismatch;
- missing store-day data;
- material inventory variance;
- negative inventory;
- abnormal write-off/waste;
- unclaimed supplier funding;
- stale in-transit stock.

## 18. Controls

Recommended baseline:

- operational evidence and financial authorization separated where practical;
- material supplier invoice matched to receipt/PO evidence;
- supplier bank-detail changes independently verified;
- credit-note/write-off authority controlled;
- AR write-off separate from salesperson authority;
- cash deposit linked to store-day/shift evidence;
- inventory adjustments visible to finance/control;
- period cutoff policy documented;
- costing method owned by finance and applied consistently;
- supplier/customer rebates tracked separately from normal selling/purchase price where material.

## 19. KPI framework

### AP

- first-pass invoice match rate;
- unmatched invoice/receipt aging;
- duplicate invoice incidents;
- payment-on-time rate;
- supplier claim recovery.

### AR

- DSO;
- overdue AR %;
- bad debt/write-off;
- unapplied cash aging;
- credit-hold exposure.

### Cash / settlement

- cash over/short;
- deposit variance;
- electronic settlement mismatch;
- unresolved payment aging.

### Inventory / margin

- inventory accuracy;
- inventory valuation adjustment;
- shrinkage/waste value;
- stock turn;
- gross margin %;
- margin variance by product/store/category.

### Close quality

- first-pass clean store days;
- period-end unresolved exception count;
- days to close operational exceptions;
- manual correction frequency.

## 20. Management questions

- Are we paying suppliers for quantities not received?
- How much inventory value sits in damaged/quarantine/in-transit status?
- Which stores create the most financial reconciliation work?
- How much sales value has not reached bank settlement?
- Which B2B customers consume working capital through overdue AR?
- Is reported gross margin distorted by current-cost shortcuts?
- How much supplier funding/rebate remains unclaimed?
- What operational exceptions delay finance close?

## 21. Worked example — changing purchase cost

Retailer buys SKU at 80,000 in January and later at 90,000 in February. A January sale for 100,000 must not automatically be reported with February current cost 90,000 merely because product master changed.

The accepted accounting/costing policy determines historical COGS. This is why “current purchase cost” and “historical cost of sold inventory” are different business concepts.

## 22. Research anchors

- Oracle Retail Invoice Matching: https://docs.oracle.com/en/industries/retail/retail-invoice-matching-cloud/latest/
- Oracle Retail Financial Integration: https://docs.oracle.com/en/industries/retail/retail-integration-cloud/latest/fiimp/
- Oracle Retail Sales Audit: https://docs.oracle.com/en/industries/retail/retail-merchandising-foundation-cloud/latest/rmsoa/sales-audit.htm
- SAP Credit Management: https://help.sap.com/docs/SAP_S4HANA_CLOUD/0f69f8fb28ac4bf48d2b57b9637e81fa/6532d2531a4d424de10000000a174cb4.html
- APQC Finance and Accounting PCF content: https://www.apqc.org/process-frameworks

## 23. Open business-policy questions

- Which costing method is used for inventory/COGS?
- Are landed costs capitalized/allocated, and how?
- What AP matching tolerances apply?
- What event defines receipt/invoice/sales cutoff?
- What makes a store day finance-ready?
- Which unresolved exceptions block close?
- Who may approve AR/AP write-off?
- How are provider fees and settlement timing reconciled?
- How are supplier/customer rebates accrued and settled?
- What financial controls vary between retail and wholesale channels?
