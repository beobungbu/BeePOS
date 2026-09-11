import { useState } from 'react';
import { Screen, SafeArea, Field, Input, OTPInput, Button, ButtonLabel, Text } from '@beemvp/beeui-ui';
import { useRouter } from 'expo-router';
import { useT } from '../../src/i18n';
import { useSessionStore } from '../../src/data/session-store';

export default function LoginScreen() {
  const t = useT();
  const router = useRouter();
  const login = useSessionStore((state) => state.login);

  const [storeCode, setStoreCode] = useState('HN01');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    const ok = login(storeCode, pin);
    if (!ok) {
      setError(t('common.auth.invalidCredentials'));
      return;
    }
    setError(null);
    const storeOptions = useSessionStore.getState().storeOptions;
    router.replace(storeOptions.length > 1 ? '/select-store' : '/pos');
  }

  return (
    <Screen>
      <SafeArea className="flex-1 items-center justify-center px-6" edges={['top', 'bottom', 'left', 'right']}>
        <Text className="mb-8 text-2xl font-semibold text-foreground">
          {t('common.auth.welcome')}
        </Text>

        <Field label={t('common.auth.storeCode')} className="w-full max-w-sm">
          <Input
            value={storeCode}
            onChangeText={setStoreCode}
            autoCapitalize="characters"
            placeholder="HN01"
          />
        </Field>

        <Field label={t('common.auth.pin')} className="mt-4 w-full max-w-sm">
          <OTPInput
            length={4}
            value={pin}
            onChange={(e) => setPin(e.nativeEvent.text)}
            secureTextEntry
          />
        </Field>

        {error && <Text className="mt-3 text-sm text-destructive">{error}</Text>}

        <Button className="mt-6 w-full max-w-sm" onPress={handleSubmit}>
          <ButtonLabel>{t('common.auth.login')}</ButtonLabel>
        </Button>
      </SafeArea>
    </Screen>
  );
}
