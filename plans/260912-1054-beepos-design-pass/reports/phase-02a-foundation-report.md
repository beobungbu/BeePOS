# Phase 2A report · foundation (icons, breakpoints, shell, auth, multi-cart, images)

Worker: 2A · 2026-09-12 · working tree left uncommitted for review.

## What changed

### 1. Dependencies
`npx expo install lucide-react-native react-native-svg expo-image`, then `npm run postinstall`.
`react-native-svg@15.15.4` and `expo-image@~57.0.5` are the SDK 57 pins; `lucide-react-native@1.45.0`
came from npm. Installing `expo-image` also appended its config plugin to `app.json`; that file is
not in the 2A ownership list but the edit is the dependency install's own side effect, so it stays.

### 2. `src/components/icons.tsx`
One typed map, `APP_ICONS`, from app icon name to lucide component, plus `AppIcon` taking
`name`, `size` (default 20), `tone` (a semantic colour token) and an optional resolved `color`.
Colour is read through BeeUI's `useBeeToken('colors.<token>')`, the sanctioned path for SVG props,
so icons follow the theme with no literal colours and no conditional dark-mode branch.

The direction doc names 20 icons; the map has 23. The three extras and why:
`id-card` for the Nhân viên nav item (the mockup's staff glyph is not `users-round`),
`chevron-left` for the back control on the phone `/select-store` header, and `hexagon` for the
BeePOS brand mark. Every emoji in `nav-items.ts` is gone; `NavItem.icon` is now typed `AppIconName`,
so an unknown icon is a compile error.

### 3. `useBreakpoint()` and the shell
`src/hooks/use-breakpoint.ts` exports `breakpointForWidth` (pure) and `useBreakpoint`:
`phone` under 768, `tablet` 768 to 1279, `desktop` from 1280.

- `app-shell.tsx` branches once on the band. Phone: header, content, bottom tabs. Tablet and
  desktop: the rail or sidebar runs full height on the left with the header inside the content
  column, as the mockups show.
- `bottom-tab-bar.tsx`: 5 tabs, 24 pt icons, one-line labels, active in `primary-pressed` (the
  mockup's own choice; plain `primary` on white is too light for 11 pt text). Keeps the
  `accessibilityRole="button"` + label contract the e2e suite measures, and the existing
  large-Dynamic-Type icon-only fallback.
- `nav-rail.tsx` (new): 72 pt, brand mark on top, eight areas, Cài đặt pinned to the bottom,
  active pill `bg-primary/15`. Labels wrap to two lines instead of truncating, so "Khách hàng"
  stays readable at 60 pt.
- `sidebar.tsx`: 240 pt, brand block on top, Cài đặt pinned bottom, signed-in cashier block under
  it. The old `bg-accent` active class (not a BeeUI token, a silent no-op) is gone.
- `shell-header.tsx`: store name with a second line (staff and role on phone, the address from
  tablet up), the store code as a badge from tablet up, and an avatar with initials that opens the
  store switcher and sign-out menu.
- `more-sheet.tsx`: same list, now with `AppIcon` leading and a chevron trailing.

**Not done here, by ownership:** the shift-not-open strip still renders as a full `AlertBanner`
above the catalog grid. It lives in `src/features/pos/components/no-shift-banner.tsx`, which W-POS
owns, and the direction doc wants it as a 40 pt strip under the order tab strip that W-POS is
building. Handed to W-POS.

### 4. Login and select-store
Moved into `src/features/auth/`; `app/(auth)/*.tsx` are one-line re-exports.

- `auth-layout.tsx`: content centred, capped at 480, card on `bg-surface-muted` from 768 up,
  footer `BeePOS 0.1.0 · BeeUI 0.86.2-rc.1`.
- `login-screen.tsx`: brand block, `Mã cửa hàng` resolving live to the store name and address in
  `text-success` (or a muted "not found" line), `Mã PIN` as `OTPInput length={4}`, the
  "Ghi nhớ cửa hàng này" switch, and a 52 pt primary button. Enter in the PIN field submits
  (`onSubmitEditing`).
- The remember switch is real, not decoration: `remembered-store.ts` keeps the last store code in
  `localStorage` on web (guarded by `Platform.OS === 'web'` and a try/catch for blocked storage)
  and in module memory on native, where this prototype has no storage dependency. It prefills the
  login field and marks the "Gần đây" branch on select-store. Verified on web: toggle on, sign in,
  reload `/login`, the field reads `HN02` and the switch is on.
- `select-store-screen.tsx`: phone gets the mockup's header (back control signs out), greeting,
  optional "Gần đây" group and the full list as 72 pt rows with a code badge and chevron; tablet
  and desktop get the same list inside the auth card with a sign-out link.
- The mockup's "Quên mã PIN?" link is deliberately absent: this prototype has no recovery flow and
  a link that does nothing is a lie about the product.

### 5. Multi-cart
`src/domain/pos.ts` gained the pure half: `MAX_OPEN_CARTS = 8`, `CartSet`, `makeCart`,
`initialCartSet`, `nextCartOrdinal`, `openCart` (returns `null` at 8), `switchCart`, `closeCart`,
`updateActiveCart`, `activeCartOf`. Closing the active cart activates its neighbour; closing the
last one leaves a fresh empty cart. 13 new jest cases cover open, switch, close (three positions),
next-ordinal and the 8 ceiling.

`src/data/cart-store.ts` is now a thin wrapper: `{ carts, activeCartId, openCart(), switchCart(),
closeCart(), ...line actions on the active cart }`, plus a `useActiveCart()` hook. Call sites in
`src/features/pos/**` were changed only enough to compile (`state.cart` to `useActiveCart()`), plus
checkout, where paying now calls `closeCart(cart.id)` instead of `clearCart()`, which is what
"paying removes that cart and activates the next open one" means.

**Deviation to note:** the spec says "cart ids are `Đơn N`". Cart identity is `Cart.ordinal`
(a new field) with `id` = `cart-<storeId>-<ordinal>`; the label `Đơn N` is presentation and belongs
in `src/i18n` so the `en` dictionary can say `Order N`. A display string as a primary key would have
made the tab labels untranslatable. W-POS renders the label from `cart.ordinal`.

### 6. Product images
31 files in `assets/products/`, 1.0 MB total, largest 57 KB, all 400 px on the long side at JPEG
quality 80:
- 23 real product photos from Open Food Facts / Open Beauty Facts / Open Products Facts
  (Coca-Cola, Bia Saigon, G7, Vinamilk, Ông Thọ, Hảo Hảo, Omachi, Vifon, Oreo, Chocopie, Oishi,
  Alpenliebe, Omo, Comfort, Sunlight, Clear and more), keyed by base product so all four
  size/pack variants share one picture.
- 8 generic Pexels photos, one per category, backing the products whose own photo the source did
  not have (Trà xanh Không Độ, Lavie, Gạo ST25, Dầu ăn Neptune, Cháo Cầu Tre, Kem đánh răng P/S,
  Tương ớt Chinsu).
- 10 SKUs carry no image on purpose (`SKUS_WITHOUT_IMAGE`) so the monogram fallback stays visible.
- `Product.imageUrl` widened to `string | number` for the `require()` asset convention.
- Every file, source URL, barcode, photographer and licence is in `docs/design/image-credits.md`.

The Open Food Facts `/api/v2/search` endpoint was down during this phase; `search.openfoodfacts.org`
(search-a-licious) plus `/api/v2/product/<barcode>.json` worked and is what the credits cite.

### 7. i18n
Eight keys added to `common.auth` in both `vi` and `en`: `tagline`, `rememberStore`,
`storeNotFound`, `greeting`, `selectStorePrompt`, `recentStore`, `allStores`.

## Gates

| Gate | Result |
|---|---|
| `npx tsc --noEmit` / `npm run typecheck` | pass |
| `npm test` | pass, 152 tests in 8 suites (13 new) |
| `npx expo export --platform all` | pass, web + android + ios bundles |
| `npm run qa:e2e` | 8/8 pass |

Two gate notes:

1. **`scripts/qa/e2e/lib/session.ts` needed one line.** The phone select-store screen now carries
   "Chọn cửa hàng" twice (header title and the prompt under the greeting), so the helper's
   `getByText('Chọn cửa hàng').waitFor()` tripped Playwright strict mode on the four narrow
   journeys. Changed to `.first()`. No other spec or selector touched.
2. **`tsconfig.json` needed one line, outside 2A ownership.** `expo/tsconfig.base` sets
   `allowJs: true` and the config has no `include`, so after `expo export` the 5.2 MB web bundle in
   `dist/` becomes an input and `tsc` dies with `RangeError: Maximum call stack size exceeded`.
   Running the two mandated gates in the order "export, then typecheck" therefore fails for anyone.
   Added `"dist"` to `exclude`. Flagging it because it is not a 2A file; revert it and every 2B
   worker will hit the same wall.

Console on web through login to POS: zero errors. Four warnings remain, all pre-existing or from
BeeUI: `props.pointerEvents is deprecated`, `useNativeDriver` on web, and BeeUI's `Switch` logging
a Uniwind accent warning twice (filed).

## Screenshots

`docs/design/after/`, at 375, 768 and 1440: `login-*.png`, `select-store-*.png`, `pos-shell-*.png`.
The POS ones show the shell only (bottom tabs, rail, sidebar, header); the catalog, cart and order
tab strip inside them are still the phase 1 build and belong to W-POS.

`docs/screenshots/e2e-*.png` are modified in the working tree: the e2e journey rewrites them on
every run. They are not a 2A edit.

## BeeUI findings

`docs/beeui-audit/findings-14-restyle-2a-foundation.md`:
- 14-02 minor gap: `OTPInput` renders one text field, so the design's 4 cell PIN is not buildable
  from the family. Its docs say so plainly, so this is a gap, not a docs defect.
- 14-03 minor web-runtime: `Switch` logs a Uniwind `accent-muted-foreground` warning from inside
  the family on every mount.
- 14-04 nit: `DropdownMenuTrigger` is a full `Button`, so an avatar trigger needs
  `variant="ghost"` and `p-0` to stop looking like a button with a picture in it.

## Handed to the 2B workers

- Use `AppIcon` and `useBreakpoint`; do not import lucide directly and do not invent width
  thresholds.
- Cart API: `useActiveCart()` for the order, `useCartStore` for actions. The tab label is
  `cart.ordinal`, not `cart.id`.
- W-POS owns the shift strip restyle (still an `AlertBanner` above the grid) and the order tab strip.
- `bg-card` still appears in `src/features/stores/store-detail-screen.tsx` (x2) and
  `src/features/reports/components/stat-cards.tsx`; em-dashes in `src/features/pos/shift-screen.tsx`
  (x2), `src/features/pos/components/payment-method-panel.tsx` and a comment in
  `src/features/settings/settings-screen.tsx`. All in 2B-owned files.
