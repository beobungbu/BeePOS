import { PerfHarnessScreen } from '../../../src/features/audit/perf-harness-screen';

// Hidden, unlinked route used only by scripts/qa/e2e/specs/perf.spec.ts (phase 5, W-E): the
// sell screen's product grid over a 1000 product catalogue held in memory by the harness.
// Not reachable from any nav item; see the perf-harness-screen.tsx module docblock.
export default function AuditPerfRoute() {
  return <PerfHarnessScreen />;
}
