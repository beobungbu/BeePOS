// Minimal, regex-based HTML utilities for the Starlight-generated BeeUI docs
// site. No cheerio / DOM dependency per phase-06 constraints.

/** Strip tags/entities down to plain, whitespace-collapsed text. */
export function stripTags(html) {
  let t = html.replace(/<script[\s\S]*?<\/script>/g, ' ');
  t = t.replace(/<style[\s\S]*?<\/style>/g, ' ');
  t = t.replace(/<[^>]+>/g, ' ');
  t = t
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

/**
 * Extract the Starlight main-content region: from the first <h1 down to the
 * Previous/Next pager footer (or end of document if no pager is present).
 */
export function mainContent(html) {
  const startMatch = html.match(/<h1[^>]*>/);
  if (!startMatch) return html;
  const start = startMatch.index;
  const pagerIdx = html.search(/class="pagination-links"|>Next<\/a>|<footer/);
  const end = pagerIdx > start ? pagerIdx : html.length;
  return html.slice(start, end);
}

/** Extract the HTML fragment for a Starlight heading id, up to the next <h2 (or end). */
export function extractSection(html, id, { stopAt = '<h2' } = {}) {
  const re = new RegExp(`id="${id}"[\\s\\S]*?(?=${stopAt}|$)`);
  const m = html.match(re);
  return m ? m[0] : null;
}

/** Text (stripped) for a given heading id's section. */
export function sectionText(html, id, opts) {
  const frag = extractSection(html, id, opts);
  return frag ? stripTags(frag) : null;
}

/** Pull the plain import statement(s) rendered by Expressive Code's copy button. */
export function extractImportLine(html) {
  const importSection = extractSection(html, 'import');
  if (!importSection) return null;
  const m = importSection.match(/data-code="(import[^"]*?)"/);
  if (!m) return null;
  return m[1]
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

/** All href targets inside an HTML fragment. */
export function extractHrefs(html) {
  const out = [];
  const re = /href="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

/** Page <title> text. */
export function extractTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/);
  return m ? m[1].trim() : null;
}
