import {
  AppHeader,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  HStack,
  Text,
} from '@beemvp/beeui-ui';
import { useRouter } from 'expo-router';
import { useT } from '../../i18n';
import { useSessionStore } from '../../data/session-store';

/** App header with store switcher and user menu (logout). Rendered for every area screen. */
export function ShellHeader() {
  const t = useT();
  const router = useRouter();
  const store = useSessionStore((state) => state.store);
  const staff = useSessionStore((state) => state.staff);
  const storeOptions = useSessionStore((state) => state.storeOptions);
  const selectStore = useSessionStore((state) => state.selectStore);
  const logout = useSessionStore((state) => state.logout);

  return (
    <AppHeader
      title={store?.name ?? 'BeePOS'}
      trailing={
        <HStack className="items-center gap-2">
          {storeOptions.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                accessibilityLabel={t('common.shell.switchStore')}
                className="h-9 w-9 items-center justify-center rounded-full"
              >
                <Text>🏬</Text>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {storeOptions.map((option) => (
                  <DropdownMenuItem key={option.id} onSelect={() => selectStore(option.id)}>
                    <Text>{option.name}</Text>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              accessibilityLabel={t('common.shell.profile')}
              className="h-9 w-9 items-center justify-center rounded-full"
            >
              <Text>{staff?.name.charAt(0) ?? '?'}</Text>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onSelect={() => {
                  logout();
                  router.replace('/login');
                }}
              >
                <Text>{t('common.auth.logout')}</Text>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </HStack>
      }
    />
  );
}
