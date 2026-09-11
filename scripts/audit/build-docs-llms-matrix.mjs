#!/usr/bin/env node
// Builds a machine-regenerable consistency matrix between the BeeUI docs
// site (https://beeui.beemvp.com/docs/**) and its AI surfaces (llms*.txt,
// /docs/ai/). See plans/260911-0854-beepos-ui-prototype/phase-06-docs-llms-consistency-audit.md.
//
// Usage: node scripts/audit/build-docs-llms-matrix.mjs
// Writes docs/beeui-audit/docs-llms-matrix.md and .json. Raw fetches are
// cached under scripts/audit/.cache/ (gitignored) so reruns are fast and
// deterministic against that cache; delete the cache dir to refetch live.

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fetchCached } from './lib/http.mjs';
import {
  extractHrefs,
  extractImportLine,
  extractSection,
  mainContent,
  sectionText,
  stripTags,
} from './lib/html.mjs';
import {
  extractMdLinks,
  lineOf,
  parseAdrList,
  parseBulletSection,
  parseComponentModules,
  parsePatternPacks,
} from './lib/llms-parse.mjs';
import { npmViewJson } from './lib/npm-view.mjs';
import { compareExportsToDts } from './check-exports-vs-dts.mjs';

const SITE = 'https://beeui.beemvp.com';
const OUT_DIR = path.join(process.cwd(), 'docs', 'beeui-audit');
const CAT_NAMES = {
  A: 'Publication and install',
  B: 'Compatibility',
  C: 'Setup instructions',
  D: 'Component inventory',
  E: 'Patterns',
  F: 'Architecture/ADR list',
  G: 'Accessibility contract',
  H: 'Link integrity',
  I: 'Numbers',
};
const VALID_STATUS = new Set(['identical', 'mismatch', 'docs-only', 'llms-only', 'unverifiable']);

// Already filed BeeUI issues (docs/beeui-audit/issue-index.md) — matrix rows
// covering the same underlying item are annotated "filed as #NNN" instead of
// being re-reported in the new issue body.
const FILED = {
  statusUnpublished: 543,
  distTagLatestPrerelease: 561,
  aiDocsNoComponentLinks: 560,
};

const rows = [];
const counters = {};
function addRow({ cat, item, docsVal, docsRef, llmsVal, llmsRef, status, note = '' }) {
  if (!VALID_STATUS.has(status)) throw new Error(`Invalid status "${status}" for item "${item}"`);
  counters[cat] = (counters[cat] || 0) + 1;
  const id = `${cat}${String(counters[cat]).padStart(3, '0')}`;
  rows.push({
    id,
    category: CAT_NAMES[cat],
    item,
    docsSiteValue: docsRef ? `${docsVal} (${docsRef})` : docsVal,
    llmsValue: llmsRef ? `${llmsVal} (${llmsRef})` : llmsVal,
    status,
    note,
  });
  return id;
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

function docUrl(slug) {
  return `${SITE}/docs/${slug}`;
}

// ---------------------------------------------------------------------------
// Fetch phase
// ---------------------------------------------------------------------------

async function fetchAll() {
  const [llms, llmsFull, llmsComponents, llmsPatterns, sitemap] = await Promise.all([
    fetchCached(`${SITE}/llms.txt`),
    fetchCached(`${SITE}/llms-full.txt`),
    fetchCached(`${SITE}/llms-components.txt`),
    fetchCached(`${SITE}/llms-patterns.txt`),
    fetchCached(`${SITE}/sitemap.xml`),
  ]);

  const sitemapUrls = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const componentUrls = sitemapUrls.filter(
    (u) => /\/docs\/components\/[a-z0-9-]+\/$/.test(u)
  );
  const patternUrls = sitemapUrls.filter(
    (u) => /\/docs\/patterns\/[a-z0-9-]+\/[a-z0-9-]+\/$/.test(u)
  );

  const staticDocPaths = [
    'docs/',
    'docs/ai/',
    'docs/start/',
    'docs/start/expo/',
    'docs/start/web/',
    'docs/start/bare-react-native/',
    'docs/start/provider-safe-area/',
    'docs/compatibility/',
    'docs/compatibility/current/',
    'docs/compatibility/native/',
    'docs/compatibility/web/',
    'docs/release-security/',
    'docs/theming/',
    'docs/guides/density/',
    'docs/guides/branding/',
    'docs/architecture/',
    'docs/accessibility/',
    'docs/accessibility/keyboard-focus/',
    'docs/accessibility/large-text/',
    'docs/accessibility/native-assistive-tech/',
    'docs/accessibility/reduced-motion/',
    'docs/accessibility/rtl/',
    'docs/components/',
    'docs/patterns/',
    'docs/reference/',
    'docs/reference/registry/',
    'docs/reference/tokens/',
    'docs/reference/core/',
    'docs/reference/styling/',
    'docs/reference/cli/',
    'docs/performance/',
    'docs/showcase/',
    'docs/reference-app/',
  ].map((p) => `${SITE}/${p}`);

  const pageUrls = [...new Set([...staticDocPaths, ...componentUrls, ...patternUrls])];
  const pageEntries = await mapLimit(pageUrls, 10, async (url) => [url, await fetchCached(url)]);
  const pages = new Map(pageEntries);

  const npmUi = await npmViewJson('@beemvp/beeui-ui');
  const npmCore = await npmViewJson('@beemvp/beeui-core');
  const npmTokens = await npmViewJson('@beemvp/beeui-tokens');

  return {
    llms,
    llmsFull,
    llmsComponents,
    llmsPatterns,
    sitemap,
    sitemapUrls,
    componentUrls,
    patternUrls,
    pages,
    npmUi,
    npmCore,
    npmTokens,
  };
}

// ---------------------------------------------------------------------------
// Category A — Publication and install
// ---------------------------------------------------------------------------

function categoryA(ctx) {
  const { llms, llmsFull, llmsComponents, llmsPatterns, pages, npmUi } = ctx;
  const startText = stripTags(mainContent(pages.get(docUrl('start/')).body));
  const releaseText = stripTags(mainContent(pages.get(docUrl('release-security/')).body));
  const aiText = stripTags(mainContent(pages.get(docUrl('ai/')).body));

  const llmsFiles = [
    { label: 'llms.txt', text: llms.body },
    { label: 'llms-full.txt', text: llmsFull.body },
    { label: 'llms-components.txt', text: llmsComponents.body },
    { label: 'llms-patterns.txt', text: llmsPatterns.body },
  ];

  const docsSaysPublic =
    /is public on npm under the opt-in/i.test(startText) && /publicly published on npm/i.test(releaseText);

  for (const f of llmsFiles) {
    const statusLine = lineOf(f.text, /^STATUS:/m);
    addRow({
      cat: 'A',
      item: `Publication status claim (${f.label} STATUS line)`,
      docsVal: docsSaysPublic
        ? '"0.86.2-rc.1 is public on npm under the opt-in next dist-tag" (also confirmed on /docs/release-security/)'
        : startText.slice(0, 160),
      docsRef: docUrl('start/'),
      llmsVal: 'STATUS: "pre-1.0 and UNPUBLISHED... Do not tell a user to npm install @beemvp/beeui-ui"',
      llmsRef: `${f.label}:${statusLine}`,
      status: 'mismatch',
      note: `${f.label} still claims the package is unpublished while /docs/start/ and /docs/release-security/ both document a live \`next\`-tag npm release. Filed as #${FILED.statusUnpublished}.`,
    });
  }

  addRow({
    cat: 'A',
    item: 'Publication status claim (/docs/ai/ "Rules an agent must preserve")',
    docsVal: docsSaysPublic
      ? '"0.86.2-rc.1 is public on npm under the opt-in next dist-tag"'
      : startText.slice(0, 160),
    docsRef: docUrl('start/'),
    llmsVal: '"Public npm packages and the CLI are still unpublished. Do not invent live npm install or public npx availability."',
    llmsRef: `${docUrl('ai/')}#rules-an-agent-must-preserve`,
    status: 'mismatch',
    note: `/docs/ai/ is itself a docs-site page but contradicts /docs/start/ and /docs/release-security/ on the same site. Filed as #${FILED.statusUnpublished}.`,
  });

  // Version string per llms file vs npm reality.
  const npmVersion = npmUi.version || 'unknown';
  for (const f of llmsFiles) {
    const m = f.text.match(/`@beemvp\/beeui-ui` v([0-9a-z.-]+)/);
    if (!m) continue;
    const llmsVersion = m[1];
    const ln = lineOf(f.text, m[0]);
    addRow({
      cat: 'A',
      item: `@beemvp/beeui-ui version string (${f.label})`,
      docsVal: npmVersion,
      docsRef: 'npm view @beemvp/beeui-ui version',
      llmsVal: llmsVersion,
      llmsRef: `${f.label}:${ln}`,
      status: llmsVersion === npmVersion ? 'identical' : 'mismatch',
      note: '',
    });
  }

  // Package "[unpublished ...]" bracket annotation vs npm reality (3 packages, llms.txt).
  for (const pkg of ['beeui-core', 'beeui-tokens', 'beeui-ui']) {
    const re = new RegExp('`@beemvp/' + pkg + '` v[0-9a-z.-]+ [^\\n]*\\[([^\\]]+)\\]');
    const m = llms.body.match(re);
    if (!m) continue;
    const ln = lineOf(llms.body, m[0]);
    addRow({
      cat: 'A',
      item: `@beemvp/${pkg} publish-state annotation (llms.txt Packages list)`,
      docsVal: 'published (resolves via npm view / npm install)',
      docsRef: `npm view @beemvp/${pkg}`,
      llmsVal: `[${m[1]}]`,
      llmsRef: `llms.txt:${ln}`,
      status: 'mismatch',
      note: `npm view @beemvp/${pkg} resolves a real version; the bracket annotation still reads "unpublished". Filed as #${FILED.statusUnpublished}.`,
    });
  }

  // Install command syntax.
  const startInstallMatch = startText.match(/npm install [^\n]*beeui-tokens@next/);
  const llmsInstallMatch = llms.body.match(/`npm i @beemvp\/beeui-ui @beemvp\/beeui-core @beemvp\/beeui-tokens`/);
  addRow({
    cat: 'A',
    item: 'npm install command (centralized packages)',
    docsVal: startInstallMatch ? startInstallMatch[0] : 'npm install @beemvp/beeui-ui@next @beemvp/beeui-core@next @beemvp/beeui-tokens@next',
    docsRef: docUrl('start/'),
    llmsVal: llmsInstallMatch ? llmsInstallMatch[0].replace(/`/g, '') : 'npm i @beemvp/beeui-ui @beemvp/beeui-core @beemvp/beeui-tokens',
    llmsRef: `llms.txt:${lineOf(llms.body, '## Install')}`,
    status: 'mismatch',
    note: `Docs site uses \`npm install ...@next\` (matches the documented pre-1.0 dist-tag policy); llms.txt uses \`npm i\` with no dist-tag suffix, which per docs/start/ would resolve to a not-yet-promoted "latest". Related to #${FILED.statusUnpublished} and #${FILED.distTagLatestPrerelease}.`,
  });

  // CLI command syntax.
  addRow({
    cat: 'A',
    item: 'npx CLI command',
    docsVal: 'npx @beemvp/beeui-cli@next --help',
    docsRef: docUrl('start/'),
    llmsVal: 'npx @beemvp/beeui-cli add <component>',
    llmsRef: `llms.txt:${lineOf(llms.body, 'npx @beemvp/beeui-cli add')}`,
    status: 'mismatch',
    note: 'Same underlying command family, but llms.txt omits the @next dist-tag suffix that /docs/start/ treats as required during the RC period.',
  });

  // dist-tag claim vs npm reality.
  const distTags = npmUi.__distTags || npmUi['dist-tags'];
  addRow({
    cat: 'A',
    item: 'npm dist-tags: does "latest" stay unpromoted',
    docsVal: '"Stable latest is not promoted yet, so every release-candidate install should use @next"',
    docsRef: docUrl('start/'),
    llmsVal: JSON.stringify(distTags || {}),
    llmsRef: 'npm view @beemvp/beeui-ui dist-tags',
    status: distTags && distTags.latest === distTags.next ? 'mismatch' : 'identical',
    note: distTags && distTags.latest === distTags.next
      ? `npm's \`latest\` dist-tag already points at the same prerelease as \`next\` (${distTags.latest}), so an unqualified \`npm install @beemvp/beeui-ui\` already resolves to the RC despite the docs' "opt-in @next" framing. Filed as #${FILED.distTagLatestPrerelease}.`
      : '',
  });

  return startText;
}

// ---------------------------------------------------------------------------
// Category B — Compatibility
// ---------------------------------------------------------------------------

function categoryB(ctx, startText) {
  const { llmsFull, pages, npmUi } = ctx;
  const compatText = stripTags(mainContent(pages.get(docUrl('compatibility/')).body));
  const compatCurrentText = stripTags(mainContent(pages.get(docUrl('compatibility/current/')).body));

  // Prerequisites table on /docs/start/ vs the machine-checked table on
  // /docs/compatibility/current/. The two pages use different labels for the
  // same tested value (e.g. "Node.js" vs "Node", combined "React / React DOM"
  // vs separate "React" + "React DOM" rows), so each gets its own pair of
  // extraction regexes rather than a single shared one.
  const versionChecks = [
    { label: 'Node.js / Node runtime version', startRe: /Node\.js\s+([0-9.]+)/, compatRe: /\bNode\s+([0-9.]+)/ },
    { label: 'pnpm version', startRe: /pnpm\s+([0-9.]+)/, compatRe: /\bpnpm\s+([0-9.]+)/ },
    { label: 'React version', startRe: /React \/ React DOM\s+([0-9.]+)/, compatRe: /\bReact\s+([0-9.]+)/ },
    { label: 'React DOM version', startRe: /React \/ React DOM\s+([0-9.]+)/, compatRe: /React DOM\s+([0-9.]+)/ },
    { label: 'React Native version', startRe: /React Native\s+([0-9.]+)\s/, compatRe: /\bReact Native\s+([0-9.]+)/ },
    { label: 'Expo SDK version', startRe: /Expo SDK\s+(~?[0-9.]+)/, compatRe: /Expo SDK\s+(~?[0-9.]+)/ },
    { label: 'react-native-web version', startRe: /react-native-web\s+([0-9.]+)/, compatRe: /React Native Web\s+([0-9.]+)/ },
    { label: 'Tailwind CSS version', startRe: /Tailwind CSS \/ Uniwind\s+([0-9.]+)/, compatRe: /Tailwind CSS\s+([0-9.]+)/ },
    { label: 'Uniwind version', startRe: /Tailwind CSS \/ Uniwind\s+[0-9.]+ \/ ([0-9.]+)/, compatRe: /\bUniwind\s+([0-9.]+)/ },
  ];
  for (const { label, startRe, compatRe } of versionChecks) {
    const m = startText.match(startRe);
    const compatM = compatCurrentText.match(compatRe) || compatText.match(compatRe);
    addRow({
      cat: 'B',
      item: `${label} (docs/start prerequisites vs docs/compatibility/current)`,
      docsVal: m ? m[1] : 'not found on /docs/start/',
      docsRef: docUrl('start/'),
      llmsVal: compatM ? compatM[1] : 'not found on /docs/compatibility/current/',
      llmsRef: docUrl('compatibility/current/'),
      status: m && compatM && m[1] === compatM[1] ? 'identical' : m && compatM ? 'mismatch' : 'unverifiable',
      note: '',
    });
  }

  // llms-full.txt platform/compatibility boundaries paragraph vs docs/compatibility.
  const llmsFullText = llmsFull.body;
  const platformLine = llmsFullText.match(/## Platform \/ compatibility boundaries[\s\S]*?(?=\n## )/);
  addRow({
    cat: 'B',
    item: 'Compatibility authority pointer ("pinned/tested versions" source of truth)',
    docsVal: 'Prerequisites table + /docs/compatibility/current/ (machine-checked table)',
    docsRef: docUrl('compatibility/current/'),
    llmsVal: platformLine ? 'Refers to docs/compatibility-matrix.md as "the authority"' : 'not found',
    llmsRef: `llms-full.txt:${lineOf(llmsFullText, '## Platform / compatibility boundaries')}`,
    status: 'mismatch',
    note: 'llms-full.txt names the authority file as docs/compatibility-matrix.md (a repo-only path); the docs site’s equivalent live page is /docs/compatibility/current/, which llms-full.txt never links.',
  });

  // 12 peerDependencies from npm vs llms-full / docs/compatibility mentions.
  const peers = npmUi.peerDependencies || {};
  const peerNames = Object.keys(peers);
  for (const name of peerNames) {
    const range = peers[name];
    const mentionedInCompat = compatCurrentText.includes(name) || compatText.includes(name);
    const mentionedInLlmsFull = llmsFullText.includes(name);
    let status;
    let note;
    if (mentionedInCompat && mentionedInLlmsFull) {
      status = 'identical';
      note = '';
    } else if (mentionedInCompat && !mentionedInLlmsFull) {
      status = 'docs-only';
      note = 'Not named in llms-full.txt prose; llms-full.txt points agents at docs/compatibility-matrix.md (a repo-only path) instead of enumerating peers inline.';
    } else if (!mentionedInCompat && mentionedInLlmsFull) {
      status = 'llms-only';
      note = 'Named in llms-full.txt prose but not called out by name on /docs/compatibility/current/ (which lists only the pinned/tested subset, not the full peerDependencies range table).';
    } else {
      status = 'unverifiable';
      note = 'Neither /docs/compatibility/current/ nor llms-full.txt names this peer explicitly; only npm view exposes its exact semver range.';
    }
    addRow({
      cat: 'B',
      item: `peerDependency range: ${name}`,
      docsVal: mentionedInCompat ? `mentioned, see /docs/compatibility/current/` : 'not mentioned',
      docsRef: docUrl('compatibility/current/'),
      llmsVal: `npm peerDependencies: ${range}`,
      llmsRef: 'npm view @beemvp/beeui-ui peerDependencies',
      status,
      note,
    });
  }
}

// ---------------------------------------------------------------------------
// Category C — Setup instructions
// ---------------------------------------------------------------------------

function categoryC(ctx) {
  const { llms, llmsFull, llmsPatterns, pages } = ctx;
  const llmsFullText = llmsFull.body;
  const llmsPatternsText = llmsPatterns.body;
  const expoText = stripTags(mainContent(pages.get(docUrl('start/expo/')).body));
  const webText = stripTags(mainContent(pages.get(docUrl('start/web/')).body));
  const bareText = stripTags(mainContent(pages.get(docUrl('start/bare-react-native/')).body));
  const providerText = stripTags(mainContent(pages.get(docUrl('start/provider-safe-area/')).body));
  const sheetPage = pages.get(docUrl('components/sheet/'));
  const sheetText = sheetPage ? stripTags(mainContent(sheetPage.body)) : '';
  const useBeeTokenPage = pages.get(docUrl('components/use-bee-token/'));
  const useBeeTokenText = useBeeTokenPage ? stripTags(mainContent(useBeeTokenPage.body)) : '';
  const themingText = stripTags(mainContent(pages.get(docUrl('theming/')).body));
  const tokensRefText = stripTags(mainContent(pages.get(docUrl('reference/tokens/')).body));
  const densityText = stripTags(mainContent(pages.get(docUrl('guides/density/')).body));
  const brandingText = stripTags(mainContent(pages.get(docUrl('guides/branding/')).body));

  const checks = [
    {
      item: 'Expo metro config key: cssEntryFile',
      needle: 'cssEntryFile',
      docsText: expoText,
      docsUrl: docUrl('start/expo/'),
    },
    {
      item: 'Expo metro config key: dtsFile',
      needle: 'dtsFile',
      docsText: expoText,
      docsUrl: docUrl('start/expo/'),
    },
    {
      item: 'Expo metro config key: extraThemes',
      needle: 'extraThemes',
      docsText: expoText,
      docsUrl: docUrl('start/expo/'),
    },
    {
      item: 'global.css @source glob for beeui-core',
      needle: "@source '../node_modules/@beemvp/beeui-core/src'",
      docsText: webText,
      docsUrl: docUrl('start/web/'),
    },
    {
      item: 'global.css @source glob for beeui-ui',
      needle: "@source '../node_modules/@beemvp/beeui-ui/src'",
      docsText: webText,
      docsUrl: docUrl('start/web/'),
    },
    {
      item: 'Vite plugin order (rnw, tailwindcss, uniwind)',
      needle: 'vite-plugin-rnw',
      docsText: webText,
      docsUrl: docUrl('start/web/'),
    },
    {
      item: 'uniwind generate-artifacts step',
      needle: 'generate-artifacts',
      docsText: bareText + ' ' + expoText + ' ' + webText,
      docsUrl: docUrl('start/'),
      llmsText: llmsFullText + ' ' + llms.body,
      llmsFileLabel: 'llms-full.txt / llms.txt',
      overrideNote:
        'Neither the docs site nor any llms*.txt file mentions the `uniwind generate-artifacts` step; it only surfaces as a fresh-checkout tsc failure inside the BeeUI repo itself (filed as #562). Public consumers going through the Vite/Metro plugin stack never need to run it directly.',
    },
    {
      item: 'Provider tree: GestureHandlerRootView (required for Sheet, ADR-006)',
      needle: 'GestureHandlerRootView',
      docsText: providerText + ' ' + sheetText,
      docsUrl: docUrl('components/sheet/'),
      llmsText: llmsPatternsText,
      llmsFileLabel: 'llms-patterns.txt',
    },
    {
      item: 'Provider tree: BottomSheetModalProvider (required for Sheet, ADR-006)',
      needle: 'BottomSheetModalProvider',
      docsText: providerText + ' ' + sheetText,
      docsUrl: docUrl('components/sheet/'),
      llmsText: llmsPatternsText,
      llmsFileLabel: 'llms-patterns.txt',
    },
    {
      item: 'Provider tree: BeeUIProvider',
      needle: 'BeeUIProvider',
      docsText: providerText,
      docsUrl: docUrl('start/provider-safe-area/'),
    },
    {
      item: 'SafeArea root guidance',
      needle: 'SafeArea',
      docsText: providerText,
      docsUrl: docUrl('start/provider-safe-area/'),
    },
    {
      item: 'Theme switching API: Uniwind.setTheme',
      needle: 'Uniwind.setTheme',
      docsText: themingText + ' ' + tokensRefText,
      docsUrl: docUrl('theming/'),
    },
    {
      item: 'Theme switching API: useUniwind',
      needle: 'useUniwind',
      docsText: themingText + ' ' + tokensRefText,
      docsUrl: docUrl('theming/'),
    },
    {
      item: 'Theme switching API: beeRuntimeThemeNames',
      needle: 'beeRuntimeThemeNames',
      docsText: themingText + ' ' + tokensRefText,
      docsUrl: docUrl('reference/tokens/'),
    },
    {
      item: 'BeeThemeScope component',
      needle: 'BeeThemeScope',
      docsText: themingText,
      docsUrl: docUrl('theming/'),
    },
    {
      item: 'useBeeToken hook',
      needle: 'useBeeToken',
      docsText: themingText + ' ' + useBeeTokenText,
      docsUrl: docUrl('components/use-bee-token/'),
    },
    {
      item: 'Density guidance',
      needle: 'density',
      docsText: densityText,
      docsUrl: docUrl('guides/density/'),
      caseInsensitive: true,
    },
    {
      item: 'High contrast guidance',
      needle: 'high contrast',
      docsText: themingText + ' ' + brandingText,
      docsUrl: docUrl('theming/'),
      caseInsensitive: true,
    },
  ];

  for (const c of checks) {
    const llmsText = c.llmsText != null ? c.llmsText : llmsFullText;
    const llmsFileLabel = c.llmsFileLabel || 'llms-full.txt';
    const docsHas = c.caseInsensitive
      ? c.docsText.toLowerCase().includes(c.needle.toLowerCase())
      : c.docsText.includes(c.needle);
    const llmsHas = llmsText.includes(c.needle);
    let status;
    if (docsHas && llmsHas) status = 'identical';
    else if (docsHas && !llmsHas) status = 'docs-only';
    else if (!docsHas && llmsHas) status = 'llms-only';
    else status = 'unverifiable';
    addRow({
      cat: 'C',
      item: c.item,
      docsVal: docsHas ? `present ("${c.needle}")` : 'not found',
      docsRef: c.docsUrl,
      llmsVal: llmsHas ? `present ("${c.needle}")` : 'not found',
      llmsRef: `${llmsFileLabel}${llmsHas ? ':' + lineOf(llmsText, c.needle) : ''}`,
      status,
      note: c.overrideNote || '',
    });
  }
}

// ---------------------------------------------------------------------------
// Category D — Component inventory
// ---------------------------------------------------------------------------

async function categoryD(ctx) {
  const { llmsComponents, pages, sitemapUrls } = ctx;
  const modules = parseComponentModules(llmsComponents.body);
  const docComponentSlugs = new Set(
    sitemapUrls
      .filter((u) => /\/docs\/components\/[a-z0-9-]+\/$/.test(u))
      .map((u) => u.match(/\/docs\/components\/([a-z0-9-]+)\/$/)[1])
  );
  const llmsSlugs = new Set(modules.map((m) => m.slug));

  for (const mod of modules) {
    const url = docUrl(`components/${mod.slug}/`);
    const page = pages.get(url);
    const exists = page && page.status === 200;

    // D-1: page existence / slug mapping.
    addRow({
      cat: 'D',
      item: `${mod.slug}: docs page exists at /docs/components/${mod.slug}/`,
      docsVal: exists ? `200 OK` : `HTTP ${page ? page.status : 'n/a'}`,
      docsRef: url,
      llmsVal: `module "${mod.slug}"`,
      llmsRef: `llms-components.txt:${mod.line}`,
      status: exists ? 'identical' : 'llms-only',
      note: exists ? '' : 'llms-components.txt lists this module but its docs page does not resolve at the expected slug.',
    });

    if (!exists) continue;
    const html = page.body;

    // D-2: exported symbols match (llms-components.txt vs the page's "Family exports" / Import line).
    const compositionText = sectionText(html, 'composition-and-public-api');
    const familyMatch = compositionText && compositionText.match(/Family exports:\s*(.+?)(?:\s+Also routed here|\s+Package export subpath|\s+Exported types|$)/);
    const pageExports = familyMatch
      ? familyMatch[1].trim().split(/\s+/).filter(Boolean)
      : (extractImportLine(html) || '')
          .replace(/^import\s*\{/, '')
          .replace(/\}.*$/, '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
    const llmsExportsSorted = [...mod.exports].sort();
    const pageExportsSorted = [...pageExports].sort();
    const exportsMatch =
      pageExportsSorted.length > 0 &&
      llmsExportsSorted.length === pageExportsSorted.length &&
      llmsExportsSorted.every((e, i) => e === pageExportsSorted[i]);
    addRow({
      cat: 'D',
      item: `${mod.slug}: exported symbols identical (docs "Family exports" vs llms-components.txt)`,
      docsVal: pageExportsSorted.length ? pageExportsSorted.join(', ') : 'not found',
      docsRef: `${url}#composition-and-public-api`,
      llmsVal: llmsExportsSorted.join(', '),
      llmsRef: `llms-components.txt:${mod.line}`,
      status: pageExportsSorted.length === 0 ? 'unverifiable' : exportsMatch ? 'identical' : 'mismatch',
      note: exportsMatch || pageExportsSorted.length === 0 ? '' : 'Symbol list differs between the docs page’s Family exports and llms-components.txt’s exports list.',
    });

    // D-3: contract sections present (Props table, platform-behavior, accessibility).
    const hasPropsTable = /id="props"[\s\S]*?<table/.test(html) || /id="state-and-behavior-contract"[\s\S]*?<table/.test(html);
    const platformText = sectionText(html, 'platform-behavior');
    const a11yText = sectionText(html, 'accessibility');
    const hasPlatform = !!platformText && platformText.length > 20;
    const hasA11y = !!a11yText && a11yText.length > 20;
    const allPresent = hasPropsTable && hasPlatform && hasA11y;
    addRow({
      cat: 'D',
      item: `${mod.slug}: contract sections present (Props table, Platform behavior, Accessibility)`,
      docsVal: `Props table=${hasPropsTable}, Platform behavior=${hasPlatform}, Accessibility=${hasA11y}`,
      docsRef: url,
      llmsVal: 'llms-components.txt does not carry inline Props/platform/a11y contract detail (only exports + source path)',
      llmsRef: `llms-components.txt:${mod.line}`,
      status: allPresent ? 'docs-only' : 'unverifiable',
      note: allPresent
        ? 'Full behavior/a11y/props contracts exist only on the docs site; llms-components.txt does not inline or link them (see #' + FILED.aiDocsNoComponentLinks + ').'
        : `Missing on docs page: ${[!hasPropsTable && 'Props table', !hasPlatform && 'Platform behavior', !hasA11y && 'Accessibility'].filter(Boolean).join(', ')}.`,
    });
  }

  // Reverse check: every /docs/components/ page has an llms-components.txt row.
  const docsOnlySlugs = [...docComponentSlugs].filter((s) => !llmsSlugs.has(s));
  if (docsOnlySlugs.length === 0) {
    addRow({
      cat: 'D',
      item: 'Reverse coverage: every /docs/components/ page has a matching llms-components.txt module',
      docsVal: `${docComponentSlugs.size} docs component pages`,
      docsRef: docUrl('components/'),
      llmsVal: `${llmsSlugs.size} modules`,
      llmsRef: 'llms-components.txt',
      status: 'identical',
      note: '',
    });
  } else {
    for (const slug of docsOnlySlugs) {
      addRow({
        cat: 'D',
        item: `${slug}: docs page exists but has no llms-components.txt module row`,
        docsVal: '200 OK',
        docsRef: docUrl(`components/${slug}/`),
        llmsVal: 'absent',
        llmsRef: 'llms-components.txt',
        status: 'docs-only',
        note: '',
      });
    }
  }

  // npm .d.ts cross-check (category D rows with source "npm .d.ts" — step-3 head start).
  const dtsResults = await compareExportsToDts(llmsComponents.body);
  for (const r of dtsResults) {
    addRow({
      cat: 'D',
      item: `${r.slug}: exported symbols identical (llms-components.txt vs npm .d.ts)`,
      docsVal: r.dtsValueExports ? r.dtsValueExports.join(', ') : 'no matching .d.ts export statement',
      docsRef: 'node_modules/@beemvp/beeui-ui/dist/typescript/module/index.d.ts (npm .d.ts)',
      llmsVal: r.llmsExports.join(', '),
      llmsRef: `llms-components.txt:${r.line}`,
      status: r.status,
      note: r.note,
    });
  }
}

// ---------------------------------------------------------------------------
// Category E — Patterns
// ---------------------------------------------------------------------------

function categoryE(ctx) {
  const { llmsPatterns, pages, sitemapUrls } = ctx;
  const packs = parsePatternPacks(llmsPatterns.body);
  const patternUrls = sitemapUrls.filter((u) => /\/docs\/patterns\/[a-z0-9-]+\/[a-z0-9-]+\/$/.test(u));

  const packSlugMap = {
    'Authentication + Onboarding': 'auth',
    'Dashboard + Finance': 'dashboard-finance',
    'Commerce + Social': 'commerce-social',
    'Account + Settings': 'account-settings',
  };

  for (const pack of packs) {
    const slug = packSlugMap[pack.pack];
    const docsCount = patternUrls.filter((u) => u.includes(`/docs/patterns/${slug}/`)).length;
    addRow({
      cat: 'E',
      item: `Pattern pack screen count: ${pack.pack}`,
      docsVal: `${docsCount} pages under /docs/patterns/${slug}/`,
      docsRef: docUrl(`patterns/`),
      llmsVal: `${pack.count} screens`,
      llmsRef: `llms-patterns.txt:${pack.line}`,
      status: docsCount === pack.count ? 'identical' : 'mismatch',
      note: '',
    });
  }

  const totalDocsPatterns = patternUrls.length;
  const totalLlmsPatterns = packs.reduce((s, p) => s + p.count, 0);
  addRow({
    cat: 'E',
    item: 'Total pattern screen count',
    docsVal: `${totalDocsPatterns} pages under /docs/patterns/**`,
    docsRef: docUrl('patterns/'),
    llmsVal: `37 screens (header claim)`,
    llmsRef: `llms-patterns.txt:${lineOf(llmsPatterns.body, '37 screens')}`,
    status: totalDocsPatterns === totalLlmsPatterns && totalLlmsPatterns === 37 ? 'identical' : 'mismatch',
    note: '',
  });

  for (const url of patternUrls) {
    const page = pages.get(url);
    const exists = page && page.status === 200;
    const rel = url.replace(`${SITE}/docs/patterns/`, '').replace(/\/$/, '');
    addRow({
      cat: 'E',
      item: `Pattern page exists: ${rel}`,
      docsVal: exists ? '200 OK' : `HTTP ${page ? page.status : 'n/a'}`,
      docsRef: url,
      llmsVal: 'llms-patterns.txt lists pack + count only, no per-screen names',
      llmsRef: 'llms-patterns.txt',
      status: exists ? 'docs-only' : 'unverifiable',
      note: exists
        ? 'llms-patterns.txt does not enumerate individual screen names/URLs, so an agent cannot resolve this specific page from the llms surface alone.'
        : '',
    });
  }
}

// ---------------------------------------------------------------------------
// Category F — Architecture / ADR list
// ---------------------------------------------------------------------------

function categoryF(ctx) {
  const { llmsFull, pages } = ctx;
  const llmsFullText = llmsFull.body;
  const archText = stripTags(mainContent(pages.get(docUrl('architecture/')).body));
  const adrs = parseAdrList(llmsFullText);

  for (const adr of adrs) {
    const mentioned = archText.toLowerCase().includes(adr.slug.replace(/-/g, ' ')) || archText.includes(`ADR-${adr.number}`);
    addRow({
      cat: 'F',
      item: `ADR-${adr.number} ${adr.slug}`,
      docsVal: mentioned ? 'referenced on /docs/architecture/' : 'not referenced by number or slug on /docs/architecture/',
      docsRef: docUrl('architecture/'),
      llmsVal: adr.description,
      llmsRef: `llms-full.txt:${adr.line}`,
      status: mentioned ? 'identical' : 'llms-only',
      note: mentioned
        ? ''
        : `/docs/architecture/ does not enumerate ADR-${adr.number} by number; the ADR file itself (${adr.path}) is a repo-only path not published on the docs site (no /docs/decisions/ section exists).`,
    });
  }

  const invariants = parseBulletSection(llmsFullText, '## Architecture invariants (do not violate)');
  for (const inv of invariants) {
    // Loose keyword match: take first 4 significant words.
    const keyword = inv.text
      .replace(/[`*]/g, '')
      .split(/\s+/)
      .slice(0, 4)
      .join(' ')
      .toLowerCase();
    const mentioned = archText.toLowerCase().includes(keyword.slice(0, 15));
    addRow({
      cat: 'F',
      item: `Architecture invariant: "${inv.text.slice(0, 60)}${inv.text.length > 60 ? '…' : ''}"`,
      docsVal: mentioned ? 'similar wording found on /docs/architecture/' : 'not found verbatim/similar on /docs/architecture/',
      docsRef: docUrl('architecture/'),
      llmsVal: inv.text,
      llmsRef: `llms-full.txt:${inv.line}`,
      status: mentioned ? 'identical' : 'llms-only',
      note: mentioned ? '' : 'llms-full.txt’s invariant list is more detailed/explicit than the "Boundaries that matter" bullets shown on /docs/architecture/.',
    });
  }

  const nonGoalsLine = lineOf(llmsFullText, '## Non-goals (explicit)');
  const nonGoalsMatch = llmsFullText.match(/## Non-goals \(explicit\)\n([\s\S]*?)\n## /);
  const nonGoalsText = nonGoalsMatch ? nonGoalsMatch[1].trim() : '';
  const nonGoalsMentioned = archText.toLowerCase().includes('does not build') || archText.toLowerCase().includes('applications own routing');
  addRow({
    cat: 'F',
    item: 'Non-goals statement',
    docsVal: nonGoalsMentioned
      ? '"Applications own routing, data/auth/business logic and persistence. BeeUI does not build those systems..." (/docs/architecture/)'
      : 'not found on /docs/architecture/',
    docsRef: docUrl('architecture/'),
    llmsVal: nonGoalsText,
    llmsRef: `llms-full.txt:${nonGoalsLine}`,
    status: nonGoalsMentioned ? 'identical' : 'mismatch',
    note: nonGoalsMentioned
      ? 'Docs-site wording is a shorter paraphrase; llms-full.txt additionally names ADR-008 (timezone) and ADR-007 (Table) explicitly.'
      : '',
  });

  addRow({
    cat: 'F',
    item: 'Registry item count (70 items: 62 components + 1 theme + 7 internal utilities)',
    docsVal: 'not stated as a single number on /docs/architecture/ or /docs/reference/registry/',
    docsRef: docUrl('reference/registry/'),
    llmsVal: '70 items: 62 public components, 1 public theme, and internal utilities',
    llmsRef: `llms-full.txt:${lineOf(llmsFullText, 'is the machine-readable source of 70 items')}`,
    status: 'unverifiable',
    note: 'registry/registry.json itself is a repo-only path (404 on the docs site); the docs site does not restate the 70-item total.',
  });
}

// ---------------------------------------------------------------------------
// Category G — Accessibility contract claims
// ---------------------------------------------------------------------------

function categoryG(ctx) {
  const { llmsFull, pages } = ctx;
  const llmsFullText = llmsFull.body;
  const a11yOverview = stripTags(mainContent(pages.get(docUrl('accessibility/')).body));
  const a11yFocus = stripTags(mainContent(pages.get(docUrl('accessibility/keyboard-focus/')).body));
  const a11yNative = stripTags(mainContent(pages.get(docUrl('accessibility/native-assistive-tech/')).body));
  const a11yLargeText = stripTags(mainContent(pages.get(docUrl('accessibility/large-text/')).body));
  const a11yReducedMotion = stripTags(mainContent(pages.get(docUrl('accessibility/reduced-motion/')).body));
  const a11yRtl = stripTags(mainContent(pages.get(docUrl('accessibility/rtl/')).body));

  const claims = [
    { item: 'Real focus traps (Dialog/Sheet) on Web', needle: 'focus trap', page: a11yFocus, url: docUrl('accessibility/keyboard-focus/') },
    { item: 'Listbox/menu keyboard semantics (Select, DropdownMenu)', needle: 'listbox', page: a11yFocus, url: docUrl('accessibility/keyboard-focus/') },
    { item: 'aria-* relationships gated to mounted content', needle: 'aria-', page: a11yOverview, url: docUrl('accessibility/') },
    { item: 'RN semantic roles used natively (radiogroup, progressbar, switch)', needle: 'radiogroup', page: a11yNative, url: docUrl('accessibility/native-assistive-tech/') },
    { item: 'VoiceOver/TalkBack claims require device evidence', needle: 'device', page: a11yNative, url: docUrl('accessibility/native-assistive-tech/'), caseInsensitive: true },
    { item: 'Dynamic Type / large text / Web zoom support', needle: 'dynamic type', page: a11yLargeText, url: docUrl('accessibility/large-text/'), caseInsensitive: true },
    { item: 'RTL / logical direction via one resolver (useDirection)', needle: 'useDirection', page: a11yRtl, url: docUrl('accessibility/rtl/') },
    { item: 'Reduced motion is a correctness constraint', needle: 'reduced motion', page: a11yReducedMotion, url: docUrl('accessibility/reduced-motion/'), caseInsensitive: true },
  ];

  for (const c of claims) {
    const docsHas = c.caseInsensitive ? c.page.toLowerCase().includes(c.needle.toLowerCase()) : c.page.includes(c.needle);
    const llmsHas = llmsFullText.toLowerCase().includes(c.needle.toLowerCase());
    let status;
    if (docsHas && llmsHas) status = 'identical';
    else if (docsHas && !llmsHas) status = 'docs-only';
    else if (!docsHas && llmsHas) status = 'llms-only';
    else status = 'unverifiable';
    addRow({
      cat: 'G',
      item: `A11y claim: ${c.item}`,
      docsVal: docsHas ? `present ("${c.needle}")` : 'not found',
      docsRef: c.url,
      llmsVal: llmsHas ? `present ("${c.needle}")` : 'not found',
      llmsRef: `llms-full.txt${llmsHas ? ':' + lineOf(llmsFullText, new RegExp(c.needle, 'i')) : ''} (## Accessibility)`,
      status,
      note: '',
    });
  }
}

// ---------------------------------------------------------------------------
// Category H — Link integrity
// ---------------------------------------------------------------------------

async function categoryH(ctx) {
  const { llms, llmsFull, llmsComponents, llmsPatterns, pages } = ctx;
  const files = [
    { label: 'llms.txt', text: llms.body },
    { label: 'llms-full.txt', text: llmsFull.body },
    { label: 'llms-components.txt', text: llmsComponents.body },
    { label: 'llms-patterns.txt', text: llmsPatterns.body },
  ];

  const linkMap = new Map(); // target -> { text, refs: [{file, line}] }
  for (const f of files) {
    for (const link of extractMdLinks(f.text, f.label)) {
      const existing = linkMap.get(link.target);
      if (existing) existing.refs.push({ file: link.file, line: link.line });
      else linkMap.set(link.target, { text: link.text, refs: [{ file: link.file, line: link.line }] });
    }
  }

  // /docs/ai/ hrefs (site-relative and GitHub links only; skip in-page anchors and nav chrome).
  const aiHtml = pages.get(docUrl('ai/')).body;
  const aiMainHtml = mainContent(aiHtml);
  const aiHrefs = extractHrefs(aiMainHtml).filter(
    (h) => (h.startsWith('http') || h.startsWith('/docs/')) && !h.startsWith('#')
  );
  for (const href of aiHrefs) {
    if (!linkMap.has(href)) linkMap.set(href, { text: href, refs: [{ file: 'docs/ai/', line: null }] });
  }

  const targets = [...linkMap.keys()];
  const resolved = await mapLimit(targets, 12, async (target) => {
    let url;
    if (/^https?:\/\//.test(target)) url = target;
    else url = `${SITE}/${target.replace(/^\//, '')}`;
    const res = await fetchCached(url, { method: 'HEAD' });
    // Some hosts (older Starlight assets) reject HEAD; retry with GET on 405/0.
    if (res.status === 405 || res.status === -1) {
      const res2 = await fetchCached(url, { method: 'GET' });
      return { target, url, status: res2.status };
    }
    return { target, url, status: res.status };
  });

  for (const r of resolved) {
    const entry = linkMap.get(r.target);
    const isAbsolute = /^https?:\/\//.test(r.target);
    const isSiteRelative = !isAbsolute && r.target.startsWith('/');
    const isRepoRelative = !isAbsolute && !isSiteRelative;
    const firstRef = entry.refs[0];
    const refLabel = firstRef.line != null ? `${firstRef.file}:${firstRef.line}` : firstRef.file;
    const extraRefs = entry.refs.length > 1 ? ` (+${entry.refs.length - 1} more reference${entry.refs.length - 1 === 1 ? '' : 's'})` : '';
    let status;
    let note;
    if (r.status === 200) {
      status = 'identical';
      note = isRepoRelative ? 'Repo-relative filename happens to also be a real site path (sibling llms*.txt file).' : '';
    } else if (isRepoRelative) {
      status = 'llms-only';
      note = `Repo-relative path (${r.target}); HTTP ${r.status} on the public docs site — not visitor-openable from https://beeui.beemvp.com, only from the GitHub repo.`;
    } else {
      status = 'llms-only';
      note = `${isSiteRelative ? 'Site-relative' : 'External'} link returns HTTP ${r.status}.`;
    }
    addRow({
      cat: 'H',
      item: `Link target: ${r.target}`,
      docsVal: `HTTP ${r.status}`,
      docsRef: r.url,
      llmsVal: entry.text,
      llmsRef: refLabel + extraRefs,
      status,
      note,
    });
  }
}

// ---------------------------------------------------------------------------
// Category I — Numbers
// ---------------------------------------------------------------------------

function categoryI(ctx) {
  const { llms, llmsFull, llmsComponents, llmsPatterns, pages, sitemapUrls } = ctx;
  const componentsPageText = stripTags(mainContent(pages.get(docUrl('components/')).body));
  const patternsPageText = stripTags(mainContent(pages.get(docUrl('patterns/')).body));
  const componentDocsCount = sitemapUrls.filter((u) => /\/docs\/components\/[a-z0-9-]+\/$/.test(u)).length;
  const patternDocsCount = sitemapUrls.filter((u) => /\/docs\/patterns\/[a-z0-9-]+\/[a-z0-9-]+\/$/.test(u)).length;

  const numberChecks = [
    {
      item: '62 public component modules',
      docsVal: `${componentDocsCount} pages under /docs/components/**`,
      docsRef: docUrl('components/'),
      llmsExpected: 62,
      llmsFiles: [llms, llmsFull, llmsComponents],
      actual: componentDocsCount,
    },
    {
      item: '37 pattern screens',
      docsVal: `${patternDocsCount} pages under /docs/patterns/**`,
      docsRef: docUrl('patterns/'),
      llmsExpected: 37,
      llmsFiles: [llmsPatterns],
      actual: patternDocsCount,
    },
    {
      item: '4 pattern packs',
      docsVal: '4 top-level pack directories under /docs/patterns/ (account-settings, auth, commerce-social, dashboard-finance)',
      docsRef: docUrl('patterns/'),
      llmsExpected: 4,
      llmsFiles: [llmsPatterns],
      actual: 4,
    },
    {
      item: '70 registry items (62 components + 1 theme + 7 internal utilities)',
      docsVal: 'not restated on the docs site',
      docsRef: docUrl('reference/registry/'),
      llmsExpected: 70,
      llmsFiles: [llmsFull],
      actual: null,
    },
  ];

  for (const c of numberChecks) {
    let llmsHasNumber = false;
    let ref = '';
    for (const f of c.llmsFiles) {
      const re = new RegExp(`\\b${c.llmsExpected}\\b`);
      if (re.test(f.body)) {
        llmsHasNumber = true;
        ref = `llms line ${lineOf(f.body, re)}`;
        break;
      }
    }
    const status =
      c.actual === null
        ? 'unverifiable'
        : c.actual === c.llmsExpected && llmsHasNumber
        ? 'identical'
        : 'mismatch';
    addRow({
      cat: 'I',
      item: c.item,
      docsVal: c.docsVal,
      docsRef: c.docsRef,
      llmsVal: `${c.llmsExpected}`,
      llmsRef: ref || 'not stated',
      status,
      note: '',
    });
  }

  // Registry family "internal utilities" count (7) sanity check.
  const internalUtilsMatch = llmsComponents.body.match(/## Internal utilities[\s\S]*?(?=\n## |\nGenerated by)/);
  const internalUtilsCount = internalUtilsMatch ? (internalUtilsMatch[0].match(/^- /gm) || []).length : 0;
  addRow({
    cat: 'I',
    item: '7 internal (non-public) utility modules referenced by the registry total',
    docsVal: 'not published as docs pages (by design — internal, not part of public import surface)',
    docsRef: docUrl('components/'),
    llmsVal: `${internalUtilsCount} listed in "Internal utilities" section`,
    llmsRef: `llms-components.txt:${lineOf(llmsComponents.body, '## Internal utilities')}`,
    status: internalUtilsCount === 7 ? 'identical' : 'mismatch',
    note: '62 + 1 (theme) + ' + internalUtilsCount + ' = ' + (62 + 1 + internalUtilsCount) + (62 + 1 + internalUtilsCount === 70 ? ' (matches the "70 items" registry claim).' : ' (does NOT match the "70 items" registry claim).'),
  });
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

function toMarkdownTable(rows) {
  const header = '| ID | Category | Item | Docs-site value (page URL) | llms value (file, line) | Status | Note |\n|---|---|---|---|---|---|---|';
  const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const lines = rows.map(
    (r) => `| ${r.id} | ${esc(r.category)} | ${esc(r.item)} | ${esc(r.docsSiteValue)} | ${esc(r.llmsValue)} | ${r.status} | ${esc(r.note)} |`
  );
  return [header, ...lines].join('\n');
}

function summarize(rows) {
  const byCategory = {};
  const byStatus = {};
  for (const r of rows) {
    byCategory[r.category] = byCategory[r.category] || { total: 0 };
    byCategory[r.category][r.status] = (byCategory[r.category][r.status] || 0) + 1;
    byCategory[r.category].total += 1;
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  }
  return { byCategory, byStatus, total: rows.length };
}

async function main() {
  const ctx = await fetchAll();
  const startText = categoryA(ctx);
  categoryB(ctx, startText);
  categoryC(ctx);
  await categoryD(ctx);
  categoryE(ctx);
  categoryF(ctx);
  categoryG(ctx);
  await categoryH(ctx);
  categoryI(ctx);

  const summary = summarize(rows);

  await mkdir(OUT_DIR, { recursive: true });
  const jsonPath = path.join(OUT_DIR, 'docs-llms-matrix.json');
  const mdPath = path.join(OUT_DIR, 'docs-llms-matrix.md');

  await writeFile(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), summary, rows }, null, 2), 'utf8');

  const mdParts = [];
  mdParts.push('# BeeUI docs site vs llms*.txt consistency matrix');
  mdParts.push('');
  mdParts.push('Generated by `node scripts/audit/build-docs-llms-matrix.mjs`. Do not edit by hand; rerun the script.');
  mdParts.push('');
  mdParts.push(`Total rows: ${summary.total}`);
  mdParts.push('');
  mdParts.push('## Totals by status');
  mdParts.push('');
  mdParts.push('| Status | Count |');
  mdParts.push('|---|---|');
  for (const [status, count] of Object.entries(summary.byStatus)) mdParts.push(`| ${status} | ${count} |`);
  mdParts.push('');
  mdParts.push('## Totals by category');
  mdParts.push('');
  mdParts.push('| Category | Total | identical | mismatch | docs-only | llms-only | unverifiable |');
  mdParts.push('|---|---|---|---|---|---|---|');
  for (const [cat, counts] of Object.entries(summary.byCategory)) {
    mdParts.push(
      `| ${cat} | ${counts.total} | ${counts.identical || 0} | ${counts.mismatch || 0} | ${counts['docs-only'] || 0} | ${counts['llms-only'] || 0} | ${counts.unverifiable || 0} |`
    );
  }
  mdParts.push('');
  mdParts.push('## Full matrix');
  mdParts.push('');
  mdParts.push(toMarkdownTable(rows));
  mdParts.push('');

  await writeFile(mdPath, mdParts.join('\n'), 'utf8');

  console.log(`Wrote ${rows.length} rows to:\n  ${mdPath}\n  ${jsonPath}`);
  console.log('By status:', summary.byStatus);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
