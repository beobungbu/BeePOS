# BeePOS — Three-Level Business Matrix

Status: Business-documentation coverage map · 2026-09-13

## 1. Purpose

This matrix gives a single three-level view of the BeePOS business-research package.

The three business levels are:

- **Level 1 — Business Domain / Capability Domain:** a major area the enterprise must be able to operate.
- **Level 2 — Process Family / Major Business Process:** a coherent group of end-to-end or management processes inside the domain.
- **Level 3 — Operational Process / SOP-Level Activity:** the concrete business workflow that can be validated with real operators, forms, approvals, exceptions, controls and KPIs.

The matrix intentionally separates business hierarchy from software modules. A Level-3 process may span POS, ERP, WMS, accounting, spreadsheets, paper, external partners and human approval.

### Coverage legend

- **SOP-level** — dedicated detailed process specification exists under `docs/business/processes/`.
- **Baseline** — process is described in the process catalogue/E2E/business-rule documents but does not yet have a dedicated SOP-level file.
- **Capability-only** — identified in the capability map but not yet decomposed deeply enough for operator validation.

---

## 2. Three-level matrix

| L1 Business Domain | L2 Process Family / Major Process | L3 Operational Processes Already Documented | Main existing documents | Coverage |
|---|---|---|---|---|
| **1. Strategy & Performance Management** | Corporate / chain planning | Define chain strategy; store-network priorities; annual/monthly operating plan; budget/expense targets | `01-business-capability-map.md`, `05-business-rules-controls-kpis.md` | Capability-only |
|  | Performance management | Set sales/margin/availability/shrinkage targets; store benchmarking; exception/action review | `01-business-capability-map.md`, `05-business-rules-controls-kpis.md`, `08-process-control-kpi-traceability.md` | Baseline |
| **2. Merchandise & Category Management** | Category management | Define category role/strategy; analyze category performance; determine breadth/depth; seasonal/category review | `02-process-catalogue.md`, `processes/P10-category-assortment-product-lifecycle.md` | SOP-level |
|  | Assortment management | Plan assortment by store/cluster/channel; range/de-range SKU; launch new assortment; manage residual stock | `processes/P10-category-assortment-product-lifecycle.md` | SOP-level |
|  | Product lifecycle / master | Product introduction; SKU/barcode/UOM maintenance; status/lifecycle; delisting | `02-process-catalogue.md`, `processes/P10-category-assortment-product-lifecycle.md`, `06-business-glossary.md` | SOP-level |
| **3. Supplier & Procurement Management** | Supplier lifecycle | Identify/qualify/approve supplier; maintain commercial terms; suspend/reactivate; performance review | `processes/P09-supplier-to-settlement.md` | SOP-level |
|  | Purchase planning | Review demand/stock need; source selection; MOQ/pack/lead-time review; purchase recommendation/approval | `02-process-catalogue.md`, `processes/P01-procure-to-receive.md` | SOP-level |
|  | Purchase ordering | Create/approve/send PO; receive supplier confirmation; amend/cancel; monitor open PO | `processes/P01-procure-to-receive.md` | SOP-level |
|  | Goods receiving | Identify PO/delivery; count; quality/expiry check; shortage/overage/damage/cost discrepancy; accept/reject | `processes/P01-procure-to-receive.md` | SOP-level |
|  | Supplier settlement | Invoice matching; tolerance/discrepancy handling; supplier credit/claim; payment authorization | `processes/P09-supplier-to-settlement.md`, `processes/P16-finance-facing-retail-controls.md` | SOP-level |
|  | Supplier return | Identify returnable stock; authorize; dispatch; supplier credit/settlement adjustment | `02-process-catalogue.md`, `P01`, `P09` | Baseline |
| **4. Demand, Replenishment & Allocation** | Demand planning | Use sales/stock/seasonality/promotion signals; forecast; review/override forecast exceptions | `02-process-catalogue.md`, `processes/P03-replenish-to-shelf.md` | Baseline |
|  | Replenishment policy | Define min/max/target stock; reorder point; safety stock; lead time; case-pack constraints | `processes/P03-replenish-to-shelf.md` | SOP-level |
|  | Replenishment execution | Detect need; calculate recommended quantity; choose supplier/DC/store source; create PO/transfer; monitor fulfillment | `processes/P03-replenish-to-shelf.md` | SOP-level |
|  | Allocation | Allocate scarce/new/promotion inventory across stores/channels; handle shortage priorities | `01-business-capability-map.md`, `02-process-catalogue.md`, `P03`, `P15` | Baseline |
| **5. Inventory & Stock Control** | Inventory visibility | View on-hand/available/reserved/in-transit; identify low/zero/excess/aging/expiry risk | `processes/P02-inventory-to-availability.md` | SOP-level |
|  | Store/DC transfer | Create/approve transfer; source pick; dispatch; in-transit accountability; destination receipt; discrepancy resolution | `processes/P02-inventory-to-availability.md`, `04-end-to-end-processes.md` | SOP-level |
|  | Stock count | Plan count; blind/count/recount; variance investigation; approval; adjustment | `processes/P02-inventory-to-availability.md` | SOP-level |
|  | Inventory adjustment / shrinkage | Damage; spoilage; loss; found stock; manual correction; material-variance escalation | `P02`, `P11-grocery-quality-expiry-waste.md` | SOP-level |
|  | Lot / expiry / quality stock status | FEFO; short-dated; quarantine; waste; recall; quality disposition | `processes/P11-grocery-quality-expiry-waste.md` | SOP-level |
|  | Inventory valuation inputs | Quantity/cost evidence; landed cost; stock valuation and COGS control points | `processes/P16-finance-facing-retail-controls.md` | SOP-level |
| **6. Warehouse & Distribution Operations** | Inbound operations | Delivery scheduling; receiving; quality/quantity check; staging/putaway | `P01`, `P02`, `02-process-catalogue.md` | Baseline |
|  | Storage / internal replenishment | Storage; replenishment to pick/shelf location; stock-status control | `P02`, `P03` | Baseline |
|  | Outbound fulfillment | Pick; pack; dispatch; delivery handoff; discrepancy/failed-delivery handling | `P13-wholesale-order-to-cash.md`, `P14-distribution-route-to-settlement.md`, `P15-omnichannel-order-to-fulfillment.md` | SOP-level across channel flows |
|  | Cross-dock / DC-specific flow | Cross-docking, wave/pick-face depth, warehouse slotting | `01-business-capability-map.md`, `02-process-catalogue.md` | Capability-only |
| **7. Store Operations** | Store opening / closing | Operational readiness; register/till readiness; day-end closure | `01-business-capability-map.md`, `P06-shift-to-reconciliation.md` | Baseline |
|  | Shelf operations | Store receiving; backroom-to-shelf; FEFO/FIFO; price-label/promo execution; shelf-gap resolution | `processes/P03-replenish-to-shelf.md`, `P11` | SOP-level |
|  | Store inventory control | Local receiving; transfer; count; adjustment; damage/expiry handling | `P02`, `P03`, `P11` | SOP-level |
|  | Store exception management | Price dispute; item-not-found; shortage; cash variance; failed promotion; suspicious refund | `P04`, `P05`, `P06`, `P07`, `P08` | SOP-level |
| **8. Selling & Customer Service** | Store-to-Cash | Scan/select; basket; customer attach; pricing/promotion; discount approval; tender; receipt; finalize sale | `processes/P04-store-to-cash.md` | SOP-level |
|  | Return / exchange / refund | Verify original sale; eligibility; condition; partial promotion return; refund; disposition; fraud control | `processes/P05-return-to-resolution.md` | SOP-level |
|  | Customer service / recovery | Complaint handling, service recovery, special exception approval | `04-end-to-end-processes.md`, `P05`, `P12` | Baseline |
| **9. Pricing & Promotion Management** | Regular pricing | Set regular/store/channel/customer-group price; effective date; approval; execution validation | `processes/P07-pricing-and-promotion-lifecycle.md` | SOP-level |
|  | Markdown / emergency price | Markdown rationale; timing; approval; execution; margin/clearance outcome | `P07` | SOP-level |
|  | Promotion lifecycle | Objective/budget; eligibility; mechanics; stacking/conflict; approval; publish; execution; evaluation | `P07` | SOP-level |
|  | Promotion exception | Missing/incorrect promo; stock readiness; manual compensation/override policy | `P04`, `P07` | SOP-level |
| **10. Customer & Loyalty Management** | Customer lifecycle | Enroll/profile/consent; segmentation; contact preference; service history | `processes/P12-customer-loyalty-lifecycle.md` | SOP-level |
|  | Loyalty lifecycle | Earn; redeem; tier; expiry; return reversal; manual adjustment; abuse control | `P12` | SOP-level |
|  | Customer analytics / targeted offer | Purchase history; segments; targeted promotions; loyalty effectiveness | `P12`, `05-business-rules-controls-kpis.md` | Baseline |
| **11. Finance & Cash Control** | Shift / till control | Opening float; paid-in/out; safe drop; close count; expected vs actual; over/short approval | `processes/P06-shift-to-reconciliation.md` | SOP-level |
|  | Tender reconciliation | Cash; card/electronic tender; settlement mismatch; unresolved reconciliation | `P06`, `P16` | SOP-level |
|  | Supplier AP | PO/receipt/invoice evidence; three-way/tolerance matching; payable exception; payment | `P09`, `P16` | SOP-level |
|  | B2B AR / credit | Credit limit; credit hold; invoice; collection; allocation; aging; overdue follow-up | `processes/P13-wholesale-order-to-cash.md`, `P16` | SOP-level |
|  | Margin / COGS / stock value controls | Historical cost/COGS policy points; stock valuation; landed cost; reconciliation | `P16` | SOP-level baseline; retailer policy still open |
| **12. Workforce & Access Management** | Employee / role operations | Employee onboarding; store assignment; role/authority assignment; cashier/manager responsibilities | `03-actors-and-responsibilities.md`, `01-business-capability-map.md` | Baseline |
|  | Authority / segregation of duties | Buyer vs receiver; cashier vs variance approver; price/discount/refund authority; finance separation | `03-actors-and-responsibilities.md`, `05-business-rules-controls-kpis.md`, `08-process-control-kpi-traceability.md` | Baseline |
|  | Scheduling / attendance | Shift scheduling, attendance integration, workforce planning | `01-business-capability-map.md` | Capability-only |
| **13. Risk, Compliance & Audit** | Sales assurance / transaction audit | Missing/duplicate/erroneous/suspicious transactions; store-day exception queue; trusted-data release | `processes/P08-sales-to-assurance.md` | SOP-level |
|  | Business controls | Price override; refund; stock adjustment; cash variance; credit release; supplier discrepancy | `05-business-rules-controls-kpis.md`, `08-process-control-kpi-traceability.md`, P01–P16 | Baseline cross-process |
|  | Fiscal/tax compliance | Tax/invoice evidence and reconciliation requirements | `P04`, `P05`, `P16` | Baseline; Vietnam-specific compliance needs separate deep dive |
|  | Business continuity | Offline/manual operating procedure, evidence preservation, recovery | `01-business-capability-map.md`, `07-business-policy-decision-register.md` | Capability-only |
| **14. Data, Reporting & Master Data** | Master-data governance | Product; supplier; store/location; employee; customer; price/promotion; reason codes | `01-business-capability-map.md`, `06-business-glossary.md`, P09/P10/P12 | Baseline |
|  | Operational reporting | Sales; inventory; supplier; cash; returns; route; fulfillment; exception reporting | `05-business-rules-controls-kpis.md`, P01–P16 | Baseline |
|  | KPI governance | KPI definitions; control evidence; management questions; owner/accountability | `05-business-rules-controls-kpis.md`, `08-process-control-kpi-traceability.md` | Baseline |
|  | Data-quality / exception governance | Missing/duplicate/suspicious sales; unmatched receipt/invoice; unexplained stock/cash differences | `P08`, `P09`, `P16` | SOP-level in selected flows |
| **15. Wholesale & Distribution** | B2B customer / commercial setup | Account approval; contract/customer price; payment term; credit limit; territory/salesperson | `processes/P13-wholesale-order-to-cash.md` | SOP-level |
|  | Wholesale Order-to-Cash | Order capture; credit check; allocation; pick/ship; POD; invoice; collection; return/credit note | `P13` | SOP-level |
|  | Dealer / route distribution | Route planning; load; presales/van sales; delivery; collection; returns/empties; route settlement | `processes/P14-distribution-route-to-settlement.md` | SOP-level |
|  | Trade terms / rebate / sell-in/sell-out | Volume rebate; dealer terms; sell-in/sell-out visibility; trade-promotion economics | `P13`, `P14`, `01-business-capability-map.md` | Baseline; deeper TPM/DMS research still open |
| **16. Omnichannel & Fulfillment** | Order capture / orchestration | Digital order validation; availability promise; source selection; allocation/reservation | `processes/P15-omnichannel-order-to-fulfillment.md` | SOP-level |
|  | Store / DC fulfillment | Store pick; ship-from-store; DC fulfillment; substitution; staging; carrier handoff | `P15` | SOP-level |
|  | Click-and-collect | Ready-for-pickup; customer verification; pickup; expiry/no-show; restock/cancel | `P15` | SOP-level |
|  | Delivery / failed fulfillment | Delivery; failed delivery; reattempt; return-to-source; refund/resolution | `P15` | SOP-level |
|  | Cross-channel return | Verify original order; return policy; refund; disposition; channel reconciliation | `P15`, `P05` | SOP-level |

---

## 3. Cross-cutting documentation layer

The following files do not represent one single business domain. They support all three levels above.

| Document | Role in the three-level model |
|---|---|
| `README.md` | research scope, methodology, maturity and navigation |
| `01-business-capability-map.md` | canonical Level-1 capability/domain view |
| `02-process-catalogue.md` | Level-2 and Level-3 catalogue backbone |
| `03-actors-and-responsibilities.md` | process owners, actors, RACI and segregation of duties |
| `04-end-to-end-processes.md` | cross-domain E2E value streams and handoffs |
| `05-business-rules-controls-kpis.md` | business rules, internal controls, exception logic and KPI tree |
| `06-business-glossary.md` | common business vocabulary and document definitions |
| `07-business-policy-decision-register.md` | retailer-specific policy choices not safe to assume from desk research |
| `08-process-control-kpi-traceability.md` | process → risk → control → evidence → KPI traceability |
| `09-professional-source-map.md` | professional evidence base and reference strength |
| `10-real-retailer-validation-guide.md` | interview/observation/evidence pack for moving from reference model to validated current state |

---

## 4. Coverage summary by level

### Level 1

All **16 capability domains** currently exist in the capability map.

### Level 2

Core retail domains are decomposed into major process families. The strongest Level-2 coverage currently exists in:

- merchandise/category/product;
- supplier/procurement;
- replenishment;
- inventory;
- store operations;
- selling/returns;
- pricing/promotion;
- customer/loyalty;
- cash/finance control;
- wholesale;
- route distribution;
- omnichannel.

The thinner Level-2 areas are:

- corporate strategy/planning;
- workforce scheduling/attendance;
- warehouse/DC-specific depth;
- business continuity;
- dedicated master-data governance.

### Level 3

There are currently **16 dedicated SOP-level process specifications (P01–P16)**. They provide deepest coverage for operational flows that materially affect revenue, margin, stock, cash, customer service or financial control.

---

## 5. Main gaps exposed by the matrix

The matrix shows that the next business-research work should not simply create more POS flows. The main gaps are now concentrated in:

1. **Strategy-to-Plan / performance-management operating cycle** — annual/monthly planning, budgeting, target cascade, review/action governance.
2. **Warehouse/DC operations depth** — inbound appointment, putaway, slotting, wave/picking, packing, cross-dock, dispatch and warehouse productivity.
3. **Workforce operations** — scheduling, attendance, labor planning, store labor productivity and role/certification requirements.
4. **Vietnam-specific fiscal/compliance operations** — e-invoice/tax operational lifecycle and exception handling from a business/compliance perspective.
5. **Master-data governance** — who creates/approves/changes critical product/supplier/customer/price/location data and how bad master data is detected/corrected.
6. **Trade-promotion/distributor-management depth** — dealer hierarchy, territory, sell-in/sell-out, rebate claims, trade spend and distributor stock.
7. **Enterprise planning / S&OP-style cycle** — demand, purchase, inventory and commercial plan alignment for a larger chain.

These should be treated as business-research gaps, not software backlog items.
