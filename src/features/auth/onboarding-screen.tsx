import { useState } from 'react';
import { Platform, View } from 'react-native';
import {
  Button,
  ButtonLabel,
  Field,
  Input,
  OTPInput,
  PasswordInput,
  Stepper,
  StepperItem,
  Text,
  useToast,
} from '@beemvp/beeui-ui';
import { useRouter } from 'expo-router';
import { useT } from '../../i18n';
import { createSalt, hashPassword, isValidEmail, normalizeEmail, passwordsMatch } from '../../domain/auth';
import { validatePin } from '../../domain/org';
import type { Organization, Register, Staff, Store, UserAccount } from '../../domain/types';
import { accountByEmail, useOrgStore } from '../../data/org-store';
import { setActiveOrgId } from '../../data/persistence-bootstrap';
import { useSessionStore } from '../../data/session-store';
import { AuthBrand, AuthFooter, AuthLayout } from './auth-layout';
import { PASSWORD_ERROR_KEY } from './change-password-screen';
import { resumeRoute } from './routes';

const STEPS = ['org', 'store', 'owner'] as const;
type Step = (typeof STEPS)[number];

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * First run: no chain exists yet, so there is nothing to sign into. Three steps create the
 * chain, its first branch with a first till, and the owner account that everything else is
 * then granted from.
 */
export default function OnboardingScreen() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const accounts = useOrgStore((state) => state.accounts);
  const createOrganization = useOrgStore((state) => state.createOrganization);
  const login = useSessionStore((state) => state.login);

  const [step, setStep] = useState<Step>('org');
  const [touched, setTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [taxRate, setTaxRate] = useState('10');
  const [storeName, setStoreName] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [registerName, setRegisterName] = useState('Quầy 1');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pin, setPin] = useState('');

  const stepIndex = STEPS.indexOf(step);
  const passwordCheck = passwordsMatch(password, confirm);
  const pinCheck = validatePin(pin);
  const required = t('auth.error.required');

  const errors = {
    orgName: orgName.trim().length === 0 ? required : undefined,
    storeName: storeName.trim().length === 0 ? required : undefined,
    storeAddress: storeAddress.trim().length === 0 ? required : undefined,
    registerName: registerName.trim().length === 0 ? required : undefined,
    ownerName: ownerName.trim().length === 0 ? required : undefined,
    ownerEmail: isValidEmail(ownerEmail) ? undefined : t('auth.error.invalidEmail'),
    password:
      !passwordCheck.valid && passwordCheck.errorCode
        ? t(PASSWORD_ERROR_KEY[passwordCheck.errorCode])
        : undefined,
    pin: pinCheck.valid ? undefined : t('auth.onboarding.pinInvalid'),
  };

  function stepValid(candidate: Step): boolean {
    if (candidate === 'org') return !errors.orgName;
    if (candidate === 'store') return !errors.storeName && !errors.storeAddress && !errors.registerName;
    return !errors.ownerName && !errors.ownerEmail && !errors.password && !errors.pin;
  }

  function handleNext() {
    setTouched(true);
    if (!stepValid(step)) return;
    setTouched(false);
    setError(null);
    setStep(STEPS[stepIndex + 1]);
  }

  async function handleCreate() {
    setTouched(true);
    if (!stepValid('owner') || pending) return;
    if (accountByEmail(accounts, ownerEmail)) {
      setError(t('auth.onboarding.emailTaken'));
      return;
    }

    setPending(true);
    setError(null);
    try {
      const now = new Date();
      const orgId = `org-${now.getTime()}`;
      const storeId = `${orgId}-store-1`;
      const staffId = `${orgId}-staff-1`;
      const salt = createSalt();

      const organization: Organization = {
        id: orgId,
        code: slugify(orgCode.trim() || orgName),
        name: orgName.trim(),
        plan: 'free',
        currency: 'VND',
        // Typed as a percentage, stored as the rate the totals actually multiply by.
        taxRate: (Number(taxRate.replace(',', '.')) || 0) / 100,
        receiptHeader: orgName.trim(),
        receiptFooter: 'Cảm ơn quý khách, hẹn gặp lại',
        createdAt: now,
      };
      const store: Store = {
        id: storeId,
        orgId,
        code: (storeCode.trim() || 'CH01').toUpperCase(),
        name: storeName.trim(),
        address: storeAddress.trim(),
        phone: '',
        isActive: true,
      };
      const register: Register = {
        id: `${storeId}-reg-1`,
        orgId,
        storeId,
        code: 'Q1',
        name: registerName.trim(),
        isActive: true,
      };
      const owner: Staff = {
        id: staffId,
        orgId,
        name: ownerName.trim(),
        role: 'owner',
        storeIds: [storeId],
        pin,
      };
      const account: UserAccount = {
        id: `${orgId}-account-1`,
        orgId,
        email: normalizeEmail(ownerEmail),
        passwordHash: await hashPassword(password, salt),
        salt,
        staffId,
        status: 'active',
        mustChangePassword: false,
        createdAt: now,
      };

      createOrganization({ organization, store, register, owner, account });
      // Points the persisted data keys at the new chain, so its orders and stock can never be
      // read back as the previous chain's. The registered keys are resolved at import time, so
      // web reloads once to pick them up; native keeps the old scope until the next launch.
      setActiveOrgId(orgId);
      toast.show({ title: t('auth.onboarding.success').replace('{name}', organization.name), variant: 'success' });

      const result = await login(account.email, password);
      router.replace(result.ok ? resumeRoute() : '/login');
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.location.reload();
    } catch (cause) {
      console.warn('[auth] onboarding failed:', cause);
      setError(t('auth.error.invalid'));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout footer={<AuthFooter />}>
      <AuthBrand title={t('auth.onboarding.title')} subtitle={t('auth.onboarding.subtitle')} />

      {/* BeeUI's own stepper rather than three painted bars: it carries the step state to
          assistive tech, which a row of `View`s cannot. Both numbers are 1-based per the docs
          (`currentStep` is clamped to [1, n]), so the 0-based index is shifted here. */}
      <Stepper currentStep={stepIndex + 1}>
        {STEPS.map((item, index) => (
          <StepperItem key={item} step={index + 1} title={t(`auth.onboarding.step.${item}`)} />
        ))}
      </Stepper>
      <Text variant="caption" className="text-center text-muted-foreground">
        {t('auth.onboarding.stepLabel')
          .replace('{current}', String(stepIndex + 1))
          .replace('{total}', String(STEPS.length))}
      </Text>

      {step === 'org' ? (
        <>
          <Field
            label={t('auth.onboarding.orgName')}
            error={touched ? errors.orgName : undefined}
            invalid={touched && Boolean(errors.orgName)}
            required
          >
            <Input
              value={orgName}
              onChangeText={setOrgName}
              placeholder={t('auth.onboarding.orgNamePlaceholder')}
              accessibilityLabel={t('auth.onboarding.orgName')}
            />
          </Field>
          <Field label={t('auth.onboarding.orgCode')}>
            <Input
              value={orgCode}
              onChangeText={setOrgCode}
              autoCapitalize="none"
              placeholder={t('auth.onboarding.orgCodePlaceholder')}
              accessibilityLabel={t('auth.onboarding.orgCode')}
            />
          </Field>
          <View className="flex-row gap-3">
            <View className="flex-1">
              {/* One currency, said out loud and disabled rather than left off the form: the
                  receipt totals are VND everywhere and the shop should see that decided. */}
              <Field label={t('auth.onboarding.currency')} description={t('auth.onboarding.currencyNote')}>
                <Input value="VND (đ)" editable={false} accessibilityLabel={t('auth.onboarding.currency')} />
              </Field>
            </View>
            <View className="flex-1">
              <Field label={t('auth.onboarding.taxRate')}>
                <Input
                  value={taxRate}
                  onChangeText={setTaxRate}
                  keyboardType="decimal-pad"
                  accessibilityLabel={t('auth.onboarding.taxRate')}
                />
              </Field>
            </View>
          </View>
        </>
      ) : null}

      {step === 'store' ? (
        <>
          <Field
            label={t('auth.onboarding.storeName')}
            error={touched ? errors.storeName : undefined}
            invalid={touched && Boolean(errors.storeName)}
            required
          >
            <Input
              value={storeName}
              onChangeText={setStoreName}
              placeholder={t('auth.onboarding.storeNamePlaceholder')}
              accessibilityLabel={t('auth.onboarding.storeName')}
            />
          </Field>
          <Field label={t('auth.onboarding.storeCode')}>
            <Input
              value={storeCode}
              onChangeText={setStoreCode}
              autoCapitalize="characters"
              placeholder="CH01"
              accessibilityLabel={t('auth.onboarding.storeCode')}
            />
          </Field>
          <Field
            label={t('auth.onboarding.storeAddress')}
            error={touched ? errors.storeAddress : undefined}
            invalid={touched && Boolean(errors.storeAddress)}
            required
          >
            <Input
              value={storeAddress}
              onChangeText={setStoreAddress}
              accessibilityLabel={t('auth.onboarding.storeAddress')}
            />
          </Field>
          <Field
            label={t('auth.onboarding.registerName')}
            error={touched ? errors.registerName : undefined}
            invalid={touched && Boolean(errors.registerName)}
            required
          >
            <Input
              value={registerName}
              onChangeText={setRegisterName}
              accessibilityLabel={t('auth.onboarding.registerName')}
            />
          </Field>
        </>
      ) : null}

      {step === 'owner' ? (
        <>
          <Field
            label={t('auth.onboarding.ownerName')}
            error={touched ? errors.ownerName : undefined}
            invalid={touched && Boolean(errors.ownerName)}
            required
          >
            <Input
              value={ownerName}
              onChangeText={setOwnerName}
              accessibilityLabel={t('auth.onboarding.ownerName')}
            />
          </Field>
          <Field
            label={t('auth.onboarding.ownerEmail')}
            error={touched ? errors.ownerEmail : undefined}
            invalid={touched && Boolean(errors.ownerEmail)}
            required
          >
            <Input
              value={ownerEmail}
              onChangeText={setOwnerEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder={t('auth.signIn.emailPlaceholder')}
              accessibilityLabel={t('auth.onboarding.ownerEmail')}
            />
          </Field>
          <Field
            label={t('auth.onboarding.ownerPassword')}
            error={touched ? errors.password : undefined}
            invalid={touched && Boolean(errors.password)}
            required
          >
            <PasswordInput
              showLabel={t('auth.signIn.showPassword')}
              hideLabel={t('auth.signIn.hidePassword')}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              accessibilityLabel={t('auth.onboarding.ownerPassword')}
            />
          </Field>
          <Text variant="caption" className="-mt-2 text-muted-foreground">
            {t('auth.onboarding.passwordHint')}
          </Text>
          <Field label={t('auth.onboarding.ownerPasswordConfirm')} required>
            <PasswordInput
              showLabel={t('auth.signIn.showPassword')}
              hideLabel={t('auth.signIn.hidePassword')}
              value={confirm}
              onChangeText={setConfirm}
              autoCapitalize="none"
              accessibilityLabel={t('auth.onboarding.ownerPasswordConfirm')}
            />
          </Field>
          <Field
            label={t('auth.onboarding.ownerPin')}
            description={t('auth.onboarding.pinNote')}
            error={touched ? errors.pin : undefined}
            invalid={touched && Boolean(errors.pin)}
            required
          >
            <OTPInput
              length={4}
              value={pin}
              onValueChange={setPin}
              secureTextEntry
              accessibilityLabel={t('auth.onboarding.ownerPin')}
            />
          </Field>
        </>
      ) : null}

      {error ? (
        <Text variant="label" accessibilityRole="alert" className="font-normal text-destructive">
          {error}
        </Text>
      ) : null}

      <View className="gap-2">
        {step === 'owner' ? (
          <Button className="h-[52px] w-full" onPress={() => void handleCreate()} disabled={pending}>
            <ButtonLabel>{pending ? t('auth.onboarding.creating') : t('auth.onboarding.submit')}</ButtonLabel>
          </Button>
        ) : (
          <Button className="h-[52px] w-full" onPress={handleNext}>
            <ButtonLabel>{t('auth.onboarding.next')}</ButtonLabel>
          </Button>
        )}
        {stepIndex > 0 ? (
          <Text
            variant="label"
            accessibilityRole="button"
            onPress={() => {
              setTouched(false);
              setError(null);
              setStep(STEPS[stepIndex - 1]);
            }}
            className="min-h-touch-target p-2 text-center font-semibold text-info"
          >
            {t('auth.onboarding.back')}
          </Text>
        ) : null}
      </View>
    </AuthLayout>
  );
}
