import { AreaPlaceholder } from '../../../src/components/shell/area-placeholder';
import { useT } from '../../../src/i18n';

export default function OrdersScreen() {
  const t = useT();
  return <AreaPlaceholder title={t('common.nav.orders')} description={t('common.nav.orders')} />;
}
