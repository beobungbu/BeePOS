# BeePOS — Three-Level Business Matrix

Status: SOP-level documentation coverage map · 2026-09-13

## 1. Purpose

This matrix gives one three-level view of the BeePOS business-research package.

- **Level 1 — Business Domain:** major area the enterprise must operate.
- **Level 2 — Process Family:** coherent group of business processes inside the domain.
- **Level 3 — Operational Process / SOP:** detailed workflow with actors, evidence, states, exceptions, approvals, controls, KPIs, examples and open policy questions.

This hierarchy is business-facing, not a software-module design.

## 2. Coverage and validation

### Documentation coverage

After the P17–P27 expansion, **every process family in this matrix has SOP-level documentation coverage**.

**SOP-level** means a dedicated detailed process specification exists under `docs/business/processes/`, either directly for the process family or through a clearly identified SOP that owns the flow.

### Validation status

Coverage must not be confused with real-enterprise approval.

All current SOPs are still **Desk-Research SOPs** unless and until they are validated with a real retailer using interviews, observed work, forms/reports and exception cases.

Target maturity remains:

```text
SOP-level desk-research
        ↓
Validated SOP
        ↓
Approved / Operational SOP
```

---

## 3. Three-level matrix — 100% SOP-level documentation coverage

| L1 Business Domain | L2 Process Family | L3 Operational Processes Covered | Dedicated SOP reference | Coverage | Validation |
|---|---|---|---|---|---|
| **1. Strategy & Performance Management** | Corporate / chain planning | Context review; strategic choices; store/network priorities; annual/monthly plan; budget/resource alignment | **P17 Strategy-to-Performance** | **SOP-level** | Desk-research |
|  | Performance management | KPI/target cascade; store benchmarking; monthly/quarterly review; action governance; reforecast | **P17** | **SOP-level** | Desk-research |
| **2. Merchandise & Category Management** | Category management | Category role/strategy; performance review; breadth/depth; seasonal/category decisions | **P10 Category/Assortment/Product Lifecycle** | **SOP-level** | Desk-research |
|  | Assortment management | Store/cluster/channel ranging; new assortment; de-range; residual-stock exit | **P10** | **SOP-level** | Desk-research |
|  | Product lifecycle / master | NPI; SKU/barcode/UOM maintenance; lifecycle/status; delist | **P10**, supported by **P26** | **SOP-level** | Desk-research |
| **3. Supplier & Procurement Management** | Supplier lifecycle | Identify/qualify/approve; terms; suspension/reactivation; supplier-performance review | **P09 Supplier-to-Settlement** | **SOP-level** | Desk-research |
|  | Purchase planning | Demand/stock need; source selection; MOQ/pack/lead-time review; purchase approval | **P01 Procure-to-Receive** | **SOP-level** | Desk-research |
|  | Purchase ordering | Create/approve/send PO; confirmation; amendment/cancellation; open-PO monitoring | **P01** | **SOP-level** | Desk-research |
|  | Goods receiving | Expected receipt; count; quality/expiry; shortage/overage/damage; accept/reject | **P01** | **SOP-level** | Desk-research |
|  | Supplier settlement | Invoice matching; tolerance; claim/credit; payable/payment authorization | **P09**, **P16 Finance-Facing Retail Controls** | **SOP-level** | Desk-research |
|  | Supplier return | Eligibility; authorization; pick/count; dispatch; supplier confirmation; credit/claim resolution | **P18 Supplier Return-to-Credit** | **SOP-level** | Desk-research |
| **4. Demand, Replenishment & Allocation** | Demand planning | History preparation; baseline forecast; event/promo uplift; override; consensus; accuracy/bias review | **P19 Demand Planning and Allocation** | **SOP-level** | Desk-research |
|  | Replenishment policy | Min/max/target; reorder point; safety stock; lead time; pack constraints | **P03 Replenish-to-Shelf** | **SOP-level** | Desk-research |
|  | Replenishment execution | Detect need; calculate recommended quantity; select source; PO/transfer; monitor fulfillment | **P03** | **SOP-level** | Desk-research |
|  | Allocation | Constrained supply; launch/promotion allocation; channel/store priority; reallocation/override | **P19** | **SOP-level** | Desk-research |
| **5. Inventory & Stock Control** | Inventory visibility | On-hand/available/reserved/in-transit; low/zero/excess/aging/expiry visibility | **P02 Inventory-to-Availability** | **SOP-level** | Desk-research |
|  | Store / DC transfer | Request; approve; pick; dispatch; in-transit; receive; discrepancy resolution | **P02** | **SOP-level** | Desk-research |
|  | Stock count | Plan; blind/count/recount; variance investigation; approval; adjustment | **P02** | **SOP-level** | Desk-research |
|  | Inventory adjustment / shrinkage | Damage; spoilage; loss; found stock; controlled correction; escalation | **P02**, **P11 Grocery Quality/Expiry/Waste** | **SOP-level** | Desk-research |
|  | Lot / expiry / quality stock status | FEFO; short-dated; quarantine; waste; recall; quality disposition | **P11** | **SOP-level** | Desk-research |
|  | Inventory valuation inputs | Quantity/cost evidence; landed cost; stock value/COGS controls | **P16** | **SOP-level** | Desk-research |
| **6. Warehouse & Distribution Operations** | Inbound operations | Arrival; unloading; receiving; QC; discrepancy; acceptance/quarantine | **P20 Warehouse Inbound, Storage and Cross-Dock** | **SOP-level** | Desk-research |
|  | Storage / internal replenishment | Putaway; location discipline; pick-face replenishment; status/expiry controls | **P20** | **SOP-level** | Desk-research |
|  | Outbound fulfillment | Pick; pack; dispatch; delivery handoff; failed-delivery resolution | **P13**, **P14**, **P15** | **SOP-level** | Desk-research |
|  | Cross-dock / DC-specific flow | Cross-dock eligibility; flow-through; fall-back to putaway; custody/evidence | **P20** | **SOP-level** | Desk-research |
| **7. Store Operations** | Store opening / closing | Security/readiness; staffing; equipment; till; pre-open walk; close/handover/lock-up | **P21 Store Open-to-Close** | **SOP-level** | Desk-research |
|  | Shelf operations | Store receiving; backroom-to-shelf; FEFO/FIFO; label/promo execution; shelf-gap resolution | **P03**, **P11** | **SOP-level** | Desk-research |
|  | Store inventory control | Local receiving; transfer; count; adjustment; quality/expiry | **P02**, **P03**, **P11** | **SOP-level** | Desk-research |
|  | Store exception management | Price dispute; item-not-found; shortage; cash variance; failed promotion; suspicious refund | **P04–P08**, **P21** | **SOP-level** | Desk-research |
| **8. Selling & Customer Service** | Store-to-Cash | Basket; customer attach; pricing/promotion; override; tender; receipt; finalize sale | **P04 Store-to-Cash** | **SOP-level** | Desk-research |
|  | Return / exchange / refund | Original sale; eligibility; condition; refund/exchange; disposition; fraud control | **P05 Return-to-Resolution** | **SOP-level** | Desk-research |
|  | Customer service / recovery | Complaint intake; SLA; investigation; compensation; escalation; root-cause feedback | **P22 Customer Service-to-Recovery** | **SOP-level** | Desk-research |
| **9. Pricing & Promotion Management** | Regular pricing | Base/store/channel/customer-group price; effective date; approval; execution validation | **P07 Pricing and Promotion Lifecycle** | **SOP-level** | Desk-research |
|  | Markdown / emergency price | Rationale; approval; timing; execution; margin/clearance evaluation | **P07** | **SOP-level** | Desk-research |
|  | Promotion lifecycle | Objective/budget; eligibility; mechanics; stacking; approval; publish; evaluate | **P07** | **SOP-level** | Desk-research |
|  | Promotion exception | Missing/incorrect offer; stock readiness; compensation/override policy | **P07**, **P04** | **SOP-level** | Desk-research |
| **10. Customer & Loyalty Management** | Customer lifecycle | Enroll/profile/consent; segmentation attributes; preference; service history | **P12 Customer & Loyalty Lifecycle** | **SOP-level** | Desk-research |
|  | Loyalty lifecycle | Earn; redeem; tier; expiry; return reversal; adjustment; abuse control | **P12** | **SOP-level** | Desk-research |
|  | Customer analytics / targeted offer | Segmentation; audience eligibility; suppression; targeting; response/incrementality review | **P23 Customer Analytics-to-Targeting** | **SOP-level** | Desk-research |
| **11. Finance & Cash Control** | Shift / till control | Float; paid-in/out; safe drop; close count; expected vs actual; over/short | **P06 Shift-to-Reconciliation** | **SOP-level** | Desk-research |
|  | Tender reconciliation | Cash/card/electronic tender settlement; mismatch; exception closure | **P06**, **P16** | **SOP-level** | Desk-research |
|  | Supplier AP | PO/receipt/invoice evidence; tolerance matching; payable exception; payment | **P09**, **P16** | **SOP-level** | Desk-research |
|  | B2B AR / credit | Credit limit/hold; invoice; collection; allocation; aging; overdue follow-up | **P13 Wholesale Order-to-Cash**, **P16** | **SOP-level** | Desk-research |
|  | Margin / COGS / stock value controls | Historical cost/COGS policy; stock valuation; landed cost; reconciliation | **P16** | **SOP-level** | Desk-research; costing policy open |
| **12. Workforce & Access Management** | Employee / role operations | Onboarding; store assignment; training/readiness; transfer; offboarding/access removal | **P24 Workforce Lifecycle, Authority and Scheduling** | **SOP-level** | Desk-research |
|  | Authority / segregation of duties | Authority matrix; conflicting duties; compensating review; periodic access review | **P24** | **SOP-level** | Desk-research |
|  | Scheduling / attendance | Workload/role demand; schedule; publish; absence/swap; actual vs plan; productivity review | **P24** | **SOP-level** | Desk-research |
| **13. Risk, Compliance & Audit** | Sales assurance / transaction audit | Missing/duplicate/erroneous/suspicious transaction detection and trusted-data release | **P08 Sales-to-Assurance** | **SOP-level** | Desk-research |
|  | Business controls | Risk/control catalogue; control evidence; exception/escalation; remediation | **P25 Risk, Compliance and Business Continuity**, supported by **P01–P27** | **SOP-level** | Desk-research |
|  | Fiscal / tax compliance | Fiscal/e-invoice transaction treatment; failure/retry; adjustment; reconciliation; legal-change intake | **P25**, **P16** | **SOP-level** | Desk-research; legal/retailer validation required |
|  | Business continuity | Incident classification; degraded/manual procedure; recovery; reconciliation; lessons | **P25** | **SOP-level** | Desk-research |
| **14. Data, Reporting & Master Data** | Master-data governance | Request; validation; approval; effective change; sensitive-field control; lifecycle | **P26 Master Data, Reporting and KPI Governance** | **SOP-level** | Desk-research |
|  | Operational reporting | Report purpose/owner/source/cutoff/reconciliation; distribution; exception handling | **P26** | **SOP-level** | Desk-research |
|  | KPI governance | Formula/source/owner/target/version; publication; interpretation; retirement | **P26** | **SOP-level** | Desk-research |
|  | Data-quality / exception governance | Detect; classify; contain; correct through business evidence; reconcile; root-cause | **P26**, **P08**, **P09**, **P16** | **SOP-level** | Desk-research |
| **15. Wholesale & Distribution** | B2B customer / commercial setup | Account approval; price/terms; credit; territory; return/rebate agreement | **P13 Wholesale Order-to-Cash** | **SOP-level** | Desk-research |
|  | Wholesale Order-to-Cash | Order; credit check; allocation; pick/ship; POD; invoice; AR; collection; return | **P13** | **SOP-level** | Desk-research |
|  | Dealer / route distribution | Route plan/load; presales/van sales; delivery; collection; return/empties; settlement | **P14 Distribution / Route-to-Settlement** | **SOP-level** | Desk-research |
|  | Trade terms / rebate / sell-in / sell-out | Dealer terms; trade-promotion budget; rebate; claims; sell-in/sell-out; performance review | **P27 Trade Promotion and Dealer Management** | **SOP-level** | Desk-research |
| **16. Omnichannel & Fulfillment** | Order capture / orchestration | Digital validation; promise; source selection; allocation/reservation | **P15 Omnichannel Order-to-Fulfillment** | **SOP-level** | Desk-research |
|  | Store / DC fulfillment | Pick; stage; substitution; ship-from-store/DC handoff | **P15** | **SOP-level** | Desk-research |
|  | Click-and-collect | Ready; notify; verify customer; pickup; no-show/expiry; restock/cancel | **P15** | **SOP-level** | Desk-research |
|  | Delivery / failed fulfillment | Deliver; failed delivery; reattempt; return-to-source; refund | **P15** | **SOP-level** | Desk-research |
|  | Cross-channel return | Original-order verification; refund; disposition; channel reconciliation | **P15**, **P05** | **SOP-level** | Desk-research |

---

## 4. Dedicated SOP catalogue

The detailed process set is now **P01–P27**.

### Original operational core P01–P16

- P01 Procure-to-Receive
- P02 Inventory-to-Availability
- P03 Replenish-to-Shelf
- P04 Store-to-Cash
- P05 Return-to-Resolution
- P06 Shift-to-Reconciliation
- P07 Pricing and Promotion Lifecycle
- P08 Sales-to-Assurance
- P09 Supplier-to-Settlement
- P10 Category / Assortment / Product Lifecycle
- P11 Grocery Quality / Expiry / Waste
- P12 Customer & Loyalty Lifecycle
- P13 Wholesale Order-to-Cash
- P14 Distribution / Route-to-Settlement
- P15 Omnichannel Order-to-Fulfillment
- P16 Finance-Facing Retail Controls

### Coverage-completion SOPs P17–P27

- **P17 Strategy-to-Performance**
- **P18 Supplier Return-to-Credit**
- **P19 Demand Planning and Allocation**
- **P20 Warehouse Inbound, Storage and Cross-Dock**
- **P21 Store Open-to-Close**
- **P22 Customer Service-to-Recovery**
- **P23 Customer Analytics-to-Targeting**
- **P24 Workforce Lifecycle, Authority and Scheduling**
- **P25 Risk, Compliance and Business Continuity**
- **P26 Master Data, Reporting and KPI Governance**
- **P27 Trade Promotion and Dealer Management**

---

## 5. Cross-cutting documentation layer

| Document | Role |
|---|---|
| `README.md` | research scope, maturity and navigation |
| `01-business-capability-map.md` | Level-1 domain/capability model |
| `02-process-catalogue.md` | process taxonomy backbone |
| `03-actors-and-responsibilities.md` | actors/RACI/segregation of duties |
| `04-end-to-end-processes.md` | cross-domain value streams |
| `05-business-rules-controls-kpis.md` | rules/controls/KPI tree |
| `06-business-glossary.md` | normalized business vocabulary |
| `07-business-policy-decision-register.md` | retailer-specific policies still to validate |
| `08-process-control-kpi-traceability.md` | process → risk → control → evidence → KPI |
| `09-professional-source-map.md` | professional source/evidence map |
| `10-real-retailer-validation-guide.md` | field validation/interview/evidence pack |

---

## 6. Coverage summary

### Documentation coverage

- **16/16 Level-1 business domains:** covered.
- **All Level-2 process families in this matrix:** **SOP-level**.
- **27 dedicated SOP-level process specifications:** P01–P27.
- **No Baseline or Capability-only label remains in the matrix.**

### Important maturity caveat

This is **100% SOP-level documentation coverage**, not 100% validated operational truth.

The package remains a professional desk-research reference model until retailer-specific values and current-state practice are validated, including:

- authority thresholds;
- tolerances;
- return windows;
- credit policies;
- workforce rules;
- tax/fiscal operating detail;
- costing/valuation policy;
- continuity rules;
- trade/rebate mechanics;
- master-data ownership.

Use `10-real-retailer-validation-guide.md` to progress each SOP to **Validated SOP**, then **Approved / Operational SOP**.
