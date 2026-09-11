# Findings 05 · integrated end-to-end Web QA (phase 05 step 2, 2026-09-11)

Suite: `scripts/qa/e2e/` (`npm run qa:e2e`), one full user journey per run, 8 runs (viewport 1280 and 390 x locale vi and en x theme light and dark), zero console or page errors allowed. Journey: login, open shift, sell 3 products (one by barcode + Enter), qty, line and order discounts, attach customer, split payment (transfer + cash with change), receipt, orders newest first, partial refund by line, customer points, product price edit, categories, goods receipt, transfer draft to sent to received, stock count post, reports period switch and custom range, store detail, staff PIN reset dialog, settings theme and locale, five tabs inside the 390 viewport, cart Sheet from the floating bar. Result: 8 of 8 green after the app fixes below.

## BeeUI findings

### 05-01 · AlertDialog renders role="dialog" on Web, not "alertdialog"
- Area: a11y
- Severity: minor
- Source consulted: https://beeui.beemvp.com/docs/components/alert-dialog/ (accessibility section names the confirmation semantics); Playwright accessibility snapshot of the refund confirmation and the stock-count post confirmation.
- Expected (per docs and WAI-ARIA): a confirmation surface that interrupts the flow exposes `role="alertdialog"` so assistive technology announces it as an alert.
- Actual: the accessibility tree shows `dialog` for the `AlertDialogContent` container (nested `dialog` inside the modal wrapper); `getByRole('alertdialog')` matches nothing. Behaviour (no backdrop or Escape dismissal) is correct.
- Repro: open any `AlertDialog` on Web, inspect with `page.getByRole('alertdialog')`.
- Workaround: the suite locates the last `[role="dialog"]`.
- Suggested fix for BeeUI: set `role="alertdialog"` on the Web content element.

### 05-02 · Field duplicate accessible name reconfirmed in a real flow (BeeUI #570)
- Area: a11y
- Severity: major (already filed)
- Actual: `page.getByLabel('Giá bán')` resolves to the label element first and `fill` fails with "Element is not an input"; the suite uses `getByRole('textbox', { name })` everywhere as the workaround.

### 05-03 · SelectValue default placeholder is English ("Select an option") regardless of locale
- Area: docs-public / dx
- Severity: nit
- Actual: two Selects in /settings (density, printer) show "Select an option" in the Vietnamese UI because the app did not pass `placeholder`; BeeUI's default is not localizable. Docs could state that consumers must always pass `placeholder` or the default should come from the app locale hook. (App polish item for BeePOS as well.)

## BeePOS app bugs found and fixed
1. Product tiles and the floating cart bar were `Pressable`s without `accessibilityRole="button"` or a label (invisible to assistive tech and to role queries). Fixed in `product-card.tsx` and `floating-cart-bar.tsx`.
2. Seed orders for "today" were generated with UTC day boundaries and times later than now, so a freshly created order was not the newest (and receipts showed tomorrow's date in local time). Fixed in `src/data/seed/orders.ts` (local day, capped 5 minutes before now).
3. 18 `router.back()` calls logged "GO_BACK was not handled" when a screen is the first history entry (deep link, reload, client navigation). Replaced with `goBackOr(fallback)` in `src/lib/navigation.ts`.
4. Bottom tab bar overflowed at 390 px with Vietnamese labels ("Thêm" right edge at 434 px). Fixed: tabs `flex-1 min-w-0`, single-line 11 px labels, no bar padding; the suite asserts every tab's right edge is inside the viewport in both locales.
