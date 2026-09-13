# 03 — Canonical retail domain model

Status: proposal for product/domain review, not implementation schema.

## 1. Bounded contexts

### A. Organization & Identity

Owns tenant isolation, organizational hierarchy and authorization.

```text
Organization
BusinessUnit
Store
Warehouse
Register
UserAccount
Employee
Role
Permission
Assignment
AuditEvent
```

Key invariants:

- every business-owned aggregate has `orgId`;
- `UserAccount` is login identity, not the same thing as `Employee`;
- employee access to stores is explicit;
- register belongs to exactly one store at a time;
- sensitive actions produce audit events.

### B. Catalog

Owns what can be bought, stocked and sold.

```text
Product
SKU / TradeItem
Variant
Identifier
UOM
UOMConversion
Category
MerchandiseHierarchy
Brand
TaxCategory
```

Proposed distinction:

- `Product`: customer/business concept, e.g. Coca-Cola Original;
- `SKU`: stock/sell identity, e.g. Coca-Cola Original 330ml can;
- `Identifier`: GTIN/EAN/UPC/internal/supplier barcode, many-to-one with SKU where rules allow;
- `UOM`: each, pack, case, kg, etc.;
- `UOMConversion`: 1 case = 24 each.

Do not make `barcode`, `unit`, `salePrice` or `costPrice` intrinsic single-value attributes of the product aggregate.

### C. Pricing

Owns determination of list/selling price before promotions.

```text
PriceBook
PriceBookEntry
PriceApplicability
PriceRule
PriceCalculationTrace
```

Inputs may include:

```text
org
store
channel
customer/customerGroup
SKU
quantity
sale time
currency
```

Output:

```text
selected base/list price
source price book/rule
calculation trace
```

The engine must be deterministic when several price books apply.

### D. Promotion

Owns centrally configured commercial incentives.

```text
Promotion
PromotionEligibility
PromotionCondition
PromotionReward
Coupon
PromotionApplication
```

Examples:

- percent/amount off item;
- percent/amount off order;
- buy X get Y;
- threshold reward;
- customer-tier promotion;
- store/channel/time-limited promotion.

Required rule metadata:

```text
priority
stackable/exclusive
validity window
scope
usage limits
rounding policy
```

Manual cashier discount remains in Sales with permission/audit policy; it is not a Promotion entity.

### E. Sales / Retail Transaction

Owns cart lifecycle and finalized sale/return/exchange records.

```text
Cart
CartLine
RetailTransaction
TransactionLine
SaleLine
ReturnLine
ExchangeLink
DiscountApplication
PriceSnapshot
Receipt
```

Key design rule: a finalized transaction stores the **commercial snapshot used at sale time**. Future price/product changes must not rewrite historical truth.

A line should be able to explain:

```text
SKU
quantity + UOM
base price
price-book decision
promotion applications
manual discount
net amount
VAT/tax snapshot
cost snapshot if policy permits
```

Returns must reference the original transaction/line when possible and preserve refund calculation provenance.

### F. Tender & Store Cash

Owns settlement and physical cash control.

```text
TenderType
Payment
PaymentAllocation
RefundPayment
Shift
CashMovement
TillCount
Reconciliation
ZReport
```

`Payment.method` is too small for production. Payment/tender needs status, reference/provider metadata, reversal/refund linkage and reconciliation state.

Cash movement types include:

```text
opening float
cash sale
cash refund
paid in
paid out
cash drop
closing count
variance adjustment
```

### G. Inventory

Owns stock truth.

```text
InventoryLocation
InventoryMovement
InventoryLedger
StockPosition
StockReservation
InventoryCount
InventoryAdjustment
Transfer
TransferShipment
Lot
Expiry
```

Recommended model:

```text
source document/action
        ↓
InventoryMovement (immutable)
        ↓
InventoryLedger
        ↓
StockPosition (derived/materialized)
```

Typical movement reasons:

```text
purchase receipt       +
sale                   -
customer return        +
transfer out           -
transfer in            +
stock count adjustment +/-
damage/shrinkage       -
supplier return        -
```

`StockLevel` can remain as a read model/cache but should not be the only source of inventory truth.

### H. Procurement

Owns supplier purchasing.

```text
Supplier
SupplierLocation
SupplierItem
SupplierCost
PurchaseOrder
PurchaseOrderLine
GoodsReceipt
GoodsReceiptLine
SupplierReturn
```

Purchase-order and receiving quantities need their own UOM and conversion into inventory base UOM.

Receiving should support partial receipt and variance; posting creates inventory movements.

### I. Customer & Loyalty

```text
Customer
CustomerGroup
LoyaltyProgram
LoyaltyAccount
LoyaltyLedgerEntry
Tier
Reward
Redemption
```

Replace mutable `points` as sole truth with a points ledger or equivalent traceable transaction history.

### J. Fiscal / Compliance

```text
TaxPolicy
TaxRateSnapshot
FiscalDocument
EInvoice
EInvoiceAdjustment
FiscalProviderReference
```

Core domain must not include MISA/VNPT/Viettel-specific fields. Those belong behind adapters.

## 2. Suggested aggregate/event relationships

```text
Sale finalized
├── RetailTransaction created
├── Tender(s) recorded
├── InventoryMovement(s) posted
├── Loyalty entries posted (if applicable)
├── CashMovement posted for cash tender
├── AuditEvent recorded
└── FiscalDocument requested/issued depending policy
```

```text
Purchase receipt posted
├── GoodsReceipt finalized
├── PO received quantities advanced
├── InventoryMovement(s) posted
├── supplier cost snapshot recorded
└── AuditEvent recorded
```

This event-oriented view is useful even if BeePOS remains a modular monolith and does not adopt event sourcing.

## 3. Read models vs sources of truth

Fast POS/UI queries should use read models where useful:

```text
CurrentStockByStore
CurrentPriceByStoreAndCustomerGroup
OpenShiftSummary
DailyStoreSalesSummary
CustomerBalanceSummary
```

Do not force every screen to replay ledgers. Keep immutable transaction/movement truth plus optimized projections/snapshots.

## 4. Minimum migration from current prototype

Before a production backend is committed, make these concepts canonical:

1. `Organization`, `Store`, `Register`, account/employee split.
2. `Product` + `SKU` + identifiers + UOM conversion.
3. `PriceBook` and pricing result trace.
4. `RetailTransaction` snapshot semantics.
5. `InventoryMovement` / ledger semantics.
6. `Supplier` + `PurchaseOrder` + partial `GoodsReceipt`.
7. `CashMovement` / reconciliation.
8. provider-independent fiscal boundary.

UI routes can continue using existing names during migration; the important change is the domain contract underneath them.
