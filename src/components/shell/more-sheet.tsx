import { Platform } from 'react-native';
import { Dialog, DialogContent, DialogTitle, ListGroup, ListItem, Sheet, SheetContent, SheetTitle } from '@beemvp/beeui-ui';
import { useRouter } from 'expo-router';
import { useT } from '../../i18n';
import { ShellIcon } from './shell-icons';
import { useVisibleNavItems } from './nav-items';

interface MoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Menu listing the areas that do not fit as primary bottom tabs on narrow screens.
 *
 * BeeUI's native `Sheet` never presents on iOS (BeeUI #584): the gorhom-backed sheet's
 * `present()` call fires with no visible content and no error, while `Dialog` (RN
 * `Modal`-based) works fine. On native this falls back to a `Dialog` with the same item
 * list; on web the `Sheet` still works and is kept. Remove this branch once #584 lands.
 */
export function MoreSheet({ open, onOpenChange }: MoreSheetProps) {
  const t = useT();
  const router = useRouter();
  const secondary = useVisibleNavItems().filter((item) => !item.primaryOnMobile);

  function handleSelect(href: string) {
    onOpenChange(false);
    router.navigate(href as never);
  }

  const items = (
    <ListGroup>
      {secondary.map((item) => (
        <ListItem
          key={item.id}
          title={t(item.labelKey)}
          leading={<ShellIcon name={item.icon} tone="muted-foreground" />}
          trailing={<ShellIcon name="chevron-right" size={18} tone="subtle-foreground" />}
          onPress={() => handleSelect(item.href)}
        />
      ))}
    </ListGroup>
  );

  if (Platform.OS !== 'web') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>{t('common.nav.more')}</DialogTitle>
          {items}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>{t('common.nav.more')}</SheetTitle>
        {items}
      </SheetContent>
    </Sheet>
  );
}
