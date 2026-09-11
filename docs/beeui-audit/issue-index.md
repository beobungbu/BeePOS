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
