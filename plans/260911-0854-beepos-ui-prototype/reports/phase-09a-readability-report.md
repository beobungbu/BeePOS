# Phase 09A report: readability of the hand-written BeeUI docs pages

Date: 2026-09-11. Scorer: fresh-context Fable subagent with no prior BeeUI opinion; did not read any other BeePOS finding, matrix or report before scoring. Spec: `plans/260911-0854-beepos-ui-prototype/phase-09-readability-comprehension.md`.

## Outputs

- `docs/beeui-audit/readability-site.md`: per-page table (section, URL, nine scores, average, words, code blocks, links, non-200 links, stale count), ranking, per-page justifications (one sentence per criterion, quotes for every 1 or 2), site-level analysis, and the 10 lowest pages with one rewrite and replacement text each.
- `docs/beeui-audit/readability-site.json`: the same data, machine-readable, plus section and criterion averages.
- `docs/beeui-audit/findings-09-readability.md`: 23 findings in the Area / Severity / Source / Expected / Actual / Repro / Workaround / Fix template; F-09-01 to F-09-10 are the stale sentences, F-09-11 to F-09-23 the site-level patterns.
- Stripped page text and raw HTML cached under `scripts/audit/.cache/readability/` (gitignored), with the scoring module `_scores.mjs`, the builders `_build.mjs` and `_md.mjs`, and the link checker `_links.mjs`.

## Method

1. Page list from `https://beeui.beemvp.com/docs/sitemap-0.xml` (151 URLs), minus `/docs/components/<name>/` and `/docs/patterns/<pack>/<screen>/`: 52 pages, matching the spec's count.
2. Each page fetched with curl (retries were needed: about one request in four stalled mid-transfer on this date), the `<main>` column extracted, tags stripped, and read in full. Word count, `<pre>` count and unique hrefs computed from the main column.
3. All 335 unique hrefs checked with GET following redirects, up to four attempts: 335 returned 200. Page-level link total 654, non-200 0.
4. Scores 1 to 5 on criteria 1 to 9 with one-sentence justifications; every 1 or 2 quotes the sentence or the absence. Criterion 10 left as "pending exam".
5. Factual claims checked against npm (`npm view @beemvp/beeui-{ui,core,tokens,cli} version dist-tags`: all four at 0.86.2-rc.1, dist-tags `next` and `latest` both 0.86.2-rc.1, published 2026-09-09). The Styling reference's "four @custom-variant theme scopes and five bee-* @utility rules" was verified against the packed `theme.css` (4 and 5, correct). The Density guide's pixel arithmetic was recomputed (512 / 668 / 784 px, correct). Component and pattern counts (62, 37) were recounted from the index tables (correct).

## Headline numbers

- Pages scored: 52. Site average over criteria 1 to 9: 3.82.
- 22 pages at or above 4.0; 17 pages below 3.5.
- Section averages: Learn 4.40, Start 4.27, Guides 4.01, Home 3.67, Patterns index 3.67, Reference 3.67, Responsive 3.56, Theming 3.56, Compatibility 3.50, AI 3.44, Accessibility 3.43, Architecture 3.33, Registry 3.33, Release & security 3.33, Components index 3.22, Reference app 3.22, Showcase 3.11, Performance 3.00.
- Criterion averages: Navigation 4.33, Purpose 4.31, Concept before mechanism 4.02, Platform/evidence 4.02, Rules actionable 3.88, Reading load 3.75, Prerequisites/audience 3.37, Terms defined 3.37, Examples runnable 3.31.
- Highest: Provider & safe area 4.89, Table guide 4.67, Date & time 4.56, Learn Ownership / Cross-platform / Responsive model 4.56.
- Lowest: Accessibility keyboard-focus 3.00, Guides current-release 3.00, Performance 3.00, Showcase 3.11, then Accessibility index, Reduced motion, Compatibility native, Components index and Reference app at 3.22.
- False or stale sentences: 20 on 17 pages. All 20 concern publication state; the reality source for every one is npm.

## What the site does well

Navigation is uniformly good: every page has Related or canonical-source links and none is broken. The Learn section follows one repeatable shape (concept, why, diagram, rules, consequences, misconception, next) and is the model for the rest of the site. The long task guides (Table, Date & time, Branding, Density, Provider & safe area, Troubleshooting) pair complete code with rules that say what breaks, and state platform differences and evidence classes in tables.

## What drags the average down

1. Publication state is stated by hand on 17 pages in two incompatible versions ("unpublished, run from a checkout" on 8 pages; "published on next, latest not promoted" on 9), and npm contradicts both: latest already points to the RC. The AI rules page and the Troubleshooting page, which readers are most likely to trust verbatim, both say unpublished. Finding F-09-11 proposes one generated include plus a build check.
2. Short summary pages are written from the maintainer's seat (Compatibility native and Web, Showcase, Reference app, Performance): CI labels, build flags and `pnpm --filter` commands a package consumer cannot run. Replacement openings are given for four of them.
3. Thirty pages have no audience or prerequisite line before the first instruction; the three shortest Accessibility "task guides" (93 to 127 words) contain no task at all.
4. The CLI is invoked two ways (`pnpm beeui` versus `npx @beemvp/beeui-cli@next`) depending on the page; Theming's CSS snippet omits the `@source` lines every Start page calls required; Start/Web and Start/Bare defer the config file the reader must write to a repository path.

## Acceptance check against the spec

- All 52 hand-written pages scored with per-criterion justifications: done.
- Every score of 1 or 2 quotes the sentence or absence: done (12 pages carry at least one 2; no 1 was warranted).
- Per page: word count, code blocks, links and non-200 count, false or stale sentences with quote and reality source: done.
- Criterion 10: pending exam, as instructed.
- Template samples, exam and the #234 comment are outside this pass and were not touched.

## Note on a prior attempt

When this pass reached the commit step, an uncommitted report from an earlier attempt (13:31 to 13:38 on the same day) was found at this report path, with its helper files in the same cache directory. No process was running and nothing had been committed. This pass did not read those files; its scores were complete before they were noticed. This report and the three docs/beeui-audit files supersede them.

## Concerns

- The "latest points to a prerelease" state (F-09-05) is an npm-side question for the owner, not a docs edit; the docs should follow whichever way it is decided.
- Two of the ten lowest slots were decided by tie-break (3.22 and 3.33 ties); Architecture and Compatibility Web sit at 3.33 and are covered by the maintainer's-seat finding rather than a dedicated rewrite.
- The site stalled on roughly a quarter of requests during the audit (F-09-23); the link check therefore used four attempts per URL, which could hide an intermittent 5xx behind a later 200.
