# Findings 18 · W-C (admin, shell, command palette, export, dark sweep)

Phase: `plans/260912-1054-beepos-design-pass/phase-05-feature-upgrade.md`, block W-C.
Surface exercised: `Table`/`TableHead`, `Avatar`, `Button`/`ButtonLabel`, `DropdownMenu`,
`Dialog`, `SearchInput`, `SettingsItem`, `AlertDialog`, on `react-native-web` in dark at 1440.

Nothing in the published packages was patched. Every defect below is worked around in app code
and the workaround is named in the entry. Measurements come from a scripted contrast pass that
walks every rendered leaf text node, resolves the effective background, and compares the WCAG
2.x ratio against 4.5:1 (3:1 for large text).

### 18-01 · Raw DOM text in `Table` inherits the document colour, so every `<th>` is 1.1:1 in dark
- Area: bug
- Severity: major
- Source consulted: <https://beeui.beemvp.com/docs/components/table/>
- Expected (per docs): `Table` is a themed component; a header cell should read in both themes
  with no colour work from the consumer.
- Actual: on web `TableHead` renders a real `<th class="px-3 py-2 text-start align-middle
  font-semibold">` with no colour utility. A string child therefore inherits the document
  colour, which nothing sets, so it paints black. In light that passes by accident; in dark it
  is `#000` on `#0b0f14`, measured 1.09:1. The same header reads correctly when its child is a
  BeeUI `Text` (which paints itself), so one table looks fine and the next is invisible
  depending on how the label was written.
- Repro: dark theme at 1440, `/stores`, `/customers`, `/reports`, `/inventory`,
  `/inventory/receipts`, `/pos/shift`: `Mã cửa hàng`, `Địa chỉ`, `Cửa hàng`, `Nhà cung cấp`, and
  every cell value of the shift table.
- Workaround: `text-foreground` on the app shell's outer `SafeArea`
  (`src/components/shell/app-shell.tsx`). The class emits a real `color` declaration, so every
  uncoloured DOM descendant inherits the theme token instead of black. One line fixed 40+ nodes
  across eight screens.
- Suggested fix for BeeUI: give `<th>` (and any other raw DOM text the web build emits) an
  explicit `text-muted-foreground`, or document that the consumer must set a root text colour.

### 18-02 · `Avatar` fallback initials paint react-native-web's default black, 1.43:1 in dark
- Area: bug
- Severity: major
- Source consulted: <https://beeui.beemvp.com/docs/components/avatar/>
- Expected (per docs): `fallback` is the documented way to show initials when there is no image;
  it should carry a colour that pairs with the component's own `bg-muted` circle.
- Actual: the fallback renders a BeeUI `Text` whose only classes are `font-semibold` plus the
  dead `text-caption` / `text-label` sizing utilities (the same dead utilities as issue #599, so
  they contribute no colour either). With no colour class the node keeps react-native-web's base
  `.css-text-146c3p1 { color: rgb(0,0,0) }`, which 18-01's root-colour workaround cannot
  override because it is an explicit declaration on the node itself. Measured 1.43:1 on the
  `bg-muted` circle in dark.
- Repro: dark theme, the sidebar user block, the header avatar, `/customers` (every row),
  `/staff` (every row), `/customers/<id>`.
- Workaround: `fallbackClassName="text-foreground"` at all six app call sites. The prop exists
  and works; it is the default that is wrong.
- Suggested fix for BeeUI: default the fallback text to a token (`text-muted-foreground` pairs
  with `bg-muted` at 6:1 in both themes) rather than relying on inheritance.

### 18-03 · `ButtonLabel` paints `text-primary-foreground` whatever the variant, 1.2:1 on outline in dark
- Area: bug
- Severity: major
- Source consulted: <https://beeui.beemvp.com/docs/components/button/>
- Expected (per docs): `ButtonLabel` is the documented label slot of `Button`; the label colour
  should follow the variant, as the background and border already do.
- Actual: the rendered label is `font-semibold text-primary-foreground` for every variant. On a
  filled button that is right; on `variant="outline"` and `variant="ghost"` in dark it is
  `#1f2937` on `#0b0f14`, measured 1.22:1. A plain string child of the same button renders with
  the correct colour, so `<Button variant="outline">Xuất CSV</Button>` is legible while
  `<Button variant="outline"><ButtonLabel>Xuất báo cáo</ButtonLabel></Button>` is not.
- Repro: dark theme, `/reports` at 1440 (`Xuất báo cáo`), `/settings` (`In thử`), plus the POS
  outline buttons owned by another worker this phase (receipt `In hoá đơn` / `Chia sẻ`, the cart
  bar, the note and order-discount dialog triggers).
- Workaround: `className="text-foreground"` on the two `ButtonLabel`s in W-C's files.
- Suggested fix for BeeUI: derive the label colour from the button variant the same way the
  background is derived, so the two ways of writing a label cannot disagree.

### 18-04 · No hover state on `DropdownMenuTrigger`, and no pointer callbacks to build one
- Area: gap
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/components/dropdown-menu/>
- Expected (per docs): the trigger is a `Button` underneath, and on web a pointer user expects a
  control to answer the cursor before it is pressed.
- Actual: the trigger renders a pressed state (`active:`) but no hover state, and
  `DropdownMenuTriggerProps` exposes no `onHoverIn`/`onPointerEnter` to add one. The header store
  chip (`HN01 · Tạp hoá Cầu Giấy`) therefore read as a caption rather than a control.
- Repro: hover the store chip on `/orders` at 1440 before the workaround: nothing changes.
- Workaround: a wrapping `View` with `onPointerEnter`/`onPointerLeave` that paints `bg-muted`
  behind the trigger (`src/components/shell/shell-header.tsx`).
- Suggested fix for BeeUI: a hover style on the web build of the trigger, or forward the RN
  pointer props so a consumer can add one without a wrapper element.

### 18-05 · Two standing gaps confirmed again (evidence, no new issue)
- Area: gap
- Severity: minor
- Source consulted: the existing findings 15-02 (dead type utilities) and 17-02 (menu slots).
- Actual: BeeUI ships no icon set, so "a menu opens from this control" needs an app-owned
  chevron (this phase rotates the app's `chevron-right` a quarter turn rather than editing the
  icon file another worker owns), and `SearchInput` still exposes no imperative focus handle, so
  the command palette focuses its field through the wrapper's DOM node exactly as the existing
  F3 shortcuts do.
- Suggested fix for BeeUI: nothing beyond what #599 and #603 already ask for. Recorded so the
  next reader knows both workarounds are deliberate.
