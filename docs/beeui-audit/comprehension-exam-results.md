# Comprehension exam results (phase 09B, graded by Ambrose, 2026-09-11)

Exam: `plans/260911-0854-beepos-ui-prototype/phase-09-exam.md` (25 application-style questions with answer keys). Taker: a fresh Sonnet agent restricted to /docs/learn/**, /docs/guides/**, /docs/theming/, /docs/accessibility/**, /docs/reference/** (31 pages opened, about 70 minutes). Answers: `comprehension-exam-answers.md`. Grading: 2 correct and grounded in a quoted sentence, 1 partial or ungrounded, 0 wrong or not found.

## Scores

| # | Page under test | Score | Grader note |
|---|---|---|---|
| 1 | learn/foundations | 2 | anti-pattern and "genuine product rule" both present |
| 2 | learn/foundations | 2 | three packages with ownership; patterns as evidence not dependency |
| 3 | learn/ownership-model | 2 | one owner per edge; explicit edges; also found the troubleshooting entry |
| 4 | learn/ownership-model | 2 | do not mirror runtime state |
| 5 | learn/composition-model | 2 | anchoring, dismissal, focus restoration; runtime not type error |
| 6 | learn/composition-model | 2 | put content inside SelectItem; children is the extension point |
| 7 | learn/state-model | 2 | read-only; dev warning; correct reading of the prod clause |
| 8 | learn/state-model | 2 | compile error via union typing |
| 9 | learn/state-model | 2 | seed at mount; remount resets |
| 10 | learn/overlays-and-runtime | 2 | nested provider creates a new toast runtime; viewport offscreen |
| 11 | learn/overlays-and-runtime | 2 | nearest host; deepest scope |
| 12 | learn/overlays-and-runtime | 2 | asymmetry stated exactly |
| 13 | learn/forms-model | 2 | invalid not set |
| 14 | learn/forms-model | 2 | one control per Field; FormGroup with legend |
| 15 | learn/forms-model | 2 | associates and announces; never validates or submits |
| 16 | learn/cross-platform-model | 2 | class 4; insets, hardware back, assistive tech |
| 17 | learn/cross-platform-model | 2 | full list; contract unchanged |
| 18 | learn/responsive-model | 2 | two breakpoints from tokens; useWindowDimensions for which subtree renders; added the pixel values from reference/tokens |
| 19 | learn/accessibility-model, accessibility/reduced-motion | 2 | rule stated; used the dedicated page |
| 20 | learn/accessibility-model, accessibility/large-text | 2 | platform owns; fixed heights and allowFontScaling=false break it |
| 21 | guides/density | 2 | applyDensity per runtime theme; no per-subtree scope ("There is no BeeDensityScope"); 44 px floor |
| 22 | guides/table | 2 | caller-owned sort and selection; no virtualization; not a data grid |
| 23 | guides/date-time | 2 | timezone-free CalendarDate; app owns business-calendar rules |
| 24 | guides/branding, theming | 2 | tokens; no literal hex; BeeThemeScope |
| 25 | learn/responsive-model, reference/tokens | 2 | pageGutter, contentWidth, controlSize |

**Total: 50 / 50 (100%).** Per page: every page at 100%. Threshold for "docs transfer knowledge" (overall >= 80%, no page < 60%): met with margin.

## Reading

- The Learn and Guides pages transfer knowledge reliably: every scenario question (why a toast never appears, which layer Escape closes, why an error never shows) was answered with the exact reasoning the docs give, in about 3 minutes per question including reading.
- The weak part of the site is not the conceptual layer. It is the setup layer (phase 07B, about 90 minutes lost per platform) and the generated layers (Props tables, pattern code blocks, llms files). Recommendations in `report.md` stand: fix Start, the generators and the AI surfaces; keep Learn as the model for the rest.
- Caveat: one taker, one sitting; the exam tests recall and application of stated rules, not the ability to build. The clean-room passes cover building.
