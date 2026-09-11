// Parses the "Props" section of a BeeUI Starlight component doc page into
// structured { typeName, headingId, rows: [{name,type,default,description}],
// inheritsFrom: 'RawExprText' | null } blocks, one per <h4> Props-table
// subsection. Regex-based (no DOM dep), matching the site's fixed Starlight
// table markup (see scripts/audit/lib/html.mjs for the sibling convention).
import { extractSection } from './html.mjs';

function decodeEntities(s) {
  return s
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function stripInnerTags(s) {
  return decodeEntities(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

/** Extract the raw HTML for the whole "Props" h3 section (all h4 subsections + tables). */
function propsSectionHtml(pageHtml) {
  return extractSection(pageHtml, 'props', { stopAt: '<h2|<h3' });
}

/**
 * Parse a props-section HTML fragment's rows for one <table>...</table> block.
 * Returns [{name, type, default, description}].
 */
function parseTableRows(tableHtml) {
  const rows = [];
  const rowRe = /<tr>([\s\S]*?)<\/tr>/g;
  let m;
  let first = true;
  while ((m = rowRe.exec(tableHtml))) {
    if (first) {
      first = false;
      continue; // header row
    }
    const cellRe = /<td>([\s\S]*?)<\/td>/g;
    const cells = [];
    let cm;
    while ((cm = cellRe.exec(m[1]))) cells.push(stripInnerTags(cm[1]));
    if (cells.length < 4) continue;
    const [rawName, type, def, description] = cells;
    // BeeUI's docs convention marks a required prop by appending
    // " (required)" to the Prop-column name itself (there is no separate
    // Required column) — e.g. "open (required)", "onOpenChange (required)".
    const requiredMatch = rawName.match(/^(.*?)\s*\(required\)$/);
    const name = requiredMatch ? requiredMatch[1] : rawName;
    rows.push({
      name,
      type,
      default: def === '—' || def === '-' ? null : def,
      description,
      requiredPerDocs: !!requiredMatch,
    });
  }
  return rows;
}

/**
 * Parse every Props subsection on a component doc page.
 * Returns an array of:
 *   { typeName, headingId, rows: [...], inheritsRaw: string|null }
 * inheritsRaw is the raw (decoded, un-stripped-of-Omit) expression text from
 * "Also carries every prop of `<expr>`" — e.g. "Omit<PressableProps, 'role'>".
 */
export function parsePropsSections(pageHtml) {
  const section = propsSectionHtml(pageHtml);
  if (!section) return [];
  const blocks = section.split(/<div class="sl-heading-wrapper level-h4">/).slice(1);
  const out = [];
  for (const block of blocks) {
    const idMatch = block.match(/<h4 id="([^"]+)">/);
    const nameMatch = block.match(/<h4[^>]*><code[^>]*>([^<]+)<\/code>/);
    const headingId = idMatch ? idMatch[1] : null;
    const typeName = nameMatch ? decodeEntities(nameMatch[1]) : headingId;
    const tableMatch = block.match(/<table[^>]*>[\s\S]*?<\/table>/);
    const rows = tableMatch ? parseTableRows(tableMatch[0]) : [];
    const inheritsMatch = block.match(/Also carries every prop of\s*(?:<[^>]+>)*\s*<code[^>]*>([^<]+)<\/code>/);
    const inheritsRaw = inheritsMatch ? decodeEntities(inheritsMatch[1]) : null;
    out.push({ typeName, headingId, rows, inheritsRaw });
  }
  return out;
}
