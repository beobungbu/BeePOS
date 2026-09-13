# BeeUI issues filed from BeePOS findings

Tracker comment: https://github.com/beobungbu/BeeUI/issues/234 (batch 1, 2026-09-11)

| BeeUI issue | BeePOS finding(s) | Severity | Title |
|---|---|---|---|
| [#560](https://github.com/beobungbu/BeeUI/issues/560) | scaffold 00-05 (re-classified), precheck 00-05 | major | llms-components.txt and /docs/ai/ never link the per-component Props pages |
| [#561](https://github.com/beobungbu/BeeUI/issues/561) | precheck 00-02 | minor | npm `latest` dist-tag points at prerelease |
| [#562](https://github.com/beobungbu/BeeUI/issues/562) | scaffold 00-04 | major | fresh checkout fails tsc until `uniwind generate-artifacts` |
| [#563](https://github.com/beobungbu/BeeUI/issues/563) | scaffold 00-07 | major | `className={cond ? 'x' : undefined}` throws styleq |
| [#564](https://github.com/beobungbu/BeeUI/issues/564) | scaffold 00-08 | major | AppHeader inside partial-edge SafeArea throws on mount |
| [#565](https://github.com/beobungbu/BeeUI/issues/565) | scaffold 00-05 (nested button) | minor | *Trigger components are pressables; nested `<button>` |
| [#566](https://github.com/beobungbu/BeeUI/issues/566) | scaffold 00-03, 00-06, 00-10; precheck 00-03, 00-04; OTPInput note | minor | umbrella of 6 small items |
| [#543](https://github.com/beobungbu/BeeUI/issues/543) (comment) | precheck 00-01, 00-05 | major | llms*.txt + /docs/ai/ say UNPUBLISHED |

Already covered upstream, not re-filed: [#547](https://github.com/beobungbu/BeeUI/issues/547) (SafeArea doc contradiction), [#558](https://github.com/beobungbu/BeeUI/issues/558) (DropdownMenuTrigger aria-haspopup).

Not BeeUI's problem, not filed: scaffold 00-09 (`expo export --platform web,ios,android` comma syntax rejected by Expo CLI; BeePOS spec error).

## Batch 2 (2026-09-11, feature phases) · tracker comment https://github.com/beobungbu/BeeUI/issues/234#issuecomment-5628947586

| BeeUI issue | BeePOS finding(s) | Severity | Title |
|---|---|---|---|
| [#567](https://github.com/beobungbu/BeeUI/issues/567) | 03-01, 04-01 (re-classified) | major | llms-components.txt claims DatePicker is native-only; it ships date-picker.web.tsx and works |
| [#568](https://github.com/beobungbu/BeeUI/issues/568) | 01-01, 03-02 | minor | IconButton has no `size` prop |
| [#569](https://github.com/beobungbu/BeeUI/issues/569) | 02-01, 03-05 | minor | TimelineStatus values not published |
| [#570](https://github.com/beobungbu/BeeUI/issues/570) | 02-02 | major | Field exposes accessible name twice (getByLabel → 2 nodes) |
| [#571](https://github.com/beobungbu/BeeUI/issues/571) | 04-03, 04-05 | minor | Field/FormGroup relationships do not reach Switch/Checkbox lists |
| [#572](https://github.com/beobungbu/BeeUI/issues/572) | 02-04 | minor | TableRow has no onPress; row navigation undocumented |
| [#573](https://github.com/beobungbu/BeeUI/issues/573) | 04-04, 03-04, 03-03, 02-03, 02-05 | minor | umbrella 2 |

Own-code bugs (not BeeUI): 01-03, 03-06 (zustand selector returning a new array each call → React 19 `useSyncExternalStore` loop). Positive confirmations: 01-04, 01-05, 04-02, 04-07.

## Batch 3 (2026-09-11, phase 06 docs-vs-llms consistency audit) · tracker comment https://github.com/beobungbu/BeeUI/issues/234#issuecomment-5629005153

| BeeUI issue | BeePOS finding(s) | Severity | Title |
|---|---|---|---|
| [#574](https://github.com/beobungbu/BeeUI/issues/574) | findings-06 06-01..06-06; matrix rows (see docs/beeui-audit/docs-llms-matrix.md) | major | Docs site vs llms*.txt consistency matrix, step 1-2 (501 rows) |

Matrix rows already covered by earlier issues (not re-filed, cross-referenced instead): #543 (STATUS/unpublished claims, matrix rows A001-A005, A011), #560 (informs category D "contract sections present" rows), #561 (npm `latest` dist-tag, matrix row A013), #562 (`uniwind generate-artifacts` undocumented, matrix row C007).

Step 3 (reality check against npm package + BeePOS runtime, propose sync fixes) is explicitly deferred; see findings-06 "Step 3 (deferred)" section.

## Batch 3 (2026-09-11, clean-room fresh reader, phase 07B)

| BeeUI issue | Source | Severity | Title |
|---|---|---|---|
| [#575](https://github.com/beobungbu/BeeUI/issues/575) | cleanroom-web-log steps 5-7 | major | Web start "Vite configuration" has no configuration |
| [#576](https://github.com/beobungbu/BeeUI/issues/576) | cleanroom logs steps 2-4, 10-11 | major | no project-creation step, install order ERESOLVE, expo-router root |
| [#577](https://github.com/beobungbu/BeeUI/issues/577) | cleanroom-expo-log step 7 | minor | @source path without CSS file location |
| [#578](https://github.com/beobungbu/BeeUI/issues/578) | readability-rubric B4 | minor | Verified example source not runnable as pasted |

## Batch 4 (2026-09-11, doc-truth verification, phase 07A)

| BeeUI issue | Source | Severity | Title |
|---|---|---|---|
| [#579](https://github.com/beobungbu/BeeUI/issues/579) | props-accuracy required-mismatch | major | 3 props marked required but optional in .d.ts |
| [#580](https://github.com/beobungbu/BeeUI/issues/580) | props-accuracy default/type/missing | minor | Props generator gaps (30 defaults, 2 type names, 2 undocumented props) |

## Batch 5 (2026-09-11, guides and patterns samples, phase 10)

| BeeUI issue | Source | Severity | Title |
|---|---|---|---|
| [#581](https://github.com/beobungbu/BeeUI/issues/581) | 10-01, 10-04 | major | Branding example throws; stale "unpublished" on branding + learn/foundations |
| [#582](https://github.com/beobungbu/BeeUI/issues/582) | 10-02, 10-03 | minor | pattern blocks reference undefined types; table guide fragment |
| [#583](https://github.com/beobungbu/BeeUI/issues/583) | 10-05, 10-06 | minor | troubleshooting metro fragment, theming CSS missing @source |

## Batch 6 (2026-09-11, per-prop, readability, native passes)

| BeeUI issue | Source | Severity | Title |
|---|---|---|---|
| [#584](https://github.com/beobungbu/BeeUI/issues/584) | 11-03 + Ambrose reproduction | blocker (native) | Sheet never presents on iOS in a real Expo 57 consumer |
| [#585](https://github.com/beobungbu/BeeUI/issues/585) | 09A readability-site, 09C readability-templates, exam results | major | Readability and knowledge-transfer audit, 7 site-level fixes |
| [#586](https://github.com/beobungbu/BeeUI/issues/586) | 11-01, 11-02 | minor | Toast top placement on iOS; DatePicker deprecated onChange |
| [#543](https://github.com/beobungbu/BeeUI/issues/543) (comment) | F-09-01..10 | major | 20 stale publication sentences on 17 pages |

Not filed: 08-01 (`Text.numeric` crash on a TypeScript-invalid value, robustness only; noted in #234 comment).

## Batch 7 (2026-09-11, integrated E2E + native fallbacks + Android)

| BeeUI issue | Source | Severity | Title |
|---|---|---|---|
| [#587](https://github.com/beobungbu/BeeUI/issues/587) | 05-01, 05-03 | minor | AlertDialog Web role; SelectValue default placeholder |

Reconfirmed in a real flow: #570 (05-02). Android pass (phase 12): no new BeeUI defects.

## Batch 8 (2026-09-11, iOS keyboard avoidance and Dynamic Type, phase 13)

| BeeUI issue | Source | Severity | Title |
|---|---|---|---|
| [#588](https://github.com/beobungbu/BeeUI/issues/588) | 13-01 | major | KeyboardAwareScreen does not scroll the focused input into view |
| [#589](https://github.com/beobungbu/BeeUI/issues/589) | 13-02 | major | Fixed heights clip text at large Dynamic Type |

## Batch 9 (2026-09-11, closing reconciliation)

| BeeUI issue | Source | Severity | Title |
|---|---|---|---|
| [#590](https://github.com/beobungbu/BeeUI/issues/590) | F-09-18..21, F-09-23, 08-01 | minor | umbrella 3: overlapping pages, sidebar order, Learn example types, Reference Core descriptions, Text.numeric robustness, site stalls |

Coverage check (2026-09-11 20:05): 83 findings across `findings-*.md`; every BeeUI-attributable finding maps to an issue or a supplementary comment above. Not filed by design: BeePOS app bugs (fixed in this repo), positive confirmations (01-04, 01-05, 04-02, 04-07, F-09-22, 06-07), nits that are composition notes (04-06), and worker findings corrected by review notes (00-05 original claim, 04-01, 08-01 severity).

## Batch 10 (2026-09-12, design pass)

| BeeUI issue | Source | Severity | Title |
|---|---|---|---|
| [#591](https://github.com/beobungbu/BeeUI/issues/591) | 14-01 | minor (gap) | No family composes a closable, scrollable tab strip (POS open orders) |
| [#592](https://github.com/beobungbu/BeeUI/issues/592) | 14-02..14-04 | minor | umbrella 4: OTPInput segmented appearance, Switch accent warning on web, DropdownMenuTrigger is a Button |

Checked and not filed: `llms-tokens.txt` 404 (not referenced anywhere), `bg-card` / `bg-accent` (BeePOS worker error, fixed in phase 2).

## Batch 11 (2026-09-12, restyle phase)

| BeeUI issue | Source | Severity | Title |
|---|---|---|---|
| [#593](https://github.com/beobungbu/BeeUI/issues/593) | 14-05 | major | DialogTrigger variant="outline" paints the primary label colour in dark |
| [#594](https://github.com/beobungbu/BeeUI/issues/594) | 14-07, 14-20 | major | chart token path documented as `colors.chart-series-1`, real path `chart.series-1` |
| [#595](https://github.com/beobungbu/BeeUI/issues/595) | 14-21, 14-22 | major | TableCell cannot right-align through className alone |
| [#596](https://github.com/beobungbu/BeeUI/issues/596) | 14-30 | major | TableRow selected paints nothing |
| [#597](https://github.com/beobungbu/BeeUI/issues/597) | 14-06, 14-08, 14-23, 14-32, 14-33 | minor | umbrella 5 |
| [#572](https://github.com/beobungbu/BeeUI/issues/572) (comment) | 14-31 | dup | TableRow has no onPress |

## Batch 12 (2026-09-12, polish)

| BeeUI issue | Source | Severity | Title |
|---|---|---|---|
| [#598](https://github.com/beobungbu/BeeUI/issues/598) | 15-01 | major | SafeArea drops className padding |
| [#599](https://github.com/beobungbu/BeeUI/issues/599) | 15-02, 15-03 | major | type scale not reachable as text-<step> classes |

## Batch 13 (2026-09-12, native verification)

| BeeUI issue | Source | Severity | Title |
|---|---|---|---|
| [#600](https://github.com/beobungbu/BeeUI/issues/600) | 15N-01 | major | SegmentedControl truncates labels at accessibility-large |
| [#601](https://github.com/beobungbu/BeeUI/issues/601) | 15N-02 | minor | Field required injects untranslated "required" |
| [#589](https://github.com/beobungbu/BeeUI/issues/589) (comment) | 15N-03 | evidence | fixed heights still clip |
| [#599](https://github.com/beobungbu/BeeUI/issues/599) (comment) | sweep | evidence | Avatar uses dead text-caption class |
| [#602](https://github.com/beobungbu/BeeUI/issues/602) | 16N-01 | major | ButtonLabel clamps to one line, ignores numberOfLines at large text |

## Batch 14 (2026-09-12, desktop density)

| BeeUI issue | Source | Severity | Title |
|---|---|---|---|
| [#603](https://github.com/beobungbu/BeeUI/issues/603) | 17-01, 17-02 | minor | umbrella 6: per-table density step, DropdownMenuItem description slot |
| [#573](https://github.com/beobungbu/BeeUI/issues/573) (comment) | 17-03 | evidence | Chip tonal variant |

## Batch 15 (2026-09-13, feature wave)

| BeeUI issue | Source | Severity | Title |
|---|---|---|---|
| [#604](https://github.com/beobungbu/BeeUI/issues/604) | 18-01 | major | Table th text inherits document colour in dark |
| [#605](https://github.com/beobungbu/BeeUI/issues/605) | 18-02 | major | Avatar fallback initials black in dark |
| [#593](https://github.com/beobungbu/BeeUI/issues/593) (comment) | 18-03 | evidence | ButtonLabel child ignores variant colour |

## Batch 16 (2026-09-13, code review)

| BeeUI issue | Source | Severity | Title |
|---|---|---|---|
| [#606](https://github.com/beobungbu/BeeUI/issues/606) | 19-01 | major | focused Input stops keydown bubbling |
| [#607](https://github.com/beobungbu/BeeUI/issues/607) | 19-02, 18-04 | minor | umbrella 7: nested role=dialog, trigger hover |
| [#597](https://github.com/beobungbu/BeeUI/issues/597) (comment) | 19-03 | evidence | SearchInput focus handle |

## Batch 17 (2026-09-13, native smoke)

| BeeUI issue | Source | Severity | Title |
|---|---|---|---|
| [#608](https://github.com/beobungbu/BeeUI/issues/608) | 20N-01 | major | DialogContent does not clip children on iOS |
| [#607](https://github.com/beobungbu/BeeUI/issues/607) (comment) | 20N-02 | minor | autoFocus inert inside DialogContent on iOS |
| [#609](https://github.com/beobungbu/BeeUI/issues/609) | 21F-01 | major | Uniwind.setTheme(system) does not resume OS following |

## Batch 18 (2026-09-13, auth + toolbar)

| BeeUI issue | Source | Severity | Title |
|---|---|---|---|
| [#610](https://github.com/beobungbu/BeeUI/issues/610) | 22-01 | major | PasswordInput hardcoded English Show/Hide |
| [#611](https://github.com/beobungbu/BeeUI/issues/611) | 22-02, 22-05, 22-06, 23-01, 23-03, 23-04 | minor | umbrella 8 |
