// Small disk-cached HTTP helper for the docs-vs-llms audit scripts.
// Cache lives in scripts/audit/.cache/ (gitignored) and is keyed by a
// filesystem-safe hash of the request (method + url).
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CACHE_DIR = path.join(__dirname, '..', '.cache');

function cacheKey(method, url) {
  const hash = createHash('sha1').update(`${method} ${url}`).digest('hex').slice(0, 16);
  const safeName = url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120);
  return `${safeName}.${hash}.json`;
}

/**
 * Fetch a URL with an on-disk JSON cache. Returns { status, body, url, fromCache }.
 * Never throws on HTTP error status (404 etc.) — those are meaningful results
 * for the link-integrity (category H) checks.
 */
export async function fetchCached(url, { method = 'GET', force = false } = {}) {
  await mkdir(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, cacheKey(method, url));
  if (!force) {
    try {
      const raw = await readFile(file, 'utf8');
      const parsed = JSON.parse(raw);
      return { ...parsed, url, fromCache: true };
    } catch {
      // fall through to network fetch
    }
  }
  let status = 0;
  let body = '';
  try {
    const res = await fetch(url, { method, redirect: 'follow' });
    status = res.status;
    body = method === 'HEAD' ? '' : await res.text();
  } catch (err) {
    status = -1;
    body = String(err && err.message ? err.message : err);
  }
  const record = { status, body };
  await writeFile(file, JSON.stringify(record), 'utf8');
  return { ...record, url, fromCache: false };
}

export async function fetchTextCached(url, opts) {
  const { status, body } = await fetchCached(url, opts);
  return { status, body };
}
