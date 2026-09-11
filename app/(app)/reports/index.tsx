import { AreaPlaceholder } from '../../../src/components/shell/area-placeholder';
import { useT } from '../../../src/i18n';

export default function ReportsScreen() {
  const t = useT();
  return <AreaPlaceholder title={t('common.nav.reports')} description={t('common.nav.reports')} />;
}
