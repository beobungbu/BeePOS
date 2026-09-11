# BeeUI production-readiness field audit: consolidated report

Date: 2026-09-11 · Auditor: Ambrose (Hive Enterprise) with 8 worker passes · Subject: `@beemvp/beeui-ui@0.86.2-rc.1` and https://beeui.beemvp.com · Vehicle: BeePOS, a grocery-chain POS built in one day from the public surfaces only.

## 1. Executive summary

**Verdict: the components are production-grade; the documentation is not yet.**

- **Component correctness: strong.** 30 screens, 70 public symbols, 140 unit tests, `expo export` for iOS/Android/Web, 86 Chromium screenshots at 390 and 1280 in light and dark, zero console errors on every merged phase. 72 behavior claims taken verbatim from the docs' "State and behavior contract" and "Accessibility" sections were turned into executable tests: **72 hold, 0 fail**. The export surface (62 modules) agrees three ways between docs, llms files and the shipped `.d.ts`. Two runtime bugs were found, both in one styling-engine bridge (`undefined` className, #563, #564), plus one a11y naming defect (#570).
- **Docs accuracy: mostly right, with a generator that lies in the margins.** Across 62 components and 137 Props types: 3 props wrongly marked required (#579), 30 declared defaults shown as empty, 2 phantom type names, 2 undocumented props (#580). No documented behavior was false.
- **AI surfaces (llms*.txt, /docs/ai/): the weakest area.** All four llms files and the AI landing page still say the package is unpublished and forbid `npm install` (#543); 115 of 124 links in the llms files 404 on the site (#574); the files never link the per-component Props pages (#560); one hand-written platform note is flatly wrong and steered a worker into rebuilding a component that exists (`DatePicker`, #567). Of 501 matrix rows, llms is the wrong side in 110 and docs in only 4.
- **Setup docs usability: the most expensive defect class.** A fresh developer following only the site lost about 90 minutes on each platform path before reaching a styled screen, all of it in setup pages: the Web page's "Vite configuration" section contains no configuration (#575), no project-creation step, an install order that fails with `ERESOLVE`, a provider example that ignores the expo-router root (#576), `@source` paths without the file location (#577), and an undocumented `uniwind generate-artifacts` step that breaks `tsc` on a fresh clone (#562). Once past setup, every component behaved as documented.

## 2. Method

| Pass | What it did | Evidence |
|---|---|---|
| 00 pre-check | Read llms*.txt, /docs/start/, npm state before any code | findings-00-docs-precheck.md |
| 00 scaffold | Expo 57 + expo-router + BeeUI from npm, shell, theme, mock data | findings-00-scaffold.md, phase-00 report |
| 01..04 features | POS, products + inventory, orders + customers, reports + admin, built by four workers who could not read BeeUI source | findings-01..04, 140 tests, screenshots |
| 06 matrix | 501-row docs-vs-llms consistency matrix, regenerable (`scripts/audit/build-docs-llms-matrix.mjs`) | docs-llms-matrix.md, #574 |
| 07A truth | Props tables vs `.d.ts` via TypeScript API; 72 behavior claims as Jest tests; reality verdict on all 501 rows | props-accuracy.md, behavior-claims.md, scripts/audit/claims |
| 07B fresh reader | Two clean-room projects (Expo, Vite) from the docs only; per-step log with minutes lost; readability rubric | cleanroom-*-log.md, readability-rubric.md |

Rules that make the evidence credible: workers consumed only public surfaces and the npm package; every finding quotes the doc sentence and URL; worker self-reports were re-run by the auditor (tsc, jest, export, the audit scripts); GitHub issues were filed only after de-duplication against the parallel BeeECOM audit (#543..#559).

## 3. Findings by area

54 findings logged in `docs/beeui-audit/findings-*.md`; 21 issues filed (#560..#580) plus 5 supplementary comments, indexed in `issue-index.md` and summarised on BeeUI #234.

| Area | Findings | Filed | Severity of the worst |
|---|---|---|---|
| Publication state and versioning | 6 | #543 (comment), #561, #566 | major |
| llms*.txt and /docs/ai/ accuracy | 9 | #560, #567, #574 | major |
| Setup and getting-started docs | 11 | #562, #575, #576, #577, #578 | major |
| Component Props tables | 38 diffs | #579, #580 | major |
| Component behavior | 0 false claims; 3 runtime defects | #563, #564, #570 | major |
| Component API gaps (consumer wishes) | 7 | #565, #568, #569, #571, #572, #573 | minor |
| Compatibility page | 2 | #566 | minor |

## 4. What a first-time consumer experiences (measured)

1. Reads `/docs/start/`: correct and clear (rubric 4..5), learns to use `@next`.
2. Reads `llms.txt` or `/docs/ai/` instead: told the package does not exist. An AI agent stops here.
3. Expo path: no scaffold step; installs; Metro config and CSS given but the CSS file location is unstated; the provider example does not match the expo-router scaffold. About 90 minutes to a styled screen.
4. Web path: same, plus the Vite section has no config. A good-faith reconstruction compiles and runs unstyled with no error. About 89 minutes.
5. Runs `tsc` before Metro on a fresh clone: fails on every `className` until `uniwind generate-artifacts` is discovered.
6. Composes the shell exactly as the provider guide shows: a `styleq` error on mount from `AppHeader` inside a partial-edge `SafeArea`.
7. From here on, every component used (Field, Input, Select, Dialog, AlertDialog, Sheet, Popover, Table + Pagination, Tabs, Stat, Progress, Stepper, Accordion, Timeline, Calendar, DatePicker, OTPInput, Toast, Skeleton) works as its page says. Props tables are complete enough to build 30 screens; the gaps are defaults and three wrong "required" flags.

## 5. Recommendations for BeeUI, in order of impact

1. **One publication-state authority** feeding README, /docs/start/, /docs/ai/, all llms files and the CLI, with a CI check that no surface says "unpublished" while npm has a version (#543, #574).
2. **Rewrite the two platform start pages as a linear tutorial**: create project, one install command, exact file paths for `global.css` and config, provider inside `app/_layout.tsx`, `uniwind generate-artifacts` in `postinstall`, and a "how to know it worked" check (#562, #575, #576, #577).
3. **Make llms files link the site**: per-component docs URLs, site URLs instead of repo paths, and generate the platform-behavior notes from registry metadata instead of prose (#560, #567, #574).
4. **Fix the Props generator**: required flags per union branch, `@default` and `cva` defaults, resolved unions, all own members (#579, #580).
5. **Fix the two `styleq` runtime paths** and the duplicate accessible name in `Field` (#563, #564, #570).
6. Small API additions consumers reached for on day one: `IconButton.size`, `TableRow.onPress`, `ListItem.active`, static `Chip`, `Field`/`FormGroup` reaching `Switch`/`Checkbox` (#565, #568, #571, #572, #573).

## 6. Positive confirmations worth keeping

Export surface identical across docs, llms and `.d.ts`; 72/72 documented behaviors hold; density and runtime theme switching work as documented; `SearchInput.onSearch` fits a barcode-scanner flow; `Sheet`, overlays and focus behavior correct on Web; Table + Pagination scale to 120 products with caller-owned sort; the provider-safe-area page is the best-written page on the site (rubric 4..5).

## 7. Reproduce

```bash
git clone https://github.com/beobungbu/BeePOS && cd BeePOS && npm ci
npm run typecheck && npm test && npm run export:all
node scripts/audit/build-docs-llms-matrix.mjs      # 501-row matrix from cache or live
node scripts/audit/check-props-vs-dts.mjs           # props accuracy, 62 components
npx jest -c scripts/audit/claims/jest.config.js     # 72 behavior claims
```

## 8. Out of scope and open questions

- Native runtime (iOS Simulator, Android) was not exercised; all runtime evidence is Chromium. Native-only claims (Sheet gestures, pageSheet, DatePicker system picker) remain unverified by this audit.
- 58 matrix rows stay `reality-unknown` (ADR contents and accessibility contract prose have no public source to test against).
- Accessibility was checked structurally (roles, names, keyboard) but not with a screen reader.

## 9. Addendum: round 2 passes (same day, after the first consolidated verdict)

| Pass | Scope | Result |
|---|---|---|
| Per-prop verification (phase 08) | 62 components, 570 own props, 947 generated Jest tests against the installed package | 98.6% of props executed; 0 documented behaviors false; 1 robustness crash on a TypeScript-invalid `Text.numeric` value; 3 props too vague to test |
| Guides and patterns samples (phase 10) | 73 code blocks on 9 guides, theming/reference and 37 pattern pages, compiled and rendered in a clean room; CLI run for real | 22 run as pasted, 50 need context the page omits, 1 broken (Branding example throws); 37/37 patterns render; CLI guide holds end to end (#581 to #583) |
| Readability and knowledge transfer (phase 09) | 52 hand-written pages scored on a 10-criterion rubric; 14 template samples; 25-question comprehension exam by a fresh reader | site 3.82/5 (Learn 4.40, Start 4.27, worst pages 3.00); templates 3.0 and 3.3; exam 50/50: the conceptual layer transfers knowledge; 20 stale publication sentences on 17 pages (#585, #543) |
| Native and browser claims (phase 11) | iOS Simulator happy path; 8 Web-only claims via Playwright | 8/8 browser claims hold; iOS: Dialog, SafeArea, DatePicker hold; **Sheet never presents on iOS** (isolated and reproduced by the auditor, root-cause lead: gorhom dynamic sizing with flex:1 content) (#584); Toast top placement, deprecated DatePicker onChange (#586) |

**Verdict update.** The component verdict from section 1 needs one qualifier: on iOS, `Sheet` is non-functional in a real Expo 57 consumer with the documented root wiring, and no deterministic or compile gate in BeeUI catches it. Everything else in the component layer held under 947 per-prop tests, 80 behavior-claim tests and a device pass. Coverage after round 2: props 98.6% executed; components with executed behavior evidence 62/62; guides 9/9 with every code block run; patterns 37/37 rendered; docs pages with a readability score 52 hand-written + template-level for the 99 generated; native runtime: one happy path on one simulator, keyboard avoidance and font scaling still unobserved.

Totals: 27 BeeUI issues (#560 to #586) and 10 supplementary comments, all indexed in `issue-index.md` and summarised on BeeUI #234.

## 10. Addendum: round 3 (integration QA and native fallbacks)

- Integrated Web E2E (`scripts/qa/e2e`, `npm run qa:e2e`): one 12-step journey per run, 8 runs (1280/390 x vi/en x light/dark), all green with zero console errors. Four BeePOS bugs fixed on the way (a11y roles on tiles and cart bar, future-dated seed orders, unsafe `router.back()`, tab bar overflow at 390 with Vietnamese labels). New BeeUI finding: AlertDialog Web role (#587); #570 reconfirmed in a real flow.
- Native: the cart and More menu fall back to a route and a Dialog on iOS and Android because of #584; verified on iPhone 16 Pro simulator and an Android emulator (11 screenshots). Android hardware back closes the child Dialog first, as documented. No Android-specific BeeUI defects found.
- Keyboard avoidance and Dynamic Type observed on the iOS Simulator (phase 13): KeyboardAwareScreen pads but does not scroll the focused input into view (#588); AppHeader, Input and SearchInput clip at accessibility-large because of fixed heights and line heights (#589). BeePOS switched the tab bar to icons at fontScale >= 1.3; content under the grown tab bar at large text stays open on the app side.

Totals: 30 BeeUI issues (#560 to #589) and 12 supplementary comments. Native coverage now: one iOS happy path, one Android happy path, keyboard and large-text passes; VoiceOver/TalkBack still not exercised.
