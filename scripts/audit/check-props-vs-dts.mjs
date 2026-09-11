#!/usr/bin/env node
// Phase 07 / Worker A / A1: compares every Props table on every
// /docs/components/<slug>/ page against the *real* prop surface computed
// from the installed @beemvp/beeui-ui package's .d.ts (via the TypeScript
// checker, so intersections/Omit<>/VariantProps<> collapse exactly as they
// do for app code) plus the compiled dist/module/*.js runtime defaults
// (cva defaultVariants, destructured function-parameter defaults).
//
// Usage: node scripts/audit/check-props-vs-dts.mjs
// Writes docs/beeui-audit/props-accuracy.md and .json.

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { fetchCached } from './lib/http.mjs';
import { parseComponentModules } from './lib/llms-parse.mjs';
import { parsePropsSections } from './lib/props-table.mjs';
import { buildProbeProgram, flattenProps, RN_BASE_TYPE_IMPORTS } from './lib/ts-props.mjs';
import { loadRuntimeDefaults } from './lib/js-runtime-defaults.mjs';

const SITE = 'https://beeui.beemvp.com';
const OUT_DIR = path.join(process.cwd(), 'docs', 'beeui-audit');

function docUrl(slug) {
  return `${SITE}/docs/components/${slug}/`;
}

function normalizeType(t) {
  if (!t) return '';
  return t
    .replace(/\s*\|\s*undefined\b/g, '')
    // cva's VariantProps<> mechanically appends `| null` to every variant key
    // (so callers may reset to the default via `null`); BeeUI's docs tables
    // consistently omit it as an implementation detail, not a documented
    // value — strip it too so that idiom does not read as a type-mismatch.
    .replace(/\s*\|\s*null\b/g, '')
    .replace(/`/g, '')
    .replace(/"/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// RN's own `StyleProp<T>` expands (via the checker) to
// `T | RecursiveArray<T | Falsy> | Falsy`-shaped text; docs tables
// consistently write the short `StyleProp<T>` form, which is the correct,
// idiomatic RN-consumer-facing name for that exact expansion.
function isStylePropExpansion(docsType, realType) {
  const m = docsType.match(/^StyleProp<\s*(.+?)\s*>$/);
  if (!m) return false;
  const inner = m[1];
  return realType.includes('RecursiveArray') && realType.includes('Falsy') && realType.includes(inner);
}

// Canonicalize `Omit<Base, 'a' | 'b' | 'c'>`'s excluded-key list by sorting
// it — docs and the checker's printed order for the same Omit<> frequently
// differ only in key order, which is not a real difference.
function canonicalizeOmit(t) {
  return t.replace(/Omit<([^,>]+),\s*((?:'[^']*'\s*\|\s*)*'[^']*')>/g, (full, base, keys) => {
    const sorted = keys
      .split('|')
      .map((k) => k.trim())
      .sort()
      .join(' | ');
    return `Omit<${base.trim()}, ${sorted}>`;
  });
}

// `Base['propName']` (indexed-access) is a recognized, correct idiom for
// "the same type as that prop on Base" — the checker expands it to the full
// inlined signature, which is unverifiable-but-equivalent without deeper
// resolution disproportionate to the value; treat as equivalent.
function isIndexedAccessShorthand(docsType) {
  return /^[A-Za-z_][A-Za-z0-9_]*\[['"][A-Za-z0-9_]+['"]\]$/.test(docsType.trim());
}

// `SomeGeneric<Def>` (a short, single-token type-parameter name like `Def`,
// `T`, `K`) printed by docs vs. the checker's fully-instantiated expansion
// (default type argument substituted in) for the same generic — recognized
// as equivalent when the generic's own name appears in the real type text.
function isGenericShorthand(docsType, realType) {
  const m = docsType.match(/^([A-Za-z_][A-Za-z0-9_]*)<([A-Za-z_][A-Za-z0-9_]*)>$/);
  if (!m) return false;
  const [, genericName, typeParam] = m;
  return typeParam.length <= 4 && realType.includes(genericName);
}

function typesEquivalent(docsType, realType, { resolveNamedType } = {}) {
  if (docsType === 'never') return true; // discriminated-union controlled/uncontrolled branch marker, not a defect (see AlertDialogProps.defaultOpen)
  if (isIndexedAccessShorthand(docsType)) return true;
  if (isGenericShorthand(docsType, realType)) return true;
  const a = canonicalizeOmit(normalizeType(docsType));
  const b = canonicalizeOmit(normalizeType(realType));
  if (a === b) return true;
  if (isStylePropExpansion(docsType, realType)) return true;
  // Union-of-literals: compare as sets, order-independent. Guarded to plain
  // literal-union shapes (no generic `<...>` nesting) so pipes *inside* a
  // generic's type arguments (e.g. `Omit<X, 'a' | 'b'>`) are not misread as
  // a top-level union split.
  const isUnionish = (s) => s.includes('|') && !s.includes('<');
  if (isUnionish(a) && isUnionish(b)) {
    const setA = new Set(a.split('|').map((s) => s.trim()));
    const setB = new Set(b.split('|').map((s) => s.trim()));
    if (setA.size === setB.size && [...setA].every((x) => setB.has(x))) return true;
  }
  // Docs sometimes name a BeeUI-exported type alias (e.g. `DatePickerAlign`)
  // where the checker's typeToString expands to the underlying/aliased type
  // it re-exports (e.g. `AnchoredOverlayAlign`) — resolve the docs' alias
  // name too and compare its *structure*, not just the printed name.
  if (resolveNamedType && /^[A-Za-z_][A-Za-z0-9_]*$/.test(docsType)) {
    const resolvedDocsType = resolveNamedType(docsType);
    if (resolvedDocsType && resolvedDocsType !== docsType) {
      return typesEquivalent(resolvedDocsType, realType, { resolveNamedType: undefined });
    }
  }
  // Loose containment fallback (docs often summarize/omit a generic wrapper).
  return a.length > 0 && (b.includes(a) || a.includes(b));
}

function normalizeDefault(d) {
  if (d == null) return null;
  return String(d)
    .replace(/`/g, '')
    .replace(/\s*\([^)]*\)\s*$/, '') // strip trailing parenthetical explanation, e.g. "null (all items closed)"
    .replace(/^"|"$/g, '')
    .replace(/^'|'$/g, '')
    .trim();
}

function defaultsEquivalent(docsDefault, realDefault) {
  const a = normalizeDefault(docsDefault);
  const b = normalizeDefault(realDefault);
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return a === b;
}

/**
 * Resolve an "Also carries every prop of `<expr>`" sentence to either
 * { kind: 'name', baseName } for a plain/Omit-wrapped identifier, or
 * { kind: 'componentProps', target } for an `Omit<React.ComponentProps<typeof
 * X>, ...>` / bare `React.ComponentProps<typeof X>` expression, or null if
 * unparseable.
 */
function parseInheritsExpr(expr) {
  if (!expr) return null;
  // Unwrap one level of Omit<INNER, '...'> to INNER (INNER never itself
  // contains a top-level comma in BeeUI's docs sentences).
  const omitMatch = expr.match(/^Omit<\s*([\s\S]+?)\s*,\s*'[\s\S]+'\s*>$/);
  const inner = omitMatch ? omitMatch[1].trim() : expr.trim();
  const cpMatch = inner.match(/^React\.ComponentProps<typeof\s+([A-Za-z0-9_]+)\s*>$/);
  if (cpMatch) return { kind: 'componentProps', target: cpMatch[1] };
  const plain = inner.match(/^([A-Za-z0-9_]+)$/);
  if (plain) return { kind: 'name', baseName: plain[1] };
  return null;
}

/** Collect every `React.ComponentProps<typeof X>` target across all docs pages, for the probe pre-pass. */
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

async function main() {
  const llmsComponents = await fetchCached(`${SITE}/llms-components.txt`);
  const modules = parseComponentModules(llmsComponents.body);

  // Pass 1: fetch every docs page (cached) and parse Props sections, so we
  // know every `React.ComponentProps<typeof X>` target up front and can
  // include it in the single TS probe program build (avoids rebuilding the
  // program, which is the expensive step, once per component).
  const sectionsBySlug = new Map();
  const statusBySlug = new Map();
  for (const mod of modules) {
    const url = docUrl(mod.slug);
    const { status, body } = await fetchCached(url);
    statusBySlug.set(mod.slug, status);
    sectionsBySlug.set(mod.slug, status === 200 ? parsePropsSections(body) : []);
  }
  const componentPropsTargets = collectComponentPropsTargets(sectionsBySlug);
  const { checker, resolve, resolveComponentPropsOf } = buildProbeProgram(process.cwd(), componentPropsTargets);
  const namedTypeTextCache = new Map();
  function resolveNamedType(name) {
    if (namedTypeTextCache.has(name)) return namedTypeTextCache.get(name);
    const t = resolve(name);
    const text = t ? checker.typeToString(t, undefined, ts.TypeFormatFlags.NoTruncation) : null;
    namedTypeTextCache.set(name, text);
    return text;
  }

  const componentResults = [];
  const allDiffs = [];
  const totals = {
    'documented-and-real': 0,
    'missing-in-docs': 0,
    'extra-in-docs': 0,
    'type-mismatch': 0,
    'default-mismatch': 0,
    'required-mismatch': 0,
    'type-not-resolved': 0,
    'base-unresolved-limited-coverage': 0,
  };

  for (const mod of modules) {
    const slug = mod.slug;
    const url = docUrl(slug);
    if (statusBySlug.get(slug) !== 200) {
      componentResults.push({ slug, url, error: `docs page HTTP ${statusBySlug.get(slug)}`, propTypes: [] });
      continue;
    }
    const sections = sectionsBySlug.get(slug);
    const runtime = loadRuntimeDefaults(slug, process.cwd());
    const propTypeResults = [];

    for (const section of sections) {
      const realType = resolve(section.typeName);
      if (!realType) {
        totals['type-not-resolved'] += 1;
        propTypeResults.push({
          typeName: section.typeName,
          error: 'Could not resolve this type name against @beemvp/beeui-ui via the TS checker probe (not exported from package index, or name differs from the exported symbol).',
          diffs: [],
        });
        continue;
      }
      const fullReal = new Map(flattenProps(checker, realType).map((p) => [p.name, p]));

      const parsedBase = parseInheritsExpr(section.inheritsRaw);
      let baseReal = new Map();
      let baseResolved = !parsedBase; // no inheritance sentence at all -> nothing to resolve, not a limitation
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

      // "Own" (BeeUI-specific) props: not in the inherited base, or present
      // there but with a narrower/overridden type (e.g. Button's `children`
      // narrows Pressable's `children` from ReactNode|function to ReactNode).
      // When the inherited base could not be resolved (third-party or
      // BeeUI-internal non-exported type, e.g. safe-area's
      // `React.ComponentProps<typeof NativeSafeAreaProvider>` or
      // dropdown-menu's internal `DropdownMenuItemBaseProps`), do NOT guess:
      // restrict the comparison to props the docs table already names, so we
      // never manufacture missing-in-docs noise out of an unresolved base's
      // full inherited surface.
      const ownNames = baseResolved
        ? [...fullReal.keys()].filter((name) => {
            if (!baseReal.has(name)) return true;
            return normalizeType(baseReal.get(name).typeText) !== normalizeType(fullReal.get(name).typeText);
          })
        : [...fullReal.keys()].filter((name) => docsRowsByName.has(name));

      const diffs = [];
      if (!baseResolved) {
        totals['base-unresolved-limited-coverage'] += 1;
      }

      for (const name of ownNames) {
        const real = fullReal.get(name);
        const docsRow = docsRowsByName.get(name);
        if (!docsRow) {
          diffs.push({
            prop: name,
            classification: 'missing-in-docs',
            real: { type: real.typeText, optional: real.optional, default: real.jsDocDefault },
            docs: null,
            detail: `\`${name}\` is a BeeUI-specific member of \`${section.typeName}\` per the installed .d.ts but has no row in the docs Props table for ${section.typeName}.`,
          });
          totals['missing-in-docs'] += 1;
          continue;
        }
        // Type check.
        if (!typesEquivalent(docsRow.type, real.typeText, { resolveNamedType })) {
          diffs.push({
            prop: name,
            classification: 'type-mismatch',
            real: { type: real.typeText, optional: real.optional },
            docs: { type: docsRow.type },
            detail: `Docs table lists type \`${docsRow.type}\`; installed .d.ts resolves \`${name}\` on \`${section.typeName}\` to \`${real.typeText}\`.`,
          });
          totals['type-mismatch'] += 1;
        }
        // Default check: prefer compiled runtime default (cva defaultVariants /
        // destructured function default) over JSDoc prose, since that is what
        // actually executes. Only compare when we have a *confident* reality
        // value (a clean runtime default, or a short/non-stopword JSDoc
        // token) — when our extraction finds nothing, that is a gap in this
        // script's evidence, not proof the docs are wrong, so it is not
        // reported as default-mismatch (see check-props-vs-dts.mjs quality
        // bar: distinguish "docs incomplete" from "docs wrong").
        const runtimeDefault = runtime.flat[name];
        const realDefaultForCompare = runtimeDefault != null ? runtimeDefault : real.jsDocDefault;
        // A docs row typed `never` documents one branch of a controlled vs.
        // uncontrolled discriminated-union props type (see the `never`
        // handling in typesEquivalent above) — its "default" is moot, so
        // skip the default check for it rather than comparing against a
        // JSDoc default that actually belongs to the *other* union branch.
        if (realDefaultForCompare != null && docsRow.type !== 'never') {
          if (!defaultsEquivalent(docsRow.default, realDefaultForCompare)) {
            diffs.push({
              prop: name,
              classification: 'default-mismatch',
              real: {
                default: realDefaultForCompare,
                source: runtimeDefault != null ? 'compiled dist/module runtime default (cva defaultVariants or function-parameter default)' : 'd.ts JSDoc prose default',
              },
              docs: { default: docsRow.default },
              detail: `Docs table default for \`${name}\` is ${docsRow.default == null ? '"—" (none shown)' : `\`${docsRow.default}\``}; reality (${runtimeDefault != null ? 'compiled JS' : 'JSDoc'}) is \`${realDefaultForCompare}\`.`,
            });
            totals['default-mismatch'] += 1;
          }
        }
        // Required check: BeeUI's docs convention marks a required prop by
        // appending " (required)" to the Prop-column name (parsed into
        // `requiredPerDocs` by lib/props-table.mjs) rather than using a
        // separate Required column, so that is the ground-truth docs claim.
        const docsSaysRequired = !!docsRow.requiredPerDocs;
        const realIsRequired = !real.optional;
        // A docs-required prop whose flattened .d.ts type is optional is
        // expected, not a bug, when it is one branch of a controlled vs.
        // uncontrolled discriminated-union props type: TS's
        // getPropertiesOfType reports the *union's* apparent optionality
        // (optional overall, since the uncontrolled branch omits the prop
        // entirely), while the docs table correctly documents this exact
        // row as required *within the controlled variant it describes*.
        // Both AlertDialog/Dialog/DropdownMenu/Popover/Sheet/Tooltip's
        // open/onOpenChange rows and their prose ("...controlled variant
        // ...") match this pattern.
        const isControlledUnionBranch =
          docsSaysRequired &&
          !realIsRequired &&
          /controlled/i.test(docsRow.description || '');
        if (docsSaysRequired !== realIsRequired && !isControlledUnionBranch) {
          diffs.push({
            prop: name,
            classification: 'required-mismatch',
            real: { optional: real.optional },
            docs: { requiredPerDocs: docsSaysRequired },
            detail: docsSaysRequired
              ? `Docs table marks \`${name}\` "(required)", but the installed .d.ts declares it optional on \`${section.typeName}\`.`
              : `\`${name}\` is a required (non-optional) member of \`${section.typeName}\` in the installed .d.ts, but the docs table does not mark it "(required)".`,
          });
          totals['required-mismatch'] += 1;
        }
      }
      // Count documented-and-real precisely (props that had zero diffs pushed for them).
      const diffPropNames = new Set(diffs.map((d) => d.prop));
      const cleanCount = ownNames.filter((n) => docsRowsByName.has(n) && !diffPropNames.has(n)).length;
      totals['documented-and-real'] += cleanCount;

      // extra-in-docs: docs row names not in the real type at all (not even
      // inherited unchanged) — a genuinely fabricated/removed prop.
      for (const [name] of docsRowsByName) {
        if (!fullReal.has(name)) {
          diffs.push({
            prop: name,
            classification: 'extra-in-docs',
            real: null,
            docs: { type: docsRowsByName.get(name).type, default: docsRowsByName.get(name).default },
            detail: `Docs table documents \`${name}\` on \`${section.typeName}\`, but no member of that name resolves anywhere on the installed .d.ts's flattened type (own props or inherited).`,
          });
          totals['extra-in-docs'] += 1;
        }
      }

      for (const d of diffs) allDiffs.push({ slug, typeName: section.typeName, url: `${url}#${section.headingId}`, ...d });
      propTypeResults.push({
        typeName: section.typeName,
        headingId: section.headingId,
        inheritsRaw: section.inheritsRaw,
        baseResolved,
        note: baseResolved
          ? ''
          : `Inherited base type ("${section.inheritsRaw}") is a third-party or BeeUI-internal non-exported type; coverage limited to the ${section.rows.length} prop(s) the docs table already names (no missing-in-docs check against the full inherited surface).`,
        ownPropCount: ownNames.length,
        docsRowCount: section.rows.length,
        diffs,
      });
    }
    componentResults.push({ slug, url, propTypes: propTypeResults });
  }

  const summary = { totals, componentsChecked: componentResults.length, propTypesChecked: componentResults.reduce((s, c) => s + c.propTypes.length, 0) };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    path.join(OUT_DIR, 'props-accuracy.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), summary, components: componentResults }, null, 2),
    'utf8'
  );

  const md = [];
  md.push('# BeeUI props accuracy: docs Props tables vs installed .d.ts + compiled runtime defaults');
  md.push('');
  md.push('Generated by `node scripts/audit/check-props-vs-dts.mjs`. Do not edit by hand; rerun the script.');
  md.push('');
  md.push(`Components checked: ${summary.componentsChecked}. Props-bearing types checked: ${summary.propTypesChecked}.`);
  md.push('');
  md.push('## Totals by classification');
  md.push('');
  md.push('| Classification | Count |');
  md.push('|---|---|');
  for (const [k, v] of Object.entries(totals)) md.push(`| ${k} | ${v} |`);
  md.push('');
  md.push('## Per-component totals');
  md.push('');
  md.push('| Component | Props-bearing types | Docs rows | Diffs |');
  md.push('|---|---|---|---|');
  for (const c of componentResults) {
    const docsRows = (c.propTypes || []).reduce((s, p) => s + (p.docsRowCount || 0), 0);
    const diffs = (c.propTypes || []).reduce((s, p) => s + (p.diffs || []).length, 0);
    md.push(`| ${c.slug} | ${(c.propTypes || []).length} | ${docsRows} | ${diffs} |`);
  }
  md.push('');
  md.push('## Full diff list');
  md.push('');
  md.push('| Component | Type | Prop | Classification | Detail | Page |');
  md.push('|---|---|---|---|---|---|');
  for (const d of allDiffs) {
    const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
    md.push(`| ${d.slug} | ${d.typeName} | ${d.prop} | ${d.classification} | ${esc(d.detail)} | ${d.url} |`);
  }
  md.push('');
  await writeFile(path.join(OUT_DIR, 'props-accuracy.md'), md.join('\n'), 'utf8');

  console.log(`Checked ${summary.componentsChecked} components / ${summary.propTypesChecked} prop types.`);
  console.log('Totals:', totals);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
