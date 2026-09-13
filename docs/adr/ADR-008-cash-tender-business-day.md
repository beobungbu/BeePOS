# ADR-008 — Register shifts, cash movements, tender reconciliation and business day

- Status: Proposed
- Date: 2026-09-13
- Related issue: #11
- Parent: #2

## Context

The prototype already supports opening/closing Shift and expected/closing cash. Production store control needs an explainable till history, paid-in/out, non-cash tender reconciliation, register ownership and day-close semantics. These are financial-control events and must not be inferred later only from order totals.

## Decision

### 1. RegisterSession/Shift is tied to one register and responsible employee

A shift records:

```text
Shift
  id
  organizationId
  storeId
  registerId
  employeeId
  businessDate
  openedAt
  closedAt?
  openingCash
  status
```

P1 permits one active cashier shift per register at a time. Handoff closes/locks the current employee context according to workflow; the physical Register identity remains stable.

### 2. Tender settlement is separate from commercial transaction totals

RetailTransaction says what the customer owes. Tender records how value was settled.

```text
TenderTransaction
  id
  organizationId/storeId/registerId/shiftId
  retailTransactionId?
  method
  amount
  direction: IN | OUT
  providerReference?
  status
  occurredAt
```

Cash, card, transfer and points may use different reconciliation mechanisms but share explainable settlement linkage.

### 3. CashMovement records non-sale cash changes

P1 movement types include:

- opening float;
- paid in;
- paid out;
- safe drop/cash pickup;
- cash refund when not already represented solely through linked tender transaction;
- correction with authorization.

Every manual cash movement requires amount, reason, actor and audit event. Sensitive movement types require permission and may later require approval.

### 4. Expected cash is a deterministic projection

For a shift:

```text
expectedCash = openingCash
             + cash tender inflows
             - cash tender outflows/refunds
             + paidIn
             - paidOut
             - safeDrop
             ± explicit cash corrections
```

Implementation must define each movement type's sign/effect exactly once. Closing count does not overwrite expected cash.

```text
cashDifference = countedClosingCash - expectedCash
```

Difference and reason/approval remain historical facts.

### 5. Non-cash tender reconciliation is explicit

For card/bank transfer/provider-backed tenders, BeePOS stores provider/reference/status data required to compare POS-recorded tender with provider settlement/reconciliation later.

P1 may keep reconciliation UI simple, but the domain must not assume all non-cash payments are final merely because a cart was closed.

### 6. BusinessDate is explicit and separate from calendar timestamp

A store has a business-day policy/timezone. Each finalized POS financial event stores both an absolute timestamp and `businessDate`.

Transactions after midnight may belong to the previous business date until the configured operational cutoff/day-close policy. Reporting/Z report groups by stored businessDate rather than recomputing later from current settings.

### 7. Z report/day close is an immutable close summary

A Z report (or equivalent BusinessDayClose) references the store/register/businessDate scope and reconciles:

- transaction counts/totals;
- tender totals by method;
- cash movements;
- expected/count/difference data from closed shifts;
- relevant exception counts.

After finalization it is immutable. Later corrections appear as subsequent adjustment/correction records rather than rewriting the closed report.

P1 may close per register and provide a store-level aggregation read model.

### 8. Retry safety

Tender recording and cash movement creation require stable IDs/idempotency. A payment timeout/retry must not duplicate settlement. Provider callbacks/webhooks must also have provider-event idempotency where used.

## Invariants

- no more than one active shift per register in P1;
- manual cash movement always has an actor and reason;
- counted cash never overwrites expected cash;
- cash difference is preserved/audited;
- financial events store immutable businessDate after finalization;
- retries cannot duplicate tender/cash effects;
- Z/day-close summary is reproducible from source events/read models at the close boundary.

## Current-prototype migration

- existing Shift fields remain useful but gain organization/register/businessDate and explicit movement linkage;
- `expectedCash` becomes a projection/result rather than freely mutable state;
- add CashMovement and TenderTransaction concepts;
- current Order.payments map into tender records/snapshots while keeping UI compatibility;
- Reports should eventually consume business-date/tender projections rather than derive all values ad hoc from current Order arrays.

## Deferred

- bank acquiring settlement file import;
- automatic safe/cash-office workflows;
- multi-currency tills;
- cash drawer hardware enforcement;
- full accounting posting to GL.

## Validation examples

1. Opening 1,000,000 + cash sales 500,000 - paid-out 100,000 - safe drop 300,000 gives expected 1,100,000.
2. Counted 1,090,000 records -10,000 difference; it does not mutate sales.
3. A card payment retry records one tender due to idempotency.
4. A 00:30 transaction can remain on the configured prior businessDate and later reports reproduce that choice.
