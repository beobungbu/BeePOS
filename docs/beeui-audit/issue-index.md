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
