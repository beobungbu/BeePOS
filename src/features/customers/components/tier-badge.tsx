import { Badge } from '@beemvp/beeui-ui';
import type { CustomerTier } from '../../../domain/types';
import { useT } from '../../../i18n';

const VARIANT_BY_TIER: Record<CustomerTier, 'outline' | 'secondary' | 'warning' | 'info'> = {
  bronze: 'outline',
  silver: 'secondary',
  gold: 'warning',
  platinum: 'info',
};

export function TierBadge({ tier }: { tier: CustomerTier }) {
  const t = useT();
  return <Badge variant={VARIANT_BY_TIER[tier]}>{t(`customers.tier.${tier}`)}</Badge>;
}
