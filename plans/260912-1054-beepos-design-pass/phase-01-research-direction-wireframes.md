# Phase 1: research, design direction, wireframes

## Context (read first)
- `docs/product-spec.md` (users/devices, screen inventory, stack, non-functional).
- Live current build: https://beepos.beemvp.com (login HN01 / PIN 1234, store "Tạp hoá Cầu Giấy"). Capture it yourself at 375, 768, 1440 so the "before" is on record.
- Current shell code, read only: `src/components/shell/` (sidebar, bottom-tab-bar, shell-header, nav-items), `src/features/pos/pos-screen.tsx`, `src/features/pos/components/product-card.tsx`, `app/(auth)/` login screens.
- BeeUI docs: https://beeui.beemvp.com/docs (components list, tokens page, llms-tokens.txt, llms-components.txt). BeeUI has NO generic Icon component; it has IconButton that accepts an element. Available BeeUI components: accordion, alert-banner, alert-dialog, app-header, avatar, badge, bottom-action-bar, box, breadcrumb, button, calendar, card, checkbox, chip, collapsible, date-picker, description-list, dialog, dropdown-menu, field, form-group, icon-button, input, keyboard-aware-screen, label, link, list-group, list-item, metadata-row, otp-input, pagination, password-input, popover, progress, radio, safe-area, screen, search-input, section, segmented-control, select, separator, sheet, skeleton, spinner, stack, stat, state-message, stepper, switch, table, tabs, text, textarea, timeline, toast, tooltip.
- Known BeeUI native bug: Sheet never presents on iOS, so cart on phone is a pushed route `/pos/cart`, not a sheet. Design for that.

## Deliverables (create exactly these)
1. `docs/design/research.md` (max 250 lines): survey of 4 POS products (KiotViet, Sapo POS, Square POS, Loyverse; swap one for another if sources are thin). For each: how the sell screen is laid out on phone, tablet, desktop; product tile density and info order; where cart/checkout lives; category navigation; what they do well for a cashier under time pressure. End with 8 to 12 patterns BeePOS adopts and 3 to 5 it deliberately rejects, each with one-line reason. Cite URLs.
2. `docs/design/design-direction.md` (max 300 lines): the single reference for phase 2 workers.
   - Breakpoints: phone < 768, tablet 768 to 1279, desktop >= 1280. Shell per breakpoint (bottom tabs / rail or sidebar / sidebar + two-pane POS).
   - Color: map every role (page bg, surface, elevated, border, text primary/secondary/muted, brand, success, warning, danger, selected chip, low-stock) to BeeUI semantic token names taken from the tokens docs. No literal hex in the app; hex allowed in this doc only as the token's documented value.
   - Icon set decision: recommend `lucide-react-native` (needs react-native-svg, in Expo SDK 57) vs `@expo/vector-icons`; pick one, list the 20 icons the app needs with names.
   - Type scale (5 steps max), spacing scale (4-pt), radius, elevation, tap targets (min 44 pt), density rule for the POS grid (name never truncated below 2 lines, price is the loudest element, stock shown as a small badge).
   - Product tile spec, category chip spec (single scrolling row on phone, wrap on tablet+), search bar spec, cart line spec, checkout total block spec, empty states, alert-banner usage rules (shift not open goes in the header area, not above the grid).
   - Forms: max-width 480 centered, page-level padding per breakpoint, login and select-store centered with logo/wordmark block.
   - Data tables on tablet+ vs ListGroup on phone: the rule and the column set for orders, products, inventory.
   - Dark mode: same tokens, no special cases.
   - Copy rules: Vietnamese default, no em-dash, numbers as `9.000 đ`.
3. `docs/design/mockups/index.html` plus one file per screen `login.html`, `select-store.html`, `pos.html`, `checkout.html`, `orders.html`. Plain HTML + CSS, no build step, no external assets except Google Fonts (Inter). Each screen file renders three device frames side by side (375x812, 768x1024, 1440x900) with realistic Vietnamese data from the spec (products like Nước ngọt Coca-Cola 330ml, prices in VND). Use CSS custom properties named after the BeeUI tokens you chose. Each visible region carries a small `data-beeui="ListGroup"` style label (toggle with a checkbox "Show component map") so a developer sees which BeeUI component builds it. Icons: inline SVG from lucide. `index.html` links the five and has a 10-line "what changed vs current" list.
4. Report `plans/260912-1054-beepos-design-pass/reports/phase-01-design-report.md`: what you decided, what you could not verify, open questions.
5. Save before/after capture of the current site into `docs/design/current/*.png` (use Playwright already in the repo: `npx playwright screenshot --viewport-size=...`; log in via UI or note if blocked).

## Constraints
- Do not touch `src/`, `app/`, `package.json`, or anything outside `docs/design/` and the plan folder.
- Work context: /Users/textsoft/workspace/BeePOS. Reports path: plans/260912-1054-beepos-design-pass/reports/.
- Do not invent BeeUI tokens or props; when unsure, quote the docs URL you read.
- No em-dash anywhere in the deliverables.
- Keep each doc within the line limits above.

End your final message with:
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: one or two sentences
Concerns/Blockers: optional
