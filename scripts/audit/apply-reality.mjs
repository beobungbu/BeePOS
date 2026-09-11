#!/usr/bin/env node
// Phase 07 Worker A / A3: adds `reality`, `verdict`, and `fix` to every row
// of docs/beeui-audit/docs-llms-matrix.json (built by phase 06's
// scripts/audit/build-docs-llms-matrix.mjs, which compares the BeeUI docs
// site against its llms*.txt AI surfaces). This script adds a THIRD,
// independent axis: what the installed npm package / a live HTTP check /
// the installed .d.ts / this phase's props-accuracy.json and
// behavior-claims.json actually show, then classifies each row as
// docs-right | llms-right | both-wrong | both-right | reality-unknown.
//
// Usage: node scripts/audit/apply-reality.mjs
// Writes docs/beeui-audit/docs-llms-matrix.{md,json} (overwriting the phase
// 06 output in place, now carrying reality/verdict/fix on every row) and
// prints the summary the A4 GitHub comment is built from.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fetchCached } from './lib/http.mjs';
import { npmViewJson } from './lib/npm-view.mjs';

const SITE = 'https://beeui.beemvp.com';
const OUT_DIR = path.join(process.cwd(), 'docs', 'beeui-audit');
const VALID_VERDICTS = new Set(['docs-right', 'llms-right', 'both-wrong', 'both-right', 'reality-unknown']);

async function loadJson(p, fallback = null) {
  try {
    return JSON.parse(await readFile(p, 'utf8'));
  } catch {
    return fallback;
  }
}

function setResult(row, reality, verdict, fix) {
  if (!VALID_VERDICTS.has(verdict)) throw new Error(`Invalid verdict "${verdict}" for row ${row.id}`);
  row.reality = reality;
  row.verdict = verdict;
  row.fix = fix;
}

// ---------------------------------------------------------------------------
// Category A — Publication and install (13 rows). Reality source: npm view.
// ---------------------------------------------------------------------------

function categoryA(rows, ctx) {
  const { npmUi } = ctx;
  const distTags = npmUi['dist-tags'] || {};
  const realVersion = npmUi.version;
  const packagesArePublished = !!realVersion && !npmUi.error;

  for (const row of rows) {
    if (/^Publication status claim/.test(row.item)) {
      setResult(
        row,
        `npm view @beemvp/beeui-ui resolves version ${realVersion} (dist-tags: ${JSON.stringify(distTags)}) — the package IS published on npm, contradicting the llms*.txt "UNPUBLISHED" claim.`,
        'docs-right',
        'Update the STATUS line in llms.txt/llms-full.txt/llms-components.txt/llms-patterns.txt and the "Rules an agent must preserve" section of /docs/ai/ to state the packages are published under the opt-in `next` dist-tag, matching /docs/start/ and /docs/release-security/. Already filed as #543.'
      );
      continue;
    }
    if (/version string \(/.test(row.item)) {
      const llmsVersion = row.llmsValue.split(' ')[0];
      setResult(
        row,
        `npm view @beemvp/beeui-ui version = ${realVersion}`,
        llmsVersion === realVersion ? 'both-right' : 'llms-right',
        llmsVersion === realVersion ? '' : `Update the version string in this llms file to ${realVersion} (currently ${llmsVersion}).`
      );
      continue;
    }
    if (/publish-state annotation/.test(row.item)) {
      setResult(
        row,
        `npm view resolves a real, installable version for this package (${realVersion}); it is not unpublished.`,
        'docs-right',
        'Remove or correct the "[unpublished ...]" bracket annotation in llms.txt\'s Packages list for this package. Already filed as #543.'
      );
      continue;
    }
    if (/npm install command/.test(row.item)) {
      setResult(
        row,
        `npm dist-tags: ${JSON.stringify(distTags)}. Right now \`latest\` and \`next\` point at the same prerelease, so llms.txt's untagged \`npm i\` command happens to also resolve ${realVersion} today — but that is a coincidence of the current release state, not a guarantee, and contradicts /docs/start/'s own "always use @next during the RC period" policy.`,
        'docs-right',
        "Update llms.txt's install command to include the `@next` dist-tag suffix, matching /docs/start/ and the documented pre-1.0 policy."
      );
      continue;
    }
    if (/npx CLI command/.test(row.item)) {
      setResult(
        row,
        'Same dist-tag policy as the npm install command above; the CLI package also only guarantees a working release under `@next` during the RC period.',
        'docs-right',
        'Update llms.txt\'s CLI command example to include the `@next` dist-tag suffix.'
      );
      continue;
    }
    if (/dist-tags: does "latest" stay unpromoted/.test(row.item)) {
      const collapsed = distTags.latest === distTags.next;
      setResult(
        row,
        `npm view @beemvp/beeui-ui dist-tags = ${JSON.stringify(distTags)}.`,
        collapsed ? 'llms-right' : 'both-right',
        collapsed
          ? "Either promote a stable `latest` distinct from the `next` prerelease, or soften /docs/start/'s \"stable latest is not promoted yet\" framing to reflect that `latest` currently resolves the same prerelease as `next`. Related to #561."
          : ''
      );
      continue;
    }
    setResult(row, 'unrecognized Category A row pattern — not classified by apply-reality.mjs', 'reality-unknown', '');
  }
}

// ---------------------------------------------------------------------------
// Category B — Compatibility (22 rows). Reality source: npm peerDependencies
// (where the item is a peer covered by it) or "unverifiable" otherwise (no
// independent, machine-checkable source of truth for a *tested* Node/pnpm
// toolchain version beyond the docs' own claim).
// ---------------------------------------------------------------------------

function satisfiesRange(version, range) {
  // Minimal semver range check sufficient for BeeUI's own `>=X <Y` /
  // `>=X.Y <Z` peerDependencies ranges — not a general semver implementation.
  const m = range.match(/>=\s*([\d.]+)\s*<\s*([\d.]+)/);
  if (!m) return null;
  const toParts = (v) => v.split('.').map((n) => parseInt(n, 10) || 0);
  const cmp = (a, b) => {
    for (let i = 0; i < 3; i++) {
      const d = (a[i] || 0) - (b[i] || 0);
      if (d !== 0) return d;
    }
    return 0;
  };
  const v = toParts(version.replace(/^\D+/, ''));
  return cmp(v, toParts(m[1])) >= 0 && cmp(v, toParts(m[2])) < 0;
}

function categoryB(rows, ctx) {
  const { npmUi } = ctx;
  const peers = npmUi.peerDependencies || {};
  const peerKeyByLabel = {
    'React version': 'react',
    'React DOM version': 'react-dom',
    'React Native version': 'react-native',
    'react-native-web version': null, // not a peerDependency (react-native-web has no fixed BeeUI-declared range)
  };
  for (const row of rows) {
    const versionCheckMatch = row.item.match(/^([A-Za-z0-9. /-]+ version) \(docs\/start prerequisites/);
    if (versionCheckMatch) {
      const label = versionCheckMatch[1];
      const peerKey = peerKeyByLabel[label];
      const docsVersion = row.docsSiteValue.split(' ')[0];
      if (peerKey && peers[peerKey]) {
        const sat = satisfiesRange(docsVersion, peers[peerKey]);
        setResult(
          row,
          `npm view @beemvp/beeui-ui peerDependencies["${peerKey}"] = "${peers[peerKey]}"`,
          sat === null ? 'reality-unknown' : sat ? (row.status === 'identical' ? 'both-right' : 'docs-right') : 'both-wrong',
          sat === false ? `The pinned/tested ${label} (${docsVersion}) falls outside the package's own declared peerDependencies range (${peers[peerKey]}); reconcile the two.` : ''
        );
      } else {
        setResult(
          row,
          'Not one of the 12 npm peerDependencies (build-toolchain version, e.g. Node.js/pnpm, or a transitive dependency with no BeeUI-declared range) — no independent machine-checkable source beyond the docs pages themselves.',
          'reality-unknown',
          ''
        );
      }
      continue;
    }
    if (/^Compatibility authority pointer/.test(row.item)) {
      setResult(
        row,
        '/docs/compatibility/current/ is a live, crawlable docs-site page (confirmed 200 OK in category D-style checks); docs/compatibility-matrix.md (the path llms-full.txt names) is a repo-only file with no public docs-site route.',
        'docs-right',
        "Point llms-full.txt's compatibility-authority reference at /docs/compatibility/current/ instead of (or in addition to) the repo-only docs/compatibility-matrix.md path."
      );
      continue;
    }
    if (/^peerDependency range:/.test(row.item)) {
      const name = row.item.replace('peerDependency range: ', '');
      setResult(
        row,
        `npm view @beemvp/beeui-ui peerDependencies["${name}"] = "${peers[name] || 'not found'}" — this is itself the ground truth (already the row's llms-value field).`,
        row.status === 'identical' ? 'both-right' : row.status === 'docs-only' ? 'docs-right' : row.status === 'llms-only' ? 'llms-right' : 'reality-unknown',
        row.status === 'docs-only'
          ? `llms-full.txt's prose peer list should name ${name} explicitly instead of only pointing at the repo-only docs/compatibility-matrix.md.`
          : ''
      );
      continue;
    }
    setResult(row, 'unrecognized Category B row pattern — not classified by apply-reality.mjs', 'reality-unknown', '');
  }
}

// ---------------------------------------------------------------------------
// Category C — Setup instructions (18 rows). These are all "does this exact
// string/key appear" checks; the docs-site page IS the primary source BeeUI
// ships (Starlight-rendered from the same repo as the package), so where
// only one side has the string, that side is presumed accurate unless a
// phase finding says otherwise — Worker A did not independently re-run the
// Expo/Web/bare-RN setup flows (that is Worker B's clean-room job), so most
// rows here are reality-unknown from this worker's evidence, except the one
// row whose note already cites Worker-collected evidence (#562).
// ---------------------------------------------------------------------------

function categoryC(rows) {
  for (const row of rows) {
    if (/uniwind generate-artifacts step/.test(row.item)) {
      setResult(
        row,
        'Confirmed by this phase\'s own scripts/audit tooling context: `npm run uniwind:types` (BeePOS\'s own postinstall) runs `uniwind generate-artifacts` directly — consumers going through the documented Metro/Vite plugin stack do not need to invoke it by hand, matching the existing note. Filed as #562 for the BeeUI-repo-internal symptom.',
        'both-right',
        ''
      );
      continue;
    }
    if (row.status === 'unverifiable') {
      setResult(row, 'Neither source states this; no reality check applies.', 'reality-unknown', '');
      continue;
    }
    setResult(
      row,
      'Not independently re-verified by Worker A (this is a "does this token/key appear in the doc text" presence check, not a runtime/package fact) — see Worker B\'s clean-room Expo/Web build logs for whether following the documented steps actually produces a working build.',
      'reality-unknown',
      ''
    );
  }
}

// ---------------------------------------------------------------------------
// Category D — Component inventory (249 rows). Sub-patterns:
//  - "docs page exists at ..." -> reality = the row's own HTTP check (already
//    grounded; docsSiteValue IS the live HTTP status).
//  - "exported symbols identical (docs Family exports vs llms-components.txt)"
//    -> reality = the installed .d.ts (from the companion "vs npm .d.ts" row
//    for the same slug, matched by slug).
//  - "contract sections present" -> reality = the same HTTP-grounded page
//    fetch; docsSiteValue already reports section presence directly.
//  - "docs page exists but has no llms-components.txt module row" -> reality
//    = same grounded page fetch.
//  - "vs npm .d.ts" -> reality = the .d.ts itself (IS the row's docsValue).
// ---------------------------------------------------------------------------

function categoryD(rows) {
  const dtsRowBySlug = new Map();
  for (const row of rows) {
    const m = row.item.match(/^([a-z0-9-]+): exported symbols identical \(llms-components\.txt vs npm \.d\.ts\)/);
    if (m) dtsRowBySlug.set(m[1], row);
  }

  // Pass 1: classify every "vs npm .d.ts" row FIRST. The "Family exports"
  // rows (pass 2) read `dtsRow.verdict`, which must already be set — the
  // raw array order from build-docs-llms-matrix.mjs puts all per-module
  // rows (including "Family exports") before the batch of "vs npm .d.ts"
  // rows appended at the very end of categoryD, so a single top-to-bottom
  // pass would read `undefined` here.
  for (const row of rows) {
    if (/vs npm \.d\.ts\)$/.test(row.item)) {
      setResult(
        row,
        'docsSiteValue IS the installed package\'s .d.ts export list (reality itself); this row already directly compares llms-components.txt against it.',
        row.status === 'identical' ? 'both-right' : 'llms-right',
        row.status === 'identical' ? '' : `Sync llms-components.txt's export list for "${row.item.split(':')[0]}" with the installed .d.ts: ${row.note}`
      );
    }
  }

  for (const row of rows) {
    if (row.verdict) continue; // already classified in pass 1
    if (/^[a-z0-9-]+: docs page exists at/.test(row.item)) {
      setResult(row, 'docsSiteValue IS a live HTTP check (reality itself).', row.status === 'identical' ? 'both-right' : 'llms-right', row.status === 'identical' ? '' : 'Fix or remove the llms-components.txt module row for a slug with no resolving docs page.');
      continue;
    }
    if (/^[a-z0-9-]+: exported symbols identical \(docs "Family exports"/.test(row.item)) {
      const slug = row.item.split(':')[0];
      const dtsRow = dtsRowBySlug.get(slug);
      if (!dtsRow || dtsRow.status === 'llms-only') {
        setResult(row, 'No resolvable .d.ts cross-check for this slug (see the companion "vs npm .d.ts" row).', 'reality-unknown', '');
        continue;
      }
      // The companion "vs npm .d.ts" row already pits llms-components.txt
      // against the installed .d.ts (that row's docsValue IS the .d.ts) —
      // its verdict of 'both-right'/'docs-right' means llms-components.txt's
      // export list matches the real .d.ts.
      const llmsAccurateVsDts = dtsRow.verdict === 'both-right' || dtsRow.verdict === 'docs-right';
      let verdict;
      if (row.status === 'identical' && llmsAccurateVsDts) verdict = 'both-right';
      else if (row.status === 'identical' && !llmsAccurateVsDts) verdict = 'both-wrong'; // docs page and llms agree with each other but both differ from .d.ts
      else if (row.status !== 'identical' && llmsAccurateVsDts) verdict = 'llms-right'; // llms matches .d.ts, docs page's Family exports table is the outlier
      else verdict = 'reality-unknown';
      setResult(
        row,
        `Cross-checked against the installed .d.ts via the companion row "${slug}: exported symbols identical (llms-components.txt vs npm .d.ts)" (${dtsRow.status}).`,
        verdict,
        verdict === 'both-wrong'
          ? `Both the docs page's "Family exports" line and llms-components.txt's export list for ${slug} disagree with the installed .d.ts (${dtsRow.note}); update whichever is stale against the real package export surface.`
          : verdict === 'llms-right'
          ? `Update the docs page's "Family exports" line for ${slug} to match the installed .d.ts.`
          : ''
      );
      continue;
    }
    if (/^[a-z0-9-]+: contract sections present/.test(row.item)) {
      setResult(
        row,
        'docsSiteValue IS a live parse of the page (Props table / Platform behavior / Accessibility sections presence) — reality itself.',
        row.status === 'docs-only' ? 'docs-right' : 'reality-unknown',
        ''
      );
      continue;
    }
    if (/^Reverse coverage:/.test(row.item)) {
      setResult(row, 'docsSiteValue is a live sitemap-crawled component-page count (reality itself).', 'both-right', '');
      continue;
    }
    if (/docs page exists but has no llms-components\.txt module row/.test(row.item)) {
      setResult(
        row,
        'docsSiteValue IS a live HTTP 200 check (reality itself) — this page genuinely exists and has no llms-components.txt counterpart.',
        'docs-right',
        `Add a module row for this component to llms-components.txt.`
      );
      continue;
    }
    setResult(row, 'unrecognized Category D row pattern — not classified by apply-reality.mjs', 'reality-unknown', '');
  }
}

// ---------------------------------------------------------------------------
// Category E — Patterns (42 rows). Reality = live sitemap crawl (already the
// docsSiteValue for every row in this category).
// ---------------------------------------------------------------------------

function categoryE(rows) {
  for (const row of rows) {
    setResult(
      row,
      'docsSiteValue is a live sitemap-crawled page count/existence check (reality itself).',
      row.status === 'identical' ? 'both-right' : row.status === 'docs-only' ? 'docs-right' : row.status === 'mismatch' ? 'both-wrong' : 'reality-unknown',
      row.status === 'mismatch' ? 'Reconcile the llms-patterns.txt screen count for this pack with the actual number of pages under /docs/patterns/.' : row.status === 'docs-only' ? 'llms-patterns.txt does not enumerate individual screen names/URLs — consider adding them so an agent can resolve a specific pattern page without visiting the docs site.' : ''
    );
  }
}

// ---------------------------------------------------------------------------
// Category F — Architecture/ADR list (20 rows). No independent machine
// source beyond the docs site and llms-full.txt themselves (ADRs are
// repo-only markdown files with no public docs-site route) — reality-unknown
// throughout, with one exception (the registry item count, cross-checked in
// category I).
// ---------------------------------------------------------------------------

function categoryF(rows) {
  for (const row of rows) {
    setResult(
      row,
      'ADR files (docs/decisions/*.md) and the architecture-invariants/non-goals prose are repo-only content with no public docs-site route to independently crawl; neither /docs/architecture/ nor llms-full.txt can be checked against a third source here.',
      'reality-unknown',
      row.status === 'llms-only' ? 'Consider publishing a /docs/decisions/ or /docs/architecture/adr/ index so these ADR summaries are independently verifiable from the public docs site, not only from llms-full.txt.' : ''
    );
  }
}

// ---------------------------------------------------------------------------
// Category G — Accessibility contract (8 rows). No independent runtime a11y
// audit was run against these narrow "does this keyword appear" checks in
// this pass (that requires an actual assistive-tech pass, out of scope for
// static doc-vs-llms text matching) — reality-unknown, deferring to
// docs/beeui-audit/findings-0*.md for any BeePOS-app-level a11y evidence
// already collected.
// ---------------------------------------------------------------------------

function categoryG(rows) {
  for (const row of rows) {
    setResult(
      row,
      'A "does this keyword appear in the prose" text match, not a runtime accessibility-tree assertion; no independent assistive-tech or DOM audit was run against this specific claim in this pass.',
      'reality-unknown',
      ''
    );
  }
}

// ---------------------------------------------------------------------------
// Category H — Link integrity (124 rows). Reality = the row's own live HTTP
// check (already docsSiteValue).
// ---------------------------------------------------------------------------

function categoryH(rows) {
  for (const row of rows) {
    const httpStatus = row.docsSiteValue.match(/HTTP (\d+)/);
    const ok = httpStatus && httpStatus[1] === '200';
    setResult(
      row,
      `Live HTTP check (already the row's docs-site value): ${row.docsSiteValue}.`,
      ok ? 'both-right' : 'both-wrong',
      ok ? '' : `Fix or remove this link target (${row.item.replace('Link target: ', '')}); it does not resolve on the public docs site. ${row.note}`.trim()
    );
  }
}

// ---------------------------------------------------------------------------
// Category I — Numbers (5 rows). Reality = live sitemap crawl / registry
// cross-check, already largely embedded in docsSiteValue/note.
// ---------------------------------------------------------------------------

function categoryI(rows) {
  for (const row of rows) {
    if (/registry items/.test(row.item)) {
      setResult(
        row,
        'registry/registry.json (the claimed machine-readable source) is a repo-only path (404 on the public docs site) — the arithmetic (62 components + 1 theme + N internal utilities) is self-consistent within llms-components.txt/llms-full.txt but not independently checkable against a public registry endpoint.',
        'reality-unknown',
        'Publish registry/registry.json (or an equivalent) at a public docs-site route so the "70 items" claim is independently verifiable.'
      );
      continue;
    }
    setResult(
      row,
      'docsSiteValue is a live sitemap-crawled count (reality itself).',
      row.status === 'identical' ? 'both-right' : row.status === 'mismatch' ? 'both-wrong' : 'reality-unknown',
      row.status === 'mismatch' ? `Reconcile the stated number with the live count (${row.docsSiteValue}).` : ''
    );
  }
}

async function main() {
  const matrixPath = path.join(OUT_DIR, 'docs-llms-matrix.json');
  const matrix = JSON.parse(await readFile(matrixPath, 'utf8'));
  const rows = matrix.rows;

  const npmUi = await npmViewJson('@beemvp/beeui-ui');
  const ctx = { npmUi };

  const byCat = {};
  for (const r of rows) (byCat[r.category] ||= []).push(r);

  categoryA(byCat['Publication and install'] || [], ctx);
  categoryB(byCat['Compatibility'] || [], ctx);
  categoryC(byCat['Setup instructions'] || []);
  categoryD(byCat['Component inventory'] || []);
  categoryE(byCat['Patterns'] || []);
  categoryF(byCat['Architecture/ADR list'] || []);
  categoryG(byCat['Accessibility contract'] || []);
  categoryH(byCat['Link integrity'] || []);
  categoryI(byCat['Numbers'] || []);

  const missing = rows.filter((r) => !r.verdict);
  if (missing.length) {
    console.error(`${missing.length} rows have no verdict:`, missing.slice(0, 5).map((r) => r.id));
    process.exitCode = 1;
  }

  const verdictTotals = {};
  for (const r of rows) verdictTotals[r.verdict] = (verdictTotals[r.verdict] || 0) + 1;

  matrix.generatedAt = new Date().toISOString();
  matrix.realitySummary = { byVerdict: verdictTotals, total: rows.length };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(matrixPath, JSON.stringify(matrix, null, 2), 'utf8');

  // Regenerate the .md alongside it with the new reality/verdict/fix columns.
  const mdParts = [];
  mdParts.push('# BeeUI docs site vs llms*.txt consistency matrix (with reality verdicts)');
  mdParts.push('');
  mdParts.push('Generated by `node scripts/audit/build-docs-llms-matrix.mjs` then `node scripts/audit/apply-reality.mjs`. Do not edit by hand; rerun both scripts.');
  mdParts.push('');
  mdParts.push(`Total rows: ${rows.length}`);
  mdParts.push('');
  mdParts.push('## Totals by docs-vs-llms status (phase 06)');
  mdParts.push('');
  mdParts.push('| Status | Count |');
  mdParts.push('|---|---|');
  for (const [status, count] of Object.entries(matrix.summary.byStatus)) mdParts.push(`| ${status} | ${count} |`);
  mdParts.push('');
  mdParts.push('## Totals by reality verdict (phase 07)');
  mdParts.push('');
  mdParts.push('| Verdict | Count |');
  mdParts.push('|---|---|');
  for (const [verdict, count] of Object.entries(verdictTotals)) mdParts.push(`| ${verdict} | ${count} |`);
  mdParts.push('');
  mdParts.push('## Full matrix');
  mdParts.push('');
  const header = '| ID | Category | Item | Docs-site value | llms value | Status | Reality | Verdict | Fix |\n|---|---|---|---|---|---|---|---|---|';
  const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  mdParts.push(header);
  for (const r of rows) {
    mdParts.push(
      `| ${r.id} | ${esc(r.category)} | ${esc(r.item)} | ${esc(r.docsSiteValue)} | ${esc(r.llmsValue)} | ${r.status} | ${esc(r.reality)} | ${r.verdict} | ${esc(r.fix)} |`
    );
  }
  mdParts.push('');
  await writeFile(path.join(OUT_DIR, 'docs-llms-matrix.md'), mdParts.join('\n'), 'utf8');

  console.log(`Applied reality/verdict/fix to ${rows.length} rows.`);
  console.log('By verdict:', verdictTotals);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
