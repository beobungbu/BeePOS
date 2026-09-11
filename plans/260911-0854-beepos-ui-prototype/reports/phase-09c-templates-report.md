# Phase 09c: template-generated pages readability report

Date: 2026-09-11
Scope: score the shared template for 62 component pages and 37 pattern pages on the
BeeUI docs site by sampling 8 component pages and 6 pattern pages, then report
template-level findings. Rubric and sample rule per
`plans/260911-0854-beepos-ui-prototype/phase-09-readability-comprehension.md`.

## What was done

1. Fetched `https://beeui.beemvp.com/docs/sitemap-0.xml` (151 URLs, matching the site's
   151-page total) and confirmed the component list (accordion, chip, field, list-item,
   popover, select, stat, textarea) and the pattern packs (auth, commerce-social,
   dashboard-finance, account-settings) needed by the deterministic sample rule.
2. Sampled 8 component pages (every 8th alphabetically starting at accordion - all 8
   named pages existed, no substitution needed) and 6 pattern pages (first alphabetically
   in auth and account-settings; first two alphabetically in commerce-social and
   dashboard-finance): auth/forgot-password-screen, account-settings/account-screen,
   commerce-social/cart-screen, commerce-social/checkout-screen,
   dashboard-finance/analytics-screen, dashboard-finance/dashboard-overview-screen.
3. Fetched each page with `curl -sS URL | sed 's/<[^>]*>/ /g' | tr -s ' \n'` and scored
   it on the 9 scorable rubric criteria (criterion 10 is exam-based and out of scope for
   this pass), with word counts, code-block counts and link counts computed from the
   underlying raw HTML.
4. Collected all 133 unique in-content links across the 14 sampled pages (from inside the
   `sl-markdown-content` region, excluding shared sidebar/TOC nav) and checked every one
   with curl; all 133 returned HTTP 200 (0 broken).
5. Cross-checked the recurring "BeeUI packages and the public CLI remain unpublished"
   claim against `https://registry.npmjs.org/@beemvp/beeui-ui` directly: the package is
   published, `latest`/`next` dist-tags both point to `0.86.2-rc.1`. The claim is false
   as written and appears on all 14 sampled pages (in matching component- and
   pattern-template phrasing).
6. Wrote the sample table and template-level findings to
   `docs/beeui-audit/readability-templates.md`, including the 5 highest-value template
   rewrites with replacement text, per the task's output spec.

## Results

- Component sample average: 2.97 / 5 (8 pages: accordion 3.00, chip 3.00, field 2.89,
  list-item 3.00, popover 2.89, select 2.89, stat 3.00, textarea 3.11).
- Pattern sample average: 3.26 / 5 (6 pages: forgot-password-screen 3.33, account-screen
  3.22, cart-screen 3.22, checkout-screen 3.33, analytics-screen 3.22,
  dashboard-overview-screen 3.22).
- Combined sample average across all 14 pages: 3.09 / 5.
- Links checked: 133 unique, 0 returned a non-200 status.
- Template-level findings identified: 6 (numbered in the output file), covering both
  templates. The single highest-impact one is the stale/false "unpublished" distribution
  claim, present verbatim (or with only the package-CLI phrasing adapted) on all 14
  sampled pages and, by construction of the shared template, almost certainly on all 99
  component + pattern pages.

## Where scores were weakest, structurally

- **C5 (examples runnable as pasted): 1/5 on all 14 pages.** Component "Verified example
  source" blocks explicitly exclude imports/state ("Open the fixture itself for the
  surrounding imports and state"); pattern pages never show JSX at all, only a prop-type
  declaration.
- **C2 (prerequisites/audience before first instruction): 2/5 on all 14 pages.** Neither
  template states who the page is for or what must be set up first before the reader
  acts on the Import section or the Preview link.
- **C3 (concept before mechanism): 2/5 components, 3/5 patterns.** Neither template has
  a "why" section comparable to the Learn pages' "Why the concept exists" model named in
  the rubric.

## Where the templates do well

- **C1 (purpose in first paragraph): 5/5 on all 14 pages**, consistently.
- **C8 (navigation/cross-links resolve): 5/5 on all 14 pages** - 133/133 links checked
  returned HTTP 200.
- The Limitations section (components) and Application ownership boundary / Responsive
  contract sections (patterns) are genuinely page-specific and actionable, not
  boilerplate - the strongest parts of both templates.

## Deviations from the task instructions

None. Sample selection matched the deterministic rule exactly (no missing pages
required substitution). Only `docs/beeui-audit/readability-templates.md` and this report
were written; no other BeePOS files were read beyond the phase-09 spec file, per
instruction. No GitHub actions were taken.

## Unresolved / handed back

- This pass covers only 14 of the 99 template-generated pages. The findings above are
  strong template-level evidence (identical phrasing across the whole sample) but are
  not a page-by-page census of all 62 + 37 pages; a small number of component families
  with unusual structure (e.g. multi-file families, or ones with real platform-specific
  files) were not in this sample and could show different patterns.
- Criterion 10 (knowledge transfer via the comprehension exam) is explicitly out of
  scope for this template pass per the task instructions; it is owned by the main
  phase-09 exam track.
- The npm-registry check used the public registry API directly rather than any BeePOS
  project file, so it does not conflict with the "read only the phase file" instruction,
  but it is worth noting for whoever reconciles this against the
  `beeui-docs-status-contradiction` memory note from earlier sessions, which already
  flagged this same unpublished/published contradiction.

Status: DONE
Summary: Sampled and scored 8 component and 6 pattern pages against the 9-criterion
readability rubric; identified 6 template-level findings including a site-wide stale
"unpublished" claim, and wrote both required output files.
Component sample avg: 3.0 · pattern sample avg: 3.3 · template-level findings: 6
