import { useMemo, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  Button,
  Chip,
  ChipGroup,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  Field,
  HStack,
  IconButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  Textarea,
  VStack,
} from '@beemvp/beeui-ui';
import type { Order, PaymentMethod, Product } from '../../../domain/types';
import { refundPlan, type Refund, type RefundPlanResult } from '../../../domain/orders';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';
import { AppIcon } from '../../../components/icons';

const METHODS: PaymentMethod[] = ['cash', 'transfer', 'card', 'points'];

function refundedQty(refunds: Refund[], productId: string): number {
  return refunds.reduce(
    (total, refund) => total + refund.lines.filter((line) => line.productId === productId).reduce((s, l) => s + l.qty, 0),
    0,
  );
}

export function RefundDialog({
  order,
  priorRefunds,
  products,
  open,
  onOpenChange,
  onConfirm,
}: {
  order: Order;
  priorRefunds: Refund[];
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (result: { plan: RefundPlanResult; method: PaymentMethod; reason: string }) => void;
}) {
  const t = useT();
  const [mode, setMode] = useState<'full' | 'partial'>('full');
  const [qtyByProduct, setQtyByProduct] = useState<Record<string, number>>({});
  const [method, setMethod] = useState<PaymentMethod>(order.payments[0]?.method ?? 'cash');
  const [reason, setReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const remainingByProduct = useMemo(() => {
    const map = new Map<string, number>();
    order.lines.forEach((line) => map.set(line.productId, line.qty - refundedQty(priorRefunds, line.productId)));
    return map;
  }, [order, priorRefunds]);

  const requestLines = useMemo(() => {
    if (mode === 'full') {
      return order.lines
        .map((line) => ({ productId: line.productId, qty: remainingByProduct.get(line.productId) ?? 0 }))
        .filter((line) => line.qty > 0);
    }
    return Object.entries(qtyByProduct)
      .filter(([, qty]) => qty > 0)
      .map(([productId, qty]) => ({ productId, qty }));
  }, [mode, order.lines, remainingByProduct, qtyByProduct]);

  const plan = useMemo(
    () => refundPlan({ order, requestLines, priorRefunds }),
    [order, requestLines, priorRefunds],
  );

  const productName = (productId: string) => products.find((p) => p.id === productId)?.name ?? productId;

  const adjustQty = (productId: string, delta: number) => {
    const remaining = remainingByProduct.get(productId) ?? 0;
    setQtyByProduct((prev) => {
      const next = Math.min(remaining, Math.max(0, (prev[productId] ?? 0) + delta));
      return { ...prev, [productId]: next };
    });
  };

  const resetAndClose = () => {
    setMode('full');
    setQtyByProduct({});
    setReason('');
    setConfirmOpen(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent>
          <DialogTitle>{t('orders.refundDialog.title')}</DialogTitle>
          <DialogDescription>{t('orders.refundDialog.description')}</DialogDescription>
          <VStack className="gap-4">
            <ChipGroup onValueChange={(v) => setMode(v as 'full' | 'partial')} selectionMode="single" value={mode}>
              <Chip value="full">{t('orders.refundDialog.modeFull')}</Chip>
              <Chip value="partial">{t('orders.refundDialog.modePartial')}</Chip>
            </ChipGroup>
            <VStack className="gap-2">
              {order.lines.map((line) => {
                const remaining = remainingByProduct.get(line.productId) ?? 0;
                const qty = mode === 'full' ? remaining : (qtyByProduct[line.productId] ?? 0);
                return (
                  <HStack className="items-center justify-between gap-2" key={line.productId}>
                    <Text variant="label" className="font-normal flex-1" numberOfLines={2}>
                      {productName(line.productId)}
                    </Text>
                    <HStack className="items-center gap-2">
                      <IconButton
                        accessibilityLabel={t('orders.refundDialog.decreaseQty')}
                        disabled={mode === 'full' || qty <= 0}
                        onPress={() => adjustQty(line.productId, -1)}
                        variant="outline"
                      >
                        <AppIcon name="minus" size={18} tone="foreground" />
                      </IconButton>
                      <Text variant="label" className="min-w-10 text-center font-semibold" numeric="tabular">
                        {qty}/{remaining}
                      </Text>
                      <IconButton
                        accessibilityLabel={t('orders.refundDialog.increaseQty')}
                        disabled={mode === 'full' || qty >= remaining}
                        onPress={() => adjustQty(line.productId, 1)}
                        variant="outline"
                      >
                        <AppIcon name="plus" size={18} tone="foreground" />
                      </IconButton>
                    </HStack>
                  </HStack>
                );
              })}
            </VStack>
            <Field label={t('orders.refundDialog.method')}>
              <Select onValueChange={(v) => setMethod(v as PaymentMethod)} value={method}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {t(`orders.paymentMethod.${item}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('orders.refundDialog.reason')}>
              <Textarea onChangeText={setReason} placeholder={t('orders.refundDialog.reasonPlaceholder')} value={reason} />
            </Field>
            <HStack className="justify-between">
              <Text tone="muted">{t('orders.refundDialog.amount')}</Text>
              <Text className="font-medium">{formatVND(plan.amount)}</Text>
            </HStack>
            <HStack className="justify-between">
              <Text tone="muted">{t('orders.refundDialog.points')}</Text>
              <Text className="font-medium">{plan.pointsToDeduct}</Text>
            </HStack>
            {!plan.valid && requestLines.length === 0 && (
              <Text tone="destructive">{t('orders.refundDialog.errorNoLines')}</Text>
            )}
          </VStack>
          <DialogFooter>
            <Button onPress={() => resetAndClose()} variant="outline">
              {t('orders.refundDialog.cancel')}
            </Button>
            <Button disabled={!plan.valid} onPress={() => setConfirmOpen(true)} variant="destructive">
              {t('orders.refundDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog onOpenChange={setConfirmOpen} open={confirmOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('orders.refundDialog.confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('orders.refundDialog.confirmDescription')}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('orders.voidDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onPress={() => {
                if (!plan.valid) return;
                onConfirm({ plan, method, reason });
                resetAndClose();
              }}
            >
              {t('orders.refundDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
