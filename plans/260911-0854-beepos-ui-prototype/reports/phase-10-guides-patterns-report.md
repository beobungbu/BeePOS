# Phase 10: Guides, Theming/Reference and Patterns code samples executed in a clean room

Date: 2026-09-11. Owner: one Sonnet worker. Tracker: BeeUI #234. Sources: only
https://beeui.beemvp.com and the npm packages (`@beemvp/beeui-*@0.86.2-rc.1`); `~/workspace/BeeUI`
was not read.

## What was done

1. **Clean room**: `/Users/textsoft/workspace/beeui-cleanroom-samples` (outside the BeePOS repo,
   never committed), an Expo SDK 57 + BeeUI 0.86.2-rc.1 app. Copied config and `node_modules` from
   the working `/Users/textsoft/workspace/beeui-cleanroom-expo` clean room built in phase 07B, to
   save an install pass -- noted here per the phase instructions. `npx playwright --version` ->
   1.63.0, already usable (no local install needed). Dev server on port 8097
   (`npx expo start --web --port 8097`).
2. **Extractor**: `scripts/audit/extract-doc-samples.mjs` (reuses `scripts/audit/lib/http.mjs` and
   `html.mjs`) fetches the 9 guide pages, `/docs/theming/` + `/docs/reference/{tokens,core,styling}/`,
   and the 37 pattern pages, and pulls every Expressive Code block (`<pre data-language>` ->
   `data-code` copy-button pairs, reconstructed line-by-line to preserve indentation) into
   `scripts/audit/.cache/samples/<page>/<n>.<ext>`, with page URL, nearest heading, and language
   recorded per block. `/docs/reference/{tokens,core,styling}/` genuinely have zero fenced code
   blocks (they are prose/table pages with only inline `<code>` spans) -- confirmed by inspecting
   the raw HTML, not an extractor bug.
3. **Compile pass**: all 57 TS/TSX samples copied into `raw-samples/**` in the clean room and
   checked with one `tsc --noEmit` pass (`tsconfig.raw-samples.json`). 20 of those 57 are real
   guide/theming samples; the other 37 are the pattern pages' single "State and callback contract"
   block each.
4. **Render pass, guides/theming (19 mountable samples)**: each was harnessed (documented additions
   logged per-sample in `doc-samples.json`'s `needsContext`/`manualNotes` fields -- default-export
   wrappers, sample data, or a screen that renders a side-effecting call's success/error text) and
   mounted as an `expo-router` route under `src/app/samples/*`. The root `_layout.tsx` was extended
   to bypass the starter app's fixed 2-tab `<Tabs>`/`<TabSlot>` navigator for `/samples/*` routes
   (which otherwise only ever displays the "home"/"explore" tab content regardless of URL) and
   render a plain `<Slot/>` there instead, still inside `BeeUIProvider`. Playwright/Chromium then
   navigated to all 19 routes, screenshotting at 390 and 1024px and capturing console/page errors.
   A second full-project `tsc --noEmit` pass over the whole app (not just the isolated raw file)
   was also run, because it surfaced a real difference for one sample (see finding 10-01): a
   sample that type-checks in isolation can still fail once the app's own generated
   `uniwind-types.d.ts` is in scope, which is the realistic result for an actual consumer app.
5. **Render pass, patterns (37 pages)**: each pattern page's own "Preview" section links to
   `https://beeui.beemvp.com/showcase/?surface=pattern&id=<id>&state=default&embed=1` (a real,
   Web-runtime rendering of the exact pattern, hosted on the same allowed public domain).
   Playwright navigated to all 37 of those, screenshotting at 390px and capturing console/page
   errors and HTTP status. The pattern id is the screen slug with `-screen` stripped (`sign-in-screen`
   -> `sign-in`), confirmed against 3 sample pages before generating the full list.
6. **CLI**: ran the full documented command contract for real, pinned to `@beemvp/beeui-cli@0.86.2-rc.1`
   (verified via `npm view @beemvp/beeui-cli dist-tags` that `next` and `latest` both resolve to
   that exact version today) -- `--help`, `init`, `list`, `add --dry-run button`, `add button`,
   `doctor`, `diff`, `update` -- in the clean room. Logs: `scripts/audit/.cache/cli-*.txt`.
7. **Prose checks**: read every guide's rendered text and listed its imperative instructions,
   marking each holds/fails/untestable with evidence (runtime probes for density's
   throw-on-unknown-mode claim and the date-time round-trip/calendar-grid claims; `npm view` for
   the publish-status claims; the CLI run above for the CLI guide; direct comparison against the
   clean room's own working config for the CSS/metro fragments).
8. **Findings**: `docs/beeui-audit/findings-10-guides-patterns.md` -- 1 broken sample (a guide's
   own worked example throwing at runtime), 1 systemic needs-context pattern (30/37 pattern
   contracts reference an undefined domain type), and 3 documentation defects (a stale
   "not published to npm yet" sentence, a metro-config path mismatch, and a Theming page missing
   the `@source` lines its own working config needs).

## Deviations from a literal reading of the phase file

- The phase file's method step 3 asks for "screenshot at 390 and 1024" for every sample and,
  separately, the Output section asks for "one per pattern page at 390." Guide/theming samples got
  both widths; pattern pages got 390 only, per the Output section's own narrower spec for patterns.
  No contact sheet was built (the Output section says a contact sheet is an alternative to
  per-page screenshots, not an addition on top of the per-page screenshots that were already made).
- Pattern pages' single code block is a type-only "state and callback contract," not a mountable
  component (no JSX). Rather than fabricating a synthetic render harness for a bare type
  declaration, the render/screenshot evidence for each pattern page came from the page's own
  linked live Web Showcase preview (an allowed public source on the same domain) -- this matches
  what the pattern page itself presents as its rendered example, more faithfully than inventing a
  component around a type alone would have.
- `pnpm beeui <cmd>` (the guides' repository-local maintainer path) and Troubleshooting's
  `pnpm --filter @beemvp/beeui-cli run build` / `pnpm registry:verify` / `pnpm ui-exports:check` /
  `pnpm docs:contract:check` only exist inside the BeeUI monorepo, which this audit is not
  permitted to read. Classified `needs-context` rather than attempting to fabricate that monorepo;
  the underlying CLI operations they wrap were independently verified through the published CLI.

## Outputs

- `scripts/audit/extract-doc-samples.mjs` (owned, committed)
- `docs/beeui-audit/doc-samples.json`, `docs/beeui-audit/doc-samples.md` (owned, committed)
- `docs/beeui-audit/findings-10-guides-patterns.md` (owned, committed)
- `docs/screenshots/samples-*.png` -- 75 files (19 guide/theming samples x 2 widths + 37 pattern
  pages x 1 width) (owned, committed)
- This report (owned, committed)
- One comment on `beobungbu/BeeUI#234`

## Verification

- `npm run typecheck` and `npm test` in BeePOS: green, unaffected (no BeePOS app code touched;
  clean room and its `node_modules`/screenshots-source live entirely outside the repo except the
  screenshot PNGs and the 4 files listed above).
- `git status` shows only the owned paths staged/committed; the clean room at
  `/Users/textsoft/workspace/beeui-cleanroom-samples` was never `git init`'d and is outside BeePOS.

Status: DONE
Summary: Extracted and ran every code block on the 9 guide pages, the 4 theming/reference pages
that have code (theming/core/styling/tokens -- tokens/core/styling genuinely have zero fenced code
blocks), and all 37 pattern pages in a clean-room Expo app; found one broken worked example in the
Branding guide (throws at runtime and fails tsc in full-project context), a systemic
needs-context gap across 30/37 pattern contracts, and 3 documentation-vs-reality mismatches, all
with reproductions and screenshots.
Concerns/Blockers: none blocking. `pnpm`-prefixed maintainer/monorepo commands (repository-local
CLI path, `pnpm bench:web`, `pnpm registry:verify` and friends) could not be run from a public-docs-only
consumer clean room by design; their underlying operations were verified another way where possible.
Samples: 73 total - as-pasted 22 - needs-context 50 - broken 1 - pattern pages rendered 37/37 - guide instructions: holds 24 / fails 3 / untestable 6 - Commit: 3a39c54
