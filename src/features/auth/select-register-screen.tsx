import { useMemo } from 'react';
import { View } from 'react-native';
import { Badge, EmptyState, ListGroup, ListItem, Text } from '@beemvp/beeui-ui';
import { useRouter } from 'expo-router';
import { useT } from '../../i18n';
import { openShiftOn } from '../../domain/pos';
import { useOrderStore } from '../../data/order-store';
import { useOrgStore } from '../../data/org-store';
import { useSessionStore } from '../../data/session-store';
import { AppIcon } from '../../components/icons';
import { formatTime } from '../../lib/datetime';
import { AuthBrand, AuthLayout } from './auth-layout';

/**
 * The till the session binds to, picked after the branch. Two stations in one shop are what
 * makes a shift, a cash drawer and a receipt attributable.
 *
 * Each row says whether someone is already on that till: taking over an open shift is a normal
 * handover, but doing it without knowing is how a drawer count goes wrong at the end of the day.
 */
export default function SelectRegisterScreen() {
  const t = useT();
  const router = useRouter();
  const store = useSessionStore((state) => state.store);
  const registerOptions = useSessionStore((state) => state.registerOptions);
  const storeOptions = useSessionStore((state) => state.storeOptions);
  const selectRegister = useSessionStore((state) => state.selectRegister);
  const shifts = useOrderStore((state) => state.shifts);
  const staff = useOrgStore((state) => state.staff);

  // Open shifts of this branch, keyed by the till they were opened on. Built from the same
  // `openShiftOn` the sell screen reads, so the two screens cannot describe one till
  // differently (P7-06).
  const openByRegister = useMemo(() => {
    const map = new Map<string, { name: string; openedAt: string }>();
    for (const register of registerOptions) {
      const open = openShiftOn(shifts, store?.id, register.id);
      if (!open) continue;
      const cashier = staff.find((member) => member.id === open.cashierId);
      map.set(register.id, { name: cashier?.name ?? open.cashierId, openedAt: open.openedAt });
    }
    return map;
  }, [registerOptions, shifts, staff, store?.id]);

  function handleSelect(registerId: string) {
    selectRegister(registerId);
    router.replace('/pos');
  }

  return (
    <AuthLayout>
      <AuthBrand
        title={t('auth.register.title')}
        subtitle={store ? `${store.code} · ${store.name}` : t('auth.register.prompt')}
      />

      {registerOptions.length === 0 ? (
        <EmptyState title={t('auth.register.empty')} description="" />
      ) : (
        <ListGroup>
          {registerOptions.map((register) => {
            const open = openByRegister.get(register.id);
            const description = open
              ? `${t('auth.register.openShiftBy').replace('{name}', open.name)} · ${formatTime(open.openedAt)}`
              : t('auth.register.idle');
            return (
              <ListItem
                key={register.id}
                className="min-h-[72px]"
                title={register.name}
                titleClassName="text-[length:var(--text-label)] leading-[var(--text-label--line-height)] font-semibold text-foreground"
                description={description}
                accessibilityLabel={`${register.name}, ${open ? t('auth.register.openShift') : t('auth.register.free')}`}
                leading={
                  <Badge variant="outline" className="rounded-sm border-transparent bg-muted">
                    {register.code}
                  </Badge>
                }
                trailing={
                  <View className="flex-row items-center gap-2">
                    {/* Green only for the state that needs a second look; a free till is the
                        normal case and stays quiet. */}
                    <Badge variant={open ? 'success' : 'outline'}>
                      {open ? t('auth.register.openShift') : t('auth.register.free')}
                    </Badge>
                    <AppIcon name="chevron-right" size={18} tone="subtle-foreground" />
                  </View>
                }
                onPress={() => handleSelect(register.id)}
              />
            );
          })}
        </ListGroup>
      )}

      {storeOptions.length > 1 ? (
        <Text
          variant="label"
          accessibilityRole="button"
          onPress={() => router.replace('/select-store')}
          className="min-h-touch-target p-2 text-center font-semibold text-info"
        >
          {t('auth.register.back')}
        </Text>
      ) : null}

      <Text variant="caption" className="text-center text-subtle-foreground">
        {t('auth.register.note')}
      </Text>
    </AuthLayout>
  );
}
