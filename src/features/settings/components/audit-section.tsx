import { ListGroup, Section, SettingsItem } from '@beemvp/beeui-ui';
import { useRouter } from 'expo-router';
import { useCan } from '../../../data/session-store';
import { useT } from '../../../i18n';

/**
 * The way into `/settings/audit` from Settings. Hidden rather than disabled for a role without
 * `audit.view`: the route guard would bounce them anyway, and a permanently greyed row is a
 * door that only advertises what someone else may do.
 */
export function AuditSection() {
  const t = useT();
  const router = useRouter();
  const canView = useCan('audit.view');

  if (!canView) return null;

  return (
    <Section title={t('chain.audit.title')}>
      <ListGroup>
        <SettingsItem
          title={t('chain.audit.open')}
          onPress={() => router.push('/settings/audit')}
        />
      </ListGroup>
    </Section>
  );
}
