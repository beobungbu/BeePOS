# ADR-010 — Vietnam fiscal/e-invoice provider boundary

- Status: Proposed
- Date: 2026-09-13
- Related issue: #8
- Parent: #2

## Context

BeePOS targets Vietnamese retail. E-invoice/fiscal behavior is therefore a production concern, but the retail core must not become coupled to one commercial provider SDK or duplicate mutable catalog data when issuing documents.

The research baseline records current Vietnam compliance context, including Decree 70/2025/NĐ-CP and e-invoice-from-cash-register requirements for applicable direct-to-consumer business activities. Legal/provider details can evolve and must be verified during implementation.

## Decision

### 1. Fiscal is a separate bounded context downstream of commercial transactions

`RetailTransaction` is the canonical commercial snapshot. Fiscal creates/maintains legal/fiscal document state referencing that immutable source.

Core concepts:

```text
FiscalDocument
  id
  organizationId
  storeId
  retailTransactionId
  documentType
  status
  issuedAt?
  providerKey
  providerDocumentId?
  providerSeries/number?
  requestFingerprint/idempotencyKey
  sourceSnapshotVersion/reference
  error/reconciliation state

FiscalOperation
  id
  fiscalDocumentId
  type: ISSUE | ADJUST | REPLACE | CANCEL | QUERY_STATUS | ...
  status
  providerReference?
  idempotencyKey
  requestedAt/completedAt?
```

Fiscal document line/body payload is generated from the finalized RetailTransaction snapshot plus legally required seller/buyer/fiscal configuration, not current Product/PriceBook state.

### 2. Provider integration is a port/adapter

Define a provider-neutral application port conceptually equivalent to:

```text
FiscalProvider
  issue(input, idempotencyContext)
  adjust(input, idempotencyContext)
  replace(input, idempotencyContext)
  cancel(input, idempotencyContext)
  getStatus(reference)
```

The final TypeScript interface can differ, but vendor-specific request/response types must stop at the adapter boundary.

Potential providers (MISA, VNPT, Viettel, FPT, etc.) are adapters selected/configured per organization or legal entity. No provider is canonical at the domain level.

### 3. Normalize provider states; retain provider evidence

BeePOS maintains its own normalized status such as:

- not_requested;
- pending;
- issued;
- rejected;
- uncertain/reconciliation_required;
- adjusted/replaced/cancelled as legally applicable.

Raw provider IDs/error codes/request-response evidence needed for support/reconciliation may be retained in a secure integration record, but domain workflows consume normalized status/error categories.

### 4. Fiscal issuance is idempotent

Every issue/adjust/replace/cancel operation has stable operation identity/idempotency. Provider calls use a stable external reference when supported.

On timeout/unknown result:

- do not assume failure;
- persist `uncertain`/pending reconciliation;
- query/reconcile provider state before attempting a potentially duplicating operation where provider guarantees are insufficient.

### 5. POS sale finalization and fiscal availability are separate states

A RetailTransaction can be commercially finalized before provider acknowledgement when legal/product policy permits queued issuance. BeePOS must clearly represent:

```text
sale: finalized
fiscal: pending / issued / failed / reconciliation_required
```

The implementation/compliance track must decide which transaction/customer scenarios can legally queue versus require immediate online issuance. The domain does not fake an `issued` invoice while offline.

### 6. Corrections do not mutate original fiscal history

Adjustment/replacement/cancellation workflows create linked FiscalOperation/FiscalDocument history. The original commercial/fiscal evidence remains traceable.

A customer return does not blindly call `cancel(original invoice)`; mapping depends on transaction/fiscal circumstances and current legal/provider rules. Application services own that policy using the stored original transaction/fiscal references.

### 7. Fiscal configuration is scoped

Seller legal/tax configuration belongs to the organization/legal profile with store-level fields only where legally/operationally required. Provider credentials/secrets are server-side secure configuration and never synchronized into generic POS client state.

### 8. Compliance rules are versioned assumptions

Implementation must cite and record the legal/provider rule set being implemented. Compliance logic likely to change is isolated behind explicit policy/configuration rather than spread through POS UI/domain functions.

## Invariants

- provider SDK/types do not leak into Sales domain;
- invoice payload commercial lines come from finalized transaction snapshots;
- retries cannot silently duplicate fiscal documents;
- unknown provider outcome remains explicit until reconciled;
- secrets never live in client domain state/audit payloads;
- fiscal corrections preserve traceability to prior documents/operations.

## Current-prototype migration

- existing receipt remains a commercial receipt view, not proof that an e-invoice has been issued;
- checkout/receipt UI later gains fiscal status/action read models;
- Settings should reference fiscal profile/provider configuration without exposing provider secrets;
- current VietQR/payment concerns remain separate from fiscal/e-invoice integration.

## Deferred

- selecting the first commercial provider;
- exact provider SDK/API mapping;
- full legal edge-case matrix;
- accounting/general-ledger integration;
- automatic tax filing/reporting beyond required invoice integration.

## Validation examples

1. Provider times out after receiving an issue request; BeePOS records uncertain state and reconciles rather than issuing a duplicate.
2. Product description changes after sale; invoice retry still uses the original transaction snapshot.
3. Changing from Provider A to Provider B does not change Sales/Inventory domain types.
4. Receipt screen can show “invoice pending” without changing the sale from paid/finalized back to an open cart.
