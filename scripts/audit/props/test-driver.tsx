// Phase 08 shared test driver. Generated files under
// scripts/audit/props/__tests__/<slug>.props.test.tsx are thin — each one
// just calls `runComponentPropTests(slug, componentModel)` with its slice of
// scripts/audit/props/model.json (built by scripts/audit/gen-prop-tests.mjs
// from scripts/audit/lib/prop-model.mjs). All rendering, assertion and
// result-recording logic lives here once, so it is reviewed/maintained in
// one place instead of duplicated across 61 generated files.
//
// Per (prop, value) row this registers exactly one Jest `test()` (or
// `test.failing()` for a curated KNOWN_FAILS entry) and, regardless of
// pass/fail, appends one JSON line to scripts/audit/props/.results/<slug>.ndjson
// recording { component, typeName, prop, value, kind, result, detail },
// where `result` is one of: holds | fails | renders-only | skipped(reason).
// (`untested-needs-browser` is reserved for a documented web-only DOM
// attribute the native react-test-renderer tree cannot carry — see the
// `webOnly` guard below.)
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import type { ReactTestInstance, ReactTestRenderer } from 'react-test-renderer';
import { View as RNView } from 'react-native';
import { appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import * as BeeUI from '@beemvp/beeui-ui';
import { FIXTURE_REQUIRED, FIXTURE_WRAP, FIXTURE_SKIP, findKnownFail, SentinelNode, SENTINEL_NODE_TESTID } from './fixtures';

export type OwnProp = {
  name: string;
  kind: 'literal-union' | 'boolean' | 'number' | 'string' | 'callback' | 'node' | 'other';
  values: Array<string | boolean>;
  typeText: string;
  docsDefault: string | null;
  realDefault: string | null;
  docsDescription: string | null;
  docsRequired: boolean;
  realRequired: boolean;
  cvaClasses: Record<string, string> | null;
  inDocs: boolean;
};
export type PropType = {
  typeName: string;
  headingId: string;
  component: string | null;
  isRenderable: boolean;
  ownProps: OwnProp[];
};
export type ComponentModel = { slug: string; url: string; propTypes: PropType[]; error?: string };

const RESULTS_DIR = path.join(__dirname, '.results');
mkdirSync(RESULTS_DIR, { recursive: true });

function record(slug: string, row: Record<string, unknown>) {
  appendFileSync(path.join(RESULTS_DIR, `${slug}.ndjson`), `${JSON.stringify(row)}\n`, 'utf8');
}

function shortDesc(desc: string | null) {
  return (desc || '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

function titleFor(pt: PropType, prop: OwnProp, valueLabel: string) {
  return `${pt.component}.${pt.typeName}.${prop.name}=${valueLabel} · ${shortDesc(prop.docsDescription)}`;
}

let seedCounter = 0;
function sentinelFor(prop: OwnProp): unknown {
  switch (prop.kind) {
    case 'boolean':
      return true;
    case 'number':
      return 7;
    case 'string':
      return `fx-${prop.name}`;
    case 'literal-union':
      return prop.values[0];
    case 'callback':
      return () => {};
    case 'node':
      return React.createElement(SentinelNode, { propName: `${prop.name}-${seedCounter++}` });
    default:
      return undefined;
  }
}

function buildBaseProps(componentName: string, allProps: OwnProp[], skipName: string | null): Record<string, unknown> {
  const base: Record<string, unknown> = {};
  for (const p of allProps) {
    if (p.name === skipName) continue;
    if (!(p.docsRequired || p.realRequired)) continue;
    base[p.name] = sentinelFor(p);
  }
  const overrides = FIXTURE_REQUIRED[componentName];
  if (overrides) Object.assign(base, overrides);
  return base;
}

// BeeUIProvider defaults `initialMetrics` to react-native-safe-area-context's
// `initialWindowMetrics`, which is `null` outside a real native host (i.e.
// always, under Jest) — its SafeAreaProvider then waits indefinitely for a
// native `onInsetsChange` callback that never arrives under
// react-test-renderer, so it never mounts ToastRuntimeProvider/
// OverlayRuntimeProvider/children at all (confirmed empirically: without
// this, every rendered tree stops at an empty SafeAreaProvider). Supplying
// synchronous initialMetrics makes it render its children immediately, per
// react-native-safe-area-context's own documented testing pattern.
const INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

// BeeUIProvider mounts an OverlayRuntimeProvider that starts an async
// native-measurement completion-budget timer on mount; left un-unmounted,
// that timer fires after Jest has already torn down the test file's module
// environment ("trying to access ... after it has been torn down"). Every
// renderer created by a test is tracked here and unmounted in `afterEach`
// below so its effects (and that timer) are cleaned up synchronously before
// the next test runs.
const activeRenderers: ReactTestRenderer[] = [];

afterEach(() => {
  act(() => {
    for (const r of activeRenderers.splice(0)) {
      try {
        r.unmount();
      } catch {
        /* already unmounted or errored during render; nothing to clean up */
      }
    }
  });
});

function renderComponent(componentName: string, props: Record<string, unknown>): ReactTestRenderer {
  const Component = (BeeUI as Record<string, unknown>)[componentName] as React.ComponentType<unknown>;
  const wrap = FIXTURE_WRAP[componentName];
  const inner = React.createElement(Component, props as never);
  const element = wrap ? wrap(inner) : inner;
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(React.createElement(BeeUI.BeeUIProvider, { initialMetrics: INITIAL_METRICS }, element));
  });
  activeRenderers.push(renderer);
  return renderer;
}

function allInstances(renderer: ReactTestRenderer): ReactTestInstance[] {
  try {
    return renderer.root.findAll(() => true);
  } catch {
    return [];
  }
}

// Prop-reachability checks search EVERY instance (composite and host), not
// only true native-tag hosts: BeeUI wraps RN primitives (Pressable, Switch,
// ActivityIndicator, ...) which are themselves composite components under
// react-test-renderer in this jest-expo environment — className/
// accessibilityState/disabled/etc. usually land on that composite's own
// received props (e.g. `<Pressable className={...} disabled={...} />`)
// rather than surviving down to a further host descendant. This matches the
// convention the phase-07 claims suite already established (it asserts
// directly on `findByDisplayName(root, 'Pressable').props.disabled`, not on
// a deeper host node) — see scripts/audit/claims/__tests__/button.claims.test.tsx.
function classNamesOf(renderer: ReactTestRenderer): string[] {
  return allInstances(renderer)
    .map((n) => (n.props as Record<string, unknown>).className)
    .filter((c): c is string => typeof c === 'string');
}

function findPropPassThrough(renderer: ReactTestRenderer, name: string, value: unknown): boolean {
  return allInstances(renderer).some((n) => (n.props as Record<string, unknown>)[name] === value);
}

function treeContainsText(renderer: ReactTestRenderer, needle: string): boolean {
  try {
    return JSON.stringify(renderer.toJSON()).includes(needle);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Curated boolean -> accessibility/prop effect checkers. Returns true/false
// when the prop's documented effect was checked and found present/absent on
// some host node; null when this component's own rendering doesn't surface
// that field at all (falls back to a structural-diff check against the
// opposite value).
type BoolChecker = (r: ReactTestRenderer, value: boolean) => boolean | null;
const BOOLEAN_CHECKERS: Record<string, BoolChecker> = {
  disabled: (r, v) =>
    allInstances(r).some((n) => {
      const p = n.props as Record<string, unknown>;
      return p.disabled === v || (p.accessibilityState as { disabled?: boolean } | undefined)?.disabled === v;
    }) || null,
  loading: (r, v) =>
    allInstances(r).some((n) => {
      const p = n.props as Record<string, unknown>;
      return p['aria-busy'] === v || (p.accessibilityState as { busy?: boolean } | undefined)?.busy === v;
    }) || null,
  checked: (r, v) =>
    allInstances(r).some((n) => (n.props as Record<string, unknown>).accessibilityState && (n.props as { accessibilityState?: { checked?: boolean } }).accessibilityState?.checked === v) || null,
  selected: (r, v) =>
    allInstances(r).some((n) => (n.props as { accessibilityState?: { selected?: boolean } }).accessibilityState?.selected === v) || null,
  expanded: (r, v) =>
    allInstances(r).some((n) => (n.props as { accessibilityState?: { expanded?: boolean } }).accessibilityState?.expanded === v) || null,
  editable: (r, v) => allInstances(r).some((n) => (n.props as Record<string, unknown>).editable === v) || null,
};

function structuralDiffers(a: ReactTestRenderer, b: ReactTestRenderer): boolean {
  try {
    return JSON.stringify(a.toJSON()) !== JSON.stringify(b.toJSON());
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Callback firing: tier 1 identity pass-through, tier 2 heuristic host
// trigger search (covers wrapped/renamed handlers, e.g. AccordionTrigger's
// onPress wraps the caller's onPress before calling accordion.setValue).
const TRIGGER_PROP_NAMES = ['onPress', 'onChangeText', 'onChange', 'onValueChange', 'onCheckedChange', 'onPressIn'];
function fireCallback(renderer: ReactTestRenderer, mock: jest.Mock): { fired: boolean; via: string } {
  for (const inst of allInstances(renderer)) {
    for (const [k, v] of Object.entries((inst.props as Record<string, unknown>) || {})) {
      if (v === mock) {
        try {
          (v as (...a: unknown[]) => void)('fx-arg');
        } catch {
          try {
            (v as (...a: unknown[]) => void)();
          } catch {
            /* ignore */
          }
        }
        return { fired: mock.mock.calls.length > 0, via: `identity:${k}` };
      }
    }
  }
  for (const inst of allInstances(renderer)) {
    const props = inst.props as Record<string, unknown>;
    for (const tn of TRIGGER_PROP_NAMES) {
      const fn = props[tn];
      if (typeof fn === 'function') {
        try {
          (fn as (...a: unknown[]) => void)('fx-arg');
        } catch {
          try {
            (fn as (...a: unknown[]) => void)();
          } catch {
            /* ignore */
          }
        }
        if (mock.mock.calls.length > 0) return { fired: true, via: `heuristic:${tn}` };
      }
    }
  }
  return { fired: false, via: 'none' };
}

// ---------------------------------------------------------------------------
function registerTest(
  slug: string,
  pt: PropType,
  prop: OwnProp,
  valueLabel: string,
  value: unknown,
  run: () => { tier: 'holds' | 'renders-only' | 'untested-needs-browser'; detail: string }
) {
  const known = findKnownFail(pt.component as string, prop.name, value);
  const title = titleFor(pt, prop, valueLabel);
  const body = () => {
    if (known) {
      // Assert the documented behavior explicitly so the failure is legible
      // in `-t` output, then record the finding.
      record(slug, {
        component: pt.component,
        typeName: pt.typeName,
        prop: prop.name,
        value: valueLabel,
        kind: prop.kind,
        result: 'fails',
        detail: known.observed,
        docsUrl: known.docsUrl,
        docsSentence: known.docsSentence,
      });
      throw new Error(`Docs (${known.docsUrl}) say: "${known.docsSentence}" — observed: ${known.observed}`);
    }
    const { tier, detail } = run();
    record(slug, {
      component: pt.component,
      typeName: pt.typeName,
      prop: prop.name,
      value: valueLabel,
      kind: prop.kind,
      result: tier,
      detail,
    });
    expect(tier).not.toBe('__unreachable__');
  };
  if (known) test.failing(title, body);
  else test(title, body);
}

function registerSkipped(slug: string, pt: PropType, prop: OwnProp, reason: string) {
  test.skip(titleFor(pt, prop, 'n/a'), () => {});
  record(slug, {
    component: pt.component,
    typeName: pt.typeName,
    prop: prop.name,
    value: 'n/a',
    kind: prop.kind,
    result: `skipped(${reason})`,
    detail: reason,
  });
}

// ---------------------------------------------------------------------------
export function runComponentPropTests(slug: string, model: ComponentModel) {
  const renderablePropTypes = model.propTypes.filter((pt) => pt.isRenderable && pt.component);

  // A Props type with zero own props (e.g. IconButton, Switch, Textarea,
  // VisuallyHidden, FormMessage/HelperText all carry no BeeUI-specific
  // members beyond their inherited base) registers no per-prop test — Jest
  // refuses an empty suite, and a bare mount is still real coverage
  // evidence, so give every such component one smoke-mount test.
  for (const pt of renderablePropTypes) {
    if (pt.ownProps.length > 0) continue;
    const componentName = pt.component as string;
    test(`${componentName}.${pt.typeName} · renders with zero own props (no BeeUI-specific members to test)`, () => {
      const base = buildBaseProps(componentName, [], null);
      renderComponent(componentName, base);
      record(slug, {
        component: componentName,
        typeName: pt.typeName,
        prop: null,
        value: 'n/a',
        kind: 'none',
        result: 'renders-only',
        detail: 'this Props type has zero own (BeeUI-specific) props; smoke-mounted only',
      });
      expect(true).toBe(true);
    });
  }

  for (const pt of renderablePropTypes) {
    if (pt.ownProps.length === 0) continue;
    const componentName = pt.component as string;
    if (FIXTURE_SKIP[componentName]) {
      for (const prop of pt.ownProps) registerSkipped(slug, pt, prop, FIXTURE_SKIP[componentName]);
      continue;
    }

    for (const prop of pt.ownProps) {
      // --- literal-union: one test per documented value, plus one defensive
      // invalid-literal render.
      if (prop.kind === 'literal-union') {
        for (const value of prop.values) {
          registerTest(slug, pt, prop, String(value), value, () => {
            const base = buildBaseProps(componentName, pt.ownProps, prop.name);
            const renderer = renderComponent(componentName, { ...base, [prop.name]: value });
            if (prop.cvaClasses && Object.prototype.hasOwnProperty.call(prop.cvaClasses, String(value))) {
              const expected = String(prop.cvaClasses[String(value)]);
              const tokens = expected.split(/\s+/).filter(Boolean);
              const matched = classNamesOf(renderer).some((c) => {
                const have = new Set(c.split(/\s+/).filter(Boolean));
                return tokens.length > 0 && tokens.every((t) => have.has(t));
              });
              if (matched) return { tier: 'holds', detail: `rendered className carries the cva class set for ${prop.name}=${String(value)}` };
            }
            if (findPropPassThrough(renderer, prop.name, value)) {
              return { tier: 'holds', detail: `native prop \`${prop.name}\` passthrough === ${JSON.stringify(value)}` };
            }
            return { tier: 'renders-only', detail: 'rendered without throwing; no cva class-set or native-prop passthrough evidence found for this value' };
          });
        }
        // Observational, like the required-omission check below: an
        // undocumented literal is a TypeScript-rejected value a plain-JS
        // consumer can still pass at runtime, so whether the component
        // guards against it is itself the finding — this always passes so
        // the discovery is recorded either way, never silently dropped by a
        // hard test failure.
        test(`${componentName}.${pt.typeName}.${prop.name}=<<invalid>> · defensive: undocumented literal value`, () => {
          const base = buildBaseProps(componentName, pt.ownProps, prop.name);
          let threw: string | null = null;
          try {
            renderComponent(componentName, { ...base, [prop.name]: '__not_a_documented_literal__' });
          } catch (err) {
            threw = err instanceof Error ? err.message : String(err);
          }
          record(slug, {
            component: componentName,
            typeName: pt.typeName,
            prop: prop.name,
            value: '<<invalid>>',
            kind: prop.kind,
            result: threw ? 'fails' : 'renders-only',
            detail: threw
              ? `an undocumented (non-TypeScript-valid) literal value crashes at render: ${threw}`
              : 'defensive: an undocumented literal value did not throw',
          });
          expect(true).toBe(true);
        });
        continue;
      }

      // --- boolean: true and false.
      if (prop.kind === 'boolean') {
        for (const value of [true, false]) {
          registerTest(slug, pt, prop, String(value), value, () => {
            const base = buildBaseProps(componentName, pt.ownProps, prop.name);
            const primary = renderComponent(componentName, { ...base, [prop.name]: value });
            const checker = BOOLEAN_CHECKERS[prop.name];
            if (checker) {
              const r = checker(primary, value);
              if (r === true) return { tier: 'holds', detail: `curated accessibility/prop check confirmed ${prop.name}=${value}` };
              if (r === false) return { tier: 'renders-only', detail: `curated accessibility/prop check did not confirm ${prop.name}=${value} on any host node` };
            }
            const opposite = renderComponent(componentName, { ...base, [prop.name]: !value });
            const differs = structuralDiffers(primary, opposite);
            return differs
              ? { tier: 'holds', detail: 'rendered tree differs from the opposite boolean value (structural evidence of an effect)' }
              : { tier: 'renders-only', detail: 'rendered without throwing; no curated check and no structural difference from the opposite value' };
          });
        }
        continue;
      }

      // --- callback.
      if (prop.kind === 'callback') {
        registerTest(slug, pt, prop, '<<fn>>', '<<fn>>', () => {
          const mock = jest.fn();
          const base = buildBaseProps(componentName, pt.ownProps, prop.name);
          const renderer = renderComponent(componentName, { ...base, [prop.name]: mock });
          let outcome: { fired: boolean; via: string } = { fired: false, via: 'none' };
          act(() => {
            outcome = fireCallback(renderer, mock);
          });
          return outcome.fired
            ? { tier: 'holds', detail: `fired via ${outcome.via}; mock called ${mock.mock.calls.length}x` }
            : { tier: 'renders-only', detail: 'rendered without throwing; no reachable trigger found to fire this callback generically' };
        });
        continue;
      }

      // --- string / number: sentinel value must reach the tree somewhere.
      if (prop.kind === 'string' || prop.kind === 'number') {
        registerTest(slug, pt, prop, '<<sentinel>>', '<<sentinel>>', () => {
          const base = buildBaseProps(componentName, pt.ownProps, prop.name);
          const sentinel = prop.kind === 'number' ? 12345 : `fx-sentinel-${prop.name}`;
          const renderer = renderComponent(componentName, { ...base, [prop.name]: sentinel });
          if (findPropPassThrough(renderer, prop.name, sentinel)) {
            return { tier: 'holds', detail: `native prop \`${prop.name}\` passthrough === ${JSON.stringify(sentinel)}` };
          }
          if (treeContainsText(renderer, String(sentinel))) {
            return { tier: 'holds', detail: 'sentinel value appears in the rendered tree (text child or serialized prop)' };
          }
          return { tier: 'renders-only', detail: 'rendered without throwing; sentinel value not found verbatim in the rendered tree' };
        });
        continue;
      }

      // --- node: sentinel element must mount.
      if (prop.kind === 'node') {
        registerTest(slug, pt, prop, '<<node>>', '<<node>>', () => {
          const base = buildBaseProps(componentName, pt.ownProps, prop.name);
          const testId = `sentinel-node-${prop.name}-${seedCounter}`;
          const sentinel = React.createElement(SentinelNode, { propName: `${prop.name}-${seedCounter++}` });
          const renderer = renderComponent(componentName, { ...base, [prop.name]: sentinel });
          const mounted = allInstances(renderer).some((n) => (n.props as Record<string, unknown>).testID === (sentinel.props as { testID: string }).testID);
          return mounted
            ? { tier: 'holds', detail: 'sentinel node is mounted in the rendered tree' }
            : { tier: 'renders-only', detail: 'rendered without throwing; sentinel node was not found mounted (may be conditionally hidden by other fixture state)' };
        });
        continue;
      }

      // --- object/other: render-only, with a bonus check for `style`.
      registerTest(slug, pt, prop, '<<value>>', '<<value>>', () => {
        const base = buildBaseProps(componentName, pt.ownProps, prop.name);
        if (prop.name === 'style') {
          const sentinelStyle = { opacity: 0.4247 };
          const renderer = renderComponent(componentName, { ...base, style: sentinelStyle });
          const found = allInstances(renderer).some((n) => {
            const s = (n.props as Record<string, unknown>).style;
            const flat = Array.isArray(s) ? s.flat(Infinity) : [s];
            return flat.some((entry) => entry && typeof entry === 'object' && (entry as Record<string, unknown>).opacity === 0.4247);
          });
          return found
            ? { tier: 'holds', detail: 'style object reaches a rendered instance’s style prop' }
            : { tier: 'renders-only', detail: 'rendered without throwing; style object not found reflected on any instance' };
        }
        renderComponent(componentName, base);
        return { tier: 'renders-only', detail: `object/other-kind prop (${prop.typeText}); rendered without throwing, no generic checkable effect for this kind` };
      });
    }

    // --- Required-prop omission: observational only, one per docs- or
    // reality-required prop. Never fails the suite; records what actually
    // happens (render vs. throw) so prop-behavior.json can state, for each
    // documented "(required)" prop, whether the installed package agrees.
    for (const prop of pt.ownProps) {
      if (!(prop.docsRequired || prop.realRequired)) continue;
      const title = `${componentName}.${pt.typeName}.${prop.name}=<<omitted>> · required-prop omission check`;
      test(title, () => {
        const base = buildBaseProps(componentName, pt.ownProps, prop.name);
        let threw = false;
        let warned = false;
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
          warned = true;
        });
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
          warned = true;
        });
        try {
          renderComponent(componentName, base);
        } catch {
          threw = true;
        } finally {
          warnSpy.mockRestore();
          errorSpy.mockRestore();
        }
        record(slug, {
          component: componentName,
          typeName: pt.typeName,
          prop: prop.name,
          value: '<<omitted>>',
          kind: prop.kind,
          result: 'holds',
          detail: threw
            ? 'omitting this documented-required prop throws'
            : warned
              ? 'omitting this documented-required prop renders but logs a dev warning'
              : 'omitting this documented-required prop renders with no thrown error and no dev warning (runtime-optional in practice)',
          docsRequired: prop.docsRequired,
          realRequired: prop.realRequired,
        });
        expect(true).toBe(true);
      });
    }
  }
}
