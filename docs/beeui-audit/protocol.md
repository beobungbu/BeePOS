# BeeUI audit protocol (for every BeePOS worker)

BeePOS is also a field test of BeeUI. You are acting as an **outside developer**. Rules:

1. **Only use public sources**: https://beeui.beemvp.com (docs site), `https://beeui.beemvp.com/llms.txt`, `llms-full.txt`, `llms-components.txt`, `llms-patterns.txt`, and the npm packages `@beemvp/beeui-*@0.86.2-rc.1`. Do NOT read `~/workspace/BeeUI` source to "figure it out" until you have logged the finding; if you must peek, log that the public docs were insufficient (that is itself a finding, area `docs-public` or `llms`).
2. **Log every friction point** in your phase file `docs/beeui-audit/findings-<phase>.md`, one entry per finding, using the template below. Log even small things (typo, missing prop in docs, confusing wording, type that does not match docs, warning in console, style that does not apply on web, a11y gap).
3. **Prefer BeeUI primitives** over hand-rolled Views. If BeeUI lacks something you need, log a `gap` finding and build a local composite in `src/components`.
4. **Never patch node_modules.** Work around in app code and log it.
5. Evidence beats opinion: include the exact error text, the doc URL, the component and prop, and a minimal repro.

## Finding template
```
### <PHASE>-<NN> · <short title>
- Area: docs-public | llms | api-types | component-behavior | web-runtime | native-runtime | dx-install | a11y | gap
- Severity: blocker | major | minor | nit
- Source consulted: <URL or file>
- Expected (per docs): ...
- Actual: ...
- Repro: <steps or code, 3 lines max>
- Workaround: ...
- Suggested fix for BeeUI: ...
```

## Severity guide
- blocker: cannot proceed without reading BeeUI source or patching packages.
- major: wrong/missing docs or behavior that costs > 30 min or produces a visible defect.
- minor: costs < 30 min, cosmetic, or has an obvious workaround.
- nit: wording, typo, formatting.
