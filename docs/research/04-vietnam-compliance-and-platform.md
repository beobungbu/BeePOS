# 04 — Vietnam compliance and POS platform requirements

## 1. Vietnam e-invoice / fiscal boundary

BeePOS targets Vietnamese retail/grocery, so e-invoice support is a product architecture concern rather than a late optional plugin.

Decree 70/2025/NĐ-CP amended Vietnam's e-invoice rules and took effect on 2025-06-01. Government guidance identifies enterprises selling goods/services directly to consumers in areas including shopping centres, supermarkets and retail (with specified vehicle exceptions) among the relevant groups for e-invoices generated from cash registers. Guidance also covers household/individual businesses under statutory conditions.

Primary sources:

- Decree metadata and official attachment: https://chinhphu.vn/?classid=1&docid=213179&orggroupid=2&pageid=27160
- Government summary of cash-register e-invoice scope: https://xaydungchinhsach.chinhphu.vn/mot-so-noi-dung-moi-cua-nghi-dinh-so-70-2025-nd-cp-ve-hoa-don-chung-tu-119250403074719995.htm
- Tax authority Q&A: https://xaydungchinhsach.chinhphu.vn/giai-dap-ve-dang-ky-su-dung-thoi-diem-lap-noi-dung-ghi-tren-hoa-don-dien-tu-khoi-tao-tu-may-tinh-tien-119250814152056721.htm

### Architecture consequence

Do **not** put a vendor SDK/model in the Sales aggregate.

Proposed application port:

```ts
interface FiscalProvider {
  issue(request: FiscalIssueRequest): Promise<FiscalResult>;
  adjust(request: FiscalAdjustRequest): Promise<FiscalResult>;
  replace(request: FiscalReplaceRequest): Promise<FiscalResult>;
  cancel(request: FiscalCancelRequest): Promise<FiscalResult>;
  getStatus(ref: FiscalReference): Promise<FiscalStatus>;
}
```

Possible adapters later:

```text
MISA meInvoice
VNPT
Viettel S-Invoice
FPT / other compliant provider
custom enterprise connector
```

The core stores provider-neutral state plus opaque provider references.

### Fiscal document requirements to preserve in the domain

At minimum research/implementation must account for:

- seller identity/tax information;
- optional/required buyer information based on scenario;
- line description, quantity, unit price and payment amount;
- VAT detail where the seller's tax method requires it;
- invoice issue time;
- tax-authority/provider retrieval data;
- QR/link/electronic delivery to buyer where applicable;
- adjustment/replacement/cancellation lifecycle;
- immutable linkage from fiscal document to retail transaction.

This research note is not legal advice; implementation must be revalidated against current tax regulations and the chosen certified provider before production launch.

## 2. Offline-first is more than local persistence

The prototype's local persistence is useful for UX testing, but production POS needs explicit synchronization semantics.

Target model:

```text
local database
├── server replica/read models
├── locally-created transactions
├── outbox
└── sync cursor
       ↓
Sync Engine
       ↓
Backend canonical services
```

### Operations that should remain possible during a normal network outage

Recommended minimum:

- scan/search cached catalog;
- calculate cached valid price/promotion policy;
- create sale and receipt locally;
- accept cash where business policy permits;
- record tender intent for other methods only when the external provider confirms it can operate offline;
- open/continue an already-authorized shift;
- queue auditable transactions for synchronization.

### Conflict policy must be defined per data type

| Data | Suggested conflict posture |
|---|---|
| completed retail transaction | append-only; idempotent upload |
| inventory movement | append-only; server validates ordering/idempotency |
| product master | server-authoritative, versioned cache |
| price book | server-authoritative, versioned with validity window |
| promotion | server-authoritative, versioned with validity window |
| customer profile | merge/version policy required |
| shift/till state | register-scoped ownership to reduce conflict |

### Required identifiers

Every offline-creatable transaction needs globally unique client-generated identity and idempotency metadata. Avoid server-sequence IDs as the only identity mechanism.

## 3. Hardware/peripheral abstraction

BeePOS production targets should assume these device classes exist even when a customer does not use all of them:

```text
barcode scanner
2D imager / camera scanner
receipt printer
label printer
cash drawer
customer display
weighing scale
payment terminal
NFC / QR payment device
```

Proposed ports:

```text
ScannerPort
PrinterPort
CashDrawerPort
ScalePort
CustomerDisplayPort
PaymentTerminalPort
```

Implementation adapters can vary by platform:

```text
Web: keyboard wedge, WebUSB/WebSerial where appropriate, network bridge
Android: USB/Bluetooth/vendor SDK
IOS: supported Bluetooth/network/vendor SDK
```

Do not allow ESC/POS commands or one printer vendor's types to appear in Sales/Receipt domain models.

## 4. Barcode/GS1 readiness

GS1's 2D Retail POS guideline (release 1.1.0, ratified Dec 2025) documents a transition toward richer 2D codes. Supported information can include GTIN plus batch/lot, expiry and variable-measure values.

Reference: https://ref.gs1.org/guidelines/2d-in-retail/

BeePOS scanner output should therefore be represented as parsed observations rather than a raw string assumption:

```text
ScanResult
├── symbology
├── rawValue
├── gtin?
├── lot?
├── expiry?
├── serial?
├── quantity/weight?
├── embeddedPrice?
└── additionalFields
```

A resolver then maps the scan to a SKU/UOM/lot/price scenario under store policy.

## 5. Security and controls

Minimum production concerns:

- password/account authentication separate from fast cashier PIN unlock;
- unique cashier PIN within an organization;
- register/device enrollment;
- route and action-level permission checks;
- re-auth/manager override for sensitive actions;
- immutable audit record for price override, manual discount, void, refund, cash movement, stock adjustment, user/permission change and settings changes;
- session timeout and till lock;
- tenant isolation at repository/query level, not only UI filters;
- no card PAN storage in BeePOS unless the product deliberately enters PCI DSS scope.

## 6. Integration boundary

Recommended integration contracts:

```text
FiscalProvider
PaymentProvider
AccountingConnector
CommerceConnector
IdentityProvider (future/enterprise)
NotificationProvider
Peripheral adapters
```

Internal canonical models should be stable even when customers choose different vendors.
