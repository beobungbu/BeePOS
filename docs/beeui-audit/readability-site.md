# BeeUI docs readability audit: hand-written pages (phase 09A)

Date: 2026-09-11. Scope: the 52 hand-written pages listed in https://beeui.beemvp.com/docs/sitemap-0.xml, excluding /docs/components/<name>/ and /docs/patterns/<pack>/<screen>/ (template-generated, scored separately). Reviewer: fresh-context technical-writing pass, no prior BeeUI opinion.

Method: each page fetched with curl, tags stripped, read in full. Ten-criterion rubric from phase-09-readability-comprehension.md, 1 to 5 each, one-sentence justification per criterion; any 1 or 2 quotes the sentence or absence that justifies it. Criterion 10 (knowledge transfer) is left as "pending exam". Word counts are of the main content column. Code blocks are `<pre>` elements in the main column. Links are unique hrefs in the main column (content plus Previous/Next), each checked with a GET following redirects. Publication-status reality is npm: npm view @beemvp/beeui-{ui,core,tokens,cli} dist-tags on 2026-09-11: { next: '0.86.2-rc.1', latest: '0.86.2-rc.1' } (published 2026-09-09).

Note on quotations: em-dash characters in quoted site text are rendered as " - " in this file.

## Headline numbers

- Pages scored: 52. Site average (criteria 1 to 9): 3.82.
- Pages at or above 4.0: 22. Pages below 3.5: 17.
- Links checked: 654 (page-level counts; 335 unique). Non-200: 0.
- False or stale sentences: 20 on 17 pages. All 20 concern publication state.

Section averages: Learn 4.4 · Start 4.27 · Guides 4.01 · Home 3.67 · Patterns (index) 3.67 · Reference 3.67 · Responsive 3.56 · Theming 3.56 · Compatibility 3.5 · AI 3.44 · Accessibility 3.43 · Architecture 3.33 · Registry 3.33 · Release & security 3.33 · Components (index) 3.22 · Reference app 3.22 · Showcase 3.11 · Performance 3

Criterion averages: Purpose 4.31 · Prereq 3.37 · Concept 4.02 · Terms 3.37 · Examples 3.31 · Rules 3.88 · Platform 4.02 · Nav 4.33 · Load 3.75

## Per-page table

Scores: 1 Purpose, 2 Prereq/audience, 3 Concept before mechanism, 4 Terms defined, 5 Examples runnable, 6 Rules actionable, 7 Platform/evidence, 8 Navigation, 9 Reading load. Criterion 10 pending exam. Avg is over 1 to 9.

| Section | URL | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | Avg | Words | Code | Links | Non-200 | Stale |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Home | /docs/ | 4 | 3 | 3 | 3 | 4 | 3 | 4 | 5 | 4 | 3.67 | 438 | 1 | 19 | 0 | 2 |
| Accessibility | /docs/accessibility/ | 3 | 2 | 4 | 2 | 3 | 3 | 5 | 4 | 3 | 3.22 | 149 | 0 | 9 | 0 | 0 |
| Accessibility | /docs/accessibility/keyboard-focus/ | 3 | 2 | 3 | 2 | 2 | 3 | 4 | 4 | 4 | 3.00 | 127 | 0 | 5 | 0 | 0 |
| Accessibility | /docs/accessibility/large-text/ | 4 | 3 | 5 | 4 | 3 | 3 | 5 | 4 | 3 | 3.78 | 478 | 0 | 5 | 0 | 0 |
| Accessibility | /docs/accessibility/native-assistive-tech/ | 3 | 2 | 4 | 3 | 2 | 3 | 5 | 4 | 4 | 3.33 | 124 | 0 | 5 | 0 | 0 |
| Accessibility | /docs/accessibility/reduced-motion/ | 3 | 2 | 4 | 3 | 2 | 4 | 3 | 4 | 4 | 3.22 | 93 | 0 | 4 | 0 | 0 |
| Accessibility | /docs/accessibility/rtl/ | 4 | 4 | 5 | 4 | 3 | 4 | 5 | 4 | 3 | 4.00 | 504 | 0 | 8 | 0 | 0 |
| AI | /docs/ai/ | 4 | 3 | 4 | 2 | 3 | 3 | 5 | 4 | 3 | 3.44 | 324 | 0 | 11 | 0 | 1 |
| Architecture | /docs/architecture/ | 3 | 3 | 4 | 3 | 3 | 3 | 3 | 4 | 4 | 3.33 | 198 | 0 | 5 | 0 | 0 |
| Compatibility | /docs/compatibility/ | 4 | 3 | 4 | 3 | 3 | 4 | 4 | 4 | 4 | 3.67 | 149 | 0 | 5 | 0 | 0 |
| Compatibility | /docs/compatibility/current/ | 4 | 3 | 3 | 4 | 3 | 4 | 5 | 4 | 4 | 3.78 | 145 | 0 | 4 | 0 | 0 |
| Compatibility | /docs/compatibility/native/ | 3 | 2 | 4 | 2 | 3 | 4 | 5 | 4 | 2 | 3.22 | 595 | 0 | 6 | 0 | 0 |
| Compatibility | /docs/compatibility/web/ | 3 | 2 | 3 | 3 | 3 | 4 | 5 | 4 | 3 | 3.33 | 511 | 1 | 4 | 0 | 0 |
| Components (index) | /docs/components/ | 4 | 3 | 3 | 2 | 3 | 3 | 3 | 5 | 3 | 3.22 | 1039 | 0 | 125 | 0 | 0 |
| Guides | /docs/guides/ | 5 | 4 | 4 | 4 | 3 | 4 | 3 | 5 | 4 | 4.00 | 473 | 0 | 20 | 0 | 0 |
| Guides | /docs/guides/branding/ | 5 | 4 | 5 | 4 | 4 | 5 | 4 | 5 | 3 | 4.33 | 1554 | 7 | 12 | 0 | 1 |
| Guides | /docs/guides/cli-source-ownership/ | 5 | 2 | 4 | 3 | 4 | 4 | 3 | 3 | 4 | 3.56 | 534 | 2 | 2 | 0 | 1 |
| Guides | /docs/guides/current-release/ | 4 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 2 | 3.00 | 102 | 0 | 2 | 0 | 1 |
| Guides | /docs/guides/date-time/ | 5 | 3 | 5 | 4 | 5 | 5 | 5 | 5 | 4 | 4.56 | 2305 | 7 | 14 | 0 | 0 |
| Guides | /docs/guides/density/ | 5 | 3 | 4 | 3 | 5 | 5 | 4 | 5 | 4 | 4.22 | 1072 | 2 | 9 | 0 | 0 |
| Guides | /docs/guides/migration-versioning/ | 4 | 4 | 4 | 3 | 4 | 4 | 3 | 3 | 4 | 3.67 | 632 | 5 | 3 | 0 | 2 |
| Guides | /docs/guides/table/ | 5 | 4 | 5 | 4 | 5 | 5 | 5 | 5 | 4 | 4.67 | 2184 | 3 | 15 | 0 | 0 |
| Guides | /docs/guides/troubleshooting/ | 5 | 3 | 4 | 3 | 4 | 5 | 5 | 5 | 3 | 4.11 | 4000 | 9 | 16 | 0 | 2 |
| Learn | /docs/learn/ | 5 | 5 | 5 | 4 | 3 | 3 | 3 | 5 | 5 | 4.22 | 502 | 1 | 21 | 0 | 0 |
| Learn | /docs/learn/accessibility-model/ | 5 | 4 | 5 | 4 | 3 | 5 | 5 | 5 | 4 | 4.44 | 937 | 1 | 18 | 0 | 0 |
| Learn | /docs/learn/composition-model/ | 5 | 4 | 5 | 4 | 4 | 5 | 3 | 5 | 4 | 4.33 | 957 | 3 | 14 | 0 | 0 |
| Learn | /docs/learn/cross-platform-model/ | 5 | 4 | 5 | 5 | 3 | 5 | 5 | 5 | 4 | 4.56 | 1019 | 1 | 13 | 0 | 0 |
| Learn | /docs/learn/forms-model/ | 5 | 4 | 5 | 4 | 4 | 5 | 3 | 5 | 4 | 4.33 | 1101 | 2 | 15 | 0 | 0 |
| Learn | /docs/learn/foundations/ | 5 | 4 | 5 | 4 | 3 | 4 | 4 | 5 | 4 | 4.22 | 866 | 1 | 14 | 0 | 1 |
| Learn | /docs/learn/overlays-and-runtime/ | 5 | 4 | 5 | 4 | 3 | 5 | 4 | 5 | 4 | 4.33 | 1081 | 1 | 19 | 0 | 0 |
| Learn | /docs/learn/ownership-model/ | 5 | 4 | 5 | 4 | 4 | 5 | 5 | 5 | 4 | 4.56 | 1032 | 2 | 14 | 0 | 0 |
| Learn | /docs/learn/responsive-model/ | 5 | 4 | 5 | 4 | 5 | 5 | 4 | 5 | 4 | 4.56 | 895 | 2 | 11 | 0 | 0 |
| Learn | /docs/learn/state-model/ | 5 | 4 | 5 | 4 | 5 | 5 | 3 | 5 | 4 | 4.44 | 1019 | 3 | 8 | 0 | 0 |
| Patterns (index) | /docs/patterns/ | 4 | 3 | 4 | 3 | 3 | 3 | 4 | 5 | 4 | 3.67 | 1118 | 0 | 76 | 0 | 0 |
| Performance | /docs/performance/ | 3 | 2 | 3 | 3 | 2 | 3 | 4 | 3 | 4 | 3.00 | 128 | 0 | 5 | 0 | 0 |
| Reference app | /docs/reference-app/ | 4 | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 3 | 3.22 | 231 | 1 | 6 | 0 | 0 |
| Reference | /docs/reference/ | 5 | 3 | 4 | 4 | 3 | 3 | 3 | 5 | 4 | 3.78 | 217 | 0 | 17 | 0 | 1 |
| Reference | /docs/reference/cli/ | 5 | 3 | 4 | 4 | 3 | 4 | 3 | 4 | 4 | 3.78 | 341 | 0 | 4 | 0 | 1 |
| Reference | /docs/reference/core/ | 5 | 4 | 4 | 5 | 3 | 3 | 4 | 4 | 4 | 4.00 | 830 | 0 | 7 | 0 | 0 |
| Reference | /docs/reference/registry/ | 4 | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 4 | 3.33 | 81 | 0 | 4 | 0 | 0 |
| Reference | /docs/reference/styling/ | 4 | 3 | 4 | 3 | 3 | 3 | 4 | 4 | 3 | 3.44 | 129 | 0 | 5 | 0 | 0 |
| Reference | /docs/reference/tokens/ | 5 | 4 | 4 | 4 | 3 | 3 | 3 | 4 | 3 | 3.67 | 2450 | 0 | 12 | 0 | 0 |
| Registry | /docs/registry/ | 4 | 3 | 4 | 3 | 2 | 4 | 3 | 4 | 3 | 3.33 | 337 | 0 | 8 | 0 | 0 |
| Release & security | /docs/release-security/ | 3 | 3 | 3 | 3 | 3 | 4 | 3 | 4 | 4 | 3.33 | 141 | 1 | 6 | 0 | 1 |
| Responsive | /docs/responsive/ | 4 | 3 | 4 | 3 | 2 | 4 | 4 | 4 | 4 | 3.56 | 222 | 0 | 5 | 0 | 0 |
| Showcase | /docs/showcase/ | 3 | 2 | 3 | 2 | 3 | 3 | 5 | 4 | 3 | 3.11 | 367 | 2 | 5 | 0 | 1 |
| Start | /docs/start/ | 5 | 5 | 3 | 3 | 5 | 4 | 5 | 5 | 4 | 4.33 | 772 | 6 | 8 | 0 | 1 |
| Start | /docs/start/bare-react-native/ | 5 | 5 | 3 | 3 | 3 | 4 | 5 | 3 | 5 | 4.00 | 380 | 5 | 3 | 0 | 1 |
| Start | /docs/start/expo/ | 5 | 5 | 3 | 3 | 4 | 4 | 5 | 4 | 5 | 4.22 | 424 | 6 | 4 | 0 | 1 |
| Start | /docs/start/provider-safe-area/ | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 4 | 4.89 | 1750 | 5 | 11 | 0 | 0 |
| Start | /docs/start/web/ | 5 | 5 | 3 | 3 | 2 | 4 | 5 | 3 | 5 | 3.89 | 360 | 5 | 3 | 0 | 1 |
| Theming | /docs/theming/ | 4 | 3 | 4 | 3 | 3 | 3 | 3 | 5 | 4 | 3.56 | 282 | 1 | 10 | 0 | 1 |

## Ranking (lowest first)

1. 3.00 /docs/accessibility/keyboard-focus/
2. 3.00 /docs/guides/current-release/
3. 3.00 /docs/performance/
4. 3.11 /docs/showcase/
5. 3.22 /docs/accessibility/
6. 3.22 /docs/accessibility/reduced-motion/
7. 3.22 /docs/compatibility/native/
8. 3.22 /docs/components/
9. 3.22 /docs/reference-app/
10. 3.33 /docs/accessibility/native-assistive-tech/
11. 3.33 /docs/architecture/
12. 3.33 /docs/compatibility/web/
13. 3.33 /docs/reference/registry/
14. 3.33 /docs/registry/
15. 3.33 /docs/release-security/
16. 3.44 /docs/ai/
17. 3.44 /docs/reference/styling/
18. 3.56 /docs/guides/cli-source-ownership/
19. 3.56 /docs/responsive/
20. 3.56 /docs/theming/
21. 3.67 /docs/
22. 3.67 /docs/compatibility/
23. 3.67 /docs/guides/migration-versioning/
24. 3.67 /docs/patterns/
25. 3.67 /docs/reference/tokens/
26. 3.78 /docs/accessibility/large-text/
27. 3.78 /docs/compatibility/current/
28. 3.78 /docs/reference/
29. 3.78 /docs/reference/cli/
30. 3.89 /docs/start/web/
31. 4.00 /docs/accessibility/rtl/
32. 4.00 /docs/guides/
33. 4.00 /docs/reference/core/
34. 4.00 /docs/start/bare-react-native/
35. 4.11 /docs/guides/troubleshooting/
36. 4.22 /docs/guides/density/
37. 4.22 /docs/learn/
38. 4.22 /docs/learn/foundations/
39. 4.22 /docs/start/expo/
40. 4.33 /docs/guides/branding/
41. 4.33 /docs/learn/composition-model/
42. 4.33 /docs/learn/forms-model/
43. 4.33 /docs/learn/overlays-and-runtime/
44. 4.33 /docs/start/
45. 4.44 /docs/learn/accessibility-model/
46. 4.44 /docs/learn/state-model/
47. 4.56 /docs/guides/date-time/
48. 4.56 /docs/learn/cross-platform-model/
49. 4.56 /docs/learn/ownership-model/
50. 4.56 /docs/learn/responsive-model/
51. 4.67 /docs/guides/table/
52. 4.89 /docs/start/provider-safe-area/

## Per-page justifications

### /docs/ (Home, avg 3.67)

1. Purpose 4: Opens with what BeeUI is and routes the reader by intent, but never says what this page itself is for.
2. Prereq 3: The install command precedes any prerequisite or audience line; Node, RN and Expo versions live two clicks away.
3. Concept 3: The install block appears before any explanation of what the three packages are or why there are three.
4. Terms 3: 'Registry', 'dist-tag' and 'RC' are used before definition; only 'evidence classes' is explained inline at the end.
5. Examples 4: The single install command is complete and copyable.
6. Rules 3: 'Use @next or the exact RC version ... until the stable 0.86.2 promotion is completed' says what to do but not what breaks if you use the bare name.
7. Platform 4: The evidence-class paragraph is explicit and links to the four supporting pages.
8. Nav 5: The 'What do you want to do?' table is the best routing device on the site and all 19 links resolve.
9. Load 4: Short paragraphs and two tables; easy to scan.
10. Knowledge transfer: pending exam

False or stale:
- Quote: "Stable latest is intentionally not published yet." Reality: npm dist-tags show latest = 0.86.2-rc.1 for all four packages.
- Quote: "Stable channel: latest remains intentionally unassigned to this RC." Reality: npm dist-tags show latest = 0.86.2-rc.1 for all four packages.

### /docs/accessibility/ (Accessibility, avg 3.22)

1. Purpose 3: First paragraph states a principle ('Accessibility is part of BeeUI's component behavior contract') rather than what this index lets the reader find.
2. Prereq 2: No audience or prerequisite sentence exists; the page opens with imperatives ('Use semantic labels/descriptions/states, preserve focus order, keep touch targets usable') without saying who is being addressed.
3. Concept 4: The contract-not-add-on framing precedes the task list and the overlay note.
4. Terms 2: 'Overlays need special attention: modal surfaces own a modal accessibility boundary while anchored overlays participate in the nearest overlay scope' uses three terms that are neither defined nor linked here.
5. Examples 3: No examples; an index page does not strictly need one, but the imperatives in paragraph one would benefit from a single labelled control.
6. Rules 3: Rules say what to do but never what fails when you do not.
7. Platform 5: The evidence paragraph is explicit and exemplary for a 150-word page.
8. Nav 4: Five task guides and three canonical sources resolve, but the Previous link goes to the 'Wallet' pattern page, which is a sidebar-order accident.
9. Load 3: The 40-word overlay sentence carries three undefined terms; the rest is fine.
10. Knowledge transfer: pending exam

### /docs/accessibility/keyboard-focus/ (Accessibility, avg 3.00)

1. Purpose 3: The first sentence is a principle, not a statement of what the reader will be able to do.
2. Prereq 2: The first sentence after the principle is an instruction ('Use the component's semantic trigger/control rather than wrapping it in a second clickable surface') with no audience or prerequisite stated.
3. Concept 3: One line of concept precedes the mechanism; thin but ordered correctly.
4. Terms 2: 'Dialog/Popover/Select/DropdownMenu/Sheet each have their own open/dismiss/focus-return behavior' names five components and links none of them, and 'focus-return' is not defined.
5. Examples 2: There is no example at all; 'Test with actual Tab/Shift+Tab and Escape, not only pointer clicks' gives no expected result to compare against.
6. Rules 3: 'interactive controls must be reachable by keyboard in logical focus order, show visible focus' says what to do, not what breaks otherwise.
7. Platform 4: 'compile success alone is insufficient evidence' names the evidence boundary for native.
8. Nav 4: Three links plus prev/next resolve.
9. Load 4: 127 words, short sentences.
10. Knowledge transfer: pending exam

### /docs/accessibility/large-text/ (Accessibility, avg 3.78)

1. Purpose 4: First paragraph states the design decision (no in-app font scale) and who owns scaling.
2. Prereq 3: No audience line, but the page is self-contained and links its source doc immediately.
3. Concept 5: 'The model' section explains native and Web behaviour before any rule.
4. Terms 4: Dynamic Type, allowFontScaling and rem are explained in context; 'OEM skins' is the only unglossed term.
5. Examples 3: No code; a two-line 'how to test at 2x' example is the missing piece.
6. Rules 3: Rules are maintainer guarantees ('a repo-wide guard test fails if either ever reappears') rather than consumer actions.
7. Platform 5: Three evidence classes are named and scoped honestly.
8. Nav 4: Links to the two tracking issues and the source doc resolve.
9. Load 3: Several 45-plus-word sentences with nested parentheticals slow the read.
10. Knowledge transfer: pending exam

### /docs/accessibility/native-assistive-tech/ (Accessibility, avg 3.33)

1. Purpose 3: The opening states what components expose, not what the reader can do with this page.
2. Prereq 2: No sentence says who should read this or what to have running first; the page goes straight to 'For release-quality native claims, representative flows are exercised with real simulator/emulator/device runtime evidence'.
3. Concept 4: The necessary-but-not-sufficient framing precedes the verification advice.
4. Terms 3: 'A Web axe scan, Jest tree or successful iOS/Android compile' assumes the reader knows all three.
5. Examples 2: 'verify your own screen composition: heading/reading order, modal boundaries, focus after dismissal, error/live announcements' lists what to verify with no example of how, on either platform.
6. Rules 3: Rules state what must not be reported but give no consumer-side action.
7. Platform 5: Evidence classes are explicit throughout.
8. Nav 4: Three source matrices resolve.
9. Load 4: 124 words, readable.
10. Knowledge transfer: pending exam

### /docs/accessibility/reduced-motion/ (Accessibility, avg 3.22)

1. Purpose 3: The first sentence is the policy, not the page purpose.
2. Prereq 2: No audience line; the page opens with 'Motion may clarify state but must not be required to understand or operate a BeeUI flow' and never says whether it addresses app authors or contributors.
3. Concept 4: Policy precedes mechanism.
4. Terms 3: 'semantic announcements' and 'reduced-motion preference' are used without a link to how BeeUI reads the preference.
5. Examples 2: 'Application-owned animation around BeeUI components must follow the same policy' gives no example of how an application reads the preference on native or Web.
6. Rules 4: 'Do not replace an animation with an invisible state change: preserve semantic announcements and final visual state' is concrete and names the failure.
7. Platform 3: Only the Web landing preference is mentioned; how native reads the OS setting is absent.
8. Nav 4: Two canonical sources resolve.
9. Load 4: 93 words, clear.
10. Knowledge transfer: pending exam

### /docs/accessibility/rtl/ (Accessibility, avg 4.00)

1. Purpose 4: First paragraph states the mechanism and the ADR; second paragraph tells app authors exactly what to do.
2. Prereq 4: 'If you are adding right to left support to an application, set the host platform's direction authority' names the audience before the first rule.
3. Concept 5: 'How direction is resolved' precedes the per-component list.
4. Terms 4: I18nManager.isRTL and document.dir are explained; 'ambient authority' is defined by its examples.
5. Examples 3: No code; a three-line direction-prop or I18nManager example would make the precedence concrete.
6. Rules 4: Rules name the limitation ('a Web document.dir change is reflected the next time an affected component re-renders').
7. Platform 5: Platform split and evidence ('Chromium Playwright tests') are explicit, and known gaps are listed with issue numbers.
8. Nav 4: Issue and source links resolve.
9. Load 3: Long parenthetical sentences ('separator glyphs, previous/next chevrons, column order, and navigation-chevron/arrow-key mirroring, respectively') slow scanning.
10. Knowledge transfer: pending exam

### /docs/ai/ (AI, avg 3.44)

1. Purpose 4: First sentence says what is published and for whom.
2. Prereq 3: Audience (people running coding agents) is implied, not stated.
3. Concept 4: The context-selection table precedes the rules.
4. Terms 2: 'The files are public static assets; the Worker must serve them as plain text without rewriting them to HTML' - 'the Worker' is never defined and is maintainer infrastructure on a consumer page.
5. Examples 3: No example of feeding a file to an agent; the four paths are listed without a host.
6. Rules 3: Rules are imperative, but one is false ('Do not invent live npm install or public npx availability'), which makes the list unsafe to follow verbatim.
7. Platform 5: 'Web preview evidence is Web evidence. Native compile/bundle evidence is not native interaction proof' is explicit.
8. Nav 4: Six canonical sources resolve.
9. Load 3: 'pnpm llms:check, pnpm ai-contract:check, Registry verification, docs/example checks, and the platform-specific Showcase/consumer gates' is repository jargon for a consumer reader.
10. Knowledge transfer: pending exam

False or stale:
- Quote: "Public npm packages and the CLI are still unpublished. Do not invent live npm install or public npx availability." Reality: All four packages and the CLI are on npm at 0.86.2-rc.1 (next and latest).

### /docs/architecture/ (Architecture, avg 3.33)

1. Purpose 3: The first paragraph describes the product, not what this page gives the reader.
2. Prereq 3: No audience line; acceptable for a summary page.
3. Concept 4: Layers are listed before boundaries.
4. Terms 3: 'Modal-class surfaces ... and anchored overlays ... use intentionally different runtime primitives' names neither primitive nor links to the overlay page.
5. Examples 3: No examples; none strictly needed.
6. Rules 3: 'Applications own routing, data/auth/business logic and persistence' states the split without the consequence of crossing it.
7. Platform 3: Platforms are named as targets; evidence classes are not mentioned here.
8. Nav 4: Three sources resolve.
9. Load 4: 198 words in short paragraphs.
10. Knowledge transfer: pending exam

### /docs/compatibility/ (Compatibility, avg 3.67)

1. Purpose 4: 'Start with Current tested versions' tells the reader where to go in sentence one.
2. Prereq 3: No audience statement; not needed for an index.
3. Concept 4: Tested-point versus promise is explained before the table.
4. Terms 3: 'Node/React/RN/Expo/RNW/Uniwind/Tailwind/native-infrastructure pins' uses RNW and Uniwind unexpanded.
5. Examples 3: No examples; none needed.
6. Rules 4: 'The tested point and the declared peer range are different concepts' is actionable when read with the next sentence.
7. Platform 4: RN 0.86.x stable line is named; the native and Web sub-pages carry the evidence.
8. Nav 4: Five links resolve.
9. Load 4: Short, but the table duplicates /compatibility/current/ by admission ('repeated here intentionally').
10. Knowledge transfer: pending exam

### /docs/compatibility/current/ (Compatibility, avg 3.78)

1. Purpose 4: First sentence says the page is generated and what the numbers mean.
2. Prereq 3: No audience line; generated table.
3. Concept 3: Table precedes the evidence explanation.
4. Terms 4: The four evidence classes are defined in 'Evidence scope'.
5. Examples 3: No examples; none needed.
6. Rules 4: 'not permission to widen a peer range beyond the package manifests' is a clear rule.
7. Platform 5: RN 0.87 exclusion is explained with its root cause.
8. Nav 4: Four links resolve.
9. Load 4: 145 words, table-led.
10. Knowledge transfer: pending exam

### /docs/compatibility/native/ (Compatibility, avg 3.22)

1. Purpose 3: 'this page is the published summary' says what the page is, not what a reader can decide with it.
2. Prereq 2: The reader is never told whether this is for consumers or CI maintainers; it opens with 'Expo Showcase (apps/showcase) - the app BeeUI itself ships and dogfoods'.
3. Concept 4: The 'Compile is not runtime' callout gives the why before the RN 0.87 detail.
4. Terms 2: 'it runs nightly and on workflow_dispatch/the ci:rn-0.87 PR label so an eventual upstream fix is caught automatically' - workflow_dispatch, PR labels and 'trusted macOS runner' are CI internals left undefined.
5. Examples 3: The only command is 'pnpm release:verify', a repository command.
6. Rules 4: Pinning inside >=0.86.0 <0.87.0 and the exact failure string are given.
7. Platform 5: Evidence classes and the compile/runtime boundary are exemplary.
8. Nav 4: Six links resolve.
9. Load 2: One sentence runs 65 words: 'The iOS bare-consumer compile passes; the Android bare-consumer compile fails because react-native-safe-area-context@5.7.0's Kotlin source does not build against RN 0.87's native surface (Unresolved reference 'uiImplementation' in SafeAreaView.kt) - an upstream/peer incompatibility, not a @beemvp/beeui-ui / @beemvp/beeui-core defect.'
10. Knowledge transfer: pending exam

### /docs/compatibility/web/ (Compatibility, avg 3.33)

1. Purpose 3: 'this page is the published summary' describes the page rather than what it lets the reader decide.
2. Prereq 2: No audience line; it opens with 'Expo's Metro Web export (apps/showcase, expo export --platform web)' as if the reader maintains the repo.
3. Concept 3: The 'Both matter' rationale comes after both mechanisms are described.
4. Terms 3: vite-plugin-rnw, axe-core and wcag2a are named without a gloss; 'monorepo-fallback' is repository slang.
5. Examples 3: The only command is './scripts/verify-web-consumer.sh all', which runs only from a checkout.
6. Rules 4: 'What this does not prove' is a clear, actionable boundary list.
7. Platform 5: Chromium-only and no-SSR boundaries are explicit.
8. Nav 4: Four links resolve.
9. Load 3: List items are 40-plus-word sentences with nested parentheses.
10. Knowledge transfer: pending exam

### /docs/components/ (Components (index), avg 3.22)

1. Purpose 4: First paragraph states the source of the list and the count.
2. Prereq 3: No audience; index.
3. Concept 3: Index; no concept needed.
4. Terms 2: One-line descriptions stack undefined compounds: 'Avatar - Image-with-fallback identity surface with size variants and source-keyed failure reset.'
5. Examples 3: No examples; index.
6. Rules 3: No rules; index.
7. Platform 3: A few entries note Web semantics ('render real table/th scope/aria-sort semantics on Web'); most do not.
8. Nav 5: 125 links, grouped by role, all resolve.
9. Load 3: Descriptions read as noun stacks ('Standalone toggle or value-scoped group item with button/radio/checkbox semantics').
10. Knowledge transfer: pending exam

### /docs/guides/ (Guides, avg 4.00)

1. Purpose 5: 'Use Guides when you already know the outcome you want' is the purpose in sentence one.
2. Prereq 4: Every guide has a 'Use it when' cell.
3. Concept 4: The Guides/Learn/Reference split is explained before the reader is sent anywhere.
4. Terms 4: Tokens, density and source ownership are linked at first use.
5. Examples 3: No examples; index.
6. Rules 4: 'If a guide and a generated reference page disagree, the generated page wins ... Report the guide as the defect' is actionable.
7. Platform 3: No platform content; not needed.
8. Nav 5: 20 links, all resolve.
9. Load 4: Tables and short rows.
10. Knowledge transfer: pending exam

### /docs/guides/branding/ (Guides, avg 4.33)

1. Purpose 5: 'You brand BeeUI by changing token values, never token names and never component source' is the whole page in one line.
2. Prereq 4: The path table's 'Use it when' column triages the reader, though the Uniwind prerequisite is assumed.
3. Concept 5: Step 1 (keep components semantic) explains why before Step 2 applies values.
4. Terms 4: Runtime theme, registry and appearance are defined where first used.
5. Examples 4: Imports are complete; where to call applyThemeOverrides at startup is not shown.
6. Rules 5: Anti-patterns name the failure: 'moving one and not the other is how brands ship unreadable buttons'.
7. Platform 4: The SVG example is labelled Web-only with the native alternative stated.
8. Nav 5: Related and six canonical sources resolve.
9. Load 3: 1554 words with several 40-word sentences; the tables carry it.
10. Knowledge transfer: pending exam

False or stale:
- Quote: "The packages are not published to npm yet, so branding work today happens against a repository checkout or a locally packed artifact - see Start." Reality: All four packages are on npm at 0.86.2-rc.1; Start on the same site gives npm install commands.

### /docs/guides/cli-source-ownership/ (Guides, avg 3.56)

1. Purpose 5: Sentence one defines source ownership and names the CLI and version.
2. Prereq 2: No prerequisite appears before 'Run the public RC CLI': Node >=24 (which Troubleshooting says the CLI enforces) and an existing consumer project are never stated.
3. Concept 4: The definition precedes the commands.
4. Terms 3: 'dependency closure', 'content digest' and 'Registry' are used without definition or link.
5. Examples 4: Commands are complete; the init-before-add order is implied by the table rather than stated.
6. Rules 4: '--force ... discarding the local edit' and 'Exit code 0 means success' are concrete.
7. Platform 3: No platform content needed.
8. Nav 3: Only two links (both to repo docs); no link to the CLI reference or Registry page.
9. Load 4: 534 words, two clean tables.
10. Knowledge transfer: pending exam

False or stale:
- Quote: "0.86.2-rc.1 is a prerelease. Stable latest is not promoted yet, so documentation and automation must keep using @next or the exact RC until the stable release flow completes." Reality: npm dist-tags show latest = 0.86.2-rc.1.

### /docs/guides/current-release/ (Guides, avg 3.00)

1. Purpose 4: 'Is BeeUI on npm? Yes.' answers the page's question first.
2. Prereq 3: Generated table; no audience needed.
3. Concept 3: Table then caveat.
4. Terms 3: 'Release environment: release' is unexplained.
5. Examples 3: No examples; none needed.
6. Rules 3: No rules.
7. Platform 3: No platform content.
8. Nav 3: Two links resolve.
9. Load 2: The page contradicts itself within 100 words: 'Published to npm: yes' then 'Release-ready means ... it does not mean an npm package, CLI, Git tag or GitHub Release exists.'
10. Knowledge transfer: pending exam

False or stale:
- Quote: "Release-ready means the repository has the engineering controls required to produce/verify artifacts; it does not mean an npm package, CLI, Git tag or GitHub Release exists. Publication remains an explicit owner action." Reality: The same page's table says 'Published to npm: yes' and npm confirms 0.86.2-rc.1 is live; the caveat is stale.

### /docs/guides/date-time/ (Guides, avg 4.56)

1. Purpose 5: 'BeeUI's date values carry no timezone' and why, in the first paragraph.
2. Prereq 3: The three-component table orients the reader, but the native peer prerequisite (@react-native-community/datetimepicker) only appears in Related at the end.
3. Concept 5: 'That is the whole design, and it exists to structurally eliminate the single most common date-picker bug' before any API.
4. Terms 4: CalendarDate and ClockTime are defined in the first paragraph; IANA and DST are assumed.
5. Examples 5: Every example has imports, state and the enclosing Field.
6. Rules 5: 'month is 1-based. It is not a Date month index.' and the storage rule name what breaks.
7. Platform 5: The platform table and the evidence boundary paragraph are exemplary.
8. Nav 5: Reference, Related and four canonical sources resolve.
9. Load 4: 2305 words, but one idea per paragraph and tables for every decision.
10. Knowledge transfer: pending exam

### /docs/guides/density/ (Guides, avg 4.22)

1. Purpose 5: 'exactly three density modes ... and they coordinate three metrics only' is the contract in sentence one.
2. Prereq 3: 'Do it' arrives before any prerequisite (Uniwind, tokens package) is stated.
3. Concept 4: Purpose is stated first; the 'Do it' block precedes 'What each mode actually changes', which is acceptable for a guide.
4. Terms 3: 'targets one named runtime theme' uses runtime theme without the Branding definition.
5. Examples 5: Both snippets are complete and copyable.
6. Rules 5: 'Forgetting a runtime theme in the loop above leaves that theme at the default silently' names the failure.
7. Platform 4: The native floor class and the Web CSS variables are both stated.
8. Nav 5: Related and four canonical sources resolve.
9. Load 4: Numbers-first prose; the arithmetic checks out (512/668/784px).
10. Knowledge transfer: pending exam

### /docs/guides/migration-versioning/ (Guides, avg 3.67)

1. Purpose 4: First paragraph states the release state and why there is nothing to migrate from.
2. Prereq 4: 'Which channel am I on?' is the right opening question.
3. Concept 4: Channel concept precedes commands.
4. Terms 3: 'release in lockstep' and 'dist-tag' are not defined.
5. Examples 4: Install and import snippets are complete.
6. Rules 4: 'Upgrade all BeeUI packages together; do not mix RC numbers' lacks the failure it prevents.
7. Platform 3: No platform content needed.
8. Nav 3: Three links, two to the same policy file; CHANGELOG.md and compatibility-matrix.md are named but not linked.
9. Load 4: Tables carry the page.
10. Knowledge transfer: pending exam

False or stale:
- Quote: "Stable latest is intentionally not promoted yet." Reality: npm dist-tags show latest = 0.86.2-rc.1.
- Quote: "Prerelease identifiers (-rc.N) are opt-in test releases and do not change the rule that latest must never point to a prerelease." Reality: On npm, latest points to the prerelease 0.86.2-rc.1, so the stated rule is currently violated.

### /docs/guides/table/ (Guides, avg 4.67)

1. Purpose 5: 'BeeUI's Table is a composable primitive family, not a data grid' plus what you own, in paragraph one.
2. Prereq 4: 'This is the task guide. For the mechanically generated prop and type inventory, use the Table reference' orients the reader; no prerequisites needed.
3. Concept 5: 'That single decision explains almost everything else on this page' before the anatomy table.
4. Terms 4: 'roving-tabindex' and 'windowing' are explained where used.
5. Examples 5: The full example has imports, state, memoisation and selection.
6. Rules 5: 'If a header is not plain text ... give TableHead an explicit label, because there is nothing to infer.'
7. Platform 5: Anatomy table is Web versus native; performance numbers state host, Node version and variance.
8. Nav 5: Reference, Related and four canonical sources resolve.
9. Load 4: 2184 words held together by tables and a 'Who owns what' matrix.
10. Knowledge transfer: pending exam

### /docs/guides/troubleshooting/ (Guides, avg 4.11)

1. Purpose 5: 'Search this page for the exact text your console printed' is the purpose in sentence one.
2. Prereq 3: The schema is explained, but contributor-only entries ('A docs build fails a publication-truth check') sit beside consumer entries without an audience marker.
3. Concept 4: Each entry gives likely cause before fix.
4. Terms 3: 'starter', 'packed tarball' and 'engine-strict' are used without a gloss.
5. Examples 4: Fix snippets are complete; the provider example is copyable.
6. Rules 5: Symptom / Fix / Verify per entry is the most actionable rule format on the site.
7. Platform 5: 'Applies to' names platforms and 'Relevant versions' names the tested pin per entry.
8. Nav 5: 16 links resolve.
9. Load 3: 4000 words; searchable, but contributor entries and pnpm-only CLI commands dilute it for a package consumer.
10. Knowledge transfer: pending exam

False or stale:
- Quote: "BeeUI is unpublished. There is no public npm package and no public CLI, so no entry below tells you to install one. Every fix runs from a BeeUI checkout or from a packed tarball produced by that checkout." Reality: 0.86.2-rc.1 is on npm; the CLI runs as npx @beemvp/beeui-cli@next.
- Quote: "Because BeeUI is unpublished, public registry-install commands and public CLI invocations are rejected outright unless the same line explicitly negates them." Reality: The packages are published; the check described would now reject the correct install commands.

### /docs/learn/ (Learn, avg 4.22)

1. Purpose 5: 'Learn is the concept layer' and what it is not, in the first two paragraphs.
2. Prereq 5: 'If you are new, read Foundations and Ownership model first' plus a reading-order diagram.
3. Concept 5: The page explains the page shape before listing pages.
4. Terms 4: Each page is introduced by its one-sentence concept.
5. Examples 3: No examples; index.
6. Rules 3: No rules; index.
7. Platform 3: No platform content; index.
8. Nav 5: 21 links resolve.
9. Load 5: Two tables and one diagram; the best index on the site.
10. Knowledge transfer: pending exam

### /docs/learn/accessibility-model/ (Learn, avg 4.44)

1. Purpose 5: Three-way split stated in sentence one.
2. Prereq 4: Assumes Cross-platform model; index order.
3. Concept 5: 'Is this library accessible? is unanswerable as asked' precedes the split.
4. Terms 4: Terms are defined by the three-box diagram.
5. Examples 3: No code; the diagram and evidence table suffice.
6. Rules 5: 'Replacing an animation with an invisible state change is a regression, not a fix.'
7. Platform 5: The evidence boundary table is explicit.
8. Nav 5: Ten links resolve.
9. Load 4: Clear.
10. Knowledge transfer: pending exam

### /docs/learn/composition-model/ (Learn, avg 4.33)

1. Purpose 5: One-sentence definition of a compound component opens the page.
2. Prereq 4: Assumes the two prior Learn pages; index says so.
3. Concept 5: Configuration-API versus composition-API rationale before the tree.
4. Terms 4: 'context consumers with behavior attached' is explained; parts table names everything.
5. Examples 4: CurrencySelect example is complete except the undefined CurrencySelectProps type.
6. Rules 5: 'A part rendered outside its root has no context to read, and the failure is a runtime error or dead interaction rather than a type error.'
7. Platform 3: No platform differences noted; the transport difference is deferred to the overlays page.
8. Nav 5: Five next-steps and two sources resolve.
9. Load 4: Short paragraphs, one tree diagram.
10. Knowledge transfer: pending exam

### /docs/learn/cross-platform-model/ (Learn, avg 4.56)

1. Purpose 5: One-sentence contract-versus-evidence definition opens the page.
2. Prereq 4: Assumes Foundations; index order.
3. Concept 5: 'test once, ship anywhere' rationale precedes the evidence table.
4. Terms 5: The four evidence classes are defined in a table with proves / never proves columns.
5. Examples 3: No code; a diagram instead, which fits the topic.
6. Rules 5: 'Never infer a stronger class from a weaker one' with concrete consequences.
7. Platform 5: This page is the evidence-class authority for the site.
8. Nav 5: Six next-steps and four sources resolve.
9. Load 4: Readable; the table carries it.
10. Knowledge transfer: pending exam

### /docs/learn/forms-model/ (Learn, avg 4.33)

1. Purpose 5: 'renders invalid; it does not decide what invalid means' in the first two paragraphs.
2. Prereq 4: Assumes State model; index order.
3. Concept 5: Why BeeUI stops at the line precedes the composition tree.
4. Terms 4: Field, FormGroup, FormMessage roles are defined in the tree.
5. Examples 4: EmailForm is complete except the undefined EmailFormProps type.
6. Rules 5: 'Setting one without the other is the most common reason an error does not appear.'
7. Platform 3: KeyboardAwareScreen platform behaviour is not differentiated.
8. Nav 5: Six next-steps and three sources resolve.
9. Load 4: Clear; one idea per paragraph.
10. Knowledge transfer: pending exam

### /docs/learn/foundations/ (Learn, avg 4.22)

1. Purpose 5: The one-sentence definition opens the page.
2. Prereq 4: Learn index names this as the first page; the page itself does not restate that.
3. Concept 5: 'Why the concept exists' precedes the layer stack.
4. Terms 4: 'contract stack' and 'package barrels' are explained in place.
5. Examples 3: Only a layer diagram; no code needed.
6. Rules 4: 'Reaching into a component's internal file path is not a supported API, even when it resolves' names the trap.
7. Platform 4: 'Evidence classes are not interchangeable' with a link.
8. Nav 5: Six next-steps and three source links resolve.
9. Load 4: Clear paragraphs; one idea each.
10. Knowledge transfer: pending exam

False or stale:
- Quote: "BeeUI's packages are not published to the public registry, and the CLI does not resolve from it either." Reality: All four packages and the CLI are on npm at 0.86.2-rc.1 since 2026-09-09.

### /docs/learn/overlays-and-runtime/ (Learn, avg 4.33)

1. Purpose 5: 'clients of two provider-owned runtimes' in sentence one.
2. Prereq 4: Assumes prior Learn pages; index order.
3. Concept 5: Arbitration-needs-one-authority rationale precedes the tree.
4. Terms 4: host, scope, depth and transport are introduced in the provider tree.
5. Examples 3: Provider tree diagram only; no code example of a nested provider or toast.
6. Rules 5: The nesting-asymmetry table states behaviour and consequence per runtime.
7. Platform 4: 'Web uses a DOM portal; React Native's New Architecture uses a teleport transport' with the legacy caveat.
8. Nav 5: Seven next-steps and four sources resolve.
9. Load 4: Clear; the asymmetry table is the page.
10. Knowledge transfer: pending exam

### /docs/learn/ownership-model/ (Learn, avg 4.56)

1. Purpose 5: One-sentence ownership rule opens the page.
2. Prereq 4: Assumes Foundations per the index; not restated here.
3. Concept 5: Bugs-are-ownership-bugs rationale precedes the boundary diagram.
4. Terms 4: Terms are defined in the two ownership tables.
5. Examples 4: AppShell example imports are complete but references an undefined AppShellProps type.
6. Rules 5: 'SafeArea defaults to all edges, so an unqualified nested SafeArea is how doubled insets happen.'
7. Platform 5: 'the failure is silent on Web, because browsers report no system insets' names the platform trap.
8. Nav 5: Six next-steps and three sources resolve.
9. Load 4: Readable; the boundary diagram does the work.
10. Knowledge transfer: pending exam

### /docs/learn/responsive-model/ (Learn, avg 4.56)

1. Purpose 5: 'compact-first' defined in sentence one.
2. Prereq 4: Assumes Foundations; index order.
3. Concept 5: Component-decision versus application-decision split precedes the width model.
4. Terms 4: breakpoint, pageGutter, contentWidth, controlSize named with their roles.
5. Examples 5: resolveShellLayoutClass example is complete.
6. Rules 5: 'Vertical scrolling is normal; horizontal page scrolling is a bug.'
7. Platform 4: 'Breakpoints are build-time constants on Web' with the native alternative.
8. Nav 5: Six next-steps and three sources resolve.
9. Load 4: Clear.
10. Knowledge transfer: pending exam

### /docs/learn/state-model/ (Learn, avg 4.44)

1. Purpose 5: 'state-transparent by default' defined in sentence one.
2. Prereq 4: Assumes Composition model; index order says so.
3. Concept 5: Why one policy does not fit precedes the three shapes.
4. Terms 4: Controlled, uncontrolled, seed and sync are defined where used.
5. Examples 5: Both examples have imports and state.
6. Rules 5: 'A controlled dialog that cannot close is therefore a compile error rather than a bug report.'
7. Platform 3: No platform content; not needed for this topic.
8. Nav 5: Five next-steps and two sources resolve.
9. Load 4: The three-column ASCII table is dense but the prose is clear.
10. Knowledge transfer: pending exam

### /docs/patterns/ (Patterns (index), avg 3.67)

1. Purpose 4: Count, packs and source are stated first.
2. Prereq 3: No audience; index.
3. Concept 4: 'A pattern is a composition recipe, not a framework layer' precedes the tables.
4. Terms 3: 'named states' is used before it is explained.
5. Examples 3: No examples; index.
6. Rules 3: No rules; index.
7. Platform 4: 'Web preview is not native-device evidence' is stated up front.
8. Nav 5: 76 links resolve.
9. Load 4: Four tables; sentence one is maintainer text ('CI fails if either side drifts').
10. Knowledge transfer: pending exam

### /docs/performance/ (Performance, avg 3.00)

1. Purpose 3: Opens with what BeeUI measures, not what the reader can do here.
2. Prereq 2: No audience; the page never says whether the reader should run benchmarks or read them, opening with 'BeeUI measures repeatable component operations and package/bundle footprint'.
3. Concept 3: 'How to read a result' is the concept, but it comes after a list of benchmark classes.
4. Terms 3: 'benchmark classes' and 'controlled baseline' are not defined.
5. Examples 2: 'Benchmark classes include representative Table work, overlay open/close/positioning, theme/token operations and package footprint' with no number, command or sample result on the page.
6. Rules 3: 'measure your own app on the hardware/browser mix that matters to you' is advice without a procedure.
7. Platform 4: 'Browser bundle size is not the same as native binary size' is a real platform caveat.
8. Nav 3: Three source links resolve; the Table guide's actual numbers are not linked.
9. Load 4: 128 words, plain.
10. Knowledge transfer: pending exam

### /docs/reference-app/ (Reference app, avg 3.22)

1. Purpose 4: 'Open the live reference app to see BeeUI used as a consumer would use it' is the purpose.
2. Prereq 3: No audience line.
3. Concept 3: Product flow precedes build command.
4. Terms 3: 'Expo Router static output plus /demo baseUrl' assumes Expo Router knowledge.
5. Examples 3: The only command is a maintainer build ('pnpm --filter @beemvp/beeui-demo build:web:public').
6. Rules 3: No rules.
7. Platform 3: 'Native keeps the accepted app shell unchanged' is vague.
8. Nav 4: Six links resolve.
9. Load 3: 'The public Web shell adds a lightweight return bar to Docs, Showcase and BeeUI Home' is release-note text, not documentation.
10. Knowledge transfer: pending exam

### /docs/reference/ (Reference, avg 3.78)

1. Purpose 5: 'Use Reference when you need a fact, not a tutorial' in sentence one.
2. Prereq 3: No audience needed.
3. Concept 4: Explains generation before listing pages.
4. Terms 4: Pages are described by what they cover.
5. Examples 3: No examples; index.
6. Rules 3: No rules.
7. Platform 3: No platform content.
8. Nav 5: 17 links resolve.
9. Load 4: Two tables; clear.
10. Knowledge transfer: pending exam

False or stale:
- Quote: "BeeUI packages and the CLI are not published to npm. Every command on these pages runs from a repository checkout; publication remains owner-gated by #254." Reality: All four packages are on npm at 0.86.2-rc.1.

### /docs/reference/cli/ (Reference, avg 3.78)

1. Purpose 5: 'The exact command surface' with the guide linked in sentence two.
2. Prereq 3: 'Run commands as pnpm beeui <command> from a checkout' is the only prerequisite and it is the maintainer path.
3. Concept 4: Safety statement ('never installs npm packages, fetches remote code') precedes the tables.
4. Terms 4: Commands and flags are defined by their rows.
5. Examples 3: No invocation example; descriptions are pasted help text ('Show this help.').
6. Rules 4: Flag rows state what happens ('discarding the local edit').
7. Platform 3: No platform content needed.
8. Nav 4: Four links resolve.
9. Load 4: Two clean tables.
10. Knowledge transfer: pending exam

False or stale:
- Quote: "Run commands as pnpm beeui <command> from a checkout." Reality: The published CLI runs as npx @beemvp/beeui-cli@next <command> from the consumer project (per /docs/guides/cli-source-ownership/).

### /docs/reference/core/ (Reference, avg 4.00)

1. Purpose 5: Sentence one says what the package holds and that it renders nothing.
2. Prereq 4: 'Most applications never import it directly' sets audience before the tables.
3. Concept 4: Classification is explained before the tables.
4. Terms 5: advanced-consumer and normal-consumer are defined precisely.
5. Examples 3: Signatures only; 12 of 25 values carry a dash for description.
6. Rules 3: No rules; reference.
7. Platform 4: 'platform-free' and 'no React dependency' are stated.
8. Nav 4: Seven links resolve.
9. Load 4: Dense tables, but that is the format.
10. Knowledge transfer: pending exam

### /docs/reference/registry/ (Reference, avg 3.33)

1. Purpose 4: Sentence one says what the Registry drives.
2. Prereq 3: No audience line.
3. Concept 3: Brief concept then one-row table.
4. Terms 3: 'peer dependencies' assumed.
5. Examples 3: No examples.
6. Rules 3: No rules.
7. Platform 3: No platform content.
8. Nav 4: Four links resolve.
9. Load 4: 81 words; the page has one row and could live on the CLI reference.
10. Knowledge transfer: pending exam

### /docs/reference/styling/ (Reference, avg 3.44)

1. Purpose 4: Sentence one says there is one stylesheet subpath.
2. Prereq 3: No audience; short.
3. Concept 4: Concept before the one-row table.
4. Terms 3: '@custom-variant', '@utility' and 'subpath' are Tailwind terms left unglossed.
5. Examples 3: No import snippet, although the import is the whole point of the page.
6. Rules 3: No rules.
7. Platform 4: 'native consumers do not import CSS at all' is a clear platform note.
8. Nav 4: Five links resolve.
9. Load 3: One 45-word sentence about className and peer dependencies does three jobs.
10. Knowledge transfer: pending exam

### /docs/reference/tokens/ (Reference, avg 3.67)

1. Purpose 5: Sentence one says it is the exact token inventory and when to use Branding or Density instead.
2. Prereq 4: 'use it to check whether a name exists' sets the audience.
3. Concept 4: Three-part structure (groups, runtime values, subpaths) is explained before the tables.
4. Terms 4: Group, runtime value and subpath are defined; 'Only colors, radius and motionDuration are runtime-overridable' is stated up front.
5. Examples 3: Signatures only; no usage example for defineThemeOverrides or beeTokenReader.
6. Rules 3: No rules; reference.
7. Platform 3: No platform notes on which tokens differ per platform.
8. Nav 4: 12 links resolve.
9. Load 3: 2450 words of tables; correct for a reference but heavy.
10. Knowledge transfer: pending exam

### /docs/registry/ (Registry, avg 3.33)

1. Purpose 4: Sentence one defines the Registry and what it is not.
2. Prereq 3: No audience line.
3. Concept 4: Definition precedes lifecycle.
4. Terms 3: 'integrity information' and 'dependency closure' are undefined.
5. Examples 2: 'Registry item lifecycle' lists six steps ('Inspect the requested item and resolved dependency closure. Dry-run the copy plan before mutation. ...') with no command for any step.
6. Rules 4: 'A normal add / update must not silently destroy a differing destination file. Use dry-run/diff first.'
7. Platform 3: No platform content.
8. Nav 4: Four canonical sources and two guides resolve.
9. Load 3: 'the public Web gate must fail until docs and Registry truth agree' is maintainer language; the page overlaps the CLI guide and CLI reference.
10. Knowledge transfer: pending exam

### /docs/release-security/ (Release & security, avg 3.33)

1. Purpose 3: The page mixes release state and security reporting; sentence one is about npm, not about what the reader can do here.
2. Prereq 3: No audience line.
3. Concept 3: Install commands precede the release-event explanation.
4. Terms 3: 'dist-tag' and 'release environment' are assumed.
5. Examples 3: The install block duplicates Start.
6. Rules 4: 'Do not open a public issue containing vulnerability details. Follow ... SECURITY.md' is clear.
7. Platform 3: No platform content.
8. Nav 4: Six links resolve.
9. Load 4: Short.
10. Knowledge transfer: pending exam

False or stale:
- Quote: "Stable latest is intentionally not promoted yet." Reality: npm dist-tags show latest = 0.86.2-rc.1.

### /docs/responsive/ (Responsive, avg 3.56)

1. Purpose 4: Sentence one states compact-first.
2. Prereq 3: No audience line.
3. Concept 4: Principle precedes advice.
4. Terms 3: 'compact/medium/expanded policy' is named without the two breakpoint values.
5. Examples 2: 'Read BeeUI breakpoint tokens instead of inventing a second screen taxonomy' has no import, value or useWindowDimensions example on the page.
6. Rules 4: 'Fixed-height rows are exceptions that need an explicit reason' is actionable.
7. Platform 4: Native (useWindowDimensions) versus Web (media query) is stated.
8. Nav 4: Five links resolve.
9. Load 4: 222 words; nearly all of it is restated better on /learn/responsive-model/.
10. Knowledge transfer: pending exam

### /docs/showcase/ (Showcase, avg 3.11)

1. Purpose 3: Sentence one describes what the Showcase is; what a reader should do with it comes later.
2. Prereq 2: 'Generated component/pattern pages use embed=1 so the same runtime can sit inside docs without duplicate global chrome' is build-internal text with no reader named.
3. Concept 3: Mechanism (baseUrl, build commands) dominates; the evidence concept comes late.
4. Terms 2: 'Component pages deep-link with ?component=<registry-family>; pattern pages deep-link with the canonical source identity and the public router resolves it against the real Pattern Catalog' leaves registry-family and canonical source identity undefined.
5. Examples 3: Commands are maintainer-only pnpm --filter invocations.
6. Rules 3: No consumer rules.
7. Platform 5: 'Bundle/export/compile evidence proves packaging and resolution, not keyboard, safe area, hardware Back, VoiceOver/TalkBack' is explicit.
8. Nav 4: Five links resolve.
9. Load 3: 'experiments.baseUrl is enabled only for this launch build' is release-note prose.
10. Knowledge transfer: pending exam

False or stale:
- Quote: "The runtime still states that BeeUI packages/CLI are unpublished; a public Showcase URL does not imply npm publication." Reality: Packages and CLI are on npm at 0.86.2-rc.1; the sentence describes a stale runtime banner as if it were current.

### /docs/start/ (Start, avg 4.33)

1. Purpose 5: RC status and the install command in the first paragraph.
2. Prereq 5: Prerequisites table with tested values precedes the platform pick.
3. Concept 3: 'Install the package boundary' precedes 'Which intent is yours', so the reader installs before choosing packages versus source ownership.
4. Terms 3: 'package boundary' is a heading before it is defined; 'dist-tag' assumed.
5. Examples 5: AppShell example is complete.
6. Rules 4: 'Do not replace the commands below with unqualified package names until stable 0.86.2 has been promoted' is actionable.
7. Platform 5: The platform table carries an Evidence column.
8. Nav 5: Eight links resolve.
9. Load 4: Tables and short blocks.
10. Knowledge transfer: pending exam

False or stale:
- Quote: "Stable latest is not promoted yet, so every release-candidate install should use @next or pin the exact RC version." Reality: npm dist-tags show latest = 0.86.2-rc.1.

### /docs/start/bare-react-native/ (Start, avg 4.00)

1. Purpose 5: 'Use this path for a React Native application that does not use the Expo runtime.'
2. Prereq 5: Audience in sentence one.
3. Concept 3: Mechanism only.
4. Terms 3: '@source', 'Metro/Uniwind setup' assumed.
5. Examples 3: 'Your Metro/Uniwind setup should follow the maintained consumer fixture at examples/bare-rn-consumer' defers the one file the reader must write to a repository path.
6. Rules 4: Toolchain rule is clear.
7. Platform 5: 'A Metro bundle proves package/bundler resolution, not native compilation or runtime interaction.'
8. Nav 3: Three links resolve; no link to Troubleshooting or Provider page.
9. Load 5: Short.
10. Knowledge transfer: pending exam

False or stale:
- Quote: "BeeUI 0.86.2-rc.1 is public under the npm next dist-tag; stable latest is not promoted yet." Reality: npm dist-tags show latest = 0.86.2-rc.1.

### /docs/start/expo/ (Start, avg 4.22)

1. Purpose 5: 'Use this path for an Expo SDK 57 application' is the purpose.
2. Prereq 5: Audience and SDK are in sentence one.
3. Concept 3: Mechanism only; no why for @source or extraThemes.
4. Terms 3: 'extraThemes' appears in the Metro config with no explanation of what it lists.
5. Examples 4: Snippets are complete; the CSS file name (global.css) is implied by the Metro config rather than stated.
6. Rules 4: 'The @source entries are required so Tailwind sees BeeUI's published source classes' names the failure.
7. Platform 5: 'Evidence boundary' states what an Expo export does not prove.
8. Nav 4: Four links resolve.
9. Load 5: Short, ordered steps.
10. Knowledge transfer: pending exam

False or stale:
- Quote: "BeeUI 0.86.2-rc.1 is public under the npm next dist-tag; stable latest is not promoted yet." Reality: npm dist-tags show latest = 0.86.2-rc.1.

### /docs/start/provider-safe-area/ (Start, avg 4.89)

1. Purpose 5: 'Every BeeUI application mounts exactly one BeeUIProvider at its root. This page is the runtime mental model behind that line.'
2. Prereq 5: 'Read this after you have a platform guide running: Expo, Bare React Native or Web.'
3. Concept 5: What the provider owns precedes root setup.
4. Terms 5: host, scope, depth, transport and inset bridge are defined in the tree and the bullet list.
5. Examples 5: Every snippet is complete; wrong and right versions shown side by side.
6. Rules 5: The Common failures table pairs each symptom with cause and fix.
7. Platform 5: Web versus native transport, and 'browsers report no system insets' are explicit.
8. Nav 5: 11 links resolve.
9. Load 4: 1750 words; the Verify and Common failures tables make it scannable.
10. Knowledge transfer: pending exam

### /docs/start/web/ (Start, avg 3.89)

1. Purpose 5: 'Use this path for a browser-first product built with Vite and React Native Web.'
2. Prereq 5: Audience in sentence one.
3. Concept 3: Mechanism only.
4. Terms 3: 'RNW aliasing' and 'plugin order' assumed.
5. Examples 2: 'The maintained examples/web-consumer fixture is the executable authority for plugin order and React Native Web aliasing' - the vite.config.ts is never shown, so the page cannot produce a running app without leaving the site.
6. Rules 4: 'Check Compatibility before changing the pinned Web stack' is actionable.
7. Platform 5: 'Do not infer Next.js, Webpack, Parcel, SSR or multi-browser support' is explicit.
8. Nav 3: Three links resolve; no link to Troubleshooting's unstyled-page entry.
9. Load 5: Short.
10. Knowledge transfer: pending exam

False or stale:
- Quote: "BeeUI 0.86.2-rc.1 is public under the npm next dist-tag; stable latest is not promoted yet." Reality: npm dist-tags show latest = 0.86.2-rc.1.

### /docs/theming/ (Theming, avg 3.56)

1. Purpose 4: Sentence one states what components consume and what the app chooses.
2. Prereq 3: No audience line.
3. Concept 4: Semantic-token concept precedes the CSS.
4. Terms 3: 'Uniwind's adaptive theme' is not explained or linked.
5. Examples 3: The CSS block omits the two @source lines every Start page calls required.
6. Rules 3: 'reusable component behavior should not depend on literal brand colors' lacks the failure.
7. Platform 3: 'Web CSS' is shown; the native equivalent is not stated.
8. Nav 5: Ten links resolve.
9. Load 4: Short.
10. Knowledge transfer: pending exam

False or stale:
- Quote: "The package is still unpublished; see Start for the current packed/workspace consumption path." Reality: @beemvp/beeui-tokens is on npm at 0.86.2-rc.1; Start now documents npm install.

## Site-level analysis

### What the best pages do that the worst do not

The eight pages at or above 4.4 (Provider & safe area 4.89, Table guide 4.67, Date & time 4.56, and the Learn pages Ownership, Cross-platform, Responsive, State and Accessibility model at 4.44 to 4.56) share seven habits. The twelve pages at or below 3.33 lack most of them.

1. A first sentence that names what the reader gets, not what BeeUI is. "This page is the runtime mental model behind that line" (Provider & safe area) versus "The public BeeUI Showcase is the same Expo application used by repository Web/native verification" (Showcase).
2. An audience or prerequisite line before the first instruction. "Read this after you have a platform guide running" (Provider) and "If you are adding right to left support to an application" (RTL). Thirty of 52 pages score 3 or below on this criterion; the Accessibility task guides, Performance, Showcase and both Compatibility sub-pages have no such line at all.
3. Why before how, in a fixed shape. Every Learn page runs concept, why it exists, diagram, rules, consequences, misconception, next. Readers can predict where the answer sits. The short summary pages (Architecture, Performance, Responsive, Registry) have no repeatable shape.
4. Complete, pasteable code. Table, Date & time, Density, Branding and Provider show imports, state and the enclosing provider or Field. Thirty-six pages score 3 or below on examples (no example, a signature-only table, or a snippet that needs another page to run); Start/Web and Start/Bare defer the one file the reader must write (vite.config.ts, metro.config.js) to a repository path.
5. Rules that say what breaks. "Setting one without the other is the most common reason an error does not appear" (Forms model), "moving one and not the other is how brands ship unreadable buttons" (Branding), and the Symptom / Cause / Fix tables in Provider and Troubleshooting. The weak pages give imperatives with no failure attached.
6. Platform and evidence as tables, not prose. Table's anatomy table (Web versus native), Date & time's platform table, Cross-platform model's four-class evidence table. The weak pages either omit platforms or bury the evidence class in a 60-word sentence (Compatibility native).
7. Written from the reader's seat. The worst pages are written from the maintainer's seat: they describe CI workflows, build flags and repository scripts (Compatibility native and Web, Showcase, Reference app, Performance, Patterns index sentence one) and offer only pnpm --filter or ./scripts commands that a package consumer cannot run.

Two other site-wide observations. Navigation is the strongest criterion (4.33): every page has Related or canonical-source links, and all 654 links resolve. Publication state is the weakest fact: 20 sentences on 17 pages say the packages are unpublished or that latest is not promoted, while npm shows every package at 0.86.2-rc.1 on both next and latest.

### The 10 lowest pages, one rewrite each

Ties at 3.22 and 3.33 were broken toward the accessibility task guides because they share one fixable pattern (policy text labelled as a task guide). Architecture and Compatibility Web also sit at 3.33 and are covered by the "maintainer's seat" finding.

#### 1. /docs/accessibility/keyboard-focus/ (3.00)

Most valuable rewrite: add an audience line and one executable check; the page currently has no task.

Replacement text (insert as the opening two paragraphs):

> Who this is for: developers shipping BeeUI on Web, and anyone verifying native hardware-keyboard behaviour. Prerequisite: a screen rendered under BeeUIProvider (see Provider & safe area).
>
> Check it in one minute on Web: open the screen in Chromium and press Tab until focus reaches a BeeUI Button, Select trigger or Dialog trigger. A visible focus ring must appear at every stop, in reading order. Press Enter or Space to activate. Inside an open Dialog, press Escape: the dialog closes and focus returns to the trigger that opened it. If Tab lands on a wrapping View instead of the control, you have wrapped the trigger in a second pressable; remove the wrapper and put your content inside the trigger.

#### 2. /docs/guides/current-release/ (3.00)

Most valuable rewrite: replace the caveat paragraph, which contradicts the table above it.

Replacement text:

> This table is generated from docs/dist-tag-policy.md and the workspace manifest. On 2026-09-09 the four packages and the CLI were published to npm at 0.86.2-rc.1. Promoting stable 0.86.2 is a separate owner action. If this page and npm disagree, run `npm view @beemvp/beeui-ui dist-tags` and trust npm.

#### 3. /docs/performance/ (3.00)

Most valuable rewrite: give the reader a number, a command and a decision, all of which already exist on the Table guide.

Replacement text (replace the page body):

> What this page lets you do: read a BeeUI benchmark result correctly and decide whether you need to measure your own app.
>
> Current baseline (Apple M1, Node 24.13.1, Web hot path): Table renders 100 rows in about 0.073 ms and 500 rows in about 0.36 ms per pass, with under 8% variance. The CI guard is maxOverheadRatio: 15 against that baseline, not an absolute millisecond budget. Reproduce from a checkout with `pnpm bench:web`.
>
> These are synthetic component loops on one host. They are not frame-rate, device-latency or end-user interaction guarantees, and browser bundle size is not native binary size. Measure your own app on the hardware and browser mix that matters to you before optimising. Methodology: benchmark harness; numbers: performance baseline; sizes: bundle footprint.

#### 4. /docs/showcase/ (3.11)

Most valuable rewrite: open from the reader's seat and move build internals to a maintainer section at the end.

Replacement text (new opening):

> What this page lets you do: try any BeeUI component or production pattern in the real Web runtime before installing anything, and run the same app natively from a checkout.
>
> Open the Component Gallery or the Pattern Gallery. Every component reference page links to its Showcase entry, and every pattern page links to each named state. What you see in the browser is Web evidence only: keyboard, safe area, hardware Back and VoiceOver/TalkBack behaviour on iOS and Android require the native runs below.

Then keep "Native preview" as is, and collect embed=1, experiments.baseUrl, the git SHA stamp and build:web:public under a final heading "For maintainers".

#### 5. /docs/accessibility/ (3.22)

Most valuable rewrite: add an audience line and define the two overlay terms the page uses.

Replacement text (replace paragraph two):

> This section is for developers composing screens from BeeUI components. Each task guide states what BeeUI already does, what you must do, and how to verify it. Two terms recur: a modal boundary is what Dialog, AlertDialog and Sheet create; focus and dismissal stay inside it. An overlay scope is the nearest such boundary, and Popover, Select, DropdownMenu and Tooltip position and dismiss within it. The model is in Overlays & runtime ownership.

#### 6. /docs/accessibility/reduced-motion/ (3.22)

Most valuable rewrite: say how an application reads the preference on each platform.

Replacement text (append after paragraph two):

> How to honour it in your own animation: on native, read AccessibilityInfo.isReduceMotionEnabled() and subscribe to the reduceMotionChanged event; on Web, use the prefers-reduced-motion media query. When it is set, shorten or remove decorative transitions but keep every state change visible and announced: a spinner may stop spinning, but the loading text stays; a success animation may be skipped, but the success message still appears. BeeUI's own components follow the motion contract linked below; the same rule applies to animation you add around them.

#### 7. /docs/compatibility/native/ (3.22)

Most valuable rewrite: a four-line consumer summary at the top; the rest is contributor material and should say so.

Replacement text (new opening):

> For consumers, the whole page in four lines: React Native 0.86.x is supported and tested at 0.86.2. RN 0.87 is excluded because react-native-safe-area-context 5.7.0 does not compile on Android against it. A green native CI run proves the packages compile for Android and iOS Simulator, not that they behave on a device. Native pageSheet and formSheet dialog presentation is experimental.
>
> The rest of this page documents how CI produces that evidence and is written for contributors.

#### 8. /docs/components/ (3.22)

Most valuable rewrite: one-line descriptions that say what the user sees and the single contract they must know, under 20 words, no compound adjectives. Three replacements as the pattern:

> Avatar: shows a user image and falls back to initials when the image fails; sizes sm to xl.
> Chip: a small toggle, alone or inside a ChipGroup that behaves like radios or checkboxes.
> Description List: read-only label and value pairs; it holds no data state of its own.

Apply the same rule to the 59 remaining lines; the generator's description field is the place to fix it.

#### 9. /docs/reference-app/ (3.22)

Most valuable rewrite: tell the reader what to look at, and drop the release-note sentences.

Replacement text (replace everything before "Source"):

> What this page lets you do: see BeeUI inside a routed application, with a navigation shell, mock services and feature state, so you can judge the library at product scale. Open the demo.
>
> Look at three things. Records: a Table with search, filter chips, sort, selection, pagination and the stacked/scroll layout switch driven by the shell's breakpoint. Settings: ListGroup and SettingsItem rows under the density axis. The shell: bottom tabs on phones, a side rail from breakpoint.medium. Everything the demo does with data, routing and persistence is application code you would write yourself; BeeUI owns only the components.

#### 10. /docs/accessibility/native-assistive-tech/ (3.33)

Most valuable rewrite: add a procedure; the page currently tells the reader what not to claim but not what to do.

Replacement text (append after paragraph one):

> Verify your screen with a screen reader before shipping. iOS: Settings > Accessibility > VoiceOver, then swipe right through the screen; every control must announce a name, a role and its state, and opening a Dialog must move focus into it and back to the trigger on close. Android: enable TalkBack and repeat. Record which flows you ran. BeeUI's own matrices (linked below) list the flows it has run on a simulator or device; nothing outside those flows is claimed.
