# ADR-002 — Organization, identity, store and register boundaries

- Status: Proposed
- Date: 2026-09-13
- Related issue: #7
- Parent: #2

## Context

The prototype currently combines authentication identity, staff profile and store assignment in `Staff`, and treats store selection plus PIN as the main session model. Production BeePOS needs strict tenant isolation, real accounts, multi-store employees, physical registers and fast cashier handoff without conflating these concepts.

## Decision

### 1. Organization is the tenant boundary

`Organization` is the top-level security and ownership boundary for retail data. Every tenant-owned aggregate carries `organizationId` directly or inherits it through a server-validated parent relation. Server-side authorization must always scope by organization; client-side filtering is not a security boundary.

Initial production BeePOS supports one active organization per authenticated session. The data model must not prevent a future account from belonging to several organizations.

### 2. Authentication identity and employee identity are separate

Use:

```text
UserAccount
  id
  email
  auth status
  credentials / external auth references

Employee
  id
  organizationId
  displayName
  employment status
  PIN credential/reference

OrganizationMembership
  organizationId
  userAccountId
  employeeId
  status
```

A `UserAccount` proves who can authenticate. `Employee` represents the person acting inside one organization. Their lifecycle can differ: invited accounts, disabled employees, re-hired employees and future multi-org membership must not require rewriting transaction history.

### 3. Store is a business location; Register is a POS workstation

```text
Organization
  └─ Store
      └─ Register
```

`Register` has stable identity, store assignment, status and device/enrollment metadata. Historical transactions keep their original `storeId` and `registerId` even if a physical device is later replaced.

A register may be disabled/replaced. Moving a register between stores is an administrative operation with audit history; historical records are never re-parented.

### 4. Employee store assignment is many-to-many

An employee may be assigned to several stores. Access is the intersection of:

- organization membership;
- role/permission grants;
- store assignment/scope;
- action-specific policy.

Owner/chain-level roles may have all-store scope without enumerating every store membership row.

### 5. PIN is fast operational re-authentication, not primary account authentication

Email/password or another real account mechanism establishes trusted device/session access. A staff PIN is then used for quick cashier handoff/unlock on an enrolled register.

PIN requirements:

- unique enough within an organization to identify the employee for fast handoff;
- stored as a salted/slow hash or delegated to secure server verification;
- rate-limited and lockable;
- never a cross-organization/global identifier;
- never copied into audit logs.

A register lock does not destroy the authenticated device enrollment; it removes the active employee context until re-unlocked.

### 6. Shift/RegisterSession is operational state

A `Shift` or `RegisterSession` references:

- organizationId
- storeId
- registerId
- employeeId
- openedAt / closedAt
- businessDate

It is not the authentication session itself.

### 7. Configuration has explicit scope and inheritance

Configuration may exist at:

1. organization default;
2. store override;
3. register override only for hardware/device concerns.

Examples:

- currency, default tax profile, loyalty policy: organization;
- receipt header, opening hours, local invoice configuration: store;
- printer/scanner/customer-display configuration: register/device.

Resolution is deterministic: register override → store override → organization default, only for settings whose schema permits those scopes.

## Invariants

- every Store belongs to exactly one Organization;
- every Register belongs to exactly one active Store at a point in time;
- every Employee belongs to exactly one Organization in the P1 model;
- transaction history stores immutable organization/store/register/employee references;
- tenant authorization is server-enforced;
- a disabled employee cannot start a new operational session, but historical references remain valid;
- a PIN never replaces primary account authentication for administrative access.

## Current-prototype migration

- existing `Store` gains `organizationId`;
- existing `Staff` is split logically into Employee + account/membership information;
- current staff `storeIds[]` becomes EmployeeStoreAssignment or equivalent scoped grant;
- introduce `Register`; current selected store alone is insufficient session context;
- current `session-store` evolves to carry account + organization + store + register + active employee contexts separately;
- current seeded demo may use a compatibility adapter while feature screens migrate.

## Deferred

- user switching between multiple organizations in UI;
- complex corporate/business-unit hierarchy above/below stores;
- enterprise SSO/SCIM;
- workforce HR/timekeeping beyond POS operational shifts.

The model must remain compatible with those additions without implementing them in P1.

## Consequences

Positive: clear tenant isolation, auditable register identity, proper account lifecycle, multi-store staffing and safe cashier handoff.

Cost: current Staff/session types require migration and more explicit context propagation through domain commands.

## Validation examples

1. One owner account can administer all stores; a cashier assigned to HN01 cannot mutate HN02 inventory.
2. A shared register can be locked by Cashier A and unlocked by Cashier B without changing the register identity.
3. Replacing a physical tablet does not rewrite historical register references.
4. Disabling an employee blocks new actions but old receipts still display the historical cashier.
5. A request that supplies another organizationId is rejected even if the client UI was manipulated.
