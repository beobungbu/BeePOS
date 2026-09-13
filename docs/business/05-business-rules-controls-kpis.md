# BeePOS Business Rules, Controls and KPI Baseline

## 1. Purpose

This document captures business rules, exception controls and KPIs that should accompany the process catalogue. It is not a technical validation specification.

---

# 2. Supplier and purchasing rules

## Core rules

- purchase orders must reference an approved supplier;
- purchase quantity should respect supplier pack / MOQ where applicable;
- expected delivery date should be explicit;
- purchase cost changes outside tolerance require review;
- PO cancellation after supplier confirmation should retain reason;
- open PO quantity must reflect received / cancelled remainder;
- partial delivery must not silently close the PO unless policy allows it.

## Key controls

- value-based PO approval threshold;
- supplier / bank-detail changes independently reviewed;
- receiving quantity entered from physical fact, not auto-copied as accepted quantity;
- material cost / quantity discrepancy escalated;
- duplicate supplier invoice / receiving evidence detected downstream.

## KPIs

- Supplier OTIF = on-time and in-full receipts / due receipts
- Fill Rate = received quantity / ordered quantity
- Purchase Price Variance
- Average PO lead time
- Open PO aging
- Receiving discrepancy rate
- Supplier return rate

---

# 3. Inventory rules

## Core rules

- every physical stock change must have a recognizable business reason;
- transfers require both source dispatch and destination receipt states;
- stock count difference requires recount / approval above tolerance;
- damaged / expired goods should be separated from saleable availability;
- stock cannot be corrected simply to force reports to match without evidence;
- negative stock, if permitted operationally, is an exception requiring visibility.

## Controls

- cycle-count frequency by SKU risk / value / velocity;
- blind count for selected high-risk inventory;
- mandatory reason for manual adjustment;
- manager approval above quantity/value threshold;
- repeated adjustment by SKU/store/person exception report;
- aging / expiry exception monitoring.

## KPIs

- Inventory Accuracy = 1 - |system - physical| / relevant inventory base
- Shrinkage %
- Stock Turn
- Days / Weeks of Supply
- Out-of-Stock Rate
- Excess / Slow-Moving Stock Value
- Expiry / Damage Write-off %
- Transfer discrepancy rate

---

# 4. Pricing rules

## Core rules

- selling price must have an effective period / approval context when changed;
- a store should know which published price is applicable at time of sale;
- retrospective price editing must not rewrite completed historical sales;
- manual price override is distinct from approved regular price change;
- tax treatment must remain consistent with applicable fiscal policy;
- price label / shelf communication should match checkout price.

## Controls

- margin guardrail / minimum margin where applicable;
- authorization threshold for override;
- future-price review before activation;
- price mismatch exception log;
- daily / weekly report of manual price overrides.

## KPIs

- Gross Margin %
- Price Override Rate
- Price Mismatch Incident Rate
- Markdown % of Sales
- Price Change Execution Compliance

---

# 5. Promotion rules

## Core rules

- promotion has explicit start / end conditions;
- eligible products / stores / customer segments are defined;
- stacking behavior must be documented;
- free-gift / bundle mechanics must be traceable;
- cancelled / returned sale must recalculate or reverse relevant benefit according to policy;
- manual customer compensation is not the same as promotion execution.

## Controls

- promotion approval before publication;
- campaign budget / margin review;
- overlap / conflict review;
- unusual promotion usage / coupon abuse monitoring.

## KPIs

- Promotion Sales Lift
- Promotion Redemption Rate
- Promotional Margin
- Promotion Cost
- Promo Stockout Rate
- Coupon Abuse / Exception Rate

---

# 6. Sale / checkout rules

## Core rules

- finalized sale must represent what was actually sold and paid;
- completed sale cannot be deleted without a controlled corrective transaction;
- tender collected must equal required payable amount subject to documented rounding rules;
- duplicate payment must be prevented / investigated;
- cashier manual discount above threshold requires override;
- customer loyalty benefit must be associated to a valid customer / policy where required.

## Controls

- cashier identity / till accountability;
- manager override for high-risk actions;
- unusual void / discount / refund reports;
- transaction / tender reconciliation;
- offline / interrupted-payment operating procedure.

## KPIs

- Net Sales
- Transactions
- Units per Transaction
- Average Basket Value
- Gross Margin
- Discount Rate
- Void Rate
- Checkout Throughput
- Payment Failure Rate

---

# 7. Return / refund rules

## Core rules

- original sale should be identified whenever possible;
- eligibility follows return policy;
- refund should not exceed eligible original economic value without explicit exception approval;
- partial return should consider original line / order discounts and promotions;
- return reason is mandatory;
- returned stock disposition must be recorded.

## Controls

- approval threshold;
- no-receipt return policy;
- repeated refund behavior detection;
- cashier self-refund / related-party review;
- high-value or repeated customer return alert.

## KPIs

- Return Rate
- Refund Value % of Sales
- No-Receipt Return Rate
- Return-to-Saleable-Stock %
- Return Fraud Exception Rate

---

# 8. Cash / tender rules

## Core rules

- opening float is acknowledged;
- paid-in / paid-out has reason and authorization;
- expected cash is derived from opening cash + cash sales + cash movements - cash refunds / drops as policy defines;
- cashier counts actual closing cash;
- material variance requires independent review;
- non-cash tender should be reconcilable to external settlement where available.

## Controls

- no uncontrolled shared till;
- manager review of variance;
- safe-drop threshold;
- daily unresolved reconciliation report;
- cash handover evidence.

## KPIs

- Cash Over / Short Value
- Cash Variance % of Cash Sales
- Unresolved Reconciliation Count
- Settlement Mismatch Value
- Paid-Out Value by Reason

---

# 9. Replenishment rules

## Core rules

Replenishment should consider, depending on operating sophistication:

- demand / forecast;
- current on-hand;
- available and reserved stock;
- stock in transit / planned receipts;
- lead time;
- target stock / safety stock;
- order cycle;
- MOQ / pack size;
- shelf / storage capacity;
- promotion / seasonality.

SAP describes store replenishment using demand, stock situation, planned receipts and target stock. Oracle adds supplier/location constraints and can create either purchase orders or transfers.

## KPIs

- On-Shelf Availability
- Replenishment Fill Rate
- Forecast Accuracy
- Stockout Rate
- Excess Stock
- Replenishment Exception Rate

---

# 10. Sales assurance / audit rules

## Core controls

Daily or periodic review should surface at least:

- duplicate transactions;
- missing / interrupted sequences where relevant;
- sale total versus tender mismatch;
- excessive discount;
- high void rate;
- high refund rate;
- repeated manual stock adjustment;
- cash variance;
- negative stock;
- overdue PO / transfer;
- supplier receipt discrepancy.

Oracle Retail Sales Audit is a useful enterprise benchmark because it explicitly checks missing, duplicate, erroneous and suspicious transactions before downstream reporting.

---

# 11. KPI tree for chain management

## Revenue

- Gross Sales
- Net Sales
- Comparable Store Sales
- Sales per Store
- Sales per m² where relevant
- Sales per Labor Hour

## Customer / Basket

- Transactions
- Average Basket Value
- Units per Transaction
- Repeat Customer Rate
- Loyalty Penetration

## Margin

- Gross Margin %
- Markdown %
- Discount %
- Promotion Cost
- Purchase Price Variance

## Inventory

- Inventory Value
- Inventory Turn
- Days of Supply
- Out-of-Stock Rate
- On-Shelf Availability
- Shrinkage %
- Aging / Expiry Loss

## Supply

- Supplier OTIF
- Fill Rate
- PO Lead Time
- Receiving Discrepancy
- Transfer Lead Time

## Store Control

- Cash Variance
- Refund Rate
- Void Rate
- Price Override Rate
- Stock Adjustment Rate

## Working Capital — later finance integration

- Inventory Days
- Receivable Days for B2B
- Payable Days
- Cash Conversion Cycle

---

# 12. KPI governance principles

A KPI is not complete until the business defines:

1. business meaning;
2. numerator and denominator;
3. inclusions / exclusions;
4. time zone / business-date rule;
5. source transaction type;
6. treatment of refund / cancellation;
7. owner;
8. target / alert threshold.

Example: `Net Sales` can vary materially depending on whether tax, refund, discount, voucher and loyalty redemption are included. The term must therefore be governed before dashboards are treated as authoritative.
