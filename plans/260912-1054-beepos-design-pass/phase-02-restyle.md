# Phase 2: restyle BeePOS to the approved design

Owner approved on 2026-09-12 the mockups in `docs/design/mockups/` (revision 2). This phase makes the app match them on phone, tablet, desktop, iOS, Android, web.

## Read first (all workers)
- `docs/design/design-direction.md` (the contract: breakpoints, tokens, icons, type/spacing, tile, chips, cart, checkout, multi-order tabs section 6, tables vs lists, forms, copy rules).
- The mockup for your screens in `docs/design/mockups/*.html` (open in a browser; tick "Show component map" to see which BeeUI component builds each region).
- `docs/product-spec.md` for routes and domain. `docs/beeui-audit/protocol.md` if you hit a BeeUI defect: write a finding file `docs/beeui-audit/findings-14-restyle-<worker>.md`, do not patch the package.
- Repo rules: Uniwind semantic tokens only, no literal colors; `bg-card` and `bg-accent` are NOT BeeUI tokens (use `bg-surface`, `bg-muted`); no em-dash in any user-facing copy; Vietnamese default with `en` dictionary kept in sync (`src/i18n`); every control keeps an accessibility label/role; `Platform.OS === 'web'` guards for web-only keys.
- A shell hook blocks Bash commands containing the literal strings `node_modules` or `dist`; never reference those paths.
- Quality gates: `npx tsc --noEmit`, `npm test`, `npx expo export --platform all` must stay green. Web check on a per-worker port with `npx expo start --web --port <port>` and Playwright screenshots into `docs/design/after/<screen>-<width>.png` at 375, 768, 1440.

## Sub-phase 2A: foundation (one worker, must merge before 2B)
Files owned: `package.json`, `src/components/icons.tsx` (new), `src/components/shell/**`, `src/hooks/use-breakpoint.ts` (new), `app/(auth)/**`, `src/features/auth/**` if present, `src/data/cart-store.ts`, `src/domain/pos.ts` + tests, `src/domain/types.ts` (only if a field is missing), `src/data/seed/products.ts` (imageUrl only), `assets/products/**` (new), `docs/design/image-credits.md` (new), `src/i18n/**` (add keys only).

1. Dependencies: `lucide-react-native`, `react-native-svg` (Expo SDK 57 version via `npx expo install`), `expo-image`. Run postinstall so Uniwind artifacts regenerate.
2. `src/components/icons.tsx`: one typed map of the 20 icon names from the direction doc to lucide components, one `AppIcon` component taking `name`, `size`, `className`/`color` from tokens. All emoji in `nav-items.ts` become icon names.
3. `useBreakpoint()`: returns `'phone' | 'tablet' | 'desktop'` at `< 768`, `768..1279`, `>= 1280` from `useWindowDimensions`. Shell: bottom tabs on phone (existing, restyled per mockup: 5 tabs, icons, one-line labels, active = primary), rail 72 pt on tablet (icon + 10 pt label, active pill), sidebar 240 pt on desktop (brand block on top, staff block at bottom, Cài đặt pinned bottom). Header per mockup: store name + address line, store code badge, avatar with initials. Shift-not-open strip is an `AlertBanner` directly under the order tabs area (POS only) and never above the catalog grid elsewhere.
4. Login and select-store: centered 480 pt max, brand block (amber rounded square with hexagon glyph, wordmark "BeePOS", tagline "Hệ thống bán hàng chuỗi tạp hoá"), store code shows resolved store name + address under the field, PIN as `OtpInput` 4 cells, "Ghi nhớ cửa hàng này" switch, footer "BeePOS 0.1.0 · BeeUI 0.86.2-rc.1". Tablet+ wraps the form in a Card on `bg-muted` page. Enter in the last PIN cell submits.
5. Multi-cart: `cart-store` becomes `{ carts: Cart[], activeCartId, openCart(), switchCart(id), closeCart(id), ...existing line actions act on the active cart }`. Max 8 open carts; `openCart` beyond that is a no-op returning false. Cart ids are `Đơn N` where N is the smallest unused ordinal. `closeCart` on the active cart activates the nearest remaining; closing the last leaves one empty cart. Paying an order (order-store `createOrder` caller in checkout) removes that cart and activates the next open one. Pure helpers live in `src/domain/pos.ts` with jest tests (open/switch/close/next-ordinal/max-8). Keep the public selectors used by POS screens working (`useCartStore(s => s.cart)` style: export a `useActiveCart()` hook) and update call sites in `src/features/pos/**` only enough to compile; 2B-POS worker restyles them.
6. Product images: use real product photos from Open Food Facts (free API, no key, `https://world.openfoodfacts.org/api/v2/search?...` or by barcode, images CC BY-SA) for the seed products that exist there (Coca-Cola, Pepsi, Vinamilk, Hảo Hảo, Oreo, Lavie, Bia Saigon, etc.), and generic grocery photos from Pexels (`https://www.pexels.com/license/`) for the rest, one shared image per category as fallback. Target about 40 files, each resized to max 400 px on the long side, JPEG quality 80, under `assets/products/`. Map `imageUrl` in `src/data/seed/products.ts` via `require()` per Expo asset convention (keep the type as `imageUrl?: string | number` if needed). Record every file, source URL, author and license in `docs/design/image-credits.md`. Leave about 10 products without an image on purpose so the monogram fallback stays visible.
7. Report: `plans/260912-1054-beepos-design-pass/reports/phase-02a-foundation-report.md` with what changed, screenshots list, gates output, BeeUI findings if any.

## Sub-phase 2B: screens (three workers in parallel after 2A lands)
Common: use `AppIcon`, `useBreakpoint`, tokens from the direction doc, and the table-vs-list rule (Table on tablet+, ListGroup rows on phone with the three-line row format from the mockup).

**W-POS** owns `src/features/pos/**`, `app/(app)/pos/**`, `scripts/qa/e2e/**` (selectors only).
- Order tab strip (app composite per direction doc section 6: ScrollView + Pressable + Badge + IconButton; active tab shows count and total and a close control; `+` pinned; disabled at 8 with a Toast; closing a cart with lines opens an AlertDialog naming count and total). Web: Alt+1..8 switch, Alt+N new, Alt+W close.
- Product tile with image (`expo-image`, `contentFit="cover"`, 1:1 phone/tablet, 4:3 desktop), stock badge / in-cart counter overlaid top-right, out-of-stock greyscale + dim, monogram fallback, name 2 lines, unit line, price loudest. Grid columns: 2 / 4 / 4 (desktop keeps 4 with the 380 pt cart pane).
- Category chips: single horizontal scroll row on phone, wrap to max 2 rows with `+N` overflow chip on tablet+. Search input with barcode icon; F3 focuses it on web.
- Cart: phone floating cart bar (count badge, order name, total, "Thanh toán" button) above the tab bar; tablet bottom action bar with "Xem giỏ" and "Thanh toán · total"; desktop 380 pt pane (customer row, lines with thumbnail and stepper, trash at qty 1, totals block, pay button carrying total and F9 hint, "Giảm giá đơn" and "Ghi chú"). `/pos/cart` route on phone matches the pane content.
- Checkout, receipt, shift per mockup: totals card, 2x2 payment method cards, tendered input with quick chips (Đủ tiền / 100.000 / 200.000 / 500.000), change block in success tint, split payment list with remaining in warning, VietQR placeholder card for transfer, "Hoàn tất · total" primary; header shows the order name and "Còn N đơn đang mở"; after completion navigate to the receipt and then to the next open order.
- Keep `npm run qa:e2e` 8/8 green; adjust selectors/labels only.

**W-ORD** owns `src/features/orders/**`, `src/features/customers/**`, `app/(app)/orders/**`, `app/(app)/customers/**`.
- Orders: filter row (search with F3 hint on web, store, date preset, status, cashier), 4 Stat cards on tablet+, Table with 6 columns on desktop (time folded under code) and 5 on tablet, status Badge text-only colors, cancelled rows strike the total, desktop 320 pt preview pane (header, customer, lines with thumbnails, totals, timeline, "In lại" and "Hoàn trả" buttons), pagination footer. Phone: ListGroup three-line rows, filter chips row.
- Customers list and detail restyled with the same rules (tier badge, points, order history list).

**W-ADM** owns `src/features/products/**`, `src/features/inventory/**`, `src/features/reports/**`, `src/features/stores/**`, `src/features/staff/**`, `src/features/settings/**`, and their `app/(app)/**` routes.
- Products: table on tablet+ with 40 pt thumbnail column, list on phone; form screens with 480 pt max width sections; image slot in the product form (display only).
- Inventory, receipts, transfers, counts: same table/list rule, low-stock AlertBanner in header area, line editors keep 44 pt targets.
- Reports: Stat cards in the direction doc style, tables with right-aligned tabular numbers.
- Stores, staff, settings: forms and lists per rules; settings groups as ListGroup sections.

Each 2B worker ends with: gates green, screenshots for its screens at 3 widths into `docs/design/after/`, a report `plans/260912-1054-beepos-design-pass/reports/phase-02b-<worker>-report.md`, and the Status footer.

## Acceptance (Ambrose, after 2B)
- `tsc`, `jest`, `expo export --platform all`, `qa:e2e` 8/8 green.
- Side-by-side of `docs/design/current/` vs `docs/design/after/` shows the mockup was followed on every screen at 3 widths.
- Dark mode render of POS and orders at 1440 has no unreadable text.
- iOS simulator and Android emulator happy path (login, multi-order, pay) recorded.
- No emoji, no `bg-card`/`bg-accent`, no em-dash: grep proves it.
