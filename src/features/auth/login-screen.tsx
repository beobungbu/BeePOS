import { useState } from 'react';
import { View } from 'react-native';
import { Button, ButtonLabel, Field, Input, OTPInput, Switch, Text } from '@beemvp/beeui-ui';
import { useRouter } from 'expo-router';
import { useT } from '../../i18n';
import { useOrgStore } from '../../data/org-store';
import { useSessionStore } from '../../data/session-store';
import { AuthBrand, AuthFooter, AuthLayout } from './auth-layout';
import { getRememberedStoreCode, setRememberedStoreCode } from './remembered-store';

const PIN_LENGTH = 4;

export default function LoginScreen() {
  const t = useT();
  const router = useRouter();
  const login = useSessionStore((state) => state.login);
  const stores = useOrgStore((state) => state.stores);

  const rememberedCode = getRememberedStoreCode();
  const [storeCode, setStoreCode] = useState(rememberedCode ?? 'HN01');
  const [remember, setRemember] = useState(rememberedCode != null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const trimmedCode = storeCode.trim().toLowerCase();
  const resolvedStore = stores.find((store) => store.code.toLowerCase() === trimmedCode);

  function handleSubmit() {
    const ok = login(storeCode, pin);
    if (!ok) {
      setError(t('common.auth.invalidCredentials'));
      return;
    }
    setError(null);
    setRememberedStoreCode(remember ? storeCode.trim().toUpperCase() : null);
    const storeOptions = useSessionStore.getState().storeOptions;
    router.replace(storeOptions.length > 1 ? '/select-store' : '/pos');
  }

  return (
    <AuthLayout footer={<AuthFooter />}>
      <AuthBrand title="BeePOS" subtitle={t('common.auth.tagline')} />

      <Field label={t('common.auth.storeCode')}>
        <Input
          value={storeCode}
          onChangeText={setStoreCode}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="HN01"
          className="font-semibold tracking-wider"
        />
      </Field>
      {/* Resolving the code to a real branch before the PIN is typed is what stops a cashier
          signing into the wrong shop; it sits outside `Field` so the label stays bound to the
          input alone. */}
      {resolvedStore ? (
        <Text className="-mt-2 text-caption font-medium text-success">
          {`${resolvedStore.name} · ${resolvedStore.address}`}
        </Text>
      ) : trimmedCode.length > 0 ? (
        <Text className="-mt-2 text-caption text-muted-foreground">{t('common.auth.storeNotFound')}</Text>
      ) : null}

      <Field label={t('common.auth.pin')}>
        <OTPInput
          length={PIN_LENGTH}
          value={pin}
          onValueChange={setPin}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
      </Field>

      <View className="min-h-touch-target flex-row items-center gap-2.5">
        <Switch
          value={remember}
          onValueChange={setRemember}
          accessibilityLabel={t('common.auth.rememberStore')}
        />
        <Text className="text-label text-foreground">{t('common.auth.rememberStore')}</Text>
      </View>

      {error ? <Text className="text-label text-destructive">{error}</Text> : null}

      <Button className="h-[52px] w-full" onPress={handleSubmit}>
        <ButtonLabel>{t('common.auth.login')}</ButtonLabel>
      </Button>
    </AuthLayout>
  );
}
