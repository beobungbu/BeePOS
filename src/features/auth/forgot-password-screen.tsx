import { useState } from 'react';
import { Button, ButtonLabel, Field, Input, OTPInput, PasswordInput, Text, useToast } from '@beemvp/beeui-ui';
import { useRouter } from 'expo-router';
import { useT } from '../../i18n';
import { createSalt, hashPassword, isValidEmail, passwordsMatch } from '../../domain/auth';
import { accountByEmail, useOrgStore } from '../../data/org-store';
import { AuthBrand, AuthFooter, AuthLayout } from './auth-layout';
import { PASSWORD_ERROR_KEY } from './change-password-screen';
import { consumeResetCode, issueResetCode } from './password-reset';

type Step = 'email' | 'code' | 'password';

/**
 * Three steps on one screen: the email, the six digit code, then the new password. The code is
 * generated on the device and shown in a toast, because a prototype that cannot send email
 * should say so rather than pretend the message is on its way.
 */
export default function ForgotPasswordScreen() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const accounts = useOrgStore((state) => state.accounts);
  const setAccountPassword = useOrgStore((state) => state.setAccountPassword);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
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

  function handleSendCode() {
    setTouched(true);
    setCode('');
    if (!isValidEmail(email)) {
      setError(t('auth.error.invalidEmail'));
      return;
    }
    if (!accountByEmail(accounts, email)) {
      setError(t('auth.forgot.unknownEmail'));
      return;
    }
    const issued = issueResetCode(email);
    setError(null);
    setTouched(false);
    setStep('code');
    toast.show({ title: t('auth.forgot.codeSent').replace('{code}', issued), variant: 'info' });
  }

  function handleVerify() {
    // The code is checked before the password fields appear, so a mistyped code is caught
    // where it was typed rather than after a password has been chosen twice.
    if (!consumeResetCode(email, code)) {
      setError(t('auth.forgot.codeInvalid'));
      return;
    }
    setError(null);
    setTouched(false);
    setStep('password');
  }

  async function handleReset() {
    setTouched(true);
    if (!validation.valid || pending) return;
    const account = accountByEmail(accounts, email);
    if (!account) {
      setError(t('auth.forgot.unknownEmail'));
      return;
    }

    setPending(true);
    setError(null);
    try {
      // A reset gets a fresh salt: the old one is the only thing an attacker who saw the old
      // hash has left to work with.
      const salt = createSalt();
      setAccountPassword(account.id, await hashPassword(next, salt), salt);
      toast.show({ title: t('auth.forgot.success'), variant: 'success' });
      router.replace('/login');
    } catch (cause) {
      console.warn('[auth] password reset failed:', cause);
      setError(t('auth.forgot.codeInvalid'));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout footer={<AuthFooter />}>
      <AuthBrand title={t('auth.forgot.title')} subtitle={t('auth.forgot.prompt')} />

      <Field label={t('auth.forgot.email')}>
        <Input
          value={email}
          onChangeText={setEmail}
          editable={step === 'email'}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder={t('auth.signIn.emailPlaceholder')}
          accessibilityLabel={t('auth.forgot.email')}
        />
      </Field>

      {step === 'code' ? (
        <Field
          label={t('auth.forgot.codeLabel')}
          description={t('auth.forgot.codePrompt').replace('{email}', email.trim().toLowerCase())}
        >
          <OTPInput
            length={6}
            value={code}
            onValueChange={setCode}
            onComplete={handleVerify}
            accessibilityLabel={t('auth.forgot.codeLabel')}
          />
        </Field>
      ) : null}

      {step === 'password' ? (
        <>
          <Field label={t('auth.forgot.newPassword')} error={nextError} invalid={Boolean(nextError)}>
            <PasswordInput
              showLabel={t('auth.signIn.showPassword')}
              hideLabel={t('auth.signIn.hidePassword')}
              value={next}
              onChangeText={setNext}
              autoCapitalize="none"
              accessibilityLabel={t('auth.forgot.newPassword')}
            />
          </Field>
          <Field label={t('auth.forgot.confirmPassword')} description={t('auth.onboarding.passwordHint')}>
            <PasswordInput
              showLabel={t('auth.signIn.showPassword')}
              hideLabel={t('auth.signIn.hidePassword')}
              value={confirm}
              onChangeText={setConfirm}
              autoCapitalize="none"
              accessibilityLabel={t('auth.forgot.confirmPassword')}
              returnKeyType="done"
              onSubmitEditing={() => void handleReset()}
            />
          </Field>
        </>
      ) : null}

      {error ? (
        <Text variant="label" accessibilityRole="alert" className="font-normal text-destructive">
          {error}
        </Text>
      ) : null}

      {step === 'email' ? (
        <Button className="h-[52px] w-full" onPress={handleSendCode}>
          <ButtonLabel>{t('auth.forgot.sendCode')}</ButtonLabel>
        </Button>
      ) : null}

      {step === 'code' ? (
        <>
          <Button className="h-[52px] w-full" onPress={handleVerify} disabled={code.length < 6}>
            <ButtonLabel>{t('auth.forgot.verify')}</ButtonLabel>
          </Button>
          <Text
            variant="caption"
            accessibilityRole="button"
            onPress={handleSendCode}
            className="min-h-touch-target py-3 text-center font-medium text-info"
          >
            {t('auth.forgot.resend')}
          </Text>
        </>
      ) : null}

      {step === 'password' ? (
        <Button className="h-[52px] w-full" onPress={() => void handleReset()} disabled={pending}>
          <ButtonLabel>{t('auth.forgot.submit')}</ButtonLabel>
        </Button>
      ) : null}

      <Text variant="caption" className="text-center text-subtle-foreground">
        {t('auth.forgot.mockNote')}
      </Text>

      <Text
        variant="label"
        accessibilityRole="button"
        onPress={() => router.replace('/login')}
        className="min-h-touch-target p-2 text-center font-semibold text-info"
      >
        {t('auth.forgot.backToLogin')}
      </Text>
    </AuthLayout>
  );
}
