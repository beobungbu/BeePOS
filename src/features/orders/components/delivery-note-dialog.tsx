import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Input,
  Text,
} from '@beemvp/beeui-ui';
import type { Product } from '../../../domain/types';
import { useT } from '../../../i18n';
import type { DeliveryProgress } from '../lib/delivery';

interface DeliveryNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: DeliveryProgress;
  products: Product[];
  onCreate: (lines: { productId: string; qty: number }[]) => void;
}

/**
 * A delivery note is what actually leaves the warehouse, so its quantities are editable per
 * line rather than being a single "deliver everything" button: partial delivery is the normal
 * case in wholesale and a note that always claimed the whole order would make the remaining
 * column a lie.
 *
 * Quantities are in base units, because that is what the person loading the van counts.
 */
export function DeliveryNoteDialog({
  open,
  onOpenChange,
  progress,
  products,
  onCreate,
}: DeliveryNoteDialogProps) {
  const t = useT();
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  // Opens defaulted to everything still owed, which is the common case; the driver edits down
  // the lines that did not fit on the van. Seeded on the open transition during render rather
  // than in an effect: an effect would render the dialog once with the previous order's
  // quantities before correcting itself.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const next: Record<string, string> = {};
      for (const line of progress.lines) {
        if (line.remainingQty > 0) next[line.line.productId] = String(line.remainingQty);
      }
      setQuantities(next);
    }
  }

  const pending = progress.lines.filter((line) => line.remainingQty > 0);
  const entered = Object.entries(quantities)
    .map(([productId, text]) => ({ productId, qty: Math.floor(Number.parseFloat(text) || 0) }))
    .filter((line) => line.qty > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t('orders.delivery.createTitle')}</DialogTitle>
        {pending.length === 0 ? (
          <View className="py-4">
            <Text variant="label" className="font-normal text-muted-foreground">
              {t('orders.delivery.nothingLeft')}
            </Text>
          </View>
        ) : (
          <ScrollView className="max-h-[360px]">
            <View className="gap-3 py-2">
              {pending.map((line) => {
                const product = products.find((item) => item.id === line.line.productId);
                return (
                  <View key={line.line.productId} className="flex-row items-center gap-3">
                    <View className="min-w-0 flex-1 gap-0.5">
                      <Text variant="label" className="font-semibold text-foreground" numberOfLines={2}>
                        {product?.name ?? line.line.productId}
                      </Text>
                      <Text variant="caption" className="text-muted-foreground" numeric="tabular">
                        {`${t('orders.delivery.remaining')} ${line.remainingQty} ${product?.unit ?? ''}`}
                      </Text>
                    </View>
                    <View className="w-24">
                      <Input
                        accessibilityLabel={`${t('orders.delivery.thisNote')} ${product?.name ?? ''}`}
                        value={quantities[line.line.productId] ?? ''}
                        onChangeText={(text) =>
                          setQuantities((previous) => ({ ...previous, [line.line.productId]: text }))
                        }
                        keyboardType="numeric"
                        className="text-right tabular-nums"
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
        <DialogFooter>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            {t('pricing.actions.cancel')}
          </Button>
          <Button
            disabled={entered.length === 0}
            onPress={() => {
              if (entered.length === 0) return;
              // Never promise more than is owed: a typo of 2400 for 240 would otherwise take
              // ten times the stock off the shelf when the note is marked delivered.
              const clamped = entered.map((line) => {
                const owed =
                  progress.lines.find((item) => item.line.productId === line.productId)?.remainingQty ?? 0;
                return { productId: line.productId, qty: Math.min(line.qty, owed) };
              });
              onCreate(clamped.filter((line) => line.qty > 0));
              onOpenChange(false);
            }}
          >
            {t('orders.delivery.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
