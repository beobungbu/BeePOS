import { useState } from 'react';
import { Button, ButtonLabel, Field, PasswordInput, Text, useToast } from '@beemvp/beeui-ui';
import { useRouter } from 'expo-router';
import { useT } from '../../i18n';
import { passwordsMatch, type PasswordErrorCode } from '../../domain/auth';
import { useSessionStore } from '../../data/session-store';
import { AuthBrand, AuthLayout } from './auth-layout';
import { resumeRoute } from './routes';

export const PASSWORD_ERROR_KEY: Record<PasswordErrorCode, string> = {
  empty: 'auth.password.empty',
  too_short: 'auth.password.tooShort',
  no_letter: 'auth.password.noLetter',
  no_digit: 'auth.password.noDigit',
  mismatch: 'auth.password.mismatch',
};

/**
 * Reached two ways: from Settings by choice, and straight after sign-in when the account is
 * still on the password an invite handed out (`mustChangePassword`). The second case is the
 * reason this screen sits in the auth group rather than inside Settings.
 */
export default function ChangePasswordScreen() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const account = useSessionStore((state) => state.account);
  const store = useSessionStore((state) => state.store);
  const changePassword = useSessionStore((state) => state.changePassword);

  const forced = Boolean(account?.mustChangePassword);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validation = passwordsMatch(next, confirm);
  const nextError =
    touched && !validation.valid && validation.errorCode
      ? t(PASSWORD_ERROR_KEY[validation.errorCode])
      : undefined;

  async function handleSubmit() {
    setTouched(true);
    if (!validation.valid || current.length === 0 || pending) return;

    setPending(true);
    setError(null);
    try {
      const ok = await changePassword(current, next);
      if (!ok) {
        setError(t('auth.change.wrongCurrent'));
        return;
      }
      toast.show({ title: t('auth.change.success'), variant: 'success' });
      // Coming from the forced path the session has no branch yet, so the flow continues
      // where sign-in left it; from Settings the till is already open and it goes back there.
      router.replace(forced || !store ? resumeRoute() : '/settings');
    } catch (cause) {
      console.warn('[auth] password change failed:', cause);
      setError(t('auth.change.wrongCurrent'));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout>
      <AuthBrand
        title={t('auth.change.title')}
        subtitle={forced ? t('auth.change.mustChange') : t('auth.change.prompt')}
      />

      <Field label={t('auth.change.current')}>
        <PasswordInput
          showLabel={t('auth.signIn.showPassword')}
          hideLabel={t('auth.signIn.hidePassword')}
          value={current}
          onChangeText={setCurrent}
          autoCapitalize="none"
          accessibilityLabel={t('auth.change.current')}
        />
      </Field>

      <Field label={t('auth.change.next')} error={nextError} invalid={Boolean(nextError)}>
        <PasswordInput
          showLabel={t('auth.signIn.showPassword')}
          hideLabel={t('auth.signIn.hidePassword')}
          value={next}
          onChangeText={setNext}
          autoCapitalize="none"
          accessibilityLabel={t('auth.change.next')}
        />
      </Field>

      <Field label={t('auth.change.confirm')}>
        <PasswordInput
          showLabel={t('auth.signIn.showPassword')}
          hideLabel={t('auth.signIn.hidePassword')}
          value={confirm}
          onChangeText={setConfirm}
          autoCapitalize="none"
          accessibilityLabel={t('auth.change.confirm')}
          returnKeyType="done"
          onSubmitEditing={() => void handleSubmit()}
        />
      </Field>

      <Text variant="caption" className="-mt-2 text-muted-foreground">
        {t('auth.onboarding.passwordHint')}
      </Text>

      {error ? (
        <Text variant="label" accessibilityRole="alert" className="font-normal text-destructive">
          {error}
        </Text>
      ) : null}

      <Button className="h-[52px] w-full" onPress={() => void handleSubmit()} disabled={pending}>
        <ButtonLabel>{t('auth.change.submit')}</ButtonLabel>
      </Button>
    </AuthLayout>
  );
}
