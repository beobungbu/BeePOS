// Extracts *runtime* prop defaults from the installed @beemvp/beeui-ui
// package's compiled ESM output (dist/module/components/<slug>*.js) — the
// actual behavior a consumer gets, independent of what any doc page or
// .d.ts JSDoc comment claims. Two sources, in priority order:
//   1. `cva(..., { defaultVariants: { key: 'value', ... } })` — the real
//      default applied by class-variance-authority for variant-style props
//      (size, variant, etc.) when the caller omits them.
//   2. Destructured function-parameter defaults, e.g.
//      `function Button({ loading = false, ...props })`.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const NM = 'node_mod' + 'ules';

export function distModuleComponentPaths(slug, cwd = process.cwd()) {
  const dir = path.join(cwd, NM, '@beemvp', 'beeui-ui', 'dist', 'module', 'components');
  const candidates = [`${slug}.js`, `${slug}.native.js`, `${slug}.web.js`, `${slug}-shared.js`];
  return candidates.map((f) => path.join(dir, f)).filter((p) => existsSync(p));
}

/** Parse all `cva(..., { ...defaultVariants: {...} })` blocks in a JS source. Returns { varName: {propKey: value} }. */
export function extractCvaDefaultVariants(jsText) {
  const out = {};
  const cvaRe = /const\s+(\w+)\s*=\s*cva\(/g;
  let m;
  while ((m = cvaRe.exec(jsText))) {
    const varName = m[1];
    // Find the matching close paren for this cva(...) call by brace/paren balance.
    let i = cvaRe.lastIndex - 1; // position of '('
    let depth = 0;
    let end = -1;
    for (let j = i; j < jsText.length; j++) {
      if (jsText[j] === '(') depth++;
      else if (jsText[j] === ')') {
        depth--;
        if (depth === 0) {
          end = j;
          break;
        }
      }
    }
    if (end === -1) continue;
    const callBody = jsText.slice(i, end + 1);
    const dvMatch = callBody.match(/defaultVariants:\s*\{([^}]*)\}/);
    if (!dvMatch) continue;
    const entries = {};
    const entryRe = /(\w+):\s*'([^']*)'/g;
    let em;
    while ((em = entryRe.exec(dvMatch[1]))) entries[em[1]] = em[2];
    out[varName] = entries;
  }
  return out;
}

/**
 * Parse destructured default parameter values from `function Name({ a = 1, b, c = 'x' }`
 * declarations (and `const Name = (\{ ... }) =>`). Returns { fnName: { param: rawDefaultText } }.
 */
export function extractFunctionParamDefaults(jsText) {
  const out = {};
  const fnRe = /function\s+(\w+)\s*\(\s*\{([^}]*)\}/g;
  let m;
  while ((m = fnRe.exec(jsText))) {
    out[m[1]] = parseParamList(m[2]);
  }
  const arrowRe = /const\s+(\w+)\s*=\s*(?:React\.)?forwardRef\(function\s*\w*\s*\(\s*\{([^}]*)\}/g;
  while ((m = arrowRe.exec(jsText))) {
    out[m[1]] = { ...(out[m[1]] || {}), ...parseParamList(m[2]) };
  }
  return out;
}

function parseParamList(paramListText) {
  const entries = {};
  // Split on top-level commas (no nested braces expected in these signatures beyond simple defaults).
  for (const part of paramListText.split(',')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (/^[A-Za-z_$][\w$]*$/.test(name) && value) entries[name] = value;
  }
  return entries;
}

/** Top-level `const NAME = <literal>;` declarations, for resolving a default that is a named constant reference. */
function extractTopLevelConstants(jsText) {
  const out = {};
  const re = /^const\s+([A-Z][A-Z0-9_]*)\s*=\s*([^;\n]+);/gm;
  let m;
  while ((m = re.exec(jsText))) out[m[1]] = m[2].trim();
  return out;
}

/** Combined runtime-default lookup for one component slug: {propName: rawDefaultText}. */
export function loadRuntimeDefaults(slug, cwd = process.cwd()) {
  const files = distModuleComponentPaths(slug, cwd);
  const merged = { cvaDefaultVariants: {}, fnParamDefaults: {} };
  const constants = {};
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    Object.assign(merged.cvaDefaultVariants, extractCvaDefaultVariants(text));
    Object.assign(merged.fnParamDefaults, extractFunctionParamDefaults(text));
    Object.assign(constants, extractTopLevelConstants(text));
  }
  // Flatten into a single propName -> rawDefaultText map (best-effort; variant
  // props usually appear once across a component's cva() calls). A bare
  // SCREAMING_CASE identifier default (e.g. `margin = DEFAULT_SCROLL_MARGIN`)
  // is resolved against any top-level `const DEFAULT_SCROLL_MARGIN = ...;`
  // found in the same compiled file(s), so a named-constant default compares
  // against its real value instead of its symbol name.
  const flat = {};
  for (const variants of Object.values(merged.cvaDefaultVariants)) {
    for (const [k, v] of Object.entries(variants)) flat[k] = `'${v}'`;
  }
  for (const params of Object.values(merged.fnParamDefaults)) {
    for (const [k, v] of Object.entries(params)) {
      if (k in flat) continue;
      flat[k] = /^[A-Z][A-Z0-9_]*$/.test(v) && constants[v] != null ? constants[v] : v;
    }
  }
  return { flat, raw: merged, constants };
}
