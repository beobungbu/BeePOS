import { AreaPlaceholder } from '../../../src/components/shell/area-placeholder';
import { useT } from '../../../src/i18n';

export default function PosScreen() {
  const t = useT();
  return <AreaPlaceholder title={t('common.nav.pos')} description={t('common.nav.pos')} />;
}
