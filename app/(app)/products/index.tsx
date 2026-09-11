import { AreaPlaceholder } from '../../../src/components/shell/area-placeholder';
import { useT } from '../../../src/i18n';

export default function ProductsScreen() {
  const t = useT();
  return <AreaPlaceholder title={t('common.nav.products')} description={t('common.nav.products')} />;
}
