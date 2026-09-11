import { useRouter } from 'expo-router';
import { AlertBanner, Button, ButtonLabel } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';

/** Persistent warning shown on /pos while no shift is open; selling remains allowed. */
export function NoShiftBanner() {
  const t = useT();
  const router = useRouter();

  return (
    <AlertBanner
      variant="warning"
      title={t('pos.shiftBanner.title')}
      description={t('pos.shiftBanner.description')}
      action={
        <Button size="sm" onPress={() => router.push('/pos/shift')}>
          <ButtonLabel>{t('pos.shiftBanner.action')}</ButtonLabel>
        </Button>
      }
    />
  );
}
