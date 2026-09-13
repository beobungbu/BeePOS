import { Button, Dialog, DialogContent, DialogFooter, DialogTitle, Field, Input, useToast } from '@beemvp/beeui-ui';
import { useState } from 'react';
import { useInventoryStore } from '../../data/inventory-store';
import { useT } from '../../i18n';
import { fill } from '../orders/lib/fill';
import { recordAudit } from '../../data/audit-store';
import { useOrgStore } from '../../data/org-store';

interface AdjustTarget {
  productId: string;
  storeId: string;
  productName: string;
}

interface AdjustStockDialogProps {
  target: AdjustTarget | null;
  onClose: () => void;
}

export function AdjustStockDialog({ target, onClose }: AdjustStockDialogProps) {
  const t = useT();
  const toast = useToast();
  const adjustStock = useInventoryStore((state) => state.adjustStock);
  const stores = useOrgStore((state) => state.stores);
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');

  function handleClose() {
    setQty('');
    setReason('');
    onClose();
  }

  function handleConfirm() {
    if (!target) return;
    const delta = Number(qty);
    if (!Number.isFinite(delta) || delta === 0) return;
    adjustStock(target.productId, target.storeId, delta, reason.trim() || 'manual-adjustment');
    recordAudit({
      action: 'stockAdjust',
      entity: 'stock',
      entityId: target.productName,
      storeId: target.storeId,
      summary: [
        fill(t('chain.audit.summary.stockAdjust'), {
          delta: delta > 0 ? `+${delta}` : String(delta),
          store: stores.find((store) => store.id === target.storeId)?.name ?? target.storeId,
        }),
        reason.trim(),
      ]
        .filter(Boolean)
        .join(', '),
    });
    toast.show({ title: t('products.savedToast'), variant: 'success' });
    handleClose();
  }

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogTitle>{target ? `${t('inventory.adjust.title')} · ${target.productName}` : t('inventory.adjust.title')}</DialogTitle>
        <Field label={t('inventory.adjust.qtyLabel')} required>
          <Input value={qty} onChangeText={setQty} keyboardType="numbers-and-punctuation" placeholder="+10 / -5" />
        </Field>
        <Field label={t('inventory.adjust.reasonLabel')}>
          <Input value={reason} onChangeText={setReason} />
        </Field>
        <DialogFooter>
          <Button variant="outline" onPress={handleClose}>
            {t('inventory.adjust.cancel')}
          </Button>
          <Button onPress={handleConfirm}>{t('inventory.adjust.confirm')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
