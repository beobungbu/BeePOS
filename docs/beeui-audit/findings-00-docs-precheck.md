# Findings 00 · docs pre-check (Ambrose, 2026-09-11, before any code)

### 00-01 · llms*.txt say UNPUBLISHED while npm has 0.86.2-rc.1
- Area: llms
- Severity: major
- Source consulted: https://beeui.beemvp.com/llms.txt, llms-full.txt, llms-components.txt, llms-patterns.txt (all four carry the same STATUS paragraph); `npm view @beemvp/beeui-ui` (published 2026-09-09T01:16Z)
- Expected (per docs): STATUS says "No `@beemvp/beeui-*` package or CLI is on npm ... Do not tell a user to `npm install @beemvp/beeui-ui`".
- Actual: `@beemvp/beeui-ui`, `-core`, `-tokens`, `-cli` all resolve on npm at `0.86.2-rc.1`. The same llms files list "v0.86.2-rc.1" in the Packages section, so the generator picked up the RC version but the hard-coded STATUS text was not updated. Also says "the repository is private" (local llms.txt copy) while README says public since 2026-08-30.
- Repro: `curl -s https://beeui.beemvp.com/llms.txt | grep -n UNPUBLISHED`; `npm view @beemvp/beeui-ui version`
- Workaround: ignore STATUS, follow `/docs/start/` which is correct.
- Suggested fix for BeeUI: make STATUS in `scripts/generate-llms-txt.mjs` derive from npm dist-tags / release state instead of a constant; add a CI check that STATUS and Packages version agree.

### 00-02 · npm `latest` dist-tag already points at the RC, docs say only `next`
- Area: docs-public
- Severity: minor
- Source consulted: https://beeui.beemvp.com/docs/start/ ("public on npm under the opt-in next dist-tag. Stable latest is not promoted yet"); `npm view @beemvp/beeui-ui dist-tags` → `{ next: 0.86.2-rc.1, latest: 0.86.2-rc.1 }`
- Expected (per docs): `npm i @beemvp/beeui-ui` (unqualified) should not resolve to the RC.
- Actual: unqualified install resolves to `0.86.2-rc.1` because `latest` was set. Harmless today (only one version) but contradicts the "opt-in" promise and will bite once a stable exists if tags are not managed.
- Repro: `npm view @beemvp/beeui-ui dist-tags`
- Workaround: pin exact `@0.86.2-rc.1`.
- Suggested fix for BeeUI: publish RCs with `--tag next` only; add release check that `latest` never points at a prerelease.

### 00-03 · Version scheme mismatch between repo and npm
- Area: docs-public
- Severity: nit
- Source consulted: BeeUI repo `package.json` workspace version `20260902.0.0`; npm `0.86.2-rc.1`; README still says manifests read `"version": "0.1.0"`; examples/expo-package-consumer/package.json pins `file:.beeui-tarballs/beeui-ui-0.1.0.tgz`.
- Expected: one version story.
- Actual: three different version strings across README, workspace, and npm. `0.86.2` mirrors the React Native version, which is not explained anywhere public.
- Workaround: none needed.
- Suggested fix for BeeUI: one sentence in `/docs/start/` and `/docs/release-security/` explaining the versioning policy; refresh README "Pre-1.0 distribution" section.

### 00-04 · `/docs/` sitemap-index.xml referenced by robots.txt returns empty
- Area: docs-public
- Severity: nit
- Source consulted: https://beeui.beemvp.com/robots.txt lists `https://beeui.beemvp.com/docs/sitemap-index.xml`
- Actual: `curl` of `/sitemap-index.xml` returns empty body; `/sitemap.xml` returns 200. Not verified whether `/docs/sitemap-index.xml` is populated (check during phase 5 SEO/AI-discoverability pass).
- Workaround: none.
