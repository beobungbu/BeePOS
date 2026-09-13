import {
  Field,
  ListGroup,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SettingsItem,
  Text,
} from '@beemvp/beeui-ui';
import { useRouter } from 'expo-router';
import { AUTO_LOCK_OPTIONS } from '../../../domain/auth';
import { useSessionStore } from '../../../data/session-store';
import { useT } from '../../../i18n';

/**
 * How long an idle till stays open, and the way to a new password. Both belong to the person
 * at the counter rather than to the chain, which is why they sit in Settings next to theme and
 * language instead of on an admin screen.
 */
export function SecuritySection() {
  const t = useT();
  const router = useRouter();
  const autoLockMinutes = useSessionStore((state) => state.autoLockMinutes);
  const setAutoLockMinutes = useSessionStore((state) => state.setAutoLockMinutes);

  const label = (minutes: number) =>
    minutes === 0
      ? t('settings.security.autoLockOff')
      : t('settings.security.autoLockMinutes').replace('{count}', String(minutes));

  return (
    <Section title={t('settings.section.security')}>
      <Field label={t('settings.security.autoLock')}>
        <Select
          value={String(autoLockMinutes)}
          onValueChange={(value) => setAutoLockMinutes(Number(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('settings.security.autoLock')} />
          </SelectTrigger>
          <SelectContent>
            {AUTO_LOCK_OPTIONS.map((minutes) => (
              <SelectItem key={minutes} value={String(minutes)}>
                {label(minutes)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Text variant="caption" className="text-muted-foreground">
        {t('settings.security.autoLockDescription')}
      </Text>

      <ListGroup>
        <SettingsItem
          title={t('settings.security.changePassword')}
          onPress={() => router.push('/change-password')}
        />
      </ListGroup>
    </Section>
  );
}
