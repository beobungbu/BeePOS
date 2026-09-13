import type { ReactNode } from 'react';
import { View } from 'react-native';
import { EmptyState } from '@beemvp/beeui-ui';
import { useCan } from '../../data/session-store';

/**
 * The permission gate on the two unlinked QA harnesses, `/audit` and `/audit/perf`.
 *
 * Neither route is in `nav-items.ts`, so `permissionForPath` costs them at nothing and the
 * route guard lets any signed-in staff member through to a screen that builds a thousand
 * synthetic products and fires dialogs and toasts at them. `audit.view` is the permission the
 * chain already uses for "may look at what the system did" (owner and manager hold it, a
 * cashier does not), which is the same line these screens sit on.
 *
 * The gate wraps the harness rather than living inside it, so a cashier who types the URL
 * never mounts the harness at all: no catalogue is built and no marks are published.
 */
export function AuditGuard({ children }: { children: ReactNode }) {
  const allowed = useCan('audit.view');

  if (!allowed) {
    return (
      <View className="flex-1 justify-center p-6" testID="audit-guard-denied">
        <EmptyState
          title="Khu vực kỹ thuật"
          description="Màn hình kiểm thử này thuộc quyền xem nhật ký hệ thống. Hỏi quản lý nếu bạn cần vào."
        />
      </View>
    );
  }

  return <>{children}</>;
}
