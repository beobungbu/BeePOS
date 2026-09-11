# Phase 09 · Pass 2: readability and knowledge transfer, whole docs site

Owner: Fable (Ambrose designs and grades; a Fable subagent with clean context scores hand-written pages; a fresh Sonnet sits the exam). Runs after phase 08.

## Scope and split (151 pages from /docs/sitemap-0.xml)
- Hand-written pages, scored by a Fable subagent: start (5), learn (10), guides (9), theming (1), accessibility (6), reference (6), compatibility (4), architecture (1), ai (1), performance (1), release-security (1), responsive (1), showcase (1), reference-app (1), registry (1), patterns index (1), components index (1). About 52 pages.
- Template-generated pages: 62 component pages and 37 pattern pages share one template each. Score the template by scoring 8 random component pages and 6 random pattern pages (Sonnet), then report template-level findings; the 8 already scored in phase 07B count.

## Rubric (1..5 each, one sentence of justification per score; no score without a quoted sentence as evidence for 1..2)
1. Purpose stated in the first paragraph (what this page lets me do).
2. Prerequisites and audience stated before the first instruction.
3. Concept before mechanism: the "why" precedes the "how" (the Learn pages' "Why the concept exists" is the model).
4. Terms defined before use or linked at first use (token, scope, host, runtime, evidence class ...).
5. Examples complete and runnable as pasted (imports, state, provider).
6. Rules are actionable: each rule says what to do and what breaks otherwise.
7. Platform differences and evidence class explicit where relevant.
8. Navigation: "where to go next" and cross-links exist and resolve (HTTP 200).
9. Reading load: sentence length, jargon density, one idea per paragraph (subjective; justify).
10. Knowledge transfer: after reading, could the reader answer the exam questions drawn from this page (filled from the exam results, not by the scorer).

Also record per page: word count, number of code blocks, number of links and how many 404, and any sentence that is false or stale (with URL + quote), e.g. `learn/foundations` "BeeUI's packages are not published to the public registry" (stale since 2026-09-09).

## Comprehension exam
`phase-09-exam.md` (25 questions, keys). A fresh Sonnet agent with the exam-taker rules sits it; Ambrose grades 0/1/2 against the keys and fills rubric criterion 10 per page. Report per page: exam score, rubric average, top 3 rewrites with replacement text.

## Outputs
- `docs/beeui-audit/readability-site.md` (per-page table: section, URL, 10 scores, avg, words, code blocks, links/404, false sentences) + `.json`.
- `docs/beeui-audit/comprehension-exam-results.md` (answers as given, score, grounding URL, grader note).
- `docs/beeui-audit/findings-09-readability.md`: template-level findings for component/pattern pages, site-level patterns (what the best pages do that the worst do not), stale sentences.
- One comment on BeeUI #234 with: overall readability average per section, exam score per page, the 10 pages below 3.0 and their top rewrite, and the stale-sentence list. No new issues (Ambrose files). No em-dash.

## Acceptance
- All 52 hand-written pages scored with justifications; 14 template samples scored; exam sat and graded; #234 comment posted.
- Claims of "false sentence" quote the text and give the reality source.
