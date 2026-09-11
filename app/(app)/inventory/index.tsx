import { AreaPlaceholder } from '../../../src/components/shell/area-placeholder';
import { useT } from '../../../src/i18n';

export default function InventoryScreen() {
  const t = useT();
  return <AreaPlaceholder title={t('common.nav.inventory')} description={t('common.nav.inventory')} />;
}
