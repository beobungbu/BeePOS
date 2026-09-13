# H2 closed: the last 15 seed reads now go through the org store

Date: 2026-09-13 · Worker: H2 follow-up · Plan: 260913-1115-beepos-commerce-program

## What was wrong

Fifteen screens still imported `stores`, `staff` or `organization` from `src/data/seed`, which
is the demo chain and only the demo chain. An owner signed into `chuoi-demo-2` saw four Tạp hoá
branches in the scope pickers, the demo roster in every sales-rep select, and a VAT invoice
headed with the demo chain's name and MST. The six screens that can *write* a document to a
branch were fixed in the review wave; these were the read-only name lookups left behind.

## What changed

Every seed read became a selector on the chain the process is signed into
(`useOrgStore((state) => state.stores | state.staff | state.organization)`).

| File | Read | Note |
|---|---|---|
| `inventory/counts-list-screen.tsx` | stores | module-level `storeName` moved into the component |
| `inventory/transfers-list-screen.tsx` | stores | same |
| `inventory/receipts-list-screen.tsx` | stores | same, as an arrow beside `supplierName` |
| `inventory/purchase-orders-list-screen.tsx` | stores | same |
| `inventory/supplier-returns-list-screen.tsx` | stores | same |
| `inventory/inventory-screen.tsx` | stores | `allStores` added to the `buildStockRows` memo deps |
| `inventory/expiring-screen.tsx` | stores | merged into the existing `org-store` import |
| `products/product-stock-table.tsx` | stores | |
| `products/components/product-lots-section.tsx` | stores | |
| `orders/screens/orders-list-screen.tsx` | stores, staff | filter bar and CSV cashier column |
| `orders/screens/order-detail-screen.tsx` | stores, staff | |
| `orders/screens/vat-invoice-screen.tsx` | stores, staff, organization | seller block |
| `pos/components/cart-panel.tsx` | staff | sales-rep select |
| `customers/screens/customers-list-screen.tsx` | staff | |
| `customers/screens/customer-detail-screen.tsx` | staff | |

Two details worth naming:

- **Empty-chain safety.** Three screens seeded their default scope from `allStores[0].id`, which
  is a crash the moment the list is empty. They now read `allStores[0]?.id` with a fallback
  (`'all'` on the inventory screen, `''` elsewhere), matching what `receipt-detail-screen`
  already does.
- **A nullable chain on the invoice.** `useOrgStore().organization` is `Organization | null`
  (null only before onboarding, which no signed-in route reaches), so the VAT screen derives
  `sellerName` once and reads `organization?.taxCode`. The existing rule still holds: a chain
  with no MST prints no seller tax-code row rather than a blank one.

Behaviour on the demo chain is unchanged: the org store starts from the same seed arrays for
`chuoi-demo`, so every name, label and E2E selector reads exactly as before.

## Test

`src/features/__tests__/org-scoped-reads.test.tsx` renders `ProductStockTable` with the second
chain's seed loaded into the org store and asserts the table names `Minh Châu Quận 7` and none
of the demo-chain-only names (the four Tạp hoá branches and every staff name except the owner's,
who is deliberately the same person in both chains).

Verified as a real guard, not a passing shape: reverting `product-stock-table.tsx` to the seed
import makes it fail, and it passes again on restore.

The UI kit ships ESM that the `jest-expo` preset does not transform, so the test stubs
`@beemvp/beeui-ui` with RN primitives. The component, its store reads and its row mapping stay
real; only the kit's own rendering is replaced. Changing the shared jest `transformIgnorePatterns`
would have been the alternative, and that config belongs to nobody in this wave.

## Checks

- `npx tsc --noEmit`: clean.
- `npm test`: 51 suites, 700 tests, all pass.
- `npx eslint src app`: 0 errors, 0 warnings.
- Grep, the acceptance one:

  ```
  grep -rn "from '.*seed'" src app --include='*.ts' --include='*.tsx' \
    | grep -v "^src/data/seed/" \
    | grep -E "\b(stores|staff|organization|registers|accounts|memberships)\b"
  ```

  Two hits, both legitimate: `src/domain/__tests__/auth.test.ts` (a test) and
  `src/data/org-settings-store.ts`, which seeds `memberships` and `orgDirectory`. Those two are
  cross-chain by design: the directory answers "which chains does this login belong to", so it
  has to hold both. No file under `src/features` or `app` reads an org-scoped list from the seed.

## Not done here

- No visual pass on the second chain. Metro was shared with two other workers this wave, and the
  render test plus the typecheck cover the swap. Worth one look when the chain-2 polish lands.
- The scoping rule is guarded by one render test, not a source scan. A scan would need `fs`,
  and `tsconfig.json` sets `types: ["jest"]` with no node types, so it will not typecheck
  without touching shared config.
