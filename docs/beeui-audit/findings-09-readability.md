# Findings 09: readability and stale sentences on the hand-written BeeUI docs pages

Date: 2026-09-11. Source of scores: docs/beeui-audit/readability-site.md and readability-site.json (52 pages). Reality source for publication state: `npm view @beemvp/beeui-{ui,core,tokens,cli} dist-tags` on 2026-09-11 returns `{ next: '0.86.2-rc.1', latest: '0.86.2-rc.1' }` for all four packages, published 2026-09-09.

Em-dashes inside quoted site text are written as " - " in this file.

## Part A: false or stale sentences (20 sentences, 17 pages)

Every stale sentence found concerns publication state. Two contradictory stories coexist on the site: (a) "unpublished, run from a checkout" and (b) "published on next, latest not promoted". npm agrees with neither: the packages are published and latest already points at the RC.

### F-09-01 Home says latest is unassigned

- Area: /docs/ (Home), "Platform and release truth"
- Severity: High (first page a reader sees; drives the install command)
- Source consulted: page text; npm dist-tags
- Expected: the channel table matches npm
- Actual: "Stable latest is intentionally not published yet." and "Stable channel: latest remains intentionally unassigned to this RC."
- Repro: `curl -s https://beeui.beemvp.com/docs/ | grep -o 'latest remains[^.]*'`; `npm view @beemvp/beeui-ui dist-tags`
- Workaround: none needed for install; `@next` and bare install resolve the same version
- Suggested fix: generate the channel lines from dist-tag-policy or from npm at build time; until then state "latest and next both resolve to 0.86.2-rc.1"

### F-09-02 AI agent rules page tells agents the packages are unpublished

- Area: /docs/ai/, "Rules an agent must preserve"
- Severity: High (this page is the human summary of the llms*.txt rules an agent is told to obey)
- Source consulted: page text; npm
- Expected: agents told the RC is on npm and to use `@next` or the exact version
- Actual: "Public npm packages and the CLI are still unpublished. Do not invent live npm install or public npx availability."
- Repro: open the page; run `npx @beemvp/beeui-cli@next --help`
- Workaround: none
- Suggested fix: replace with "Packages and the CLI are on npm at 0.86.2-rc.1; install with `@next` or the exact version and never with an invented newer version"

### F-09-03 Branding guide says work happens against a checkout

- Area: /docs/guides/branding/, "Known limitations"
- Severity: Medium
- Source consulted: page text; npm
- Expected: no publication caveat, or a caveat that matches npm
- Actual: "The packages are not published to npm yet, so branding work today happens against a repository checkout or a locally packed artifact - see Start."
- Repro: read the last bullet under Known limitations
- Workaround: ignore the bullet; the Start page it links to gives npm install commands
- Suggested fix: delete the bullet

### F-09-04 CLI guide, Migration, Release, Start and the three platform pages say latest is not promoted

- Area: /docs/guides/cli-source-ownership/ ("Stable latest is not promoted yet"), /docs/guides/migration-versioning/ ("Stable latest is intentionally not promoted yet" and the channel table row "Stable (latest): Not promoted yet"), /docs/release-security/ ("Stable latest is intentionally not promoted yet"), /docs/start/ ("Stable latest is not promoted yet, so every release-candidate install should use @next or pin the exact RC version"), /docs/start/expo/, /docs/start/bare-react-native/, /docs/start/web/ (each: "stable latest is not promoted yet")
- Severity: Medium (the install commands still work; the stated reason for `@next` is false)
- Source consulted: page text; npm dist-tags
- Expected: one sentence about channels, generated from one source
- Actual: seven pages repeat a hand-written sentence that npm contradicts
- Repro: `npm view @beemvp/beeui-ui dist-tags`
- Workaround: none needed
- Suggested fix: replace the sentence on all seven pages with a shared include generated from the same source as /docs/guides/current-release/

### F-09-05 Migration page states a rule that npm currently violates

- Area: /docs/guides/migration-versioning/, "Semver policy for future releases"
- Severity: Medium (policy versus reality; either the tag or the sentence is wrong)
- Source consulted: page text; npm dist-tags
- Expected: latest points to a stable version, or the page says the rule is not yet applied
- Actual: "Prerelease identifiers (-rc.N) are opt-in test releases and do not change the rule that latest must never point to a prerelease." while npm has latest = 0.86.2-rc.1
- Repro: `npm view @beemvp/beeui-ui dist-tags.latest`
- Workaround: pin the exact version in consumers
- Suggested fix: this is an npm-side decision for the owner (retag latest or accept the RC as latest); the docs sentence should then be updated to whichever is true

### F-09-06 Troubleshooting opens by saying BeeUI is unpublished

- Area: /docs/guides/troubleshooting/, "Distribution status" and "A docs build fails a publication-truth check"
- Severity: High (the page a stuck reader lands on; the first thing it says is false)
- Source consulted: page text; npm
- Expected: entries that assume the npm install path and the public CLI
- Actual: "BeeUI is unpublished. There is no public npm package and no public CLI, so no entry below tells you to install one. Every fix runs from a BeeUI checkout or from a packed tarball produced by that checkout." and "Because BeeUI is unpublished, public registry-install commands and public CLI invocations are rejected outright unless the same line explicitly negates them."
- Repro: read the second section of the page
- Workaround: read /docs/start/ instead for install
- Suggested fix: delete the Distribution status callout; rewrite the publication-truth entry to describe what the check now enforces; convert every `pnpm beeui ...` command in the CLI section to `npx @beemvp/beeui-cli@next ...` with the pnpm form noted as maintainer-only

### F-09-07 Current release page contradicts itself

- Area: /docs/guides/current-release/
- Severity: Medium
- Source consulted: page text; npm
- Expected: the generated table and the prose agree
- Actual: table says "Published to npm: yes"; prose says "Release-ready means the repository has the engineering controls required to produce/verify artifacts; it does not mean an npm package, CLI, Git tag or GitHub Release exists. Publication remains an explicit owner action."
- Repro: read the page top to bottom (102 words)
- Workaround: trust the table
- Suggested fix: see replacement text in readability-site.md, lowest pages, item 2

### F-09-08 Learn Foundations and Reference index say not published

- Area: /docs/learn/foundations/ ("BeeUI's packages are not published to the public registry, and the CLI does not resolve from it either."); /docs/reference/ ("BeeUI packages and the CLI are not published to npm. Every command on these pages runs from a repository checkout; publication remains owner-gated by #254.")
- Severity: Medium
- Source consulted: page text; npm
- Expected: no such paragraph, or one that matches npm
- Actual: as quoted
- Repro: open either page and search "not published"
- Workaround: none needed
- Suggested fix: delete "Distribution reality today" on Foundations (Start covers it); delete "Publication state" on Reference

### F-09-09 CLI reference and Theming describe the checkout path as the only path

- Area: /docs/reference/cli/ ("Run commands as pnpm beeui <command> from a checkout."); /docs/theming/ ("The package is still unpublished; see Start for the current packed/workspace consumption path.")
- Severity: Medium
- Source consulted: page text; /docs/guides/cli-source-ownership/; npm
- Expected: `npx @beemvp/beeui-cli@next <command>` as the consumer form; Theming pointing at the npm install
- Actual: as quoted
- Repro: compare /docs/reference/cli/ with /docs/guides/cli-source-ownership/
- Workaround: use the guide's commands
- Suggested fix: change the CLI reference sentence to "Run commands as `npx @beemvp/beeui-cli@next <command>` from your project; `pnpm beeui` is the repository-local form"; delete the Theming sentence

### F-09-10 Showcase describes a stale runtime banner as current

- Area: /docs/showcase/, "Build identity and status"
- Severity: Low
- Source consulted: page text; npm
- Expected: no publication claim, or a current one
- Actual: "The runtime still states that BeeUI packages/CLI are unpublished; a public Showcase URL does not imply npm publication."
- Repro: read the section
- Workaround: none needed
- Suggested fix: delete the sentence; if the Showcase banner still says unpublished, fix the banner

## Part B: site-level patterns

### F-09-11 Two publication stories, neither generated

- Area: site-wide (17 pages)
- Severity: High
- Source consulted: all 52 pages; npm
- Expected: one sentence about channel state, generated once, included everywhere
- Actual: 20 hand-written sentences in two incompatible versions ("unpublished" on 8 pages, "published on next, latest not promoted" on 9 pages), and a generated page (/docs/guides/current-release/) that contradicts its own prose
- Repro: `grep -l -i "unpublished\|not promoted\|not published" scripts/audit/.cache/readability/*.txt`
- Workaround: none
- Suggested fix: a single generated include fed by npm dist-tags at docs build time, plus a build check that fails on the strings "unpublished", "not published to npm" and "not promoted" outside that include

### F-09-12 Maintainer's-seat writing on consumer pages

- Area: /docs/compatibility/native/, /docs/compatibility/web/, /docs/showcase/, /docs/reference-app/, /docs/performance/, /docs/patterns/ (sentence one), /docs/ai/ ("the Worker must serve them as plain text"), /docs/registry/ ("the public Web gate must fail")
- Severity: Medium (these pages average 3.2; the reader cannot run any command they give)
- Source consulted: page text
- Expected: pages that say what the reader can decide or do, with commands a package consumer can run
- Actual: descriptions of CI workflows, labels (`ci:rn-0.87`, `workflow_dispatch`), build flags (`embed=1`, `experiments.baseUrl`) and `pnpm --filter` or `./scripts/` commands
- Repro: count the `pnpm --filter` and `.github/workflows` mentions on those pages
- Workaround: none
- Suggested fix: open each page with a consumer summary (see the replacement texts in readability-site.md for Compatibility native, Showcase, Reference app and Performance) and move the rest under a "For maintainers" heading

### F-09-13 No audience or prerequisite line on 30 of 52 pages

- Area: site-wide; worst in Accessibility task guides, Performance, Showcase, both Compatibility sub-pages
- Severity: Medium
- Source consulted: criterion 2 scores in readability-site.json
- Expected: one line before the first instruction naming who the page is for and what must already be true (the Provider & safe area and RTL pages do this)
- Actual: 30 pages score 3 or below on criterion 2; 12 score 2 with no such line at all
- Repro: open /docs/accessibility/keyboard-focus/ and look for a sentence naming the reader
- Workaround: none
- Suggested fix: add a fixed "Who this is for / Before you start" line to the page template for Start, Guides, Accessibility and Compatibility pages

### F-09-14 Accessibility task guides contain no task

- Area: /docs/accessibility/keyboard-focus/ (127 words), /docs/accessibility/reduced-motion/ (93 words), /docs/accessibility/native-assistive-tech/ (124 words)
- Severity: Medium (the index labels them "Task guides")
- Source consulted: page text
- Expected: a procedure with an expected result, as on /docs/accessibility/rtl/ and /docs/accessibility/large-text/
- Actual: policy statements ("Test with actual Tab/Shift+Tab and Escape, not only pointer clicks") with no steps, no expected result and no code
- Repro: read the three pages
- Workaround: read /docs/learn/accessibility-model/ for the model and /docs/start/provider-safe-area/ Verify table for the closest thing to a procedure
- Suggested fix: replacement texts in readability-site.md, lowest pages, items 1, 6 and 10

### F-09-15 CLI invocation is inconsistent across pages

- Area: /docs/guides/troubleshooting/ and /docs/reference/cli/ and /docs/registry/ use `pnpm beeui ...`; /docs/start/ and /docs/guides/cli-source-ownership/ use `npx @beemvp/beeui-cli@next ...`
- Severity: Medium
- Source consulted: page text
- Expected: one consumer form everywhere, with the repository form marked maintainer-only
- Actual: a reader following Troubleshooting's "unknown or unsupported registry item" entry is told to run `pnpm beeui list`, which fails outside a checkout
- Repro: `grep -c "pnpm beeui" scripts/audit/.cache/readability/guides--troubleshooting.txt`
- Workaround: substitute `npx @beemvp/beeui-cli@next`
- Suggested fix: as F-09-06 and F-09-09

### F-09-16 Theming's CSS snippet omits the required @source lines

- Area: /docs/theming/, "Web CSS"
- Severity: Medium (a reader copying from this page reproduces Troubleshooting's first Web entry, "everything is unstyled")
- Source consulted: /docs/theming/ versus /docs/start/web/, /docs/start/expo/ and /docs/guides/troubleshooting/ ("The @source lines are equally required")
- Expected: the five-line entry every Start page shows
- Actual: three lines (tailwindcss, uniwind, theme.css) with no @source lines
- Repro: compare the two snippets
- Workaround: copy the entry from a Start page
- Suggested fix: show the five-line entry or replace the block with a link to Web onboarding

### F-09-17 Start/Web and Start/Bare defer the config file to a repository path

- Area: /docs/start/web/ ("The maintained examples/web-consumer fixture is the executable authority for plugin order and React Native Web aliasing"); /docs/start/bare-react-native/ ("Your Metro/Uniwind setup should follow the maintained consumer fixture at examples/bare-rn-consumer")
- Severity: Medium (the reader cannot finish the Start page without opening the repository)
- Source consulted: page text; Troubleshooting's "Metro builds, but native styling is missing" and "react-native-web types or aliases fail" entries, which quote the needed config
- Expected: the vite.config.ts and metro.config.js blocks inline, as /docs/start/expo/ does for Metro
- Actual: a path to a fixture
- Repro: follow /docs/start/web/ in a fresh Vite app
- Workaround: copy the snippets from Troubleshooting
- Suggested fix: inline both config files

### F-09-18 Overlapping pages that restate each other

- Area: /docs/responsive/ versus /docs/learn/responsive-model/ (the Learn page contains everything the short page says, plus values and code); /docs/registry/ versus /docs/guides/cli-source-ownership/ versus /docs/reference/cli/ (three pages, one topic, three command styles); /docs/compatibility/ versus /docs/compatibility/current/ (table repeated "intentionally"); /docs/release-security/ repeats the Start install block; /docs/theming/ versus /docs/guides/branding/
- Severity: Low
- Source consulted: page text
- Expected: one authority per topic with short pointers elsewhere
- Actual: as listed
- Repro: read the pairs
- Workaround: none
- Suggested fix: reduce /docs/responsive/ to a pointer plus the two breakpoint values; fold /docs/registry/ into the CLI guide; drop the repeated table on /docs/compatibility/

### F-09-19 Sidebar order does not match the index order

- Area: /docs/accessibility/ Previous link goes to the Wallet pattern page; the index lists Keyboard & focus first, but the sidebar sequence is RTL, Large text, Keyboard, Reduced motion, Native AT (keyboard-focus shows "Previous Large text & zoom Next Reduced motion")
- Severity: Low
- Source consulted: Previous/Next footers in the stripped text
- Expected: Previous/Next follow the section's own ordering
- Actual: as above
- Repro: read the last line of each accessibility page's text
- Workaround: use the index
- Suggested fix: set sidebar order in the Accessibility section frontmatter to match the index

### F-09-20 Learn examples reference undefined prop types

- Area: /docs/learn/ownership-model/ (`AppShellProps`), /docs/learn/composition-model/ (`CurrencySelectProps`), /docs/learn/forms-model/ (`EmailFormProps`)
- Severity: Low
- Source consulted: page text
- Expected: pasteable examples (the site's own standard on Table and Date & time)
- Actual: each example uses a props type that is never declared
- Repro: paste any of the three into a TypeScript file
- Workaround: declare the type
- Suggested fix: add a one-line `type XProps = { ... }` above each example

### F-09-21 Reference Core leaves 12 of 25 values without a description

- Area: /docs/reference/core/, Values table
- Severity: Low
- Source consulted: page text
- Expected: one sentence per exported value
- Actual: 12 rows show a dash (cn, clampCalendarDate, constrainOverlayViewportToKeyboard, createOverlayDismissStack, getSafeAreaCollisionPadding, isCalendarDateDisabled, isCalendarDateWithinRange, isLeapYear, isSameCalendarDate, isValidCalendarDate, mergeOverlayCollisionPadding, resolveAnchoredOverlayPosition, windowRectToHostRect)
- Repro: count the dashes in the Description column
- Workaround: read the signature
- Suggested fix: add JSDoc to the source so the generator picks it up

### F-09-22 Links: all resolve (positive finding)

- Area: site-wide
- Severity: none
- Source consulted: 335 unique hrefs from the main column of the 52 pages, GET with redirects, up to four attempts
- Expected: 200
- Actual: 335 of 335 returned 200
- Repro: `node scripts/audit/.cache/readability/_links.mjs` (cache dir, gitignored)
- Workaround: not applicable
- Suggested fix: none

### F-09-23 Site availability during the audit

- Area: https://beeui.beemvp.com
- Severity: Low (operational, not documentation)
- Source consulted: curl timings
- Expected: pages load in under a few seconds
- Actual: roughly one request in four stalled mid-transfer past 30 seconds on 2026-09-11 (curl exit 28 with partial bytes); the same URLs returned in about one second on retry
- Repro: `for i in 1 2 3; do curl -sS -o /dev/null -w '%{http_code} %{time_total}s\n' --max-time 90 https://beeui.beemvp.com/docs/learn/; done`
- Workaround: retry
- Suggested fix: check the host or CDN for stalled connections
