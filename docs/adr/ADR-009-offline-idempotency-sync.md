# ADR-009 — Offline identity, idempotency and synchronization contract

- Status: Proposed
- Date: 2026-09-13
- Related issue: #9
- Parent: #2

## Context

BeePOS currently persists data locally, which is useful but is not yet a production offline architecture. Real POS writes may be retried after timeouts, created while disconnected and synchronized later. Financial, inventory, loyalty and fiscal side effects must never be duplicated simply because transport state is uncertain.

## Decision

### 1. Offline-capable business records receive stable client-generated IDs

For records allowed to originate offline, the creator assigns the final BeePOS business ID before server synchronization. The server does not replace it with a new identity on acceptance.

Preferred implementation direction: UUIDv7 (or an equivalently globally unique, sortable standard supported consistently by the selected runtime/database). The exact library is an implementation choice; the invariant is globally unique stable identity without contacting the server.

Provider/external IDs never replace BeePOS IDs.

### 2. Every retryable side-effect command has an idempotency key

Commands that can create money, stock, fiscal, loyalty or other durable side effects carry:

- `commandId` / idempotency key;
- organization scope;
- actor/register context as relevant;
- stable target/source IDs;
- expected aggregate version/precondition when required.

Server persistence enforces uniqueness at the appropriate organization/command scope and returns the original accepted result for safe replay where possible.

### 3. Client uses an outbox for offline writes

Local durable workflow:

```text
user/domain action
  ↓
local transaction: business record + outbox command/event
  ↓
UI reads local state
  ↓
background/foreground sync sends outbox
  ↓
server accepts/rejects/conflicts
  ↓
local sync state/checkpoint updates
```

Do not rely on an in-memory request queue.

### 4. Synchronization state is explicit

Local records/commands can expose states such as:

- pending;
- syncing;
- synced;
- conflict;
- rejected;
- retryable_error.

These are synchronization states, not business statuses. A paid sale can be business-finalized locally while its server synchronization is still pending, if the operation is permitted offline.

### 5. Conflict policy is bounded-context-specific

No global last-write-wins policy.

Recommended categories:

- **append-only events** (finalized transaction, inventory posting command, cash movement): deduplicate/reject invalid precondition; never merge fields;
- **master data** (description/settings): optimistic version check, explicit conflict or configured server/admin policy;
- **derived/read models**: rebuild/reconcile from canonical server events;
- **reference data distributed to POS** (price/promotion/catalog): versioned snapshots with explicit stale-data policy.

### 6. Offline sales use a reference-data snapshot/version

An offline register records the catalog/pricing/promotion/tax reference versions or sufficient provenance used to finalize the sale. When reconnecting, the server must not silently re-price a locally finalized permitted sale.

If business policy disallows stale pricing beyond a threshold, POS must warn/block according to a configured freshness rule before finalization; it cannot discover the problem later and mutate the receipt.

### 7. P1 offline capability is deliberately bounded

Recommended P1 offline-allowed operations:

- scan/search from locally cached catalog;
- cart operations;
- cash sale finalization using accepted cached reference data;
- local receipt rendering;
- shift/cash events when register trust is valid;
- queue inventory effects derived from finalized local sales/returns allowed by policy.

Require online or explicitly restrict in P1 when authoritative remote validation is necessary, including potentially:

- some card/bank-provider authorizations;
- first-time e-invoice provider issuance if no legal offline queue flow is supported;
- account/password administration;
- high-risk refunds/overrides outside cached authority;
- limited-use coupon/loyalty operations that cannot be safely reserved/deduplicated.

Exact operation matrix becomes implementation configuration/tests, but unsupported offline actions must fail clearly rather than pretend success.

### 8. Receipt/display numbering is separate from primary ID

Offline transactions use stable BeePOS IDs. Human receipt numbering must have an offline-safe allocation strategy (for example register-scoped number sequences/ranges) if sequential display numbers are required. Fiscal invoice numbering follows the fiscal-provider/legal design and is not reused as the transaction primary key.

### 9. Payments and fiscal calls require stronger duplicate prevention

For provider calls:

- BeePOS sends a stable merchant/reference/idempotency value where provider supports it;
- stores request/result/provider reference state;
- uncertain outcome is represented explicitly and reconciled before retry patterns that could double charge/issue;
- callbacks are deduplicated by provider event/reference IDs.

## Invariants

- offline-created business identity never changes after sync;
- replay of an accepted idempotent command cannot create a second durable side effect;
- finalized local sales are never silently re-priced by server sync;
- conflict handling is explicit by domain type;
- outbox survives app process restart;
- provider timeout/unknown state is not treated as definite failure without reconciliation policy.

## Current-prototype migration

- existing local persistence remains useful as a UX prototype but should evolve toward durable local records + outbox rather than serialized zustand state as source of truth;
- current IDs must be audited for offline-safe uniqueness;
- API boundaries, when introduced, must accept client-generated IDs/idempotency keys from the start;
- domain commands should gain explicit context/version/idempotency rather than letting data stores invent retry behavior.

## Deferred

- multi-master collaborative editing;
- peer-to-peer register synchronization;
- CRDT-based master data;
- indefinite fully disconnected operation for all payment/fiscal features.

## Validation examples

1. POS finalizes a cash sale offline, app restarts, reconnects and syncs it exactly once.
2. HTTP timeout occurs after server accepted a sale; retry with the same idempotency key returns the accepted result without a duplicate transaction/movement.
3. HQ changed price while register was offline; an already-finalized allowed local sale keeps its captured price, while freshness policy controls future offline sales.
4. Payment provider returns an uncertain timeout; BeePOS records `unknown/pending reconciliation` instead of blindly creating a second charge.
