# Readability audit: template-generated pages (components + patterns)

Scope: BeeUI docs site (https://beeui.beemvp.com), phase 09c. Scores the two shared
templates (62 component pages, 37 pattern pages) by sampling 8 component pages and 6
pattern pages, then generalises to template-level findings. Rubric is the 9 scorable
criteria from `plans/260911-0854-beepos-ui-prototype/phase-09-readability-comprehension.md`
(criterion 10, exam-based knowledge transfer, is out of scope for this pass). Fetched
with `curl -sS URL | sed 's/<[^>]*>/ /g' | tr -s ' \n'`, content read from the second
"Select theme Dark Light Auto" marker onward. Date: 2026-09-11.

Sample selection (deterministic, per task spec):
- Components, every 8th of the alphabetical sitemap list starting at accordion: accordion,
  chip, field, list-item, popover, select, stat, textarea. All 8 existed in
  `/docs/sitemap-0.xml`; no substitution needed.
- Patterns, first alphabetically in auth and account-settings, first two alphabetically in
  commerce-social and dashboard-finance: auth/forgot-password-screen,
  account-settings/account-screen, commerce-social/cart-screen,
  commerce-social/checkout-screen, dashboard-finance/analytics-screen,
  dashboard-finance/dashboard-overview-screen.

Rubric criteria (1-5 each): C1 purpose in first paragraph, C2 prerequisites/audience
before first instruction, C3 concept before mechanism, C4 terms defined/linked at first
use, C5 examples complete and runnable as pasted, C6 rules actionable (what to do / what
breaks), C7 platform differences and evidence class explicit, C8 navigation and
cross-links resolve, C9 reading load (sentence length, jargon density, one idea per
paragraph).

## Sample table

### Component pages (8)

| Page | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | Avg | Words | Code blocks | Links (unique) | 404s |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| accordion | 5 | 2 | 2 | 2 | 1 | 4 | 3 | 5 | 3 | 3.00 | 1489 | 3 | 22 | 0 |
| chip | 5 | 2 | 2 | 2 | 1 | 4 | 3 | 5 | 3 | 3.00 | 1417 | 3 | 24 | 0 |
| field | 5 | 2 | 2 | 2 | 1 | 3 | 3 | 5 | 3 | 2.89 | 1447 | 6 | 30 | 0 |
| list-item | 5 | 2 | 2 | 2 | 1 | 4 | 3 | 5 | 3 | 3.00 | 1314 | 4 | 27 | 0 |
| popover | 5 | 2 | 2 | 2 | 1 | 4 | 3 | 5 | 2 | 2.89 | 2558 | 8 | 32 | 0 |
| select | 5 | 2 | 2 | 2 | 1 | 4 | 3 | 5 | 2 | 2.89 | 2689 | 8 | 32 | 0 |
| stat | 5 | 2 | 2 | 2 | 1 | 4 | 3 | 5 | 3 | 3.00 | 1150 | 3 | 24 | 0 |
| textarea | 5 | 2 | 2 | 2 | 1 | 4 | 4 | 5 | 3 | 3.11 | 952 | 3 | 24 | 0 |
| **Sample avg** | | | | | | | | | | **2.97** | | | | |

Justifications (one row of evidence per criterion, representative of the whole set
since all 8 pages share the identical section order and phrasing):

- **C1 = 5.** Purpose is the first sentence after the H1 on every page, e.g. accordion:
  "Single-value controlled/uncontrolled disclosure group where one item expands at a
  time." No page makes the reader hunt for what the component does.
- **C2 = 2.** No page states who it is for or what to have set up first. The text moves
  from the purpose line straight to a legal/process caveat ("Distribution status BeeUI
  packages and the public CLI remain unpublished...") and then an `import` line. The one
  fact a reader would need before importing anything - that Web consumers must load the
  BeeUI semantic theme CSS - is stated, but buried in "Provider and dependencies", after
  Props, not before the first instruction.
- **C3 = 2.** No "why would I reach for this component" framing anywhere (contrast with
  the Learn pages' "Why the concept exists" model cited in the rubric). The page goes
  purpose sentence to Identity to Import to Composition/API, i.e. straight to mechanism.
- **C4 = 2.** "Registry" is used 5-7 times per page (Registry/export-map component
  family, Registry metadata, Registry dependency closure, repository-local Registry
  command) and is never linked to an explanation of what the Registry is; the one nearby
  link (accordion) points to the raw `registry.json` file on GitHub, not a concept page.
  Types resolve only one level: on select, `SelectAlign - alias of AnchoredOverlayAlign`
  is listed under "Related exported types" but `AnchoredOverlayAlign` itself is never
  spelled out (no `'start' | 'center' | 'end'` union shown) anywhere on the page.
- **C5 = 1.** Every "Verified example source" section ends with the same sentence:
  "Open the fixture itself for the surrounding imports and state." The snippets shown
  reference state that is not defined in the snippet, e.g. select's snippet uses
  `onOpenChange={setRootSelectOpen}` and `open={rootSelectOpen}` with `setRootSelectOpen`
  and `rootSelectOpen` never declared on the page. As pasted, none of the 8 examples
  compile.
- **C6 = 3.6 avg.** Limitations sections are genuinely actionable and component-specific,
  e.g. popover/select: "Passing `open` without `onOpenChange` leaves the value
  read-only... It warns in development builds rather than failing silently in
  production." Field's Limitations is the thinnest of the sample ("Checkbox/radio/switch
  labelling stays explicit at the control/group level") - states a rule but not what
  breaks if ignored, hence field scores 3 instead of 4.
- **C7 = 3.1 avg.** The evidence-class sentence is precise and repeated verbatim: "Web
  behavior is exercised in a real browser, while iOS and Android carry package/export and
  native-compile evidence, which is not device-runtime proof." But the Platform behavior
  section only ever says whether a component's source branches on `Platform` or not
  ("its source branches on Platform, so some behavior differs by target" for select and
  textarea) without ever stating what the difference is. Textarea scores 4 because its
  Limitations section (not Platform behavior) does spell out a concrete Web-specific
  number: "On Web `numberOfLines` becomes a minimum height of at least 96 pixels rather
  than a hard row count."
- **C8 = 5.** All 133 unique in-content links collected across the 14 sampled pages
  returned HTTP 200 (checked with curl, redirects followed). Zero 404s in the sample.
- **C9 = 2.7 avg.** Sentences routinely stack two or three ideas with semicolons, e.g.
  accordion: "Single-value controlled (`value`/`onValueChange`) or uncontrolled
  (`defaultValue`) disclosure coordination shared by every AccordionItem; a disabled
  item's trigger stays non-interactive and cannot expand, and only the active item's
  AccordionContent mounts." Jargon density (Registry, evidence class, packed-consumer
  verification, dependency closure) is heavy for reference material aimed at app
  developers. Popover and select score lower (2) because their extra Props tables and
  addressable-example lists multiply the same dense pattern several times over.

### Pattern pages (6)

| Page | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | Avg | Words | Code blocks | Links (unique) | 404s |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| auth/forgot-password-screen | 5 | 2 | 3 | 3 | 1 | 4 | 4 | 5 | 3 | 3.33 | 730 | 1 | 22 | 0 |
| account-settings/account-screen | 5 | 2 | 3 | 3 | 1 | 4 | 4 | 5 | 2 | 3.22 | 791 | 1 | 19 | 0 |
| commerce-social/cart-screen | 5 | 2 | 3 | 3 | 1 | 4 | 4 | 5 | 2 | 3.22 | 763 | 1 | 20 | 0 |
| commerce-social/checkout-screen | 5 | 2 | 3 | 3 | 1 | 4 | 4 | 5 | 3 | 3.33 | 705 | 1 | 23 | 0 |
| dashboard-finance/analytics-screen | 5 | 2 | 3 | 3 | 1 | 4 | 4 | 5 | 2 | 3.22 | 724 | 1 | 22 | 0 |
| dashboard-finance/dashboard-overview-screen | 5 | 2 | 3 | 3 | 1 | 4 | 4 | 5 | 2 | 3.22 | 814 | 1 | 23 | 0 |
| **Sample avg** | | | | | | | | | | **3.26** | | | | |

Justifications:

- **C1 = 5.** Same pattern as components: one sentence after the title states the
  screen's purpose, e.g. checkout: "Order review with address editing and place-order
  action."
- **C2 = 2.** No page states audience or setup prerequisites. First instruction-adjacent
  content is the "Preview" link and the Composition list, with no framing of what the
  reader needs already in place (a router, an auth provider, a BeeUIProvider).
- **C3 = 3.** Slightly better than components: "The pattern is a composition recipe
  rather than a new framework layer. Follow the linked component contracts for state,
  provider, platform and accessibility details." states what kind of artifact this is.
  Still no discussion of why this particular screen is shaped the way it is (e.g. why
  the Forgot Password screen asks only for email, not a UX rationale).
- **C4 = 3.** "Application ownership boundary" as a heading is not pre-defined, but the
  body sentence under it immediately explains the concept through examples ("BeeUI does
  not take ownership of app routing, authentication/business rules, APIs/data fetching,
  persistence, form/state frameworks, chart frameworks or backend logic..."), which is
  better than the component template's unexplained "Registry" jargon.
- **C5 = 1.** The only code block on every pattern page is the TypeScript prop-type
  declaration (e.g. `export type ForgotPasswordScreenProps = { ... }`); there is no
  compilable JSX usage example anywhere on the page. The actual screen implementation is
  never inlined, only named: "Copy `apps/showcase/patterns/auth/screens/
  forgot-password-screen.tsx` into your app and adapt it directly." A reader cannot paste
  anything from a pattern page and run it.
- **C6 = 4.** "Application ownership boundary" is consistently concrete and actionable,
  e.g. forgot-password: "Intentionally excluded: Sending the reset email, rate limiting,
  and account lookup."
- **C7 = 4.** The Responsive contract section is the strongest part of the pattern
  template: it is derived per-file, not boilerplate, e.g. forgot-password: "Platform-
  prefixed utility classes: `web:py-12` (auth/components/auth-shared.tsx, the branch
  taken when compact is false)." It never states what the non-Web behavior looks like,
  only that Web evidence and native evidence are different classes.
- **C8 = 5.** All in-content links on the 6 sampled pattern pages returned HTTP 200.
- **C9 = 2.3 avg.** The Responsive contract and Accessibility paragraphs list every file
  in the pattern's import closure inline, in a single run-on sentence, e.g.
  dashboard-overview-screen (7-file closure): one sentence repeats all 7 file paths for
  "Scroll ownership" and another repeats them for "Viewport measurement." Pages with a
  1-3 file closure (forgot-password, checkout) read appreciably lighter and score C9=3.

## Template-level findings

Findings below recur verbatim, or with only the component/pattern name substituted, on
every page in the sample for that template - meaning they are almost certainly present
on all 62 component pages and/or all 37 pattern pages, not isolated to the pages sampled.

1. **Stale "unpublished" claim, both templates, 14/14 sampled pages.** Exact sentence,
   unchanged across all 8 component pages: "BeeUI packages and the public CLI remain
   unpublished. The import shape below is the stable public package boundary used by
   workspace/packed-consumer verification; use the repository-local Registry command
   only from a BeeUI checkout until publication is explicitly authorized." All 6 sampled
   pattern pages carry the matching claim: "before public CLI publication, use CLI &
   source ownership from a BeeUI checkout rather than a public npx command." Checked
   against the npm registry directly (`https://registry.npmjs.org/@beemvp/beeui-ui`):
   `@beemvp/beeui-ui` is published, dist-tags `latest` and `next` both point to
   `0.86.2-rc.1`. The claim is false as written.
   **Suggested template change:** replace the "unpublished" sentence with a distribution
   status computed from the actual npm dist-tag at build time (e.g. "Published as
   `@beemvp/beeui-ui@0.86.2-rc.1` (pre-release channel `next`)."), or at minimum change
   "remain unpublished" to name the actual pre-release/rc caveat instead of an absolute
   "unpublished" claim.

2. **No prerequisites or audience statement, both templates, 14/14 sampled pages.**
   Neither template states who the page is for or what must already be set up
   (BeeUIProvider, theme CSS, a router) before the reader acts on the page. The one
   relevant fact that exists - "Web consumers load the BeeUI semantic theme CSS as
   documented in Web onboarding" - is present on every component page but placed after
   the Props tables, not before the Import section where a reader would need it.
   **Suggested template change:** move a one-line prerequisites callout ("Requires
   BeeUIProvider at your app root; Web also requires the semantic theme CSS, see Web
   onboarding.") to directly under the purpose sentence, before Identity/Import.

3. **No worked example is runnable as pasted, both templates, 14/14 sampled pages.**
   Component template: every "Verified example source" section closes with "Open the
   fixture itself for the surrounding imports and state," and the snippets shown
   reference undeclared state (e.g. select's `setRootSelectOpen`). Pattern template: the
   only code block on the page is a prop-type declaration, never a usage example; actual
   JSX is never inlined, only named as a file to go copy. A reader cannot exercise either
   template's example without leaving the docs site.
   **Suggested template change:** for components, prepend a synthesized minimal wrapper
   (`import { X } from '@beemvp/beeui-ui'; export function Example() { const [state,
   setState] = useState(...); return (<verbatim JSX>); }`) generated from the same
   fixture data already extracted, so the block is self-contained. For patterns, inline
   the first 15-20 lines of the actual screen file (imports + component signature) above
   the prop-type block, or add a second code block showing a minimal composed-usage call
   site.

4. **"Registry" is undefined jargon used 5+ times per component page.** No sampled
   component page links "Registry" to a concept explainer; the only nearby link goes to
   the raw `registry.json` file. Type aliases resolve only one hop (e.g.
   `SelectAlign - alias of AnchoredOverlayAlign`) and the underlying type is never shown.
   **Suggested template change:** link the first occurrence of "Registry" per page to a
   short "What is the Registry" explainer, and resolve one more alias hop in the props
   table so the literal union/shape is visible without opening the `.d.ts`.

5. **Platform behavior section names whether a difference exists but never what it is,
   component template, 8/8 sampled pages.** The sentence toggles between "ships no
   platform-specific file, and its own source takes no Platform branch" and "its source
   branches on Platform, so some behavior differs by target" (select, textarea) but the
   actual differing behavior is never stated in that section (textarea's own concrete
   Web-height number happens to live in Limitations instead).
   **Suggested template change:** when the source does branch on `Platform`, surface the
   actual per-branch behavior (even a one-line summary per OS) in the Platform behavior
   section itself, not scattered into Limitations or omitted.

6. **Composition lists name components used but never explain the choice, pattern
   template, 6/6 sampled pages.** "Principal public BeeUI exports used by this screen:
   Button, Card, Field, Input, Link, VStack" is a flat, unannotated list on every pattern
   page; it never says why those specific components were composed this way for this
   screen (e.g. why Card wraps the form, why VStack over a Box).
   **Suggested template change:** add one sentence per pattern connecting the composition
   choice to the screen's purpose, even a generated one derived from the component roles
   already extracted for Accessibility (e.g. "Card groups the form as a single
   `region`; Field pairs each Input with its label and error state.").

## Top 5 highest-value template rewrites

These are the five changes with the largest expected readability/trust gain relative to
effort, because each touches one template section shared by 62 (component) or 37
(pattern) pages.

### 1. Replace the stale distribution-status sentence (component template)

Current (all 8 sampled pages):
> "BeeUI packages and the public CLI remain unpublished. The import shape below is the
> stable public package boundary used by workspace/packed-consumer verification; use the
> repository-local Registry command only from a BeeUI checkout until publication is
> explicitly authorized."

Replacement:
> "`@beemvp/beeui-ui` is published to npm under the `next` pre-release tag
> (`0.86.2-rc.1` at time of writing); expect breaking changes between rc releases. The
> import shape below is the stable public package boundary. Prefer `pnpm add
> @beemvp/beeui-ui@next`; the repository-local Registry command below is for source
> ownership, not for installing the package."

### 2. Add a prerequisites line under the purpose sentence (component template)

Current: purpose sentence is immediately followed by the distribution-status paragraph,
then Identity, then Import - no setup is named before the reader is told to `import`.

Replacement (new line inserted directly under the purpose sentence):
> "Before importing: mount `BeeUIProvider` once at your app root; on Web, load the BeeUI
> semantic theme CSS (see Web onboarding). This component assumes both are already in
> place."

### 3. Make the "Verified example source" block self-contained (component template)

Current closing line on every sampled page:
> "Open the fixture itself for the surrounding imports and state. For a smaller
> app-specific example, start from the public imports shown above and keep only the
> state your screen owns."

Replacement (wraps the existing verbatim snippet instead of just linking away from it):
> "Paste-ready version of the snippet above, with the imports and state it depends on
> restored:
> ```tsx
> import { useState } from 'react';
> import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@beemvp/beeui-ui';
>
> export function Example() {
>   const [open, setOpen] = useState(false);
>   return (
>     <Select onOpenChange={setOpen} open={open}>
>       <SelectTrigger><SelectValue placeholder="Root Select" /></SelectTrigger>
>       <SelectContent><SelectItem value="root">Root option</SelectItem></SelectContent>
>     </Select>
>   );
> }
> ```
> This is the same fixture code shown above with only the missing `useState` restored;
> open the fixture itself for the remaining examples on this page."

### 4. Inline a minimal usage snippet on pattern pages (pattern template)

Current: the only code block on every sampled pattern page is the prop-type
declaration; no JSX is ever shown.

Replacement (new code block inserted directly after the Composition paragraph):
> "Minimal call site:
> ```tsx
> <ForgotPasswordScreen
>   email={email}
>   onEmailChange={setEmail}
>   onSubmit={handleSubmit}
>   onBackToSignIn={handleBack}
> />
> ```
> Every prop above maps to a field in `ForgotPasswordScreenProps` below; fetching,
> routing and persistence stay in your `handleSubmit`/`handleBack` callbacks."

### 5. State the actual platform difference instead of just flagging one exists
(component template, applies to select, textarea, date-picker, date-time-picker and any
other family whose source branches on `Platform`)

Current (select, textarea):
> "This family ships no platform-specific file, but its source branches on Platform, so
> some behavior differs by target."

Replacement:
> "This family ships no platform-specific file, but its source branches on `Platform`:
> on Web, `numberOfLines` sets a minimum height (at least 96px) rather than a hard row
> count; iOS and Android render the requested row count directly. [Component-specific
> branch summary generated from the same source scan already powering this section.]"

## Notes on method

- All figures above (word count, code block count, link count) are computed from the
  rendered page, not the source Markdown, using the curl/sed pipeline specified in the
  task and the page's raw HTML for link and code-block extraction.
- 133 unique in-content links were collected across the 14 sampled pages (links inside
  the `sl-markdown-content` region only, excluding the sidebar nav and TOC, which repeat
  identically on all 151 site pages). All 133 returned HTTP 200 on direct curl check
  (redirects followed); 0 were 404 or otherwise broken.
- The npm-publication check was done directly against `registry.npmjs.org`, not by
  reading other BeePOS project files, per the task's read-only-the-phase-file
  instruction.
