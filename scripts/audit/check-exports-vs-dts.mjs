#!/usr/bin/env node
// Compares llms-components.txt's declared exported symbols per component
// module against the installed @beemvp/beeui-ui package's actual
// dist/typescript/module/index.d.ts export surface. Gives step-3 a head
// start on category D ("npm .d.ts" source rows).
//
// Usage: node scripts/audit/check-exports-vs-dts.mjs
// Also importable: `compareExportsToDts(llmsComponentsText)`.

import { fetchCached } from './lib/http.mjs';
import { loadDtsSlugExportMap } from './lib/dts-exports.mjs';
import { parseComponentModules } from './lib/llms-parse.mjs';

const LLMS_COMPONENTS_URL = 'https://beeui.beemvp.com/llms-components.txt';

export async function compareExportsToDts(llmsComponentsText, cwd) {
  const modules = parseComponentModules(llmsComponentsText);
  const { map: dtsMap } = await loadDtsSlugExportMap(cwd);
  const results = [];
  for (const mod of modules) {
    const dtsEntry = dtsMap.get(mod.slug);
    const dtsValueExports = dtsEntry ? [...dtsEntry.valueExports].sort() : null;
    const llmsExports = [...mod.exports].sort();
    let status;
    let note;
    if (!dtsEntry) {
      status = 'llms-only';
      note = `No dist/typescript/module/index.d.ts export statement resolves to slug "${mod.slug}"`;
    } else {
      const missingInDts = llmsExports.filter((e) => !dtsValueExports.includes(e));
      const extraInDts = dtsValueExports.filter((e) => !llmsExports.includes(e));
      if (missingInDts.length === 0 && extraInDts.length === 0) {
        status = 'identical';
        note = '';
      } else {
        status = 'mismatch';
        const parts = [];
        if (missingInDts.length) parts.push(`in llms-components.txt but not exported by .d.ts: ${missingInDts.join(', ')}`);
        if (extraInDts.length) parts.push(`exported by .d.ts but not listed in llms-components.txt: ${extraInDts.join(', ')}`);
        note = parts.join('; ');
      }
    }
    results.push({
      slug: mod.slug,
      line: mod.line,
      llmsExports,
      dtsValueExports,
      dtsTypeExports: dtsEntry ? [...dtsEntry.typeExports].sort() : null,
      status,
      note,
    });
  }
  return results;
}

async function main() {
  const { body } = await fetchCached(LLMS_COMPONENTS_URL);
  const results = await compareExportsToDts(body);
  const counts = { identical: 0, mismatch: 0, 'llms-only': 0 };
  for (const r of results) counts[r.status] = (counts[r.status] || 0) + 1;
  console.log(`Compared ${results.length} component modules: llms-components.txt vs node_modules/@beemvp/beeui-ui .d.ts`);
  console.log(counts);
  const mismatches = results.filter((r) => r.status !== 'identical');
  if (mismatches.length) {
    console.log('\nNon-identical rows:');
    for (const r of mismatches) {
      console.log(`- ${r.slug} [${r.status}]: ${r.note}`);
    }
  } else {
    console.log('\nAll component modules match the installed .d.ts export surface.');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
