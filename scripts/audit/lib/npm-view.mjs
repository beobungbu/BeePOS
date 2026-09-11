// Cached `npm view` wrapper (category A/B "npm" source).
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CACHE_DIR } from './http.mjs';

export async function npmViewJson(pkg) {
  await mkdir(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, `npm-view-${pkg.replace(/[@/]/g, '_')}.json`);
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    // fall through
  }
  let data;
  try {
    const out = execFileSync('npm', ['view', pkg, '--json'], { encoding: 'utf8', timeout: 30000 });
    data = JSON.parse(out);
  } catch (err) {
    data = { error: String(err && err.message ? err.message : err) };
  }
  await writeFile(file, JSON.stringify(data, null, 2), 'utf8');
  return data;
}
