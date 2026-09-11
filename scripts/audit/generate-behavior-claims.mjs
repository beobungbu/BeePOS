#!/usr/bin/env node
// Phase 07 Worker A / A2: runs the behavior-claim Jest suite
// (scripts/audit/claims/__tests__/*.claims.test.tsx) and combines the real
// pass/fail results with each claim's source doc URL + quoted sentence to
// produce docs/beeui-audit/behavior-claims.{md,json}.
//
// Usage: node scripts/audit/generate-behavior-claims.mjs

import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'docs', 'beeui-audit');
const SITE = 'https://beeui.beemvp.com';
const docUrl = (slug) => `${SITE}/docs/components/${slug}/`;

// Maps each claim-ID prefix to its docs page + the exact "State and behavior
// contract" (or Accessibility) sentence it tests, plus which test file
// executes it. Populated from the live docs pages during this phase (see
// scripts/audit/claims/__tests__/*.claims.test.tsx header comments, which
// carry the same quotes) — kept centrally here (rather than parsed out of
// each file's comments) so the URL/quote pairing is unambiguous and
// reviewable in one place.
const CLAIM_SOURCES = {
  BTN: {
    slug: 'button',
    testFile: 'button.claims.test.tsx',
    quote:
      "Stateless pressable driven entirely by props (variant/size/loading/disabled); disabled or loading both block press handling and mark the accessibility disabled state, and loading swaps in a spinner without changing the button's footprint.",
  },
  CHK: {
    slug: 'checkbox',
    testFile: 'checkbox.claims.test.tsx',
    quote:
      'Controlled boolean/indeterminate checked/onCheckedChange checkbox; enabling it without onCheckedChange warns in development instead of silently doing nothing, and disabled blocks both press handling and the accessibility toggle action.',
  },
  SW: {
    slug: 'switch',
    testFile: 'switch.claims.test.tsx',
    quote:
      'Controlled native Switch (value/onValueChange); enabled usage without onValueChange warns in development instead of silently doing nothing.',
  },
  RG: {
    slug: 'radio',
    testFile: 'radio.claims.test.tsx',
    quote:
      'grouped through RadioGroup (value/onValueChange, fully controlled — there is no uncontrolled mode) radios become mutually exclusive and can no longer deselect. Enabled usage without the matching callback warns in development.',
  },
  RD: {
    slug: 'radio',
    testFile: 'radio.claims.test.tsx',
    quote: 'Standalone Radio supports both selection and deselection through onCheckedChange.',
  },
  CHIP: {
    slug: 'chip',
    testFile: 'chip.claims.test.tsx',
    quote: 'a grouped Chip rendered without a value fails safe as disabled and warns in development',
  },
  CHIPGROUP: {
    slug: 'chip',
    testFile: 'chip.claims.test.tsx',
    quote: 'ChipGroup supports controlled/uncontrolled single- or multiple-selection.',
  },
  SC: {
    slug: 'segmented-control',
    testFile: 'segmented-control.claims.test.tsx',
    quote:
      'Controlled (value/onValueChange) mutually exclusive selection with radiogroup semantics; enabled usage without onValueChange warns in development, and a disabled segment cannot be selected.',
  },
  TABS: {
    slug: 'tabs',
    testFile: 'tabs.claims.test.tsx',
    quote:
      'Fully controlled (value/onValueChange, required — there is no uncontrolled mode) tab state shared across TabsList/TabsTrigger/TabsContent; enabled usage without onValueChange warns in development, and an inactive TabsContent panel is not mounted.',
  },
  PAG: {
    slug: 'pagination',
    testFile: 'pagination.claims.test.tsx',
    quote:
      'Controlled page/onPageChange context shared with every PaginationItem; page boundaries are normalized (out-of-range requests are clamped), and a malformed runtime page item (e.g. a type="page" item with no page number) fails safe as disabled.',
  },
  TBL: {
    slug: 'table',
    testFile: 'table.claims.test.tsx',
    quote:
      "Composable primitive family with no owned fetching, sort/filter/selection state, or spreadsheet-style cell navigation. TableHead's sortDirection/onSortChange pair is fully caller-controlled (the presence of sortDirection is what marks a column sortable); TableRow's selected is a caller-owned boolean reflected only visually/for accessibility.",
  },
  PROG: {
    slug: 'progress',
    testFile: 'progress.claims.test.tsx',
    quote:
      'Stateless clamped determinate progress bar; there is no lower-bound prop — value is clamped between 0 and max, and max itself falls back to 100 when non-finite or <= 0 — and it exposes native progressbar semantics with no indeterminate mode.',
  },
  SK: {
    slug: 'skeleton',
    testFile: 'skeleton.claims.test.tsx',
    quote: 'Stateless decorative static loading placeholder; it is hidden from the accessibility tree and carries no loading-state callbacks.',
  },
  AV: {
    slug: 'avatar',
    testFile: 'avatar.claims.test.tsx',
    quote:
      'Stateless image-with-fallback: an image load failure resets to the fallback, and the reset is keyed to the semantic image source content (not object identity), so re-supplying an already-failed source shows the fallback again immediately.',
  },
  AB: {
    slug: 'alert-banner',
    testFile: 'alert-banner.claims.test.tsx',
    quote:
      'Stateless inline callout with no open/close or controlled prop; it live-announces (Android live-region, iOS AccessibilityInfo) whenever mounted with new content, with an optional explicit announcement override for complex children.',
  },
  IB: {
    slug: 'icon-button',
    testFile: 'icon-button.claims.test.tsx',
    quote:
      "Stateless 44px icon-only pressable sharing Button's disabled/loading semantics; an accessible label (accessibilityLabel) is required because there is no visible text to derive one from.",
  },
  LI: {
    slug: 'list-item',
    testFile: 'list-item.claims.test.tsx',
    quote:
      'Press behavior is opt-in (onPress makes the row interactive); an interactive row without an explicit accessibilityLabel synthesizes one from its primitive title/description/trailing content, while non-interactive rows never hide complex descendant content.',
  },
  TL: {
    slug: 'timeline',
    testFile: 'timeline.claims.test.tsx',
    quote:
      'Stateless read-only ordered history composition; terminal connector placement is derived automatically from the rendered TimelineItem children, and supplied child keys are preserved — it owns no workflow state.',
  },
  BADGE: {
    slug: 'badge',
    testFile: 'badge-card.claims.test.tsx',
    quote: 'Stateless semantic status label; variant selects the paired foreground/background token pair, with no controlled/open state or callbacks.',
  },
  CARD: {
    slug: 'card',
    testFile: 'badge-card.claims.test.tsx',
    quote: 'Stateless elevated/outlined surface driven by a variant and spacing prop; no controlled state or callbacks.',
  },
  BAB: {
    slug: 'bottom-action-bar',
    testFile: 'bottom-action-bar.claims.test.tsx',
    quote:
      'Stateless bottom-anchored action surface with no controlled props; it adds no system-inset padding itself, so the app shell must wrap it with SafeArea or safe-area utilities.',
  },
  FI: {
    slug: 'field',
    testFile: 'field-input.claims.test.tsx',
    quote:
      'Stateless label/description/error composition; it wires accessible label/required/error relationships only to a wrapped text-entry control (Input/Textarea) — never to checkbox/radio/switch, which label themselves explicitly.',
  },
  SI: {
    slug: 'search-input',
    testFile: 'search-input.claims.test.tsx',
    quote:
      "Uncontrolled-by-default search-keyboard field layered on Input; clearing a previously non-empty query emits exactly one onSearch('') reset call, not one per keystroke of the clear action.",
  },
  OTP: {
    slug: 'otp-input',
    testFile: 'otp-input.claims.test.tsx',
    quote:
      "Controlled/uncontrolled one-time-code input; entered text is normalized to digits only when mode is 'numeric' (the default) — mode: 'text' accepts any character unnormalized — and the completion callback fires exactly once per completed value — it does not re-fire on further keystrokes while already complete, only after the value becomes incomplete again.",
  },
};

// Claims deliberately NOT executed as Jest tests in this harness: their
// components route through @gorhom/bottom-sheet / a full anchored-overlay
// portal + focus-trap runtime (Select/Dialog/AlertDialog/Sheet/Popover/
// Tooltip/DropdownMenu) or a Provider-scoped imperative singleton (Toast).
// scripts/audit/claims/jest.setup.js already auto-stubs @gorhom/bottom-sheet
// and react-native-reanimated just so *importing* these components does not
// crash the whole suite (see that file's header comment) — but the stub
// components render inert (no gesture handling, no focus trap, no portal),
// so any assertion about their *actual* open/close/focus/dismiss behavior
// would be testing the stub, not BeeUI. These are left for Worker B's
// Playwright pass (which runs BeeUI web-built output in a real Chromium
// page) per the phase brief's guidance for claims a jsdom/native-mock
// harness cannot faithfully execute.
const UNTESTED_NEEDS_BROWSER = [
  {
    id: 'SEL-01',
    slug: 'select',
    claim: 'A duplicate SelectItem value disables every item sharing it and warns in development.',
    reason: 'Select is built on the anchored-overlay/portal runtime (open/close, focus trap, collision-aware positioning) that this harness stubs out (see jest.setup.js); its real value-collision logic runs inside that portal.',
  },
  {
    id: 'SEL-02',
    slug: 'select',
    claim: 'Removing the selected option does not synthesize a value change — SelectValue falls back to its placeholder until a matching item returns.',
    reason: 'Same overlay-runtime dependency as SEL-01.',
  },
  {
    id: 'DLG-01',
    slug: 'dialog',
    claim: 'Supplying open without onOpenChange warns in development and falls back to dismissable behavior.',
    reason: 'Dialog mounts through the shared overlay runtime (portal + focus trap + Escape/backdrop dismissal) this harness does not provide a real implementation of.',
  },
  {
    id: 'DLG-02',
    slug: 'dialog',
    claim: 'Backdrop press, Web Escape, and Android hardware back all route through one close policy, while dismissOnRequestClose={false}/dismissOnEscape={false} opt individual channels out.',
    reason: 'Requires a real Web DOM (Escape keydown) or native back-handler runtime; not exercisable via react-test-renderer.',
  },
  {
    id: 'ADLG-01',
    slug: 'alert-dialog',
    claim: 'AlertDialog never closes from a backdrop press or an Escape keypress, unlike Dialog; it still closes on a native request-close because cancelOnRequestClose defaults to true.',
    reason: 'Same overlay-runtime dependency as DLG-01/DLG-02.',
  },
  {
    id: 'SHEET-01',
    slug: 'sheet',
    claim: 'Dismissal (backdrop press, swipe, Web Escape, Android hardware back) routes through the same dismissOnRequestClose/onRequestClose contract Dialog uses.',
    reason: 'Sheet is the direct @gorhom/bottom-sheet consumer this harness stubs (see jest.setup.js); real gesture-driven dismissal needs Reanimated worklets running on a real (or full native-simulator) runtime.',
  },
  {
    id: 'TOAST-01',
    slug: 'toast',
    claim: 'Toasts queue FIFO with at most three visible at once.',
    reason: 'useToast() is a provider-scoped imperative singleton whose queue/portal lives outside any single rendered tree; needs a real app-level BeeUIProvider mount, best exercised in a browser.',
  },
  {
    id: 'TOAST-02',
    slug: 'toast',
    claim: 'An explicit persistent mode opts a toast out of auto-dismiss, and action-triggered dismissal is deterministic (never racing the auto-dismiss timer).',
    reason: 'Same provider-singleton/timer dependency as TOAST-01; real timer race behavior is best verified in a browser, not a mocked jsdom/native-mock timer.',
  },
];

function runClaimsSuite() {
  const jestBin = path.join(process.cwd(), 'node_' + 'modules', '.bin', 'jest');
  try {
    execFileSync(
      jestBin,
      ['-c', 'scripts/audit/claims/jest.config.js', '--json', '--outputFile=scripts/audit/claims/.cache/results.json'],
      { stdio: 'inherit' }
    );
  } catch {
    // Jest exits non-zero on any test failure — still read the JSON report.
  }
}

async function main() {
  await mkdir(path.join(process.cwd(), 'scripts', 'audit', 'claims', '.cache'), { recursive: true });
  runClaimsSuite();
  const raw = await readFile(path.join(process.cwd(), 'scripts', 'audit', 'claims', '.cache', 'results.json'), 'utf8');
  const jestResult = JSON.parse(raw);

  const claims = [];
  for (const suite of jestResult.testResults) {
    for (const assertion of suite.assertionResults) {
      const m = assertion.title.match(/^([A-Z]+)-(\d+)(?: \([^)]*\))?:\s*(.+)$/);
      if (!m) continue;
      const [, prefix, num, description] = m;
      const source = CLAIM_SOURCES[prefix];
      claims.push({
        id: `${prefix}-${num}`,
        claim: description,
        sourceUrl: source ? `${docUrl(source.slug)}#state-and-behavior-contract` : 'unknown',
        quote: source ? source.quote : '(no CLAIM_SOURCES entry — see generate-behavior-claims.mjs)',
        testFile: `scripts/audit/claims/__tests__/${source ? source.testFile : path.basename(suite.name)}`,
        result: assertion.status === 'passed' ? 'holds' : 'fails',
        observed: assertion.status === 'passed' ? '' : assertion.failureMessages.join('\n').slice(0, 2000),
      });
    }
  }

  for (const c of UNTESTED_NEEDS_BROWSER) {
    claims.push({
      id: c.id,
      claim: c.claim,
      sourceUrl: `${docUrl(c.slug)}#state-and-behavior-contract`,
      quote: c.claim,
      testFile: null,
      result: 'untested-needs-browser',
      observed: c.reason,
    });
  }

  claims.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const totals = { holds: 0, fails: 0, 'untested-needs-browser': 0, untestable: 0 };
  for (const c of claims) totals[c.result] = (totals[c.result] || 0) + 1;
  const executed = totals.holds + totals.fails;

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    path.join(OUT_DIR, 'behavior-claims.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), totals, executed, totalClaims: claims.length, claims }, null, 2),
    'utf8'
  );

  const md = [];
  md.push('# BeeUI behavior claims: docs "State and behavior contract" sentences vs installed-package reality');
  md.push('');
  md.push('Generated by `node scripts/audit/generate-behavior-claims.mjs`, which runs `scripts/audit/claims/__tests__/*.claims.test.tsx` (Jest + react-test-renderer against the installed `@beemvp/beeui-ui` package) and records real pass/fail per claim.');
  md.push('');
  md.push(`Total claims: ${claims.length}. Executed (holds/fails): ${executed}.`);
  md.push('');
  md.push('## Totals by result');
  md.push('');
  md.push('| Result | Count |');
  md.push('|---|---|');
  for (const [k, v] of Object.entries(totals)) md.push(`| ${k} | ${v} |`);
  md.push('');
  md.push('## Claims');
  md.push('');
  md.push('| ID | Claim | Source | Test file | Result | Observed (if fails/untested) |');
  md.push('|---|---|---|---|---|---|');
  const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  for (const c of claims) {
    md.push(`| ${c.id} | ${esc(c.claim)} | [${c.sourceUrl}](${c.sourceUrl}) | ${c.testFile ? esc(c.testFile) : '(not executed)'} | ${c.result} | ${esc(c.observed)} |`);
  }
  md.push('');
  await writeFile(path.join(OUT_DIR, 'behavior-claims.md'), md.join('\n'), 'utf8');

  console.log(`Wrote ${claims.length} claims (${executed} executed: ${totals.holds} holds / ${totals.fails} fails).`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
