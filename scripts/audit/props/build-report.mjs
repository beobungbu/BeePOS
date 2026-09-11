#!/usr/bin/env node
// Phase 08 / Pass 1: aggregates scripts/audit/props/model.json (the prop
// model) + scripts/audit/props/.results/*.ndjson (one JSON line per
// (component, prop, value) row recorded by scripts/audit/props/test-driver.tsx
// while `npx jest -c scripts/audit/props/jest.config.js` ran) into the
// phase's required outputs:
//   docs/beeui-audit/prop-behavior.json
//   docs/beeui-audit/prop-behavior.md
//   docs/beeui-audit/findings-08-per-prop.md
//
// Usage: node scripts/audit/props/build-report.mjs
// Run after `node scripts/audit/gen-prop-tests.mjs && npx jest -c scripts/audit/props/jest.config.js`.
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const PROPS_DIR = path.join(ROOT, 'scripts', 'audit', 'props');
const RESULTS_DIR = path.join(PROPS_DIR, '.results');
const OUT_DIR = path.join(ROOT, 'docs', 'beeui-audit');

function key(component, typeName, prop) {
  return `${component}::${typeName}::${prop}`;
}

async function loadResults() {
  const rows = [];
  let files = [];
  try {
    files = await readdir(RESULTS_DIR);
  } catch {
    files = [];
  }
  for (const f of files) {
    if (!f.endsWith('.ndjson')) continue;
    const text = await readFile(path.join(RESULTS_DIR, f), 'utf8');
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      rows.push(JSON.parse(line));
    }
  }
  return rows;
}

async function loadPropsAccuracy() {
  try {
    const text = await readFile(path.join(OUT_DIR, 'props-accuracy.json'), 'utf8');
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Map (slug, typeName, prop) -> [{classification, detail}] from phase 07's static diff. */
function buildAccuracyIndex(accuracy) {
  const idx = new Map();
  if (!accuracy) return idx;
  for (const c of accuracy.components || []) {
    for (const pt of c.propTypes || []) {
      for (const d of pt.diffs || []) {
        const k = `${c.slug}::${pt.typeName}::${d.prop}`;
        if (!idx.has(k)) idx.set(k, []);
        idx.get(k).push(d);
      }
    }
  }
  return idx;
}

// Prop descriptions that repeat verbatim across many different components
// are BeeUI's docs-generator boilerplate, not a component-specific claim —
// there is nothing prop-specific to assert beyond "renders". Collected
// empirically from the model (see findings-08-per-prop.md's "docs too vague
// to test" section) rather than hand-maintained.
function findBoilerplateDescriptions(model) {
  const counts = new Map();
  for (const c of model.components) {
    for (const pt of c.propTypes || []) {
      for (const p of pt.ownProps || []) {
        if (!p.docsDescription) continue;
        const d = p.docsDescription.trim();
        if (!counts.has(d)) counts.set(d, new Set());
        counts.get(d).add(c.slug);
      }
    }
  }
  const boilerplate = new Set();
  for (const [desc, slugs] of counts) {
    if (slugs.size >= 5) boilerplate.add(desc);
  }
  return boilerplate;
}

function isTooVague(prop, boilerplate) {
  const d = (prop.docsDescription || '').trim();
  if (!d) return 'empty';
  if (d.length < 12) return 'too short';
  if (boilerplate.has(d)) return 'generic boilerplate repeated across many unrelated components';
  return null;
}

async function main() {
  const model = JSON.parse(await readFile(path.join(PROPS_DIR, 'model.json'), 'utf8'));
  const rows = await loadResults();
  const accuracy = await loadPropsAccuracy();
  const accuracyIdx = buildAccuracyIndex(accuracy);
  const boilerplate = findBoilerplateDescriptions(model);

  // component (export name) -> slug, needed because ndjson rows carry the
  // export name (e.g. "AccordionItem") but props-accuracy.json is keyed by
  // the docs-page slug (e.g. "accordion").
  const componentToSlug = new Map();
  for (const c of model.components) {
    for (const pt of c.propTypes || []) {
      if (pt.component) componentToSlug.set(pt.component, c.slug);
    }
  }

  const rowsByProp = new Map();
  for (const r of rows) {
    if (r.prop == null) continue; // zero-own-props smoke test row
    const k = key(r.component, r.typeName, r.prop);
    if (!rowsByProp.has(k)) rowsByProp.set(k, []);
    rowsByProp.get(k).push(r);
  }

  const propEntries = [];
  let executedCount = 0;
  const tierTotals = { holds: 0, fails: 0, 'renders-only': 0, 'needs-browser': 0, 'too-vague': 0, skipped: 0 };

  for (const c of model.components) {
    for (const pt of c.propTypes || []) {
      for (const p of pt.ownProps || []) {
        const k = key(pt.component, pt.typeName, p.name);
        const valueRows = rowsByProp.get(k) || [];
        let status;
        let detail;
        if (valueRows.length === 0) {
          status = 'skipped(not a rendered component prop; this Props type is not itself a React component — see toast\'s ToastOptions/ToastAction, passed to useToast(), not rendered as JSX)';
          detail = 'not exercised by the render-based per-prop harness';
        } else if (valueRows.some((r) => r.result === 'fails')) {
          status = 'fails';
          detail = valueRows.filter((r) => r.result === 'fails').map((r) => r.detail).join(' | ');
        } else if (valueRows.some((r) => r.result === 'holds')) {
          status = 'holds';
          detail = valueRows.filter((r) => r.result === 'holds').map((r) => r.detail).slice(0, 3).join(' | ');
        } else {
          status = 'renders-only';
          detail = valueRows.map((r) => r.detail).slice(0, 2).join(' | ');
        }
        // "Too vague to test" only means anything for a prop this harness
        // could not otherwise verify — a prop whose description repeats
        // boilerplate but still reached `holds` (its shared behavior WAS
        // exercised, e.g. every Button-family `loading`/`size`/`variant`
        // inherited onto AlertDialogAction/DialogTrigger/...) is not vague,
        // it is a legitimately shared, already-tested contract.
        const vague = status === 'renders-only' ? isTooVague(p, boilerplate) : null;
        if (vague) status = 'renders-only (docs too vague to test further)';
        const tierKey = status.startsWith('skipped') ? 'skipped' : status.startsWith('fails') ? 'fails' : status.startsWith('holds') ? 'holds' : 'renders-only';
        tierTotals[tierKey] += 1;
        if (!status.startsWith('skipped')) executedCount += 1;

        const accKey = `${componentToSlug.get(pt.component) || c.slug}::${pt.typeName}::${p.name}`;
        const accDiffs = accuracyIdx.get(accKey) || [];

        propEntries.push({
          slug: c.slug,
          url: c.url,
          component: pt.component,
          typeName: pt.typeName,
          prop: p.name,
          kind: p.kind,
          docsRequired: p.docsRequired,
          realRequired: p.realRequired,
          docsDefault: p.docsDefault,
          realDefault: p.realDefault,
          docsDescription: p.docsDescription,
          tooVague: vague,
          status,
          detail,
          values: valueRows.map((r) => ({ value: r.value, result: r.result, detail: r.detail })),
          priorFindings: accDiffs.map((d) => ({ classification: d.classification, detail: d.detail })),
        });
      }
    }
  }

  const totalOwnProps = model.totals.ownProps;
  const coveragePct = Math.round((executedCount / totalOwnProps) * 1000) / 10;

  const summary = {
    generatedAt: new Date().toISOString(),
    components: model.totals.components,
    propTypes: model.totals.propTypes,
    propsModelled: totalOwnProps,
    propsExecuted: executedCount,
    coveragePct,
    testRows: rows.length,
    tierTotals,
    resultRowTierTotals: (() => {
      const t = { holds: 0, 'renders-only': 0, fails: 0 };
      for (const r of rows) {
        const tk = r.result.split('(')[0];
        if (t[tk] == null) t[tk] = 0;
        t[tk] += 1;
      }
      return t;
    })(),
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    path.join(OUT_DIR, 'prop-behavior.json'),
    JSON.stringify({ summary, props: propEntries }, null, 2),
    'utf8'
  );

  // ---- prop-behavior.md ----
  const md = [];
  md.push('# BeeUI prop behavior: per-prop, per-value executable verification');
  md.push('');
  md.push('Generated by `node scripts/audit/props/build-report.mjs` from `scripts/audit/props/model.json` and');
  md.push('`scripts/audit/props/.results/*.ndjson` (produced by `npx jest -c scripts/audit/props/jest.config.js`).');
  md.push('Do not edit by hand; rerun the pipeline (`node scripts/audit/gen-prop-tests.mjs && npx jest -c scripts/audit/props/jest.config.js && node scripts/audit/props/build-report.mjs`).');
  md.push('');
  md.push(`Components: ${summary.components}. Props-bearing types: ${summary.propTypes}. Props modelled: ${summary.propsModelled}. Executed (non-skipped): ${summary.propsExecuted} (${summary.coveragePct}%).`);
  md.push('');
  md.push('## Per-prop status totals');
  md.push('');
  md.push('| Status | Props |');
  md.push('|---|---|');
  md.push(`| holds | ${tierTotals.holds} |`);
  md.push(`| renders-only | ${tierTotals['renders-only']} |`);
  md.push(`| fails | ${tierTotals.fails} |`);
  md.push(`| skipped | ${tierTotals.skipped} |`);
  md.push('');
  md.push('## Per-(prop, value) test-row totals');
  md.push('');
  md.push('| Result | Rows |');
  md.push('|---|---|');
  for (const [k, v] of Object.entries(summary.resultRowTierTotals)) md.push(`| ${k} | ${v} |`);
  md.push(`| **total** | **${rows.length}** |`);
  md.push('');
  md.push('## Per-component summary');
  md.push('');
  md.push('| Component | Props | holds | renders-only | fails | skipped |');
  md.push('|---|---|---|---|---|---|');
  const bySlug = new Map();
  for (const e of propEntries) {
    if (!bySlug.has(e.slug)) bySlug.set(e.slug, []);
    bySlug.get(e.slug).push(e);
  }
  for (const [slug, entries] of [...bySlug.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const c = { holds: 0, 'renders-only': 0, fails: 0, skipped: 0 };
    for (const e of entries) {
      const tk = e.status.startsWith('skipped') ? 'skipped' : e.status.startsWith('fails') ? 'fails' : e.status.startsWith('holds') ? 'holds' : 'renders-only';
      c[tk] += 1;
    }
    md.push(`| ${slug} | ${entries.length} | ${c.holds} | ${c['renders-only']} | ${c.fails} | ${c.skipped} |`);
  }
  md.push('');
  md.push('## Fails');
  md.push('');
  const fails = propEntries.filter((e) => e.status === 'fails');
  if (fails.length === 0) {
    md.push('None.');
  } else {
    md.push('| Component | Prop | Detail | Page |');
    md.push('|---|---|---|---|');
    for (const f of fails) {
      md.push(`| ${f.component}.${f.typeName} | ${f.prop} | ${String(f.detail).replace(/\|/g, '\\|')} | ${f.url} |`);
    }
  }
  md.push('');
  md.push('## Full per-prop table');
  md.push('');
  md.push('| Component | Type | Prop | Kind | Status |');
  md.push('|---|---|---|---|---|');
  for (const e of propEntries) {
    md.push(`| ${e.component} | ${e.typeName} | ${e.prop} | ${e.kind} | ${e.status} |`);
  }
  md.push('');
  await writeFile(path.join(OUT_DIR, 'prop-behavior.md'), md.join('\n'), 'utf8');

  // ---- findings-08-per-prop.md ----
  const findings = [];
  findings.push('# Phase 08 findings: per-prop, per-value executable verification');
  findings.push('');
  findings.push('Reality source: the installed `@beemvp/beeui-ui@0.86.2-rc.1` npm package, exercised through');
  findings.push('`react-test-renderer` (scripts/audit/props/test-driver.tsx) — not source read from `~/workspace/BeeUI`.');
  findings.push('');
  let n = 1;

  findings.push('## Fails (docs promise something the installed package does not do)');
  findings.push('');
  if (fails.length === 0) {
    findings.push('None found by this pass — see "docs too vague to test" and the coverage caveats below for what');
    findings.push('this harness could not rule in or out.');
  } else {
    for (const f of fails) {
      findings.push(`### 08-${String(n).padStart(2, '0')} · ${f.component}.${f.prop}`);
      n += 1;
      findings.push(`- Area: component-behavior`);
      findings.push(`- Severity: major`);
      findings.push(`- Source consulted: ${f.url}`);
      findings.push(`- Docs description: "${(f.docsDescription || '').trim()}"`);
      findings.push(`- Observed: ${f.detail}`);
      findings.push('');
    }
  }

  findings.push('## Docs too vague to test');
  findings.push('');
  findings.push('A documented prop whose description could not be turned into any assertion beyond "renders without');
  findings.push('throwing" — either empty/near-empty, or an identical boilerplate sentence repeated across 5+ unrelated');
  findings.push('components (BeeUI\'s docs-generator template text, not a component-specific behavioral claim).');
  findings.push('');
  const vagueEntries = propEntries.filter((e) => e.tooVague);
  findings.push(`${vagueEntries.length} props (of ${summary.propsModelled} modelled).`);
  findings.push('');
  findings.push('| Component | Prop | Reason | Description |');
  findings.push('|---|---|---|---|');
  for (const e of vagueEntries) {
    const desc = (e.docsDescription || '(empty)').replace(/\|/g, '\\|').slice(0, 90);
    findings.push(`| ${e.component}.${e.typeName} | ${e.prop} | ${e.tooVague} | ${desc} |`);
  }
  findings.push('');

  findings.push('## Corroboration of already-filed findings (#579 required-mismatch, #580 default-undocumented)');
  findings.push('');
  findings.push('Phase 07 (`props-accuracy.json`) found these statically from the .d.ts/docs tables; this pass adds');
  findings.push('*dynamic* evidence — what the installed package actually does at render time — for the same props.');
  findings.push('');
  const priorTagged = propEntries.filter((e) => e.priorFindings.length > 0);
  findings.push('| Component | Prop | Phase 07 classification | Phase 08 dynamic evidence |');
  findings.push('|---|---|---|---|');
  for (const e of priorTagged) {
    for (const pf of e.priorFindings) {
      findings.push(`| ${e.component}.${e.typeName} | ${e.prop} | ${pf.classification} | ${e.detail.replace(/\|/g, '\\|')} |`);
    }
  }
  findings.push('');

  findings.push('## Coverage caveats (renders-only, honestly)');
  findings.push('');
  findings.push('`renders-only` means the harness rendered the prop under test without throwing but found no');
  findings.push('generically-derivable evidence (a `cva` class-set match, a native-prop passthrough, a mounted sentinel,');
  findings.push('a curated accessibility-state check, or a structural difference from the opposite boolean value) that');
  findings.push('the documented effect actually occurred. It is not a claim that the prop is broken — most commonly it');
  findings.push('is a `cva` variant value defined through a shared constant (e.g. `size: semanticTypographyClasses.label`');
  findings.push('in button.tsx) rather than a literal class string the oracle can compare against, or an internal');
  findings.push('positioning/behavior flag (e.g. Popover/Select/Tooltip\'s `direction`/`align`/`collisionPadding`/`flip`/');
  findings.push('`shift`) consumed by internal layout math with no observable prop/class/accessibility reflection under');
  findings.push('`react-test-renderer`.');
  findings.push('');

  await writeFile(path.join(OUT_DIR, 'findings-08-per-prop.md'), findings.join('\n'), 'utf8');

  console.log(`Props modelled: ${summary.propsModelled}`);
  console.log(`Props executed: ${summary.propsExecuted} (${summary.coveragePct}%)`);
  console.log('Per-prop tier totals:', tierTotals);
  console.log('Per-row tier totals:', summary.resultRowTierTotals);
  console.log(`Fails: ${fails.length}. Too vague: ${vagueEntries.length}.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
