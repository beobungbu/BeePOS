# Findings 17 · desktop density (>= 1280)

Phase: `plans/260912-1054-beepos-design-pass/phase-04-desktop-density.md`.
Surface exercised: `AppHeader`, `DropdownMenu`, `Separator`, `Table`/`TableRow`, `SegmentedControl`,
`SearchInput`, `Select`, `IconButton`, `Chip`/`ChipGroup`, plus the `applyDensity` guide.

Nothing in the published packages was patched. Only the public docs site and the npm packages
were consulted, per `docs/beeui-audit/protocol.md`.

### 17-01 · No per-table (or per-breakpoint) row density; `applyDensity` is global and three-valued
- Area: gap
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/components/table/>, <https://beeui.beemvp.com/docs/guides/density/>
- Expected (per docs): the density guide says `rowHeight` is "Consumed by `ListItem`, `Table`",
  which reads as the sanctioned way to make a table denser.
- Actual: the only API is `applyDensity(uniwind, runtimeTheme, mode)` with three fixed steps
  (compact 44, comfortable 56, spacious 64). It writes `--spacing-density-row-height` for a whole
  runtime theme, so it cannot say "48 pt on a pointer screen, 56 at 768 and on the phone list".
  `Table`, `TableRow`, `TableCell` and `TableHead` expose only `className`, `layout`, `selected`,
  `colSpan`, `label` and the sort props; none of them takes a density or row-height prop.
- Repro: a responsive admin table that wants 48 pt rows at >= 1280 and 56 pt at 768 has no
  density lever at all, and the nearest global step (compact, 44) would also shrink the phone
  `ListItem` rows, which the design direction fixes at 56.
- Workaround: `src/components/table-row-density.ts` returns `min-h-12` at desktop and an empty
  string elsewhere, and each table spreads it onto its body `TableRow`. It is a floor, not a
  height: a row whose primary cell folds a second value under the first (order code over its
  time, product name over its SKU) still measures 52 to 60 pt.
- Suggested fix for BeeUI: either a `density` prop on `Table` that overrides the theme variable
  for that subtree, or document that `--spacing-density-row-height` may be overridden per
  container, so a consumer can scope density without a global mode switch.

### 17-02 · `DropdownMenuItem` has no secondary-line slot, so a two-line menu item is hand-built
- Area: gap
- Severity: minor
- Source consulted: <https://beeui.beemvp.com/docs/components/dropdown-menu/>
- Expected (per docs): `DropdownMenuItem` is the documented row of a menu, and a store switcher
  listing several branches has to show the address under the branch name to be usable at all.
- Actual: `DropdownMenuItemProps` is `children`, `className`, `closeOnSelect`, `onPress`,
  `onSelect`, `textClassName`. There is no `description`, no `label`, and no leading or trailing
  slot, unlike `ListItem` which documents `title`, `description`, `leading` and `trailing`.
  `textClassName` only applies to a string or number child, so the moment the item needs two
  lines that prop stops doing anything.
- Repro: `<DropdownMenuItem><View><Text>HN01 · Tạp hoá Cầu Giấy</Text><Text>12 Xuân Thuỷ…</Text></View></DropdownMenuItem>`
- Workaround: exactly that, in `src/components/shell/shell-header.tsx`. It renders correctly, but
  the two-line layout, the caption type step and the gap are now app-owned, so two menus in the
  same app can drift apart.
- Suggested fix for BeeUI: give `DropdownMenuItem` the `title` / `description` pair `ListItem`
  already has, or document the composite as the supported pattern with a code sample.

### 17-03 · `Chip` still has no tonal variant, so a warning-coloured filter chip stays hand-rolled
- Area: gap (evidence for the existing 04-04 / 03-04 chip line, not a new issue)
- Severity: nit
- Source consulted: <https://beeui.beemvp.com/docs/components/chip/>
- Expected (per docs): the inventory low-stock control is a filter chip that must read as a
  warning whether or not it is the active filter (`17 sắp hết`), which is what replaced the
  `AlertBanner` on that screen.
- Actual: `Chip` documents no tone or colour variant and takes its selected styling from
  `ChipGroup` selection, so "selected" and "warning" cannot be expressed at the same time.
- Repro: any chip that has to carry a semantic colour of its own.
- Workaround: `LowStockChip` in `src/features/inventory/inventory-screen.tsx`, a `Pressable` with
  `accessibilityState.selected` and `bg-warning` / `bg-warning/15`.
- Suggested fix for BeeUI: a `tone` prop on `Chip` covering the semantic set (`warning`,
  `destructive`, `success`, `info`), orthogonal to selection. File as a comment on the existing
  chip issue rather than a new one.

## Checked and not filed
- `Separator orientation="vertical"` behaves as documented inside a fixed-height flex row once it
  is given a height class; no finding.
- `AppHeader` honours `className` vertical padding: `py-2` measured 56 pt, `py-1` 53, `py-0` 49
  with the 48 pt floor plus its bottom border. The 48 pt header row needed no workaround.
- `DropdownMenuTrigger variant="ghost"` with a plain string child renders the store chip as
  documented (`ButtonProps`); no finding.
