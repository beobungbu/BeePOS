import { AuditHarnessScreen } from '../../../src/features/audit/audit-harness-screen';

// Hidden, unlinked route used only by scripts/audit/browser/*.spec.ts (Phase 11 Part B).
// Not reachable from any nav item; see the audit-harness-screen.tsx module docblock.
export default function AuditRoute() {
  return <AuditHarnessScreen />;
}
