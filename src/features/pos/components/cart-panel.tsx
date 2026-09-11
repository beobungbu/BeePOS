import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  ButtonLabel,
  EmptyState,
  Field,
  Textarea,
  Text,
} from '@beemvp/beeui-ui';
import { calcCart, type PricedCartLine } from '../../../domain/pos';
import { formatVND } from '../../../domain/money';
import type { Product } from '../../../domain/types';
import { useT } from '../../../i18n';
import { useCartStore } from '../../../data/cart-store';
import { useCustomerStore } from '../../../data/customer-store';
import { CartLineItem } from './cart-line-item';
import { CustomerDialog } from './customer-dialog';
import { OrderDiscountDialog } from './order-discount-dialog';

interface CartPanelProps {
  products: Product[];
}

export function CartPanel({ products }: CartPanelProps) {
  const t = useT();
  const router = useRouter();
  const cart = useCartStore((state) => state.cart);
  const setQty = useCartStore((state) => state.setQty);
  const setLineDiscount = useCartStore((state) => state.setLineDiscount);
  const removeLine = useCartStore((state) => state.removeLine);
  const setOrderDiscount = useCartStore((state) => state.setOrderDiscount);
  const setCustomer = useCartStore((state) => state.setCustomer);
  const setNote = useCartStore((state) => state.setNote);
  const clearCart = useCartStore((state) => state.clearCart);
  const customers = useCustomerStore((state) => state.customers);

  const pricedLines: PricedCartLine[] = cart.lines.map((line) => ({
    ...line,
    taxRate: products.find((product) => product.id === line.productId)?.taxRate ?? 0,
  }));
  const totals = calcCart(pricedLines, cart.discount);

  if (cart.lines.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <EmptyState title={t('pos.cart.emptyTitle')} description={t('pos.cart.emptyDescription')} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-4">
        {cart.lines.map((line) => (
          <CartLineItem
            key={line.productId}
            line={line}
            product={products.find((product) => product.id === line.productId)}
            onSetQty={(qty) => setQty(line.productId, qty)}
            onSetDiscount={(discount) => setLineDiscount(line.productId, discount)}
            onRemove={() => removeLine(line.productId)}
          />
        ))}
      </ScrollView>

      <View className="gap-3 border-t border-border p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">{t('pos.cart.customer')}</Text>
          <CustomerDialog customers={customers} selectedCustomerId={cart.customerId} onSelect={setCustomer} />
        </View>

        <Field label={t('pos.cart.note')}>
          <Textarea
            value={cart.note ?? ''}
            onChangeText={setNote}
            placeholder={t('pos.cart.notePlaceholder')}
            numberOfLines={2}
          />
        </Field>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">{t('pos.cart.subtotal')}</Text>
          <Text className="text-sm text-foreground">{formatVND(totals.subtotal)}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <OrderDiscountDialog discount={cart.discount} onApply={setOrderDiscount} />
          <Text className="text-sm text-foreground">-{formatVND(totals.discountTotal)}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">{t('pos.cart.tax')}</Text>
          <Text className="text-sm text-foreground">{formatVND(totals.taxTotal)}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-foreground">{t('pos.cart.total')}</Text>
          <Text className="text-lg font-semibold text-foreground">{formatVND(totals.total)}</Text>
        </View>

        <View className="flex-row gap-2">
          <AlertDialog>
            <AlertDialogTrigger variant="outline" className="flex-1">
              <ButtonLabel>{t('pos.cart.clear')}</ButtonLabel>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>{t('pos.cart.clearConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{t('pos.cart.clearConfirmDescription')}</AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  <ButtonLabel>{t('common.actions.cancel')}</ButtonLabel>
                </AlertDialogCancel>
                <AlertDialogAction onPress={clearCart}>
                  <ButtonLabel>{t('pos.cart.clear')}</ButtonLabel>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button className="flex-1" onPress={() => router.push('/pos/checkout')}>
            <ButtonLabel>{t('pos.cart.checkout')}</ButtonLabel>
          </Button>
        </View>
      </View>
    </View>
  );
}
