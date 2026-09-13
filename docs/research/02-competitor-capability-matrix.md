# 02 — Competitor capability matrix

This document is not a feature-copy checklist. It uses public product documentation to identify **market-proven retail requirements** that should influence BeePOS's domain model.

## 1. Evidence highlights

### KiotViet

Public API and user documentation show that pricing is not a single store override. KiotViet price books can have:

- active/effective periods;
- branch applicability;
- customer-group applicability;
- user applicability;
- rule priority and date/day conditions in some product lines.

KiotViet also documents a procurement workflow from purchase planning/order through supplier confirmation and goods receipt.

Sources:
- https://www.kiotviet.vn/huong-dan-su-dung-kiotviet/retail-ket-noi-api/public-api/
- https://www.kiotviet.vn/huong-dan-su-dung-kiotviet/retail-giao-dich/dat-hang-nhap/

### Sapo

Sapo documents separate price-book scopes for:

- customer group;
- branch;
- sales channel.

Its documented precedence is **customer group > branch > sales channel** when several price books apply. Sapo also supports purchase orders, goods receipts, supplier management and fuller inventory workflows. Product documentation shows unit conversion/use cases such as selling a case while decrementing the underlying bottle quantity.

Promotion/coupon scope can include customer group, branch and sales channel, and examples include order discount, product discount and buy-X-get-Y.

Sources:
- https://help.sapo.vn/quan-ly-bang-gia
- https://help.sapo.vn/them-moi-bang-gia-theo-chi-nhanh-tren-sapo-omniai
- https://help.sapo.vn/tao-don-dat-hang-nhap-tren-phan-mem-quan-ly-ban-hang-sapo
- https://help.sapo.vn/cap-nhat-cau-hinh-quan-ly-kho-tren-phan-mem-sapo
- https://help.sapo.vn/xem-chi-tiet-chinh-sua-san-pham-co-nhieu-phien-ban-san-pham
- https://help.sapo.vn/tao-ma-khuyen-mai-mua-x-tang-y-tren-sapo-omniai

### MISA eShop

MISA's chain documentation exposes a broader operating model than POS-only software:

- chain/org setup and store structure;
- per-store staff permissions;
- chain suppliers;
- payment partners/bank accounts;
- promotions and loyalty/campaigns;
- customer and supplier debt;
- chain price management;
- e-invoice integration;
- accounting integration;
- chain-wide sales, profit, inventory and receivable/payable reporting.

Source: https://helpeshop.misa.vn/kb/quan-ly-chuoi

### Odoo

Odoo is useful as an open workflow reference because POS, pricing, inventory and purchasing are documented as connected business applications. Pricelists can drive POS-specific pricing, temporary prices, customer-specific rules and bulk-buy adjustments.

Sources:
- https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale.html
- https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale/pricing.html

## 2. BeePOS capability matrix

Legend: ✅ existing prototype capability · 🟡 partial/simplified · ❌ missing · 🎯 recommended target

| Capability | BeePOS now | Market signal | Recommended target |
|---|---:|---|---|
| Fast POS checkout | ✅ | universal | keep core |
| Split tender | ✅ | common modern POS | keep core |
| Full/partial refund | ✅ | universal | add transaction provenance |
| Exchange | ❌ | common retail | P2 after canonical transaction model |
| Multi-store | 🟡 | baseline for chain products | P1 org/business-unit/store model |
| Register/workstation | ❌ | standard store ops | P1 |
| Staff RBAC | 🟡 | baseline | P1 explicit permissions + route/action guard |
| Audit trail | ❌ | control requirement | P1 |
| Price books | ❌ | strong KiotViet/Sapo/Odoo signal | P1 |
| Branch pricing | ❌ | strong local signal | P1 via generic applicability |
| Customer-group pricing | ❌ | strong local signal | P1 |
| Channel pricing | ❌ | strong Sapo signal | design now, UI can follow later |
| Price effective dates | ❌ | strong signal | P1 |
| Price precedence | ❌ | required when scopes overlap | P1 deterministic rules |
| Promotion engine | ❌ | universal | P1/P2 boundary depending scope |
| Buy X get Y | ❌ | Sapo/local market signal | P2 |
| Coupon | ❌ | common | P2 |
| Supplier master | ❌ | universal procurement | P1 |
| Purchase order | ❌ | KiotViet/Sapo/Odoo | P1 |
| Partial receiving | ❌ | normal procurement | P1/P2 |
| Supplier return | ❌ | mature inventory flow | P2 |
| Inventory transfer | ✅ | chain baseline | migrate to ledger semantics |
| Stock count | ✅ | baseline | migrate posting to ledger |
| Inventory movement history | 🟡 | control/reporting baseline | P1 immutable ledger |
| UOM conversion | ❌ | grocery/wholesale relevant | P1 |
| Lot/expiry | ❌ | grocery requirement for many categories | P1 design, P2 UI if needed |
| Variable-weight item | ❌ | grocery/fresh-food requirement | P2, but domain-ready P1 |
| Cash shift | ✅ | baseline | keep |
| Paid-in / paid-out | ❌ | store cash control | P1 |
| Z/end-of-day report | ❌ | store control | P1 |
| Customer profile | ✅ | common | keep |
| Loyalty points | 🟡 | common | convert to ledger/rule model |
| Supplier/customer debt | ❌ | strong local SMB/chain signal | later retail back-office / wholesale |
| E-invoice | ❌ | Vietnam compliance requirement for relevant users | P1 integration boundary |
| Accounting integration | ❌ | MISA/enterprise signal | adapter boundary, later connectors |
| Offline local data | 🟡 | POS reliability requirement | P1 architecture decision |
| Offline distributed sync | ❌ | production requirement | post-backend but design before backend |
| Hardware abstraction | ❌ | POS production requirement | P1 architecture boundary |

## 3. Critical product conclusions

### 3.1 Do not implement `StorePrice` as the final pricing model

A generic model is safer:

```text
PriceBook
├── name
├── validity
├── currency
├── priority
├── entries[]
└── applicability
    ├── organization
    ├── channel
    ├── store / store group
    ├── customer / customer group
    └── optional operator/account dimension
```

The pricing engine needs deterministic precedence and a trace explaining why a final price was selected.

### 3.2 Promotion and manual discount are different concepts

A promotion is a centrally defined rule. A manual discount is a controlled operator action. They need different permissions, audit semantics and reporting.

### 3.3 Procurement is a state machine, not just a receipt form

Target lifecycle:

```text
Draft PO
→ Submitted/Sent
→ Confirmed
→ Partially received
→ Fully received
→ Closed
        ↘ Cancelled
```

Receipt posting should create inventory movements and retain PO linkage.

### 3.4 Product/SKU/UOM must be fixed before wholesale expansion

Retail grocery already requires cases, packs and eaches. Wholesale later makes this mandatory. The domain should handle conversions before BeePOS grows into B2B pricing or distribution.
