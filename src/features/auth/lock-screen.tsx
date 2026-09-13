import { useState } from 'react';
import { View } from 'react-native';
import { Avatar, Text, useToast } from '@beemvp/beeui-ui';
import { useRouter } from 'expo-router';
import { useT } from '../../i18n';
import { useSessionStore } from '../../data/session-store';
import { initialsOf } from '../../lib/initials';
import { AuthLayout } from './auth-layout';
import { PIN_LENGTH, PinDots, PinPad } from './components/pin-pad';

const REASON_KEY = {
  unknown_pin: 'auth.lock.wrongPin',
  not_here: 'auth.lock.notHere',
  disabled: 'auth.lock.disabled',
} as const;

/**
 * The locked till. One PIN pad does both jobs the counter needs: the signed-in cashier's own
 * PIN reopens their session, and "Đổi thu ngân" takes the incoming cashier's PIN instead of
 * sending them back through email and password.
 *
 * Handing over changes who the next orders belong to and nothing else: the shift, the cash
 * drawer and the open bills stay exactly where they are, which is what a counter handover is.
 */
export default function LockScreen() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const staff = useSessionStore((state) => state.staff);
  const store = useSessionStore((state) => state.store);
  const register = useSessionStore((state) => state.register);
  const unlock = useSessionStore((state) => state.unlock);
  const logout = useSessionStore((state) => state.logout);

  const [switching, setSwitching] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const context = [staff ? t(`staff.role.${staff.role}`) : null, store?.code, register?.name]
    .filter(Boolean)
    .join(' · ');

  function handleComplete(candidate: string) {
    const result = unlock(candidate);
    if (!result.ok) {
      setError(t(REASON_KEY[result.reason]));
      setPin('');
      return;
    }
    setError(null);
    setPin('');
    setSwitching(false);
    if (result.switched) {
      toast.show({
        title: t('auth.lock.switched').replace('{name}', result.staff.name),
        description: t('auth.lock.switchNote'),
        variant: 'success',
      });
    }
    router.replace('/pos');
  }

  function handleChange(next: string) {
    if (error) setError(null);
    setPin(next);
  }

  return (
    <AuthLayout>
      <View className="items-center gap-1.5">
        <Avatar fallback={initialsOf(staff?.name)} fallbackClassName="text-foreground" size="lg" />
        <Text variant="heading" className="font-semibold text-foreground">
          {switching ? t('auth.lock.switchTitle') : (staff?.name ?? t('auth.lock.title'))}
        </Text>
        <Text variant="caption" className="text-muted-foreground">
          {switching && staff
            ? t('auth.lock.onDuty').replace('{name}', staff.name)
            : context}
        </Text>
      </View>

      <Text variant="label" className="text-center font-normal text-foreground">
        {switching ? t('auth.lock.switchNote') : t('auth.lock.prompt')}
      </Text>

      <View
        className="gap-6 py-2"
        accessibilityLabel={`${switching ? t('auth.lock.switchCashier') : t('auth.lock.unlock')}, ${pin.length}/${PIN_LENGTH}`}
      >
        <PinDots length={pin.length} invalid={Boolean(error)} />
        <PinPad
          value={pin}
          onChange={handleChange}
          onComplete={handleComplete}
          clearLabel={t('auth.lock.clear')}
          leadingKey={
            switching
              ? {
                  label: t('auth.lock.cancel'),
                  onPress: () => {
                    setSwitching(false);
                    setPin('');
                    setError(null);
                  },
                }
              : undefined
          }
        />
      </View>

      {error ? (
        <Text variant="label" accessibilityRole="alert" className="text-center font-normal text-destructive">
          {error}
        </Text>
      ) : null}

      {switching ? null : (
        <Text
          variant="label"
          accessibilityRole="button"
          onPress={() => {
            setSwitching(true);
            setPin('');
            setError(null);
          }}
          className="min-h-touch-target p-2 text-center font-semibold text-info"
        >
          {t('auth.lock.switchCashier')}
        </Text>
      )}

      <Text
        variant="caption"
        accessibilityRole="button"
        onPress={() => {
          logout();
          router.replace('/login');
        }}
        className="min-h-touch-target p-2 text-center font-medium text-muted-foreground"
      >
        {t('auth.lock.signOut')}
      </Text>
    </AuthLayout>
  );
}
