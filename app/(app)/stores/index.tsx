import { AreaPlaceholder } from '../../../src/components/shell/area-placeholder';
import { useT } from '../../../src/i18n';

export default function StoresScreen() {
  const t = useT();
  return <AreaPlaceholder title={t('common.nav.stores')} description={t('common.nav.stores')} />;
}
