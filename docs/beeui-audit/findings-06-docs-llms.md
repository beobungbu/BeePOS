# Findings 06 · docs site vs llms*.txt consistency audit (Ambrose, 2026-09-11)

Narrative findings the machine-generated matrix (`docs/beeui-audit/docs-llms-matrix.md` /
`.json`, built by `node scripts/audit/build-docs-llms-matrix.mjs`) cannot express on its own —
patterns across rows, not single-row facts. Individual line-item evidence lives in the matrix;
this file is the "so what" reading of it. Step 3 (reality check, sync-fix proposals) is
explicitly deferred per the phase spec.

## 06-01 · Almost every repo-relative link in llms*.txt 404s on the public docs site
- Area: llms
- Severity: major
- Source consulted: matrix category H (124 rows), built from every markdown link in
  `llms.txt`/`llms-full.txt`/`llms-components.txt`/`llms-patterns.txt` plus the site-relative
  and GitHub links on `/docs/ai/`.
- Expected: an agent (or human) following a link printed in an AI-context file should land
  somewhere real.
- Actual: 115 of 124 distinct link targets (93%) return HTTP 404 when resolved against
  `https://beeui.beemvp.com/`. All of them are repo-relative paths the generator copied
  verbatim from the BeeUI monorepo (`README.md`, `docs/*.md`, `docs/decisions/*.md`,
  `packages/ui/src/components/*.tsx`, `registry/registry.json`, `examples/**`). They are real
  and valid inside the git repository, but the four llms files are served from the public
  docs origin with no repo mirroring, so a coding agent that has only public-web access (the
  documented consumption path per `/docs/ai/`'s own framing of `llms.txt` as public static
  assets) cannot open a single one of these 115 links. The 9 links that do resolve are either
  sibling llms files (`llms-full.txt`, `llms-components.txt`, `llms-patterns.txt` referenced
  from `llms.txt`) or the three GitHub blob URLs on `/docs/ai/`.
- Repro: `node scripts/audit/build-docs-llms-matrix.mjs`, then inspect the category-H rows in
  `docs-llms-matrix.md` (status `llms-only` = 404 on the docs site).
- Workaround: none from the public surface; an agent must already know the GitHub repo path
  (`https://github.com/beobungbu/BeeUI/blob/main/<path>`) and construct the URL itself.
- Suggested fix for BeeUI: either rewrite repo-relative links in the generator
  (`scripts/generate-llms-txt.mjs`) to GitHub blob URLs (as `/docs/ai/`'s "Canonical sources"
  section already does for 3 links), or publish the referenced files as flat routes on the
  docs origin and link those instead.

## 06-02 · The AI-facing surfaces are internally consistent with each other and consistently wrong
- Area: llms, docs-public
- Severity: major
- Source consulted: matrix category A (rows A001-A005); `/docs/start/`, `/docs/release-security/`,
  `/docs/ai/`, all 4 llms files.
- Expected: a single publication-status story.
- Actual: this is a three-way split, not the two-way split findings-00 recorded before any
  code was written. `/docs/start/` and `/docs/release-security/` (human-facing pages) now
  correctly say BeeUI 0.86.2-rc.1 is public on npm under the `next` dist-tag, with a working
  `npm install ...@next` command. But `/docs/ai/`, the docs site's own dedicated "Use BeeUI
  with coding agents" page, still says "Public npm packages and the CLI are still
  unpublished. Do not invent live npm install or public npx availability," and all four
  llms*.txt STATUS banners repeat the same claim. Every surface an agent is pointed at
  first (`/docs/ai/`, `llms.txt`) is wrong, while the two surfaces a human is pointed at first
  are right. This is worse for agent consumers than for human consumers. Already tracked as
  #543 (comment); this audit's contribution is confirming it is still live today and that
  `/docs/ai/` itself (not just the four generated files) carries the stale claim.
- Repro: `curl -s https://beeui.beemvp.com/docs/ai/ | grep -o 'still unpublished'` vs
  `curl -s https://beeui.beemvp.com/docs/start/ | grep -o 'is public on npm'`.
- Workaround: trust `/docs/start/` and `/docs/release-security/` over `/docs/ai/` and the llms
  files for publication status.
- Suggested fix for BeeUI: single source of truth (e.g. a `publicationStatus` field read by
  both the Starlight `/docs/ai/` page and `scripts/generate-llms-txt.mjs`), plus a CI check
  that they agree.

## 06-03 · `uniwind generate-artifacts` is undocumented on every public surface
- Area: docs-public, llms
- Severity: minor (already causing pain, see #562)
- Source consulted: matrix row C007; full-text search of every fetched docs page and all 4
  llms files for the literal string `generate-artifacts`.
- Expected: if a build step is required, at least one of {docs site, llms-full.txt} names it.
- Actual: the string does not appear anywhere in `/docs/start/expo/`, `/docs/start/web/`,
  `/docs/start/bare-react-native/`, or any llms file. #562 ("fresh checkout fails tsc until
  `uniwind generate-artifacts`") was filed from the BeeUI repository scaffold experience, not
  from a public-docs contradiction; this audit confirms there is nothing public to contradict:
  the step is invisible from every public surface, repo-only knowledge. That is a stronger
  version of the same underlying gap than "docs disagree": here, no public doc mentions it at
  all.
- Workaround: none from public docs; consumers going through the published Vite/Metro plugin
  stack apparently do not need to run it directly (only repo contributors do), but that
  assumption itself is undocumented.
- Suggested fix for BeeUI: either document the step for repo contributors on a public
  CONTRIBUTING-equivalent docs page, or confirm explicitly in `/docs/start/*` that published
  consumers never need it.

## 06-04 · Sheet's native provider requirements live only in the patterns composition guidance, not on the Sheet page or the provider setup page
- Area: docs-public
- Severity: minor
- Source consulted: matrix rows C008-C009; `/docs/start/provider-safe-area/`,
  `/docs/components/sheet/`, `llms-patterns.txt` line 19.
- Expected: a component that requires two extra native providers (`GestureHandlerRootView`,
  `BottomSheetModalProvider`, per ADR-006) states that requirement on its own docs page and/or
  the app-root provider setup page.
- Actual: both strings are entirely absent from `/docs/start/provider-safe-area/` (the page
  that documents the provider tree) and from `/docs/components/sheet/` (the component's own
  docs page). The only place this requirement is written down anywhere in scope is one bullet
  in `llms-patterns.txt`'s "Composition guidance for agents" section, which a human reading the
  docs site would never see.
- Repro: `curl -s https://beeui.beemvp.com/docs/components/sheet/ | grep -c BottomSheetModalProvider` returns `0`.
- Workaround: read llms-patterns.txt, or discover the missing provider via a native runtime
  crash.
- Suggested fix for BeeUI: add the provider requirement to the Sheet component page's
  "Provider and dependencies" section (every other component page has one, see matrix D-rows)
  and cross-link it from `/docs/start/provider-safe-area/`.

## 06-05 · The 11 ADRs are cited by number across docs and llms but never published as a lookup surface
- Area: docs-public
- Severity: minor
- Source consulted: matrix category F (F001-F011); `/docs/architecture/`; sitemap.xml (no
  `/docs/decisions/**` section exists at all).
- Expected: since ADR numbers (ADR-001 through ADR-011) are used as authorities throughout both
  the docs site (individual component pages cite them, e.g. Sheet cites ADR-006) and
  llms-full.txt, a reader should be able to resolve "ADR-006" to something on the docs site.
- Actual: `/docs/architecture/` paraphrases some ADR content in unattributed "Boundaries that
  matter" bullets but never writes "ADR-" followed by a number anywhere in its rendered text,
  and there is no `/docs/decisions/` (or equivalent) section in the site's sitemap. The ADR
  files (`docs/decisions/NNN-*.md`) are pure repo-only paths (see 06-01), so an agent or human
  who only has the public docs site cannot look up what "ADR-008" means even though other
  component pages likely reference it (unverified in this pass; a step-3 check should confirm
  on-page ADR citations resolve).
- Workaround: read llms-full.txt's "Architecture decision records" section, which does carry a
  one-line description per ADR, just not the full rationale.
- Suggested fix for BeeUI: publish `docs/decisions/*.md` as a `/docs/decisions/` or
  `/docs/architecture/decisions/` Starlight collection; link it from `/docs/architecture/`.

## 06-06 · Accessibility contract vocabulary has drifted between the compressed llms-full summary and the expanded docs pages
- Area: docs-public, llms
- Severity: minor
- Source consulted: matrix category G (8 rows); llms-full.txt `## Accessibility` paragraph vs
  `/docs/accessibility/{keyboard-focus,native-assistive-tech}/`.
- Expected: llms-full.txt is meant to be a compressed version of the same claims the docs site
  makes in full.
- Actual: 4 of 8 spot-checked claims use vocabulary present in llms-full.txt's one-paragraph
  summary ("focus trap", "listbox", "aria-*", "radiogroup") that does not appear verbatim on
  the corresponding expanded docs pages, which instead describe the same behavior in different
  words (or, in the `/docs/accessibility/` overview's case, does not discuss `aria-*`
  relationships in its prose body at all; the only `aria-` occurrences on that page are in the
  Starlight search-button chrome, outside the article content). This is not necessarily wrong,
  synonyms are fine, but it means an agent doing a literal keyword search against the docs
  site for a term it read in llms-full.txt will come up empty half the time in this sample.
- Suggested fix for BeeUI: either tighten llms-full.txt's Accessibility summary to reuse the
  docs site's exact terms, or note in `/docs/ai/` that llms-full.txt's accessibility section is
  a paraphrase, not a keyword index.

## 06-07 · What is fully consistent: the component export surface (positive finding)
- Area: component-behavior
- Severity: n/a (confirms correctness, not a defect)
- Source consulted: `node scripts/audit/check-exports-vs-dts.mjs`; matrix D-rows (the "exported
  symbols identical" rows, both "docs vs llms" and "llms vs npm .d.ts" variants, 124 rows
  total across 62 components).
- Result: zero mismatches. All 62 modules in `llms-components.txt` list exactly the same
  exported value symbols as (a) the corresponding `/docs/components/<slug>/` page's "Family
  exports" line and (b) the installed `@beemvp/beeui-ui` package's
  `dist/typescript/module/index.d.ts`. The reverse check (every docs component page has a
  matching llms-components.txt row) also came back clean, no orphaned pages on either side.
  Worth stating explicitly because everything else in this file is a gap: the actual public
  component API surface, the part most likely to break a consumer, is the one thing this
  audit found in perfect three-way agreement.

## Step 3 (deferred)
Per the phase spec, reality-checking `identical` rows against BeePOS runtime behavior and
proposing which side to fix for `mismatch` rows is explicitly out of scope for this pass.
`scripts/audit/check-exports-vs-dts.mjs` was written now (06-07 above) as the one piece of
step-3 infrastructure cheap enough to build immediately; the rest of step 3, ADR-citation
resolution, accessibility claim verification against real component behavior, and a decision
on which surface (docs vs llms) is authoritative for each of the 12 category-A mismatches,
is left for the next pass.
