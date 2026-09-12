# Phase 5 · W-B · Persistence

Date: 2026-09-13 · Worker: W-B · Metro port 8102 · Login HN01 / 1234 · Nothing committed.

## Status

All six items of the W-B block are done. Gates: `npx tsc --noEmit` clean, `npm test` 276 passed
(20 suites, 16 of them new), journey E2E 8/8, `npx expo export --platform all` green
(web 5.4 MB, android 7.5 MB, ios 7.3 MB).

## For W-C (the Settings reset button)

```ts
import { resetDemoData } from '../../data/persistence-bootstrap';
// from src/features/settings/settings-screen.tsx: '../../data/persistence-bootstrap'

resetDemoData(): Promise<void>   // never rejects; await it before closing the dialog
```

Behaviour: clears every stored slice, puts catalogue, orders, stock, customers, carts, stores,
staff and settings back to the seed state, and keeps the cashier signed in. Settings go back to
their defaults too, so the reset also restores the default theme (`system`), language (`vi`) and
receipt text. Worth saying so in the dialog body; the button copy itself needs no change.

Other exports of `src/data/persistence-bootstrap.ts`, should anything else need them:
`hydrateAll(): Promise<void>`, `isHydrated(): boolean`, `useHydrated(): boolean`,
`flushAll(): Promise<void>`, `PERSISTED_KEYS: string[]`.

## What shipped

| File | Change |
| --- | --- |
| `package.json` / lock | `@react-native-async-storage/async-storage@2.2.0` via `npx expo install` (only change to the manifest) |
| `src/data/persist.ts` (new, 424 lines) | generic `persistStore(key, store, pick, version, options?)` |
| `src/data/persistence-bootstrap.ts` (new, 246 lines) | store registry, `hydrateAll`, `resetDemoData`, page-hide flush |
| `src/lib/preference-storage.ts` | native mirror of the sync preference map; `hydratePreferences()`, `clearPreferences()` |
| `src/data/settings-store.ts` | exports `SIDEBAR_COLLAPSED_KEY` (one word; no behaviour change) |
| `app/_layout.tsx` | hydration gate around `<Stack>` |
| `scripts/qa/e2e/lib/session.ts` | `clearPersistedState(page)`, called by `login()` |
| `src/domain/__tests__/persist.test.ts` (new) | 16 tests |

No other store file needed a `hydrate`/`replaceAll` action: `persistStore` subscribes and
`setState`s from outside, so `cart-store.ts` (W-A) and every other store are untouched.

### 1. `persist.ts`

`persistStore(key, store, pick, version, { storage?, debounceMs? })` subscribes to a zustand
store, debounces writes 300 ms, serialises `pick(state)` into `{"v":<version>,"s":<slice>}` and
hydrates on boot. Handle: `hydrate()`, `hydrateSync()`, `flush()`, `flushSync()`, `reset()`,
`stop()`.

- Storage: `localStorage` on web, AsyncStorage on native, in-memory when neither is available
  (private mode, blocked storage, test runner). Every read/write is wrapped: a quota error or a
  missing native module warns once and the app keeps running unpersisted.
- Dates are written as `{"__beepos_date":"<ISO>"}` and revived as `Date` on read (the replacer
  reads the raw value off the holder, since `Date.toJSON` runs before a replacer sees it).
- Version per key: a slice written under another version is dropped and its key deleted.
- Boundary validation: storage content is external input, so a payload is only merged when it
  parses, is an object, carries the expected numeric version, and passes `isCompatibleSlice`
  (every key known to the store, array stays array, object stays object, primitives keep their
  type; `null` allowed on either side). Anything else is discarded and the key cleared.
- Writes start only after hydration, so a slow read can never be overwritten by the seed state
  it is about to replace, and an unchanged payload is not rewritten.

Two additions beyond the letter of the brief, both to remove visible defects:

- `hydrateSync()` / `getItemSync`: `localStorage` answers without a turn of the event loop, so
  on web the stores are filled at import time. The first frame is already the saved session,
  theme and open orders: no spinner, and no flash of the default light theme before a dark one.
- `flushSync()` on `pagehide` / `visibilitychange: hidden`: without it, a reload inside the
  300 ms debounce window loses the change that was still queued. Found while testing, and it was
  not theoretical: log in and reload immediately and the app was back on the login screen.
  Reproduced, fixed, re-verified.

### 2. `persistence-bootstrap.ts`

Registered keys, all at schema version 1:

| Key | Slice |
| --- | --- |
| `beepos.persist.session` | `staff`, `store`, `storeOptions` |
| `beepos.persist.settings` | theme, locale, density, default store, tax rate, receipt text/logo, currency display, bank info, printer |
| `beepos.persist.carts` | `carts`, `activeCartId` (subscribed from outside `cart-store.ts`) |
| `beepos.persist.orders` | `orders`, `shifts`, `refunds`, `notes` |
| `beepos.persist.inventory` | `stockLevels`, `goodsReceipts`, `stockTransfers`, `stockCounts`, `movements` |
| `beepos.persist.customers` | `customers`, `pointHistory`, `profileExtras` |
| `beepos.persist.catalog` | `products`, `categories` |
| `beepos.persist.org` | `stores`, `staff`, `staffActiveById`, `storeHoursById` |

`org` is not in the brief's list; it is registered because without it a renamed store or a reset
PIN silently reverted on reload while every neighbouring screen kept its edits. Say the word and
it comes out in one line.

Not persisted on purpose: `settings.posSidebarCollapsed` (per-session by design),
`settings.sidebarCollapsed` (stays with `preference-storage`, because stores read it while they
are being created), `order-store.cart` (dead field, carts live in the cart store).

`resetDemoData()` restores the slice each store was created with, which is the seed data, and is
therefore unaffected by whatever the user did in between.

### 3. Hydration gate

`app/_layout.tsx` renders a centred `ActivityIndicator` on `bg-background` (role `progressbar`,
label "Đang tải dữ liệu") until `useHydrated()` is true. On web that is true on the first render
(sync read), so the gate is effectively native-only; the label is deliberately not translated,
since the saved locale is exactly what is being read at that moment.

### 4. E2E determinism

`login()` now calls `clearPersistedState(page)`, a `page.addInitScript` that wipes
`localStorage` before the app's first script runs and leaves a `beepos.e2e.cleared` marker, so
the wipe happens once per browser context and a deliberate in-journey reload (a future
persistence spec) is not wiped too. No spec file was touched.

`npm run qa:e2e`: 8/8 (`7.1m`, run on port 8102 with a private output dir).

Note for the integrator: the first full-suite run of the night reported 3 failures, all of them
`browserContext.close: ENOENT .../.playwright-artifacts-3/traces/...`, because a second
`qa:e2e` from another worker wiped `test-results/` mid-run. The test bodies had already passed.
Two parallel workers cannot share the default Playwright output directory; pass
`--output=<dir>` (and `BEEPOS_E2E_PORT`) when running concurrently.

### 5. Tests

`src/domain/__tests__/persist.test.ts`, 16 cases against an in-memory storage double: pick
(unpicked and function fields never leave the store), debounce coalescing, no write before
hydration, hydration into the store, Date revival, version mismatch, malformed payloads,
incompatible shape, read/write failures, `flush`, `flushSync`, `reset`, `stop`, plus one
end-to-end case over the real bootstrap: edit the catalogue, flush, `resetDemoData()`, seed and
default theme are back.

### 6. Manual verification on web (1440, `docs/design/after/features/`)

| Check | Evidence |
| --- | --- |
| Two open orders survive a reload, the active tab too | `persist-carts-before-reload-1440.png` / `persist-carts-after-reload-1440.png` |
| Theme kept across a reload | `persist-theme-before-reload-1440.png` / `persist-theme-after-reload-1440.png` |
| Boot after reload: session and dark theme already on the first painted frame | `persist-boot-after-reload-1440.png` (16 samples at 60 ms from document commit: nothing painted, then the dark screen; no light frame) |
| A completed sale is still in `/orders` after a reload | `persist-orders-before-reload-1440.png` / `persist-orders-after-reload-1440.png` (`HD-HN01-20260913-001` before and after) |
| Reset restores the seed | unit test over the real bootstrap (the UI button is W-C's step 5) |

Storage after one sale on the seed data: 295 KB total (orders 164 KB, customers 45 KB,
inventory 45 KB, catalog 38 KB, org 1.8 KB, session 0.9 KB, carts 0.1 KB) against a ~5 MB
`localStorage` budget.

## Risks and follow-ups

1. Slices are written whole. A catalogue of 1000 products would put the catalog key around
   300 KB per write, debounced to at most one write per 300 ms. Fine for the prototype, worth a
   look in the wave-2 perf harness if the 1000-product run feels sluggish while typing.
2. Native has no equivalent of the `pagehide` flush. An app killed within 300 ms of a change
   loses that change; an `AppState` `background` hook would close it if the iOS smoke test shows
   it matters.
3. The native module is new, so a device build needs a rebuild (`npx expo run:ios`), not just a
   reload. Without it, `persist.ts` warns once and falls back to memory rather than crashing.
4. A sale writes the catalog slice as well as orders/customers/inventory, so something on the
   POS path changes catalog state during checkout. Harmless (38 KB) but unexpected; worth a look
   in the wave-2 review.
5. `localStorage` is shared per origin. The deployed demo at beepos.beemvp.com will now carry a
   visitor's edits between visits; "Đặt lại dữ liệu mẫu" is the way out.

BeeUI findings: none. This block touched no BeeUI component, so `docs/beeui-audit/findings-18-*`
has nothing from W-B.
