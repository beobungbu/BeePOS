# BeePOS Professional Business-Research Source Map

Status: Verified reference map · 2026-09-13

## 1. Purpose

This document records the professional reference families used to build the BeePOS business-process baseline and explains **what each source is appropriate for**.

The intent is to prevent two common research problems:

1. using POS competitor feature lists as if they were complete retail operating models;
2. using ERP/vendor implementation details as if they were universal business policy.

The hierarchy used in this research is:

```text
Cross-industry / retail process frameworks
        ↓
Retail & supply-chain reference models
        ↓
Enterprise retail operating documentation
        ↓
Vietnam market workflow evidence
        ↓
Real-retailer SOP / observed practice (future validation)
```

## 2. APQC Process Classification Framework (PCF)

### Use for

- enterprise process taxonomy;
- naming L0/L1/L2 process families;
- process definition discipline;
- KPI/key-measure discovery;
- comparison across organizations.

### Do not use for

- detailed POS screen requirements;
- retailer-specific tolerances/approvals;
- database/entity design.

### References

- APQC Process Frameworks: https://www.apqc.org/process-frameworks
- APQC Retail PCF 7.2.1 PDF: https://www.apqc.org/resource-library/resource-listing/apqc-process-classification-framework-pcf-retail-pdf-version-721
- PCF v8 Process Definitions and Key Measures Collection: https://www.apqc.org/resource-library/resource-collection/pcf-version-80-process-definitions-and-key-measures-collection
- Sourcing and Procurement process reference: https://www.apqc.org/resource-library/resource/understanding-sourcing-and-procurement-processes

### BeePOS coverage

Informs the overall capability map/process catalogue and P01/P09/P16 governance language.

---

## 3. ASCM SCOR Digital Standard

### Use for

- supply-chain value streams;
- Plan / Order / Source / Fulfill / Return language;
- supply-chain performance and KPI thinking;
- supplier/service/inventory flow analysis.

### Reference

- SCOR Digital Standard guide: https://www.ascm.org/globalassets/documents--files/corporate-transformation/scor-ds-digital-guide_final.pdf

### BeePOS coverage

Informs procurement, replenishment, fulfillment, returns and distribution process boundaries.

---

## 4. Oracle Retail Merchandising / Invoice Matching

### Use for

- purchase orders and receipts;
- retail inventory movements;
- supplier invoice verification;
- cost/quantity discrepancy handling;
- enterprise-grade exception controls.

### Verified references

- Oracle Retail Invoice Matching latest: https://docs.oracle.com/en/industries/retail/retail-invoice-matching-cloud/latest/
- Invoice Matching introduction: https://docs.oracle.com/en/industries/retail/retail-invoice-matching-cloud/latest/rimog/introduction.htm
- Merchandising Foundation Cloud: https://docs.oracle.com/en/industries/retail/retail-merchandising-foundation-cloud/latest/

### Key validated business principle

Oracle Retail Invoice Matching verifies merchandise invoice cost, quantity and tax against purchase orders/receipts, accepts matches within retailer-defined tolerances, and routes cost/quantity discrepancies for resolution before payment.

### BeePOS coverage

P01 Procure-to-Receive, P09 Supplier-to-Settlement, P16 Finance-Facing Retail Controls.

---

## 5. Oracle Retail Assortment Planning

### Use for

- category/assortment planning;
- assortment breadth and depth;
- planning by point-of-commerce/location/channel;
- use of historical/geographic/product-attribute performance;
- planner override as an explicit business action.

### Verified references

- Oracle Retail Assortment Planning Cloud Service 26.2.301.0: https://docs.oracle.com/en/industries/retail/retail-assortment-planning-cloud-service/26.2.301.0/
- Assortment Planning User Guide introduction: https://docs.oracle.com/en/industries/retail/retail-assortment-planning-cloud-service/26.1.201.0/apcsu/to_2523introduction.htm

### BeePOS coverage

P10 Category, Assortment & Product Lifecycle.

---

## 6. Oracle Retail Pricing

### Use for

- distinction between regular price changes, clearance markdowns and promotions;
- price-event lifecycle;
- emergency price change;
- promotional mechanics and effective periods.

### References

- Oracle Retail Pricing Cloud latest: https://docs.oracle.com/en/industries/retail/retail-pricing-cloud/latest/
- Pricing introduction: https://docs.oracle.com/en/industries/retail/retail-pricing-cloud/latest/pcsog/introduction.htm
- Clearance overview: https://docs.oracle.com/en/industries/retail/retail-pricing-cloud/latest/rprcl/clearance-overview.htm

### BeePOS coverage

P04 Store-to-Cash and P07 Pricing & Promotion Lifecycle.

---

## 7. Oracle Retail Xstore / Sales Audit

### Use for

- verified vs unverified/blind returns;
- store order pickup;
- store-day concept;
- cashier/register/store balancing;
- missing/duplicate/erroneous/suspicious transaction audit.

### References

- Xstore Point of Service 25: https://docs.oracle.com/en/industries/retail/retail-xstore-point-of-service/25.0/
- Xstore return transactions: https://docs.oracle.com/en/industries/retail/retail-xstore-point-of-service/25.0/rpxug/return-transactions.htm
- Xstore Order Broker pickup flow: https://docs.oracle.com/en/industries/retail/retail-xstore-point-of-service/25.0/rpxmo/order-transactions-order-broker-cloud-service.htm
- Retail Sales Audit: https://docs.oracle.com/en/industries/retail/retail-merchandising-foundation-cloud/latest/rmsoa/sales-audit.htm

### BeePOS coverage

P05 Return-to-Resolution, P06 Shift-to-Reconciliation, P08 Sales-to-Assurance and P15 Omnichannel Order-to-Fulfillment.

---

## 8. Oracle Retail Customer Engagement

### Use for

- points-based loyalty programs;
- award/tender/loyalty program distinction;
- loyalty levels/tiers;
- customer-targeted offers/coupons;
- loyalty performance analysis.

### Verified references

- Customer Engagement latest: https://docs.oracle.com/en/industries/retail/retail-customer-engagement/latest/
- Programs / Loyalty concepts: https://docs.oracle.com/en/industries/retail/retail-customer-engagement/20.4/ceugg/programs.htm

### BeePOS coverage

P12 Customer & Loyalty Lifecycle.

---

## 9. Oracle Retail Order Broker

### Use for

- enterprise inventory availability;
- sourcing/routing orders across locations;
- store fulfillment of omnichannel orders;
- supplier direct fulfillment.

### Verified references

- Retail Order Broker Cloud 21.1: https://docs.oracle.com/en/industries/retail/retail-order-broker-cloud/21.1/
- Xstore Order Broker pickup flow: https://docs.oracle.com/en/industries/retail/retail-xstore-point-of-service/25.0/rpxmo/order-transactions-order-broker-cloud-service.htm

### Key validated business principle

Order Broker's routing engine determines enterprise inventory availability and applies business rules to select fulfillment locations; Store Connect supports store-associate fulfillment of omnichannel orders.

### BeePOS coverage

P15 Omnichannel Order-to-Fulfillment.

---

## 10. SAP S/4HANA Retail Replenishment

### Use for

- store replenishment based on demand, current stock, planned receipts and target stock;
- supplier versus DC source selection;
- replenishment master/policy concepts.

### References

- SAP Replenishment Planning for Stores: https://help.sap.com/docs/SAP_S4HANA_CLOUD_BEST_PRACTICES/213926733b2ca93ae8f209142315cfe1/12648c82fa6746b8b5978e5e565c1124.html

### BeePOS coverage

P03 Replenish-to-Shelf.

---

## 11. SAP Credit Management

### Use for

- B2B creditworthiness checks;
- credit exposure and limit utilization;
- order/delivery blocking;
- credit-manager release/cancel decisions.

### Verified references

- SAP Sales Credit Check Process (S/4HANA 2025 FPS01): https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/7b24a64d9d0941bda1afa753263d9e39/4e63bf186cc943be821bc0b8be3557a6.html
- SAP Financial Operations Credit Check: https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/3cb1182b4a184bdd93f8d62e3f1f0741/811174d486d74c709469ef3d36f9b7bb.html

### BeePOS coverage

P13 Wholesale Order-to-Cash and P16 Finance-Facing Retail Controls.

---

## 12. SAP Last Mile Distribution for Direct Distribution

### Use for

- presales/delivery/van-sales distinction;
- route preparation and assignment;
- route checkout/visits/check-in;
- vehicle/route stock visibility;
- truck-to-truck stock transfer;
- product/payment difference checking;
- final/intermediate route settlement.

### Verified references — S/4HANA 2025 FPS01

- Getting Started with Last Mile Distribution: https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/e322becd165844e5868e590bc8efafaf/7ba9e0272efb4d02bcb8f75970093ca0.html
- Route Preparation: https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/e322becd165844e5868e590bc8efafaf/0b7ed2e3469a41cabaf05322f5a707de.html
- Execution of Van Sales Routes: https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/e322becd165844e5868e590bc8efafaf/966e5a1b8f1d4f828e4a14d0a57875a4.html
- Truck-to-Truck Stock Transfers: https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/e322becd165844e5868e590bc8efafaf/d9a6eff6f9854141857c9c0a1d024be2.html
- Route Settlement: https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/e322becd165844e5868e590bc8efafaf/19729401d8814f1d99afa814cf2f83ab.html
- Settlement of Different Route Types: https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/e322becd165844e5868e590bc8efafaf/7786a46e210047839038d91d75bc8f32.html

### BeePOS coverage

P14 Distribution / Route-to-Settlement.

---

## 13. GS1 standards

### Use for

- product/logistics identification terminology;
- GTIN/barcodes;
- lot/batch/expiry identifiers;
- trading-partner and logistics data exchange;
- retail 2D barcode context.

### Reference

- GS1 standards directory: https://ref.gs1.org/standards/
- 2D Barcodes at Retail POS guideline: https://ref.gs1.org/guidelines/2d-in-retail/

### BeePOS coverage

Supports product, receiving, grocery quality and future master-data process research.

---

## 14. Vietnam-market operational evidence — KiotViet

### Use for

- validating common workflows encountered by Vietnamese SMEs/chains;
- terminology localization;
- purchase ordering/receiving;
- stock count and transfer;
- returns;
- promotion operations.

### References

- Purchase orders: https://www.kiotviet.vn/huong-dan-su-dung-kiotviet/retail-giao-dich/dat-hang-nhap/
- Stock count: https://www.kiotviet.vn/huong-dan-su-dung-kiotviet/retail-hang-hoa/kiem-kho/
- Transfer: https://www.kiotviet.vn/huong-dan-su-dung-kiotviet/retail-hang-hoa/chuyen-hang/
- Returns: https://www.kiotviet.vn/huong-dan-su-dung-kiotviet/retail-tra-hang/tra-hang/
- Promotions: https://www.kiotviet.vn/huong-dan-su-dung-kiotviet/retail-khuyen-mai/khuyen-mai/

### Caution

Vendor workflow is evidence of market practice, not proof that every retailer should use the same policy.

---

## 15. Evidence-strength labels for future research

When adding new business claims, classify evidence mentally as:

### A — Standard / authoritative reference

APQC, SCOR, GS1, law/regulation.

### B — Mature enterprise retail operating reference

Oracle Retail, SAP Retail/Distribution or equivalent detailed enterprise documentation.

### C — Local-market product/workflow evidence

KiotViet, Sapo, MISA or other operational documentation.

### D — Real-retailer evidence

Current SOP, interview, form, observed workflow, audit finding, KPI report.

### E — Hypothesis

Reasonable BA inference not yet externally validated.

For BeePOS, the next maturity step is to add **D — real-retailer evidence**. That is more valuable now than adding more software-vendor feature comparisons.
