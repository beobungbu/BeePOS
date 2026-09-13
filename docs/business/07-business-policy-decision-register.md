# BeePOS Business Policy Decision Register

Status: Working business-analysis artifact · 2026-09-13

## 1. Purpose

The detailed process specifications deliberately separate **business policy choices** from universal retail process logic.

This register collects the questions that a retailer/operator must decide before a process can be treated as fully specified. These are not technical architecture decisions.

A policy decision should eventually record:

- decision owner;
- scope (chain / store / category / channel / supplier / customer group);
- rule;
- effective date;
- exception authority;
- review frequency;
- related SOP/process.

---

# A. Purchasing and receiving policies

| ID | Policy question | Typical owner | Related process |
|---|---|---|---|
| POL-PUR-001 | Is receiving without an approved PO permitted? | Procurement / Finance | P01 |
| POL-PUR-002 | What PO value requires approval and at what authority levels? | CFO / COO / Procurement | P01 |
| POL-PUR-003 | What quantity shortage/overage tolerances are accepted? | Procurement / Operations | P01 |
| POL-PUR-004 | What purchase-cost variance is accepted without escalation? | Procurement / Finance | P01 |
| POL-PUR-005 | Which categories require lot/batch capture? | Quality / Operations | P01 |
| POL-PUR-006 | Which categories require expiry capture? | Quality / Category | P01 |
| POL-PUR-007 | What minimum remaining shelf life is acceptable on receipt? | Category / Quality | P01 |
| POL-PUR-008 | Can a supplier substitute another item/pack? | Category / Procurement | P01 |
| POL-PUR-009 | When does a partially received PO auto-close versus remain open? | Procurement | P01 |
| POL-PUR-010 | Can stores buy directly from local suppliers? | COO / Procurement | P01 |

# B. Inventory and transfer policies

| ID | Policy question | Typical owner | Related process |
|---|---|---|---|
| POL-INV-001 | Is negative stock operationally allowed? | Operations / Inventory Control | P02/P04 |
| POL-INV-002 | What count variance requires recount? | Inventory Control | P02 |
| POL-INV-003 | What adjustment value requires manager approval? | Operations / Finance | P02 |
| POL-INV-004 | How often is each SKU risk class cycle-counted? | Inventory Control | P02 |
| POL-INV-005 | Are inter-store transfers centrally approved? | Operations | P02/P03 |
| POL-INV-006 | Who owns in-transit loss: source, carrier, destination or central ops? | Operations / Logistics | P02 |
| POL-INV-007 | Which reasons require evidence/photo/witness? | Loss Prevention | P02 |
| POL-INV-008 | Which stock conditions are saleable, quarantined or disposal-only? | Quality / Operations | P02/P05 |
| POL-INV-009 | Which categories require FEFO versus FIFO? | Category / Quality | P02/P03 |
| POL-INV-010 | Can damaged stock be restored to saleable status and by whom? | Store Manager / Quality | P02 |

# C. Replenishment policies

| ID | Policy question | Typical owner | Related process |
|---|---|---|---|
| POL-REP-001 | Is replenishment centralized, store-led or hybrid? | Supply Chain / COO | P03 |
| POL-REP-002 | What min/max/safety stock policy applies by category? | Replenishment / Category | P03 |
| POL-REP-003 | Can store managers override replenishment recommendations? | Operations / Supply Chain | P03 |
| POL-REP-004 | Which overrides require reason / approval? | Supply Chain | P03 |
| POL-REP-005 | When may another store be used as emergency source? | Operations | P03 |
| POL-REP-006 | What shelf-life threshold prevents shipment to store? | Quality / Supply Chain | P03 |
| POL-REP-007 | What promotion uplift planning method is required? | Commercial / Replenishment | P03/P07 |
| POL-REP-008 | What is the target on-shelf availability by category/store format? | COO / Operations | P03 |
| POL-REP-009 | How are new items replenished before sales history exists? | Category / Replenishment | P03 |

# D. Store selling policies

| ID | Policy question | Typical owner | Related process |
|---|---|---|---|
| POL-SAL-001 | Are open-price / miscellaneous items allowed? | COO / Finance | P04 |
| POL-SAL-002 | What manual discount may a cashier grant? | Commercial / Operations | P04 |
| POL-SAL-003 | What requires manager price override? | Operations / Commercial | P04 |
| POL-SAL-004 | What is the customer remedy for wrong shelf price? | Customer Service / Legal | P04/P07 |
| POL-SAL-005 | Which tender methods may be split/mixed? | Finance / Operations | P04 |
| POL-SAL-006 | What procedure applies to uncertain electronic payment status? | Finance / Payments | P04/P06 |
| POL-SAL-007 | Which products are restricted / blocked from normal sale? | Legal / Category | P04 |
| POL-SAL-008 | What transaction can be post-voided and by whom? | Finance / Operations | P04/P08 |
| POL-SAL-009 | What receipt reprint activity requires approval? | Operations / Control | P04 |

# E. Return / refund policies

| ID | Policy question | Typical owner | Related process |
|---|---|---|---|
| POL-RET-001 | Return window by category? | Customer Service / Category | P05 |
| POL-RET-002 | Which items are non-returnable? | Legal / Quality / Category | P05 |
| POL-RET-003 | Are no-receipt returns permitted? | COO / Loss Prevention | P05 |
| POL-RET-004 | Are cross-store returns permitted? | Operations | P05 |
| POL-RET-005 | Are cross-channel returns permitted? | Omnichannel / Operations | P05 |
| POL-RET-006 | What refund tender is used when original tender is unavailable? | Finance / Customer Service | P05 |
| POL-RET-007 | What return value requires manager approval? | Operations / Loss Prevention | P05 |
| POL-RET-008 | How are bundle/promotion partial returns recalculated? | Commercial / Finance | P05/P07 |
| POL-RET-009 | How are earned/spent loyalty points reversed? | CRM / Finance | P05 |
| POL-RET-010 | Which returned food/perishable items may return to saleable stock? | Quality / Legal | P05 |

# F. Shift / cash policies

| ID | Policy question | Typical owner | Related process |
|---|---|---|---|
| POL-CASH-001 | Is one cashier accountable per till? | Operations / Control | P06 |
| POL-CASH-002 | Is closing cash declaration blind? | Finance / Control | P06 |
| POL-CASH-003 | What over/short tolerance is accepted? | Finance | P06 |
| POL-CASH-004 | Which paid-in/paid-out types are allowed? | Finance / Operations | P06 |
| POL-CASH-005 | What paid-out value requires approval? | Finance / Store Manager | P06 |
| POL-CASH-006 | Who may perform safe drop / cash pickup? | Operations / Cash Office | P06 |
| POL-CASH-007 | What time defines the business-day boundary? | Finance / Operations | P06/P08 |
| POL-CASH-008 | Can store day close with unresolved tender exception? | Finance / Audit | P06/P08 |
| POL-CASH-009 | Can a final Z/business-day close be reopened? | Finance / Audit | P06 |
| POL-CASH-010 | What evidence is required for bank/cash-office handover? | Treasury / Store Admin | P06 |

# G. Pricing / promotion policies

| ID | Policy question | Typical owner | Related process |
|---|---|---|---|
| POL-PRI-001 | Who owns regular price approval? | Commercial | P07 |
| POL-PRI-002 | Are store/zone-level local price differences permitted? | Commercial | P07 |
| POL-PRI-003 | What margin floor requires escalation? | Commercial / Finance | P07 |
| POL-PRI-004 | What qualifies as emergency price change? | Commercial | P07 |
| POL-PRI-005 | How much advance notice do stores need for price events? | Commercial / Operations | P07 |
| POL-PRO-001 | Which promotion types are permitted? | Marketing / Commercial | P07 |
| POL-PRO-002 | Which promotions may stack? | Commercial / CRM | P07 |
| POL-PRO-003 | Can clearance items participate in promotions? | Commercial | P07 |
| POL-PRO-004 | How are basket-level benefits allocated for returns? | Commercial / Finance | P05/P07 |
| POL-PRO-005 | What happens when free-gift stock is unavailable? | Marketing / Operations | P07 |
| POL-PRO-006 | Which KPIs define promotion success? | Marketing / Commercial / Finance | P07 |

# H. Sales assurance / control policies

| ID | Policy question | Typical owner | Related process |
|---|---|---|---|
| POL-AUD-001 | What makes a store day complete? | Finance / Retail Control | P08 |
| POL-AUD-002 | Which exceptions block downstream finance/reporting? | Finance / Audit | P08 |
| POL-AUD-003 | Who owns first-line sales-audit exception resolution? | Operations / Finance | P08 |
| POL-AUD-004 | What tender mismatch tolerance is accepted? | Finance | P06/P08 |
| POL-AUD-005 | How are late transactions assigned to business day? | Finance / Operations | P08 |
| POL-AUD-006 | Which suspicious patterns trigger loss-prevention review? | Loss Prevention | P08 |
| POL-AUD-007 | Who may perform a business correction and who approves it? | Finance / Audit | P08 |
| POL-AUD-008 | How long may material exceptions remain unresolved? | Finance / COO | P08 |

## 2. Priority decisions before detailed product requirements

The following policy families materially change day-to-day retail behavior and should be decided early with real operators:

1. receiving tolerance / PO exception policy;
2. inventory adjustment and negative-stock policy;
3. replenishment ownership and override policy;
4. cashier discount / price-override authority;
5. return/no-receipt/cross-store policy;
6. cash over-short and business-day close policy;
7. price/promotion stacking and markdown policy;
8. store-day audit readiness / blocking exceptions.

## 3. Evidence collection method

For a real retailer, do not answer these questions from software assumptions. Collect evidence from:

- written SOP/policy manuals;
- approval matrices;
- sample PO/GR/transfer/count/return/cash forms;
- interviews with buyer, store manager, cashier, inventory control and finance;
- observed store-floor workflow;
- exception cases from the previous 3–6 months;
- audit/internal-control findings;
- KPI reports and variance reports.

## 4. Decision maturity labels

Use one of:

- **Unknown** — no reliable evidence yet;
- **Observed** — current practice seen but not formally agreed;
- **Documented-current** — existing policy/SOP confirmed;
- **Target-approved** — desired future policy approved;
- **Needs-localization** — policy varies by store/category/channel;
- **Deferred** — not needed for current retail scope.

This prevents “what the software happens to do” from becoming an accidental business policy.
