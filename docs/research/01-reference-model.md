# 01 — Retail reference model for BeePOS

## 1. ARTS / OMG: domain vocabulary and enterprise retail model

The ARTS Operational Data Model (ODM) 7.3 is the strongest reference for BeePOS's **retail domain language**. OMG describes it as an enterprise-level relational model covering 133 subject areas, 850+ entities, 1,700+ relationships and 6,800+ attributes. It evolved from a store transaction model into a retail enterprise information architecture.

BeePOS should not copy the full model. Instead, use it to challenge simplified concepts in the current prototype and standardize terminology.

### ARTS concepts worth mapping first

| Reference concept | BeePOS concern | Recommendation |
|---|---|---|
| Party / Person / Organization | customer, supplier, employee | Avoid duplicating identity/contact concepts in every module |
| Business Unit / Selling Location | organization, store, warehouse | Introduce explicit hierarchy instead of assuming one chain |
| Workstation | POS register/device | Add `Register` separate from `Store` and `Shift` |
| Operator | cashier/staff | Separate account identity from employee assignment and store role |
| Item / Sellable Item | product/SKU/variant | Separate product identity from sellable SKU and identifiers |
| Merchandise hierarchy | category | Support multi-level merchandising hierarchy rather than UI-only category trees |
| Price / price derivation | `salePrice` | Replace single selling price with price books/rules/applicability |
| Promotion | order/line discount | Make promotion a rule domain, distinct from cashier manual discount |
| Retail Transaction | `Order` | Rename/reframe checkout result as immutable retail transaction concept |
| Tender | `Payment` | Model tender/payment/refund/reconciliation explicitly |
| Inventory location / movement | `StockLevel` | Move toward inventory ledger + materialized stock position |

Reference: https://www.omg.org/retail-depository/arts-odm-73/introduction_and_overview.htm

## 2. GS1: identifiers, units, barcodes and item semantics

Grocery POS cannot safely assume `Product.barcode: string` and `Product.unit: string` are sufficient.

GS1's retail POS guidance covers linear and 2D identifiers and supports data beyond GTIN, including batch/lot, expiry, variable measure, amount payable and other application identifiers. This matters for grocery, pharmacy-adjacent retail, fresh food and variable-weight products.

### BeePOS implications

Proposed item structure:

```text
Product
└── SKU / TradeItem
    ├── identifiers[]
    │   ├── GTIN / EAN / UPC
    │   ├── internal barcode
    │   └── supplier code
    ├── baseUom
    ├── sellUoms[]
    ├── conversion rules
    ├── lot/expiry policy
    ├── variable-measure policy
    └── tax category
```

Examples the model should support without hacks:

- one bottle and one 24-bottle case of the same inventory base item;
- weighted produce with encoded weight/price;
- milk with lot and expiry;
- product relabelled with an internal barcode while retaining GTIN;
- a 2D code carrying GTIN + expiry + lot.

Reference: https://ref.gs1.org/guidelines/2d-in-retail/

## 3. APQC Retail PCF: business capability/process catalogue

APQC's Retail Process Classification Framework is useful for checking whether BeePOS's roadmap covers retail operations comprehensively without organizing everything around application screens.

High-level process families relevant to BeePOS:

```text
Customer experience
Market products/services
Merchandise products/services
Deliver products
Manage customer service
Manage financial resources
Manage enterprise information / technology
Manage risk, compliance and controls
```

Use APQC as a **coverage and KPI taxonomy**, not as a software module map.

Reference: https://www.apqc.org/process-frameworks

## 4. SCOR: supply-chain workflow and measurement

SCOR becomes important when BeePOS expands beyond store-level inventory into procurement, replenishment, warehouse/distribution and returns.

BeePOS mapping:

```text
Plan      -> demand/replenishment policy
Source    -> supplier, PO, receiving
Transform -> mostly out of scope for retail v1
Fulfill   -> store/DC movement, picking/delivery when added
Return    -> customer return + supplier return
Orchestrate -> master data, rules, metrics, integration
```

Do not implement SCOR as screens. Use it to validate process completeness and metrics.

Reference: https://www.ascm.org/corporate-solutions/standards-tools/scor-ds/

## 5. Recommended canonical capability tree

```text
1. Enterprise / Tenant
   1.1 Organization
   1.2 Business units
   1.3 Stores / warehouses / locations
   1.4 Registers / devices
   1.5 Identity / employees / RBAC
   1.6 Configuration / audit

2. Merchandise
   2.1 Product / SKU / variant
   2.2 Identifiers / barcode / GTIN
   2.3 UOM / conversion
   2.4 Category / merchandise hierarchy
   2.5 Brand
   2.6 Tax classification

3. Pricing
   3.1 Base price
   3.2 Price books
   3.3 Applicability
   3.4 Effective dates
   3.5 Priority / precedence
   3.6 Manual price override policy

4. Promotion
   4.1 Promotion/campaign
   4.2 Eligibility
   4.3 Condition
   4.4 Reward
   4.5 Coupon
   4.6 Stacking / exclusivity

5. Sales / POS
   5.1 Open cart
   5.2 Retail transaction
   5.3 Sale
   5.4 Return
   5.5 Exchange
   5.6 Void/cancel
   5.7 Receipt

6. Tender / Cash
   6.1 Cash/card/transfer/points
   6.2 Split tender
   6.3 Refund
   6.4 Shift
   6.5 Cash movement
   6.6 Reconciliation / Z report

7. Inventory
   7.1 Inventory ledger
   7.2 Stock position
   7.3 Reservation
   7.4 Receipt
   7.5 Transfer
   7.6 Count / adjustment
   7.7 Lot / expiry
   7.8 Damage / shrinkage

8. Procurement
   8.1 Supplier
   8.2 Supplier item
   8.3 Purchase order
   8.4 Receiving
   8.5 Supplier return
   8.6 Supplier cost

9. Customer / Loyalty
   9.1 Customer
   9.2 Customer group
   9.3 Tier
   9.4 Points ledger
   9.5 Reward/redemption

10. Fiscal / Compliance
    10.1 Tax
    10.2 E-invoice/fiscal document
    10.3 Provider adapter
    10.4 Audit trail

11. Reporting / Analytics
    11.1 Sales
    11.2 Margin
    11.3 Inventory
    11.4 Store performance
    11.5 Cashier / shift
    11.6 Purchase / supplier
```

## 6. What this means for the current prototype

The existing screens remain useful. The main change is semantic: future implementation work should attach them to stable bounded contexts and transaction models rather than continue expanding `Product`, `Order`, `StockLevel` and settings objects indefinitely.
