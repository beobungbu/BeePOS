import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  ButtonLabel,
} from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import { useT } from '../../../i18n';
import { SecondaryButtonLabel } from './secondary-button-label';
import { useCartStore } from '../../../data/cart-store';

interface CartClearButtonProps {
  disabled?: boolean;
}

/**
 * Empties the active order's lines, keeping the order itself open. Shared by the desktop
 * cart pane header and the `/pos/cart` route header so both confirm with the same words.
 */
export function CartClearButton({ disabled = false }: CartClearButtonProps) {
  const t = useT();
  const clearCart = useCartStore((state) => state.clearCart);

  return (
    <AlertDialog>
      <AlertDialogTrigger
        accessibilityLabel={t('pos.cart.clear')}
        variant="ghost"
        size="icon"
        disabled={disabled}
      >
        <AppIcon name="trash-2" size={18} tone={disabled ? 'disabled-foreground' : 'muted-foreground'} />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>{t('pos.cart.clearConfirmTitle')}</AlertDialogTitle>
        <AlertDialogDescription>{t('pos.cart.clearConfirmDescription')}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <SecondaryButtonLabel>{t('common.actions.cancel')}</SecondaryButtonLabel>
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive" onPress={clearCart}>
            <ButtonLabel>{t('pos.cart.clear')}</ButtonLabel>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
