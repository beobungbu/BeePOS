# Phase 02 - Products, categories, inventory report

Status: DONE
Summary: All 7 screens (products list/form/categories, inventory home, receipts,
transfers, counts) implemented against BeeUI 0.86.2-rc.1, typecheck/tests/export green,
28 screenshots at 390+1280 captured, and receipt/transfer/count flows verified end to
end through real UI interaction with before/after store-state evidence.

## What was done

### Domain (src/domain/catalog.ts, src/domain/inventory.ts)
- `catalog.ts`: `isValidEan13` (checksum validation), `nextSku` (PREFIX-NNN suggestion),
  `marginPercent` (percent of sale price, rounded to 1 decimal).
- `inventory.ts`: `availableQty`, `stockStatus` (out/low/ok), `lowStock`, `applyMovement`
  (pure, clamped-at-0 stock delta), `receiptTotals`, `transferTransition` (draft->sent->received
  state machine, throws on invalid transitions), `countVariance`. Also exports the
  `StockMovement`/`StockMovementInput` types used by the inventory store's movement log.
- 29 unit test cases across `src/domain/__tests__/catalog.test.ts` (9 cases) and
  `src/domain/__tests__/inventory.test.ts` (20 cases) - exceeds the >=20 acceptance bar on
  its own; combined with the rest of the suite, `npx jest` is 140/140 green.

### Stores (kept exported names/signatures stable for pos/orders consumers)
- `src/data/catalog-store.ts`: kept `products`, `categories`, `upsertProduct`,
  `setProductActive`, `upsertCategory`; added `removeProduct`, `removeCategory`,
  `upsertVariant`, `removeVariant`.
- `src/data/inventory-store.ts`: kept `stockLevels`, `goodsReceipts`, `stockTransfers`,
  `stockCounts`, `adjustStock(productId, storeId, delta)`, `upsertGoodsReceipt`,
  `upsertStockTransfer`, `upsertStockCount`. `adjustStock` gained an *optional* 4th
  `reason` param (backward compatible for any existing 3-arg caller). Added `movements`
  (chronological log), `setMinLevel`, `receiveGoodsReceipt` (bumps on-hand at the
  receipt's store, logs a movement per line), `sendTransfer` (source on-hand -= qty,
  destination reserved += qty), `receiveTransfer` (destination reserved -= qty, on-hand +=
  qty), `postStockCount` (sets on-hand = counted per line, logs the variance as a movement).

### Screens
- `/products`: BeeUI `Table` (wide, sortable name/sku/cost/sale/stock via caller-owned
  sort state per ADR-007, 20/page `Pagination`) or `ListGroup`/`ListItem` cards (narrow);
  toolbar `SearchInput` + category `Select` + status `SegmentedControl`; row `Switch` +
  `DropdownMenu` (Sửa/Ngừng bán/Xoá); `EmptyState` for empty/no-results; `AlertDialog`
  delete confirm.
- `/products/new`, `/products/[id]`: `Field`+`Input`/`Select`/`Textarea`/`Switch` form;
  SKU auto-suggest button (domain `nextSku`); barcode `FormMessage` error from
  `isValidEan13`; live margin `HelperText` from `marginPercent`; `Collapsible` variants
  section (add/edit/remove); read-only per-store stock `Table` with inline-editable
  `minLevel`; unsaved-changes `AlertDialog` guard wired to expo-router's `beforeRemove`
  navigation event; delete `AlertDialog`; save -> `useToast()`.
- `/products/categories`: 2-level `Accordion` tree, product count per category, inline
  `Dialog` for add/rename/delete (top-level categories and subcategories).
- `/inventory`: store `Select` (+"Tất cả" for owner/manager), `AlertBanner` low-stock
  count, `Stat` row (SKU count, tổng tồn giá vốn, sắp hết, hết hàng), `Tabs` (Tồn kho /
  Sắp hết), row `DropdownMenu` (điều chỉnh nhanh `Dialog`, xem lịch sử `Timeline`).
- `/inventory/receipts` (+`[id]`, `new`): list + create/view; supplier + store `Select`;
  line editor with a shared `ProductPicker` `Dialog` (search-to-add); Lưu nháp /
  Nhận hàng (`AlertDialog` confirm) -> `receiveGoodsReceipt`.
- `/inventory/transfers` (+`[id]`, `new`): from/to store `Select`s with same-store
  `FormMessage` validation; `Stepper` (Nháp/Đã gửi/Đã nhận) driven by transfer status;
  Gửi hàng -> `sendTransfer`, Nhận hàng -> `receiveTransfer`.
- `/inventory/counts` (+`[id]`, `new`): store + optional category scope, "Tạo dòng kiểm
  kê" generates lines from current stock (`expected`=onHand, `counted` editable numeric
  `Input`), `Badge` variance column, Ghi nhận (`AlertDialog` confirm) -> `postStockCount`.

Navigation: added a "Danh mục sản phẩm" button on `/products` and a Nhập hàng/Chuyển
kho/Kiểm kê quick-link row on `/inventory`, since `nav-items.ts` (phase-0-owned, not
touched) only declares top-level areas - these sub-routes need an in-app entry point.

### i18n
`src/i18n/products.vi.ts`/`.en.ts`, `src/i18n/inventory.vi.ts`/`.en.ts` registered via
`registerDictionary`. Merge point `src/i18n/index.ts`: added the 4 import lines: already
present in the current HEAD commit (`7b4ebdb`, phase-04's commit) because the shared file
was edited by me first and phase-04 committed the file's current state as part of their
own commit before I got to mine - functionally correct (all namespaces load), no action
needed from this phase's commit.

### Type augmentation (deviation, documented)
`src/domain/types.ts#Product` (phase-0-owned) has no `description` field, but
`docs/product-spec.md`'s own screen inventory requires a "mô tả Textarea" on the product
form. Rather than edit the phase-0-owned file, added
`src/features/products/product-type-augment.d.ts`, a TypeScript module augmentation that
adds `description?: string` to `Product` program-wide without touching `domain/types.ts`.
Safe (widens only, never narrows); flagged here since it's a real deviation from "don't
touch other phases' files," resolved via TS's own declaration-merging feature rather than
an edit.

## BeeUI findings

5 findings logged in `docs/beeui-audit/findings-02-products-inventory.md`:
- 02-01 (minor, docs-public): `TimelineStatus`'s union isn't documented on the Timeline
  page; discovered via the sanctioned tsc-probe method.
- 02-02 (minor, a11y): `Field`'s label element duplicates the control's `aria-label`,
  making `getByLabel`-style accessible-name queries ambiguous (2 matches).
- 02-03 (nit, docs-public): `Accordion` has no shadcn-familiar `type` prop; single-open
  only, selected via `value`'s `string | null` shape.
- 02-04 (minor, gap): `TableRow`/`TableCell` have no `onPress`; row-to-detail navigation
  needs a caller-owned `Pressable` wrapped around one cell's content.
- 02-05 (minor, component-behavior): generalizes findings-00-05's nested-pressable pitfall
  beyond `DropdownMenuTrigger`+`IconButton` to any pressable-row + interactive-trailing-slot
  composition (e.g. `ListItem` + `Switch`); worked around by keeping pressable-row
  trailing/leading slots read-only (`Badge`) everywhere in this phase.

## Verification evidence

### `npx tsc --noEmit` (via `npm run typecheck`)
```
> beepos@0.1.0 typecheck
> npm run uniwind:types && tsc --noEmit
[Uniwind] Artifacts generated
```
Zero errors, zero output from `tsc` itself.

### `npm test` (`npx jest`)
```
Test Suites: 8 passed, 8 total
Tests:       140 passed, 140 total
```
(8 suites include this phase's 2 plus 6 from parallel phases sharing the tree; my 2 suites
alone are 29/29.)

### `npx expo export --platform web --output-dir dist-phase02`
```
web bundles (2):
_expo/static/css/global-05d1bedcd0c9a5a01e7727173c19cbd3.css (40KB)
_expo/static/js/web/entry-0d1be97097ad1abccda7c6e9df144418.js (3.2MB)
Exported: dist-phase02
```
Succeeded (not committed - build output, matches `.gitignore`'s `dist*` pattern).

### Playwright/Chromium screenshots (28 files in `docs/screenshots/phase-02-*.png`)
Dev server: `npx expo start --web --port 8092`. Both viewports (1280, 390) driven through
real login (`HN01` + PIN `1234`) -> store select -> in-app navigation (no `page.goto` to
authenticated routes - that reloads the SPA and drops the in-memory session, learned the
hard way mid-script). Captured: products list light+dark, product new-form, EAN-13
checksum error state, product detail, categories tree, inventory home light+dark,
receipts list + new, transfers list + new, counts list + new, at both viewports.
`CONSOLE_ERRORS_COUNT: 0` across the entire run (`page.on('console'/'pageerror')`).

### Functional verification: UI action -> store state (the acceptance line's explicit ask)
Separate Playwright script drove full flows and read the resulting numbers back out of
the rendered tables (not just "it didn't crash"):
```
DU-001 onHand before receipt: 23
DU-001 onHand after receipt: 73   expected: 73        (goods receipt, qty 50, "Nhận hàng")
Transfer shows "Đã gửi" after send: true               (Cầu Giấy -> Bình Thạnh, qty 5)
Transfer shows "Đã nhận" after receive: true            (full draft -> sent -> received cycle)
Count shows "Đã ghi nhận" after posting, variance +3 applied: true
```
The transfer test intentionally used a from/to store pair (Cầu Giấy -> Bình Thạnh) absent
from the seed data, since the seeded transfers and my early row-matching attempts collided
on shared store names otherwise (see findings note below - not a BeeUI issue, a test-script
bug I found and fixed, not logged to the audit file).

## Files touched (owned paths only)

- `app/(app)/products/index.tsx` (rewritten from placeholder), `new.tsx`, `[id].tsx`,
  `categories.tsx`
- `app/(app)/inventory/index.tsx` (rewritten), `receipts/index.tsx`, `receipts/new.tsx`,
  `receipts/[id].tsx`, `transfers/index.tsx`, `transfers/new.tsx`, `transfers/[id].tsx`,
  `counts/index.tsx`, `counts/new.tsx`, `counts/[id].tsx`
- `src/domain/catalog.ts`, `src/domain/inventory.ts`,
  `src/domain/__tests__/catalog.test.ts`, `src/domain/__tests__/inventory.test.ts`
- `src/data/catalog-store.ts`, `src/data/inventory-store.ts`
- `src/features/products/**` (13 files: hooks, list/form/categories screens + subcomponents,
  the type-augment .d.ts), `src/features/inventory/**` (13 files: hooks, main/receipts/
  transfers/counts screens + shared line-editor/product-picker/adjust/history components)
- `src/i18n/products.vi.ts`, `products.en.ts`, `inventory.vi.ts`, `inventory.en.ts`
- `docs/beeui-audit/findings-02-products-inventory.md`
- `docs/screenshots/phase-02-*.png` (28 files)

## Deviations / notes for later phases

- `src/features/products/product-type-augment.d.ts` module-augments `Product` with an
  optional `description` field (see "Type augmentation" above) - if phase 0/5 later adds
  `description` to `domain/types.ts` directly, this augmentation becomes a harmless no-op
  duplicate declaration and can be deleted.
- `src/i18n/index.ts`'s products/inventory import lines are already in HEAD (phase-04's
  commit swept them in); nothing left for this phase to commit there.
- Products/inventory sub-routes needed their own in-app nav entry points (categories
  button on `/products`, receipts/transfers/counts buttons on `/inventory`) since
  `nav-items.ts` only lists top-level areas.

Status: DONE
Summary: All 7 phase-02 screens implemented and verified (typecheck, 140 tests, web
export, 28 screenshots at 390/1280 with 0 console errors, and a full UI-driven
receipt/transfer/count functional check with before/after store-state numbers).
Concerns/Blockers: None blocking. 5 BeeUI findings logged (see above), all minor/nit.
