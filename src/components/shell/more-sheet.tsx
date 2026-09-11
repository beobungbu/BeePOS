import { Platform } from 'react-native';
import { Dialog, DialogContent, DialogTitle, ListGroup, ListItem, Sheet, SheetContent, SheetTitle } from '@beemvp/beeui-ui';
import { useRouter } from 'expo-router';
import { useT } from '../../i18n';
import { SECONDARY_MOBILE_ITEMS } from './nav-items';

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

  function handleSelect(href: string) {
    onOpenChange(false);
    router.navigate(href as never);
  }

  if (Platform.OS !== 'web') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>{t('common.nav.more')}</DialogTitle>
          <ListGroup>
            {SECONDARY_MOBILE_ITEMS.map((item) => (
              <ListItem key={item.id} title={`${item.icon} ${t(item.labelKey)}`} onPress={() => handleSelect(item.href)} />
            ))}
          </ListGroup>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>{t('common.nav.more')}</SheetTitle>
        <ListGroup>
          {SECONDARY_MOBILE_ITEMS.map((item) => (
            <ListItem key={item.id} title={`${item.icon} ${t(item.labelKey)}`} onPress={() => handleSelect(item.href)} />
          ))}
        </ListGroup>
      </SheetContent>
    </Sheet>
  );
}
