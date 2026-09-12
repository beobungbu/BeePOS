import { Platform } from 'react-native';
import { useEffect } from 'react';
import { IconButton } from '@beemvp/beeui-ui';
import { usePathname } from 'expo-router';
import { AppIcon } from '../icons';
import { useT } from '../../i18n';
import { toggleShellRail } from './use-shell-rail';

/**
 * The one control that switches the desktop shell between the 240 pt sidebar and the 72 pt
 * rail. It sits at the bottom of both, so the chevron never moves when the width changes,
 * and it names the destination ("Thu gọn menu" / "Mở rộng menu") rather than the current
 * state, which is what a screen reader user needs to predict the press.
 */
export function SidebarToggle({ collapsed }: { collapsed: boolean }) {
  const t = useT();
  const pathname = usePathname();

  return (
    <IconButton
      variant="ghost"
      accessibilityLabel={collapsed ? t('common.shell.expandMenu') : t('common.shell.collapseMenu')}
      onPress={() => toggleShellRail(pathname)}
    >
      <AppIcon name={collapsed ? 'chevron-right' : 'chevron-left'} tone="muted-foreground" />
    </IconButton>
  );
}

/** True when the key event came from a field, where `[` is a character and not a shortcut. */
function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element || typeof element.tagName !== 'string') return false;
  if (element.isContentEditable) return true;
  return /^(input|textarea|select)$/i.test(element.tagName);
}

/**
 * `[` toggles the sidebar on web, the key VS Code and Linear both use for the same control.
 * Native has no hardware key to bind, so the effect never runs there, and the listener is
 * skipped entirely below 1280 where the shell has no sidebar to collapse.
 */
export function useSidebarShortcut(enabled: boolean): void {
  const pathname = usePathname();

  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled || typeof document === 'undefined') return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '[' || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      toggleShellRail(pathname);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled, pathname]);
}
