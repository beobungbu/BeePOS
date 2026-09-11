// Parsers for the four BeeUI llms*.txt agent-context files.

/** 1-based line number of the first match of `needle` (string or RegExp) in `text`. */
export function lineOf(text, needle) {
  const idx = typeof needle === 'string' ? text.indexOf(needle) : text.search(needle);
  if (idx === -1) return null;
  return text.slice(0, idx).split('\n').length;
}

/** Extract every markdown link `[text](target)` with its 1-based line number. */
export function extractMdLinks(text, fileLabel) {
  const lines = text.split('\n');
  const out = [];
  lines.forEach((line, i) => {
    const re = /\[([^\]]+)\]\(([^)]+)\)/g;
    let m;
    while ((m = re.exec(line))) {
      out.push({ text: m[1], target: m[2], file: fileLabel, line: i + 1 });
    }
  });
  return out;
}

/** Parse the "## Public component modules (62)" list from llms-components.txt. */
export function parseComponentModules(text) {
  const lines = text.split('\n');
  const out = [];
  lines.forEach((line, i) => {
    const m = line.match(
      /^- `([a-z0-9-]+)` → exports: ([^—]+) — source: \[([^\]]+)\]\(([^)]+)\) — notable peers: (.+)$/
    );
    if (!m) return;
    out.push({
      slug: m[1],
      exports: m[2].trim().split(/,\s*/).filter(Boolean),
      sourceLabel: m[3],
      sourcePath: m[4],
      peers: m[5].trim().split(/,\s*/).filter(Boolean),
      line: i + 1,
    });
  });
  return out;
}

/** Parse the "## Pattern packs (37 screens total)" bullet list from llms-patterns.txt. */
export function parsePatternPacks(text) {
  const lines = text.split('\n');
  const out = [];
  lines.forEach((line, i) => {
    const m = line.match(/^- (.+?): (\d+) screens?$/);
    if (!m) return;
    out.push({ pack: m[1].trim(), count: Number(m[2]), line: i + 1 });
  });
  return out;
}

/** Parse "## Architecture decision records" bullet list from llms-full.txt. */
export function parseAdrList(text) {
  const lines = text.split('\n');
  const out = [];
  lines.forEach((line, i) => {
    const m = line.match(/^- \[ADR-(\d+) ([a-z0-9-]+)\]\(([^)]+)\): (.+)$/);
    if (!m) return;
    out.push({
      number: m[1],
      slug: m[2],
      path: m[3],
      description: m[4].trim(),
      line: i + 1,
    });
  });
  return out;
}

/** Parse the "## Architecture invariants (do not violate)" bullets from llms-full.txt. */
export function parseBulletSection(text, headingLine) {
  const lines = text.split('\n');
  const headingIdx = lines.findIndex((l) => l.trim() === headingLine);
  if (headingIdx === -1) return [];
  const out = [];
  for (let i = headingIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s/.test(line)) break;
    const m = line.match(/^- (.+)$/);
    if (m) out.push({ text: m[1].trim(), line: i + 1 });
  }
  return out;
}
