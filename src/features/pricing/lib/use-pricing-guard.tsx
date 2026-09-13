import type { ReactElement } from 'react';
import { View } from 'react-native';
import { EmptyState } from '@beemvp/beeui-ui';
import { can } from '../../../domain/auth';
import { useSessionStore } from '../../../data/session-store';
import { useT } from '../../../i18n';

/**
 * Pricing is a `catalog.manage` screen, and it guards itself.
 *
 * The route guard in `app/(app)/_layout.tsx` reads the permission off the nav list, which is
 * owned by another worker and does not carry `/pricing` yet. A screen that priced a chain's
 * whole catalogue for a cashier who happened to type the URL would be a real hole, so the
 * check lives here as well; it stays correct once the nav entry lands.
 *
 * Returns the refusal to render, or `undefined` when the member may proceed.
 */
export function usePricingGuard(): ReactElement | undefined {
  const t = useT();
  const role = useSessionStore((state) => state.staff?.role);
  if (can(role, 'catalog.manage')) return undefined;

  return (
    <View className="flex-1 items-center justify-center p-6">
      <EmptyState title={t('pricing.title')} description={t('pricing.noPermission')} />
    </View>
  );
}
