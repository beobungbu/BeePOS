import { AreaPlaceholder } from '../../../src/components/shell/area-placeholder';
import { useT } from '../../../src/i18n';

export default function StaffScreen() {
  const t = useT();
  return <AreaPlaceholder title={t('common.nav.staff')} description={t('common.nav.staff')} />;
}
