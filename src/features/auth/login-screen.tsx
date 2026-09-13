import { useState } from 'react';
import { View } from 'react-native';
import { Button, ButtonLabel, Field, Input, PasswordInput, Switch, Text } from '@beemvp/beeui-ui';
import { useRouter } from 'expo-router';
import { useT } from '../../i18n';
import { isValidEmail } from '../../domain/auth';
import { useSessionStore, type LoginFailure } from '../../data/session-store';
import { AuthBrand, AuthFooter, AuthLayout } from './auth-layout';
import { getRememberedEmail, setRememberedEmail } from './remembered-store';
import { resumeRoute } from './routes';

const FAILURE_KEY: Record<LoginFailure, string> = {
  invalid: 'auth.error.invalid',
  disabled: 'auth.error.disabled',
  invited: 'auth.error.invited',
  no_store: 'auth.error.noStore',
};

/**
 * Email and password, then the branch and the till. The store code that used to be the first
 * field is gone: it identified a shop, never a person, and twelve people shared one PIN behind
 * it. The branch is now picked after the identity is known, out of the branches this member is
 * actually assigned to.
 */
export default function LoginScreen() {
  const t = useT();
  const router = useRouter();
  const login = useSessionStore((state) => state.login);

  const rememberedEmail = getRememberedEmail();
  const [email, setEmail] = useState(rememberedEmail ?? '');
  const [remember, setRemember] = useState(rememberedEmail != null);
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = isValidEmail(email);
  const passwordFilled = password.length > 0;

  async function handleSubmit() {
    setTouched(true);
    if (!emailValid || !passwordFilled || pending) return;

    setPending(true);
    setError(null);
    try {
      const result = await login(email, password);
      if (!result.ok) {
        setError(t(FAILURE_KEY[result.reason]));
        return;
      }
      setRememberedEmail(remember ? email.trim().toLowerCase() : null);
      router.replace(resumeRoute(result.mustChangePassword));
    } catch (cause) {
      // Hashing runs on the device: a platform digest that throws must not leave the button
      // spinning with no explanation.
      console.warn('[auth] login failed:', cause);
      setError(t('auth.error.invalid'));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout footer={<AuthFooter />}>
      <AuthBrand title="BeePOS" subtitle={t('common.auth.tagline')} />

      <Field
        label={t('auth.signIn.email')}
        error={touched && !emailValid ? t('auth.error.invalidEmail') : undefined}
      >
        <Input
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          placeholder={t('auth.signIn.emailPlaceholder')}
          accessibilityLabel={t('auth.signIn.email')}
        />
      </Field>

      {/* `PasswordInput` rather than `Input secureTextEntry`: it carries the reveal toggle and
          its accessible name, which the mockup's eye affordance is. */}
      <Field label={t('auth.signIn.password')}>
        <PasswordInput
          showLabel={t('auth.signIn.showPassword')}
          hideLabel={t('auth.signIn.hidePassword')}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          placeholder={t('auth.signIn.passwordPlaceholder')}
          accessibilityLabel={t('auth.signIn.password')}
          returnKeyType="done"
          onSubmitEditing={() => void handleSubmit()}
        />
      </Field>

      {/* One row, as in the mockup: the switch on the left, the way out on the right. */}
      <View className="min-h-touch-target flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-row items-center gap-2.5">
          <Switch
            value={remember}
            onValueChange={setRemember}
            accessibilityLabel={t('auth.signIn.remember')}
          />
          <Text variant="label" className="font-normal text-foreground" numberOfLines={1}>
            {t('auth.signIn.remember')}
          </Text>
        </View>
        <Text
          variant="caption"
          accessibilityRole="button"
          onPress={() => router.push('/forgot-password')}
          className="shrink-0 py-3 font-medium text-info"
        >
          {t('auth.signIn.forgot')}
        </Text>
      </View>

      {error ? (
        <Text variant="label" accessibilityRole="alert" className="font-normal text-destructive">
          {error}
        </Text>
      ) : null}

      <Button className="h-[52px] w-full" onPress={() => void handleSubmit()} disabled={pending}>
        <ButtonLabel>{pending ? t('auth.signIn.submitting') : t('auth.signIn.submit')}</ButtonLabel>
      </Button>

      <Text variant="caption" className="text-center text-subtle-foreground">
        {t('auth.signIn.demoHint')}
      </Text>

      {/* First run on a fresh device: there is no chain to sign into yet. */}
      <Text variant="caption" className="text-center text-muted-foreground">
        {`${t('auth.signIn.noChain')} `}
        <Text
          variant="caption"
          accessibilityRole="button"
          onPress={() => router.push('/onboarding')}
          className="font-semibold text-info"
        >
          {t('auth.signIn.createChain')}
        </Text>
      </Text>
    </AuthLayout>
  );
}
