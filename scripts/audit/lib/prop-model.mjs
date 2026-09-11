// Phase 08 / Pass 1: builds a machine-readable per-prop behavior model on top
// of the same reality sources phase 07's check-props-vs-dts.mjs already
// resolves (TypeScript checker probe over the installed .d.ts + docs Props
// tables). Does not duplicate that script's diffing; it re-derives the same
// "own props" set (docs-reconciled real props) and adds, per prop:
//   { name, kind, values, docsDefault, realDefault, docsDescription,
//     docsRequired, realRequired, typeText, cvaClasses }
// so scripts/audit/gen-prop-tests.mjs can generate one executable assertion
// per (prop, value) without re-parsing docs HTML or re-walking the checker.
import path from 'node:path';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { fetchCached } from './http.mjs';
import { parseComponentModules } from './llms-parse.mjs';
import { parsePropsSections } from './props-table.mjs';
import { buildProbeProgram, flattenProps, RN_BASE_TYPE_IMPORTS } from './ts-props.mjs';
import { loadRuntimeDefaults, distModuleComponentPaths } from './js-runtime-defaults.mjs';

const SITE = 'https://beeui.beemvp.com';

function docUrl(slug) {
  return `${SITE}/docs/components/${slug}/`;
}

function normalizeType(t) {
  if (!t) return '';
  return t
    .replace(/\s*\|\s*undefined\b/g, '')
    .replace(/\s*\|\s*null\b/g, '')
    .replace(/`/g, '')
    .replace(/"/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Balance-parses every `cva(base, { variants: { key: { literal: 'classes',
 * ... }, ... } })` call in a compiled component's JS source and returns a
 * flat `{ propKey: { literalValue: classString } }` map — the oracle used to
 * assert that a literal-union prop's rendered `className` carries the class
 * fragment cva assigns to the value under test. Only string-literal variant
 * values are captured (a variant value that resolves to an identifier, e.g.
 * `sm: semanticTypographyClasses.label`, is not comparable as a class
 * substring and is left out of the map for that literal).
 */
function extractCvaVariantClasses(jsText) {
  const out = {};
  const cvaRe = /\bcva\(/g;
  let m;
  while ((m = cvaRe.exec(jsText))) {
    const start = cvaRe.lastIndex - 1;
    let depth = 0;
    let end = -1;
    for (let j = start; j < jsText.length; j++) {
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
    const callBody = jsText.slice(start, end + 1);
    const variantsIdx = callBody.search(/variants:\s*\{/);
    if (variantsIdx === -1) continue;
    const vStart = callBody.indexOf('{', variantsIdx);
    let vDepth = 0;
    let vEnd = -1;
    for (let j = vStart; j < callBody.length; j++) {
      if (callBody[j] === '{') vDepth++;
      else if (callBody[j] === '}') {
        vDepth--;
        if (vDepth === 0) {
          vEnd = j;
          break;
        }
      }
    }
    if (vEnd === -1) continue;
    const variantsBody = callBody.slice(vStart + 1, vEnd);
    const entryRe = /(\w+):\s*\{([^{}]*)\}/g;
    let em;
    while ((em = entryRe.exec(variantsBody))) {
      const propKey = em[1];
      const inner = em[2];
      const litRe = /(['"]?)(\w+)\1\s*:\s*'((?:[^'\\]|\\.)*)'/g;
      let lm;
      const valMap = out[propKey] ? { ...out[propKey] } : {};
      while ((lm = litRe.exec(inner))) valMap[lm[2]] = lm[3];
      out[propKey] = valMap;
    }
  }
  return out;
}

function loadCvaVariantClasses(slug, cwd) {
  const files = distModuleComponentPaths(slug, cwd);
  const merged = {};
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    const perFile = extractCvaVariantClasses(text);
    for (const [k, v] of Object.entries(perFile)) merged[k] = { ...(merged[k] || {}), ...v };
  }
  return merged;
}

function isFunctionTypeText(t) {
  return /^\(.*\)\s*=>\s*.+$/.test(t.trim());
}

function isNodeTypeText(t) {
  return /\bReactNode\b|\bReactElement\b|\bJSX\.Element\b|\bReactPortal\b/.test(t);
}

/** Split a normalized union-of-literal-strings type text into its literal values, or null if not that shape. */
function literalUnionValues(t) {
  const parts = t.split('|').map((s) => s.trim());
  if (parts.length === 0) return null;
  const values = [];
  for (const p of parts) {
    const m = p.match(/^'([^']*)'$/);
    if (!m) return null;
    values.push(m[1]);
  }
  return values;
}

function classifyKind(typeText) {
  const t = normalizeType(typeText);
  if (t === 'boolean') return { kind: 'boolean', values: [true, false] };
  if (t === 'true | false' || t === 'false | true') return { kind: 'boolean', values: [true, false] };
  if (t === 'number') return { kind: 'number', values: [] };
  if (t === 'string') return { kind: 'string', values: [] };
  const litValues = literalUnionValues(t);
  if (litValues && litValues.length > 0) {
    // A literal union of exactly 'true'/'false' text tokens (not actual TS
    // booleans, but string literals spelled that way) is vanishingly rare in
    // this codebase; real boolean props already resolve to `boolean` above.
    return { kind: 'literal-union', values: litValues };
  }
  if (isFunctionTypeText(t)) return { kind: 'callback', values: [] };
  if (isNodeTypeText(t)) return { kind: 'node', values: [] };
  return { kind: 'other', values: [] };
}

function parseInheritsExpr(expr) {
  if (!expr) return null;
  const omitMatch = expr.match(/^Omit<\s*([\s\S]+?)\s*,\s*'[\s\S]+'\s*>$/);
  const inner = omitMatch ? omitMatch[1].trim() : expr.trim();
  const cpMatch = inner.match(/^React\.ComponentProps<typeof\s+([A-Za-z0-9_]+)\s*>$/);
  if (cpMatch) return { kind: 'componentProps', target: cpMatch[1] };
  const plain = inner.match(/^([A-Za-z0-9_]+)$/);
  if (plain) return { kind: 'name', baseName: plain[1] };
  return null;
}

function collectComponentPropsTargets(allSections) {
  const targets = new Set();
  for (const sections of allSections.values()) {
    for (const s of sections) {
      const parsed = parseInheritsExpr(s.inheritsRaw);
      if (parsed && parsed.kind === 'componentProps') targets.add(parsed.target);
    }
  }
  return [...targets];
}

/**
 * Builds the full per-prop behavior model: every component's every
 * `*Props` type's every "own" (BeeUI-specific, docs-reconciled) prop,
 * classified by kind with its testable value set and doc/reality metadata.
 */
export async function buildPropModel(cwd = process.cwd()) {
  const llmsComponents = await fetchCached(`${SITE}/llms-components.txt`);
  const modules = parseComponentModules(llmsComponents.body);

  const sectionsBySlug = new Map();
  const statusBySlug = new Map();
  for (const mod of modules) {
    const { status, body } = await fetchCached(docUrl(mod.slug));
    statusBySlug.set(mod.slug, status);
    sectionsBySlug.set(mod.slug, status === 200 ? parsePropsSections(body) : []);
  }
  const componentPropsTargets = collectComponentPropsTargets(sectionsBySlug);
  const { checker, resolve, resolveComponentPropsOf, beeUiValueNames } = buildProbeProgram(cwd, componentPropsTargets);

  const components = [];
  const byKind = { 'literal-union': 0, boolean: 0, number: 0, string: 0, callback: 0, node: 0, other: 0 };
  let ownPropsTotal = 0;
  let propTypesTotal = 0;

  for (const mod of modules) {
    const slug = mod.slug;
    if (statusBySlug.get(slug) !== 200) {
      components.push({ slug, url: docUrl(slug), error: `docs page HTTP ${statusBySlug.get(slug)}`, propTypes: [] });
      continue;
    }
    const sections = sectionsBySlug.get(slug);
    const runtime = loadRuntimeDefaults(slug, cwd);
    const cvaClasses = loadCvaVariantClasses(slug, cwd);
    const propTypes = [];

    for (const section of sections) {
      const realType = resolve(section.typeName);
      if (!realType) continue;
      const fullReal = new Map(flattenProps(checker, realType).map((p) => [p.name, p]));

      const parsedBase = parseInheritsExpr(section.inheritsRaw);
      let baseReal = new Map();
      let baseResolved = !parsedBase;
      if (parsedBase) {
        let baseType = null;
        if (parsedBase.kind === 'componentProps') {
          baseType = resolveComponentPropsOf(parsedBase.target);
        } else {
          const rnSpec = RN_BASE_TYPE_IMPORTS[parsedBase.baseName];
          const resolveName = rnSpec ? rnSpec.as || rnSpec.name : parsedBase.baseName;
          baseType = resolve(resolveName);
        }
        if (baseType) {
          baseReal = new Map(flattenProps(checker, baseType).map((p) => [p.name, p]));
          baseResolved = true;
        }
      }

      const docsRowsByName = new Map(section.rows.map((r) => [r.name, r]));
      const ownNames = baseResolved
        ? [...fullReal.keys()].filter((name) => {
            if (!baseReal.has(name)) return true;
            return normalizeType(baseReal.get(name).typeText) !== normalizeType(fullReal.get(name).typeText);
          })
        : [...fullReal.keys()].filter((name) => docsRowsByName.has(name));

      const componentName = section.typeName.endsWith('Props') ? section.typeName.slice(0, -'Props'.length) : null;
      const isRenderable = !!componentName && beeUiValueNames.has(componentName);

      const ownProps = [];
      for (const name of ownNames) {
        const real = fullReal.get(name);
        const docsRow = docsRowsByName.get(name);
        const { kind, values } = classifyKind(real.typeText);
        const runtimeDefault = runtime.flat[name];
        const realDefault = runtimeDefault != null ? runtimeDefault : real.jsDocDefault;
        ownProps.push({
          name,
          kind,
          values,
          typeText: real.typeText,
          docsDefault: docsRow ? docsRow.default : null,
          realDefault: realDefault != null ? String(realDefault) : null,
          docsDescription: docsRow ? docsRow.description : null,
          docsRequired: docsRow ? !!docsRow.requiredPerDocs : false,
          realRequired: !real.optional,
          cvaClasses: kind === 'literal-union' && cvaClasses[name] ? cvaClasses[name] : null,
          inDocs: !!docsRow,
        });
        byKind[kind] = (byKind[kind] || 0) + 1;
        ownPropsTotal += 1;
      }

      propTypes.push({
        typeName: section.typeName,
        headingId: section.headingId,
        component: componentName,
        isRenderable,
        ownProps,
      });
      propTypesTotal += 1;
    }

    components.push({ slug, url: docUrl(slug), propTypes });
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      components: components.length,
      propTypes: propTypesTotal,
      ownProps: ownPropsTotal,
      byKind,
    },
    components,
  };
}
