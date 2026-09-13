# W-I report: inventory 2 (purchase orders, supplier returns, lots, CSV import, barcodes) and the POS return / exchange

Status: DONE_WITH_CONCERNS
Date: 2026-09-13 · worker: W-I (wave 1) · branch: main (not committed)

Rows E and F of the program are built. Eleven screens and two pure libraries landed, the five
gates are green, and the seven screenshots exist at both frames. The concerns are two entry
points I am not allowed to add myself and one naming mismatch on the payables side; all three
are one line of somebody else's file and are spelled out below.

## Gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | clean, repo wide |
| `npm test` | 47 suites, 676 tests passed (was 41 / 603 when I started). A 48th suite fails to *run*, and it is not a test: a peer has left a Playwright scratch spec at `.tmp-shots/specs/commerce-shots.spec.ts`, which Jest picks up and Playwright refuses to execute inside Jest. It is not mine and it is not in `jest.testPathIgnorePatterns`; deleting it could interrupt whoever is mid-run, so the integrator should remove the folder (or add `/.tmp-shots/` to the ignore list) before the closing gate. |
| `npx eslint src app` | **0 errors**, 2 warnings, both pre-existing in other workers' files (`src/data/seed/operations.ts`, `src/features/orders/components/order-list-group.tsx`) |
| `npm run qa:e2e` | 62 passed, 10 skipped, 0 failed, 5.4 min (`--output /tmp/claude-501/pw-wi`, port 8123) |
| `npx expo export --platform all` | web + ios + android bundles built |

Screenshots in `docs/design/after/commerce/`, at 1440 and 375:
`purchase-order`, `receive-partial`, `lots`, `expiring`, `csv-import`, `product-barcodes`,
`return-exchange`.

## 1. What another worker has to add (three one-liners)

### W-P: the two entry points into `/pos/returns`

The route exists, is permission guarded (`permissionForPath` maps `/pos/**` to `pos.sell`) and
is fully working, but nothing in the shell links to it, because the POS sub header and
`src/components/shell/nav-items.ts` are not mine.

```tsx
// src/features/pos/components/pos-sub-header.tsx (or wherever the "Thêm" menu lives)
<DropdownMenuItem onSelect={() => router.push('/pos/returns')}>
  <Text>{t('returns.entryTitle')}</Text>     {/* "Trả / đổi hàng" */}
</DropdownMenuItem>
```

```ts
// src/components/shell/nav-items.ts, SUB_NAV_ITEMS, so the command palette offers it
{ id: 'returns', href: '/pos/returns', labelKey: 'returns.entryTitle', icon: 'receipt-text', primaryOnMobile: false, permission: 'pos.sell' },
```

The order detail action ("Trả / đổi hàng" on a paid order) is W-P's file too. The screen takes
no parameters: it finds the order by code from its own search box, so the deep link can simply
be `/pos/returns` for now, and an `?order=<code>` parameter can be added when W-P wants the
action to preselect. Say the word and I will take that parameter.

### W-P: the FEFO warning on the sell tile

The pure helper you were promised is in place:

```ts
import { expiringLotsFor, gradeLot, EXPIRY_SOON_DAYS } from '../../inventory/lib/lots';

const lots = expiringLotsFor(product.id, storeId);        // expired + inside 15 days, soonest first
const blocked = lots.some((lot) => gradeLot(lot) === 'expired');
```

`expiringLotsFor(productId, storeId, withinDays = 15, now = new Date())` reads the lot store
itself, so a tile that renders hundreds of times does not have to thread a lot list through
every render. A product that tracks no lots comes back empty, so the call is safe on every
tile. The pure forms underneath it, if you would rather pass the list in, are `expiringLotsIn`,
`lotsIn`, `lotOnHand`, `expiredOnHand` and `gradeLot` (`expired` / `soon` / `ahead`).

### W-M: the supplier return writes a credit note, not a debit note

`SupplierReturnDetailScreen.handleSend` reduces the payable with
`useLedgerStore.getState().addCreditNote({ party: 'supplier', ..., refId: record.id })`.

The paperwork calls this a debit note, but `entrySign` in `src/domain/ledger.ts` gives
`debit_note` a sign of `+1`, which would *raise* what the chain owes the partner. `credit_note`
is the entry with the `-1` the return needs, and unlike `addManualNote` it carries `refId`, so
the entry traces back to the supplier return. If you want a named
`createSupplierDebitNote(supplierId, supplierReturn)` with the paperwork's word on the outside
and the `-1` on the inside, it is a one line swap in my file and I will make it.

## 2. Screens and routes

| Route | Screen | What it does |
|---|---|---|
| `/inventory/purchase-orders` | `purchase-orders-list-screen.tsx` | table from tablet up, card list on the phone, status badge per row (draft / sent / partial / received / cancelled), received vs ordered units, ordered value |
| `/inventory/purchase-orders/new`, `/[id]` | `purchase-order-detail-screen.tsx` | the four step stepper in the toolbar, a stat strip (ordered, received, outstanding, units, supplier), an editable draft, then a **`Nhận lần này` input per line** with a per-line badge (`Đủ` / `Còn 240` / `Chưa về`), lot code and expiry inputs for the tracked products of that delivery, and the send / cancel / receive actions |
| `/inventory/supplier-returns`, `/new`, `/[id]` | `supplier-returns-list-screen.tsx`, `supplier-return-detail-screen.tsx` | starts from a goods receipt (which brings the receipt's products and their cost across) or from free lines, a reason per line, and both consequences stated before sending: stock down by N units, payable down by the value |
| `/inventory/expiring` | `expiring-screen.tsx` | soonest expiry first, three grades (expired `destructive`, under 15 days `warning`, otherwise neutral), 30 or 60 day window, branch select, `Xuất huỷ` per row, and the write-off log underneath |
| `/inventory/import` | `csv-import-screen.tsx` | file picker on web, paste box everywhere (`expo-document-picker` is not installed, so there is no native picker), preview table with ok / warning / error rows, filter chips that are also counters, `Nhập N dòng hợp lệ` counting the rows that will really import, template download through the existing export helper |
| `/pos/returns` | `src/features/returns/return-screen.tsx` | find the order by code, one row per original line at quantity 0 and 60 percent opacity until picked, reason chips, per-line `Nhập lại kho` / `Hàng hỏng`, exchange pane priced at the branch's current price, one net number, and one button whose label is the settlement |
| product detail | `product-units-section.tsx`, `product-lots-section.tsx` | extra barcodes (primary is the `Thông tin chung` field and cannot be deleted), selling units with factor and their own barcode, `minOrderQty`, the `trackLots` switch, and the batch table with the expired warning |

The four new inventory destinations are reached from a single `Chứng từ khác` dropdown in the
inventory toolbar rather than four more buttons: the desktop toolbar is one 56 pt row that may
neither wrap nor clip, and four more inline actions would have broken that rule before W-E gets
to the 1440 collapse item in wave 2.

## 3. Pure code and tests

- `src/lib/csv-import.ts` (+ 17 tests). `parseCsvText` is RFC 4180 (quoted commas, doubled
  quotes, embedded newlines, CRLF, Excel BOM). `parseNumberCell` reads `9.000` as nine thousand,
  because the dot is this locale's thousands separator and a catalogue imported at nine dong a
  bottle is worse than a refused row. `mapHeader` accepts Vietnamese and English column names,
  accented or not. `parseProductImport` returns a row per line with **issue codes, not
  sentences** (the rule `notify.ts` set), so the screen renders the copy from the dictionary and
  a preview cannot be stuck in the language it was parsed in. 14 issue codes; errors skip the
  row, warnings import it with the stated adjustment.
- `src/features/inventory/lib/lots.ts` and `purchase-orders.ts` (+ 12 tests): grading, FEFO
  ordering, day-first expiry parsing that refuses `31/02/2026` instead of rolling it over, and
  the purchase order arithmetic (ordered / received / outstanding by unit and by value, per-line
  state, what may still be edited or received, the next code).
- `src/features/returns/lib/return-draft.ts` (+ 11 tests): the draft rows, the quantity clamp
  against what earlier returns left, the summary through `returnPlan` and `netExchangeAmount`,
  order lookup by code (exact before partial), and `settlesOnAccount`.

## 4. Decisions worth knowing

1. **Reasons and dispositions are stored as codes**, not as Vietnamese sentences
   (`nearExpiry`, `damagedPack`, `expired`, ...). A return recorded in Vietnamese and read back
   in English would otherwise stay Vietnamese for good. The write-off log translates through
   `returns.reason.*` first, then `inventory.supplierReturns.reason.*`, and shows the raw code
   only if neither dictionary knows it.
2. **The write-off log lives on `/inventory/expiring`.** A damaged return leaves no stock
   movement behind (the unit was already sold before it came back), so the log is the only place
   the difference is explained, and writing off is that screen's own action. This is the
   observable the E2E asserts on.
3. **`setStockLevel` is new on `inventory-store`.** `adjustStock` applies a delta to a level row
   that exists, and a product that has just been imported has no row at any branch, so the CSV
   import needs an absolute setter that creates the row. It logs a movement like every other
   stock change.
4. **Purchase order codes follow the seed** (`PO260913-001`), not the mockup's
   `PO20260913-0006`: two code shapes in one list read as two kinds of document. Tell me if the
   mockup's shape is the one you want and I will change the generator and the seed test together.
5. **CSV import is at `/inventory/import`, not the mockup's `/products/import`.** My brief named
   the inventory route; the screen writes stock as well as products, so it sits with stock. One
   line to move if the mockup's path is preferred.
6. **The cost blend now runs on both receipt paths.** `applyReceiptCost(receipt)` is called from
   the purchase order's receive action and from the plain goods receipt confirm
   (`receipt-detail-screen.tsx`). W-M's action refuses a second pass over the same receipt id,
   so neither call can double count, and the confirm path was otherwise nobody's.
7. **`ProductCostHistory` is mounted on the product form** as a `Giá vốn` section (the form has
   no tab strip). It stays reachable at `/money/cost/<id>` as well.
8. **The credit note on an on-account return uses `record.refundAmount`**, which is W-M's
   contract. Where a return is half of an exchange, the net the cashier settles
   (`refundDue`) is smaller than the goods value. Today the note is raised only when
   `refundDue > 0`, and it is raised for the goods value. If the owner wants the note to be the
   net, that is a second argument on `createCreditNote` and W-M's call.

## 5. E2E

`scripts/qa/e2e/specs/commerce-inventory.spec.ts`, seven tests, desktop project only:

1. a purchase order for 10 at a cost the catalogue does not use, sent, then **4 received**: the
   order lands on `Nhận một phần`, the till sells `before + 4`, and the product's cost history
   shows `9.999 đ` as the latest receipt price;
2. an extra barcode added on the product form, then a **keyboard wedge burst** of that code on
   the sell screen adds the product;
3. a 3 row CSV with one negative price: the preview says `Lỗi 1` and `Giá bán âm` on the row,
   the button offers `Nhập 2 dòng hợp lệ`, and afterwards the two sound SKUs are in the
   catalogue and the bad one is not;
4. one line returned as **damaged**: stock is unchanged and the write-off log carries the row;
5. an **exchange**: the return value, the exchange value and the `Thu thêm` figure agree, and
   completing it takes the replacement product off stock;
6. the lots section of a tracked product;
7. the same screens walked again at 375 for the phone half of the screenshot set.

The viewport is never resized inside a flow. The shell swaps its whole layout at the
breakpoint, which remounts the screen under it and empties any half filled form; that cost me
three false failures before I split the phone pass into its own test.

## 6. Files

Created: `src/lib/csv-import.ts` · `src/lib/__tests__/csv-import.test.ts` ·
`src/features/inventory/{purchase-orders-list-screen,purchase-order-detail-screen,supplier-returns-list-screen,supplier-return-detail-screen,expiring-screen,csv-import-screen}.tsx` ·
`src/features/inventory/components/po-lines-table.tsx` ·
`src/features/inventory/lib/{lots,purchase-orders}.ts` + `lib/__tests__/inventory-lib.test.ts` ·
`src/features/products/components/{product-units-section,product-lots-section}.tsx` ·
`src/features/returns/{return-screen.tsx,lib/return-draft.ts,lib/__tests__/return-draft.test.ts}` ·
`src/i18n/returns.{vi,en}.ts` ·
`app/(app)/inventory/{expiring,import}.tsx`, `app/(app)/inventory/purchase-orders/{index,new,[id]}.tsx`,
`app/(app)/inventory/supplier-returns/{index,new,[id]}.tsx`, `app/(app)/pos/returns.tsx` ·
`scripts/qa/e2e/specs/commerce-inventory.spec.ts` ·
14 screenshots in `docs/design/after/commerce/`.

Modified: `src/data/inventory-store.ts` (`setStockLevel`) ·
`src/features/inventory/{inventory-screen,receipt-detail-screen}.tsx` ·
`src/features/products/product-form-screen.tsx` ·
`src/i18n/{inventory,products}.{vi,en}.ts` · `src/i18n/index.ts` (two import lines for the new
`returns` namespace, which the parity test needs).

Untouched: `src/components/**`, `src/domain/**`, every other feature and store, all BeeUI
packages, `docs/design/*` except the new screenshot folder. Nothing committed.

## 7. BeeUI findings

None to file. Every component behaved as documented; `Field` takes `description` rather than
`helperText`, which the existing screens already knew, and nothing needed a patch or a
workaround. `docs/beeui-audit/findings-27-inventory.md` is therefore not created.

## Open questions

1. Should the credit note on an **exchange** be the goods value (today) or the net the cashier
   actually settles? W-M's `createCreditNote` takes the record, so this is a joint change.
2. Purchase order code shape: the seed's `PO260913-001` (today) or the mockup's
   `PO20260913-0006`?
3. CSV import route: `/inventory/import` (today, my brief) or `/products/import` (the mockup)?
4. Who owns `.tmp-shots/`? It breaks `npm test` for everyone and nobody has claimed it.
