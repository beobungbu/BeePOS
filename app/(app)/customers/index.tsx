import { AreaPlaceholder } from '../../../src/components/shell/area-placeholder';
import { useT } from '../../../src/i18n';

export default function CustomersScreen() {
  const t = useT();
  return <AreaPlaceholder title={t('common.nav.customers')} description={t('common.nav.customers')} />;
}
