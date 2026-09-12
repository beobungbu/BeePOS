import { Platform, View } from 'react-native';
import { Dialog, DialogContent, DialogTitle, Text } from '@beemvp/beeui-ui';
import { useT } from '../i18n';
import { useShellOverlayStore } from './shell/overlay-store';

/**
 * Every keyboard shortcut the app binds on web, opened with `?`. The list is written by hand
 * rather than collected from the handlers: the handlers live in the screens that own them
 * (POS catalogue, cart pane, order tab strip, shell), and a registry they all had to publish
 * into would be more machinery than nine rows are worth.
 *
 * `Cmd` is written for macOS and `Ctrl` elsewhere, because a cashier reading `Ctrl+K` on a Mac
 * tries the wrong key first.
 */
const SHORTCUTS: { keys: string; labelKey: string }[] = [
  { keys: 'commandKey+K', labelKey: 'common.shortcuts.palette' },
  { keys: '?', labelKey: 'common.shortcuts.help' },
  { keys: 'F3', labelKey: 'common.shortcuts.search' },
  { keys: 'F9', labelKey: 'common.shortcuts.checkout' },
  { keys: 'Alt+1..8', labelKey: 'common.shortcuts.switchOrder' },
  { keys: 'Alt+N', labelKey: 'common.shortcuts.newOrder' },
  { keys: 'Alt+W', labelKey: 'common.shortcuts.closeOrder' },
  { keys: '[', labelKey: 'common.shortcuts.toggleSidebar' },
  { keys: 'Esc', labelKey: 'common.shortcuts.dismiss' },
];

/** macOS writes the modifier as Cmd, every other platform as Ctrl. */
function commandKeyName(): string {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return 'Ctrl';
  return /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent) ? 'Cmd' : 'Ctrl';
}

export function ShortcutHelp() {
  const t = useT();
  const open = useShellOverlayStore((state) => state.overlay === 'shortcuts');
  const closeOverlay = useShellOverlayStore((state) => state.closeOverlay);
  const commandKey = commandKeyName();

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeOverlay()}>
      <DialogContent className="w-full max-w-[480px] gap-3">
        <DialogTitle>{t('common.shortcuts.title')}</DialogTitle>
        <Text variant="caption" className="text-muted-foreground">
          {t('common.shortcuts.description')}
        </Text>

        <View className="gap-1">
          {SHORTCUTS.map((shortcut) => (
            <View className="min-h-9 flex-row items-center justify-between gap-4" key={shortcut.keys}>
              <Text variant="label" className="min-w-0 shrink font-normal text-foreground">
                {t(shortcut.labelKey)}
              </Text>
              <View className="rounded-sm bg-muted px-2 py-1">
                <Text variant="caption" className="font-semibold text-foreground">
                  {shortcut.keys.replace('commandKey', commandKey)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </DialogContent>
    </Dialog>
  );
}
