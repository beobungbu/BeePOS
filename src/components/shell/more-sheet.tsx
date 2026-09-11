import { Sheet, SheetContent, SheetTitle, ListGroup, ListItem } from '@beemvp/beeui-ui';
import { useRouter } from 'expo-router';
import { useT } from '../../i18n';
import { SECONDARY_MOBILE_ITEMS } from './nav-items';

interface MoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Sheet listing the areas that do not fit as primary bottom tabs on narrow screens. */
export function MoreSheet({ open, onOpenChange }: MoreSheetProps) {
  const t = useT();
  const router = useRouter();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>{t('common.nav.more')}</SheetTitle>
        <ListGroup>
          {SECONDARY_MOBILE_ITEMS.map((item) => (
            <ListItem
              key={item.id}
              title={`${item.icon} ${t(item.labelKey)}`}
              onPress={() => {
                onOpenChange(false);
                router.navigate(item.href as never);
              }}
            />
          ))}
        </ListGroup>
      </SheetContent>
    </Sheet>
  );
}
