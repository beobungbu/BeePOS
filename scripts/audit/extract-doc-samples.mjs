#!/usr/bin/env node
// Phase 10: extract every fenced/Expressive-Code code block from the Guides,
// Theming/Reference and 37 Pattern pages on https://beeui.beemvp.com into
// scripts/audit/.cache/samples/<page>/<n>.<ext>, with a manifest recording
// page URL, heading, language, and file path for each sample.
//
// Reuses scripts/audit/lib/http.mjs (disk-cached fetch) and
// scripts/audit/lib/html.mjs (Starlight content helpers). No DOM dependency
// per repo convention: this file's own regex-based Expressive Code block
// parser lives here because html.mjs only exposes a single-import-line
// helper, not a general code-block extractor.

import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchTextCached } from './lib/http.mjs';
import { mainContent, stripTags } from './lib/html.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLES_DIR = path.join(__dirname, '.cache', 'samples');
const MANIFEST_PATH = path.join(__dirname, '.cache', 'samples-manifest.json');

const BASE = 'https://beeui.beemvp.com';

const GUIDE_PATHS = [
  '/docs/guides/',
  '/docs/guides/branding/',
  '/docs/guides/density/',
  '/docs/guides/table/',
  '/docs/guides/date-time/',
  '/docs/guides/cli-source-ownership/',
  '/docs/guides/troubleshooting/',
  '/docs/guides/migration-versioning/',
  '/docs/guides/current-release/',
];

const THEMING_REFERENCE_PATHS = [
  '/docs/theming/',
  '/docs/reference/tokens/',
  '/docs/reference/core/',
  '/docs/reference/styling/',
];

const PATTERN_PACKS = {
  'account-settings': [
    'account-screen',
    'appearance-screen',
    'change-password-screen',
    'edit-profile-screen',
    'notification-settings-screen',
    'privacy-security-screen',
    'profile-screen',
    'settings-screen',
  ],
  auth: [
    'forgot-password-screen',
    'interests-onboarding-screen',
    'password-updated-screen',
    'profile-setup-screen',
    'reset-password-screen',
    'sign-in-screen',
    'sign-up-screen',
    'verify-code-screen',
    'welcome-screen',
  ],
  'commerce-social': [
    'cart-screen',
    'checkout-screen',
    'messages-screen',
    'notifications-screen',
    'order-detail-screen',
    'orders-screen',
    'post-detail-screen',
    'product-detail-screen',
    'product-feed-screen',
    'product-search-screen',
    'social-feed-screen',
    'user-profile-screen',
  ],
  'dashboard-finance': [
    'analytics-screen',
    'dashboard-overview-screen',
    'invoice-detail-screen',
    'payment-methods-screen',
    'subscription-screen',
    'transaction-detail-screen',
    'transactions-screen',
    'wallet-screen',
  ],
};

const PATTERN_PATHS = ['/docs/patterns/'];
for (const [pack, screens] of Object.entries(PATTERN_PACKS)) {
  for (const screen of screens) {
    PATTERN_PATHS.push(`/docs/patterns/${pack}/${screen}/`);
  }
}

const ALL_PATHS = [...GUIDE_PATHS, ...THEMING_REFERENCE_PATHS, ...PATTERN_PATHS];

function slugFor(p) {
  return p.replace(/^\/docs\//, '').replace(/\/$/, '').replace(/\//g, '-') || 'index';
}

const EXT_MAP = {
  tsx: 'tsx',
  ts: 'ts',
  jsx: 'jsx',
  js: 'js',
  json: 'json',
  css: 'css',
  bash: 'sh',
  sh: 'sh',
  shell: 'sh',
  text: 'txt',
  plaintext: 'txt',
  txt: 'txt',
  diff: 'diff',
  yaml: 'yaml',
  yml: 'yaml',
  html: 'html',
};

function unescapeEntities(s) {
  return s
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

/** Reconstruct code text from an Expressive Code `<pre><code>...</code></pre>` inner HTML by walking `.ec-line` divs. */
function codeFromEcLines(innerHtml) {
  const lines = [];
  const re = /<div class="ec-line">([\s\S]*?)<\/div>\s*<\/div>/g;
  let m;
  while ((m = re.exec(innerHtml))) {
    const lineHtml = m[1];
    const text = unescapeEntities(stripTagsPreserveSpace(lineHtml));
    lines.push(text);
  }
  return lines.join('\n');
}

// stripTags from html.mjs collapses whitespace, which destroys indentation.
// Use a local variant that only removes tags, keeping the rest verbatim.
function stripTagsPreserveSpace(html) {
  return html.replace(/<[^>]+>/g, '');
}

/** Find the nearest preceding heading (h1-h4) text before `idx` in `html`. */
function headingBefore(html, idx) {
  const re = /<h([1-4])[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/h\1>/g;
  let last = null;
  let m;
  while ((m = re.exec(html))) {
    if (m.index > idx) break;
    last = { level: Number(m[1]), id: m[2], text: unescapeEntities(stripTagsPreserveSpace(m[3])).trim() };
  }
  return last;
}

/** Extract every Expressive Code block from a Starlight page's main content HTML. */
function extractCodeBlocks(html) {
  const blocks = [];
  const preRe = /<pre data-language="([a-z0-9]+)"[^>]*>\s*<code>([\s\S]*?)<\/code>\s*<\/pre>/g;
  let m;
  while ((m = preRe.exec(html))) {
    const language = m[1];
    const inner = m[2];
    const code = codeFromEcLines(inner);
    const heading = headingBefore(html, m.index);
    blocks.push({ language, code, heading, index: m.index });
  }
  return blocks;
}

async function main() {
  await rm(SAMPLES_DIR, { recursive: true, force: true });
  await mkdir(SAMPLES_DIR, { recursive: true });

  const manifest = [];
  const perPageCounts = [];

  for (const p of ALL_PATHS) {
    const url = `${BASE}${p}`;
    const { status, body } = await fetchTextCached(url);
    if (status !== 200) {
      perPageCounts.push({ page: p, url, status, blocks: 0, error: `HTTP ${status}` });
      continue;
    }
    const content = mainContent(body);
    const blocks = extractCodeBlocks(content);
    const slug = slugFor(p);
    const pageDir = path.join(SAMPLES_DIR, slug);
    if (blocks.length) await mkdir(pageDir, { recursive: true });

    blocks.forEach((b, i) => {
      const ext = EXT_MAP[b.language] || 'txt';
      const fileName = `${i}.${ext}`;
      const filePath = path.join(pageDir, fileName);
      manifest.push({
        page: slug,
        url,
        headingId: b.heading?.id ?? null,
        heading: b.heading?.text ?? null,
        language: b.language,
        index: i,
        file: path.relative(path.join(__dirname, '..', '..'), filePath),
        charCount: b.code.length,
      });
      writeQueue.push(writeFile(filePath, b.code, 'utf8'));
    });

    perPageCounts.push({ page: p, url, status, blocks: blocks.length });
  }

  await Promise.all(writeQueue);
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');

  console.log('Per-page block counts:');
  for (const c of perPageCounts) {
    console.log(`  ${c.blocks.toString().padStart(3)}  ${c.page}${c.error ? '  ERROR ' + c.error : ''}`);
  }
  console.log(`\nTotal pages: ${perPageCounts.length}`);
  console.log(`Total code blocks: ${manifest.length}`);
  console.log(`Manifest: ${MANIFEST_PATH}`);
}

const writeQueue = [];

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
