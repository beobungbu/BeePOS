import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import {
  AppHeader,
  Avatar,
  Badge,
  IconButton,
  ListGroup,
  ListItem,
  SafeArea,
  Screen,
  Text,
} from '@beemvp/beeui-ui';
import { useRouter } from 'expo-router';
import { useT } from '../../i18n';
import { useSessionStore } from '../../data/session-store';
import { useOrgStore } from '../../data/org-store';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { AppIcon } from '../../components/icons';
import { initialsOf } from '../../lib/initials';
import type { Store } from '../../domain/types';
import { AuthBrand, AuthLayout } from './auth-layout';
import { getRememberedStoreCode, setRememberedStoreCode } from './remembered-store';
import { resumeRoute } from './routes';

export default function SelectStoreScreen() {
  const t = useT();
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const staff = useSessionStore((state) => state.staff);
  const storeOptions = useSessionStore((state) => state.storeOptions);
  const selectStore = useSessionStore((state) => state.selectStore);
  const logout = useSessionStore((state) => state.logout);
  const registers = useOrgStore((state) => state.registers);

  const rememberedCode = getRememberedStoreCode();
  const recentStore = useMemo(
    () => storeOptions.find((store) => store.code === rememberedCode),
    [storeOptions, rememberedCode],
  );

  function handleSelect(storeId: string) {
    selectStore(storeId);
    // What puts this branch under "Gần đây" next time: a till reopens on the shop it was used
    // at, without that being a setting anyone has to find.
    setRememberedStoreCode(storeOptions.find((store) => store.id === storeId)?.code ?? null);
    // The till is the next question, unless the shop has only one, which `resumeRoute` binds
    // on the spot: a session with no register books shifts and receipts to nowhere.
    router.replace(resumeRoute());
  }

  function handleSignOut() {
    logout();
    router.replace('/login');
  }

  function storeRow(store: Store, recent: boolean) {
    return (
      <ListItem
        key={store.id}
        className="min-h-[72px]"
        title={store.name}
        titleClassName="text-[length:var(--text-label)] leading-[var(--text-label--line-height)] font-semibold text-foreground"
        // Till count before the address: it is what says whether the next screen will ask
        // anything, and two branches are told apart by the address under it.
        description={`${t('auth.register.count').replace(
          '{count}',
          String(registers.filter((item) => item.storeId === store.id && item.isActive).length),
        )} · ${store.address}`}
        leading={
          <Badge variant="outline" className="rounded-sm border-transparent bg-muted">
            {store.code}
          </Badge>
        }
        trailing={
          <View className="flex-row items-center gap-2">
            {recent ? (
              <Badge variant="outline" className="border-transparent bg-muted">
                {t('common.auth.recentStore')}
              </Badge>
            ) : null}
            <AppIcon name="chevron-right" size={18} tone="subtle-foreground" />
          </View>
        }
        onPress={() => handleSelect(store.id)}
      />
    );
  }

  const greeting = staff ? t('common.auth.greeting').replace('{name}', staff.name) : t('common.auth.selectStore');

  if (breakpoint === 'phone') {
    return (
      <Screen>
        <SafeArea className="flex-1 bg-surface-muted" edges={['top', 'bottom', 'left', 'right']}>
          <AppHeader
            className="min-h-14 bg-surface py-2"
            leading={
              <IconButton
                variant="ghost"
                accessibilityLabel={t('common.actions.back')}
                onPress={handleSignOut}
              >
                <AppIcon name="chevron-left" tone="foreground" />
              </IconButton>
            }
            title={
              <Text variant="body" className="font-semibold text-foreground">{t('common.auth.selectStore')}</Text>
            }
            trailing={<Avatar fallback={initialsOf(staff?.name)} size="md" />}
          />
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            <View className="gap-1 p-4">
              <Text variant="heading" className="font-semibold text-foreground">{greeting}</Text>
              <Text variant="label" className="font-normal text-muted-foreground">{t('common.auth.selectStorePrompt')}</Text>
            </View>

            {recentStore ? (
              <>
                <SectionLabel>{t('common.auth.recentStore')}</SectionLabel>
                <View className="px-4">
                  <ListGroup>{storeRow(recentStore, true)}</ListGroup>
                </View>
              </>
            ) : null}

            <SectionLabel>{`${t('common.auth.allStores')} · ${storeOptions.length}`}</SectionLabel>
            <View className="px-4">
              <ListGroup>{storeOptions.map((store) => storeRow(store, store.id === recentStore?.id))}</ListGroup>
            </View>
          </ScrollView>
        </SafeArea>
      </Screen>
    );
  }

  return (
    <AuthLayout>
      <AuthBrand title={greeting} subtitle={t('common.auth.selectStorePrompt')} />
      <ListGroup>{storeOptions.map((store) => storeRow(store, store.id === recentStore?.id))}</ListGroup>
      <Text
        variant="label"
        accessibilityRole="button"
        onPress={handleSignOut}
        className="min-h-touch-target p-2 text-center font-semibold text-info"
      >
        {t('common.auth.logout')}
      </Text>
    </AuthLayout>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text variant="caption" className="px-4 pb-2 pt-4 font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </Text>
  );
}
