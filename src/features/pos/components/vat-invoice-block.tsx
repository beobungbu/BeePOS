import { useState } from 'react';
import { View } from 'react-native';
import {
  Button,
  ButtonLabel,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Field,
  Input,
  Text,
} from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import type { VatInvoiceInfo } from '../../../domain/types';
import { useT } from '../../../i18n';
import { vatInvoiceComplete } from '../lib/build-order';
import { SecondaryButtonLabel } from './secondary-button-label';

interface VatInvoiceBlockProps {
  value: VatInvoiceInfo | undefined;
  onChange: (info: VatInvoiceInfo) => void;
}

const EMPTY: VatInvoiceInfo = { buyerName: '', taxCode: '', address: '' };

/**
 * The buyer block that sits above the pay button on a wholesale order: who the invoice is
 * made out to, their tax code, and an edit affordance.
 *
 * It is editable at the till because the company buying is not always the person standing at
 * the counter, and a tax code typed wrong is an invoice the buyer cannot claim back.
 */
export function VatInvoiceBlock({ value, onChange }: VatInvoiceBlockProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<VatInvoiceInfo>(value ?? EMPTY);

  // The block is opened from a screen that may have defaulted the details from the customer
  // record after this component first mounted, so the draft is seeded from the value on the
  // open transition. Done during render rather than in an effect, which would show the
  // previous buyer's details for one frame.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(value ?? EMPTY);
  }

  const complete = vatInvoiceComplete(value);
  const summary = complete
    ? `${value?.buyerName} · ${t('pos.wholesale.vat.taxCode')} ${value?.taxCode}`
    : t('pos.wholesale.vat.missing');

  return (
    <View className="gap-2 rounded-md bg-surface-muted p-3">
      <View className="flex-row items-center gap-2">
        <AppIcon name="clipboard-list" size={18} tone={complete ? 'muted-foreground' : 'warning'} />
        <Text
          variant="label"
          className={`min-w-0 flex-1 font-normal ${complete ? 'text-foreground' : 'text-warning'}`}
          numberOfLines={2}
        >
          {`${t('pos.wholesale.vat.title')} · ${summary}`}
        </Text>
        <Button size="sm" variant="ghost" onPress={() => setOpen(true)}>
          <SecondaryButtonLabel>{t('pos.wholesale.vat.edit')}</SecondaryButtonLabel>
        </Button>
      </View>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{t('pos.wholesale.vat.dialogTitle')}</DialogTitle>
          <View className="gap-3 py-2">
            <Field label={t('pos.wholesale.vat.buyerName')} required>
              <Input
                value={draft.buyerName}
                onChangeText={(buyerName) => setDraft((previous) => ({ ...previous, buyerName }))}
              />
            </Field>
            <Field label={t('pos.wholesale.vat.taxCode')} required>
              <Input
                value={draft.taxCode}
                onChangeText={(taxCode) => setDraft((previous) => ({ ...previous, taxCode }))}
                keyboardType="numeric"
              />
            </Field>
            <Field label={t('pos.wholesale.vat.address')} required>
              <Input
                value={draft.address}
                onChangeText={(address) => setDraft((previous) => ({ ...previous, address }))}
              />
            </Field>
            <Field label={t('pos.wholesale.vat.email')}>
              <Input
                value={draft.email ?? ''}
                onChangeText={(email) => setDraft((previous) => ({ ...previous, email }))}
                keyboardType="email-address"
              />
            </Field>
          </View>
          <DialogFooter>
            <Button variant="outline" onPress={() => setOpen(false)}>
              <SecondaryButtonLabel>{t('common.actions.cancel')}</SecondaryButtonLabel>
            </Button>
            <Button
              disabled={!vatInvoiceComplete(draft)}
              onPress={() => {
                onChange({
                  buyerName: draft.buyerName.trim(),
                  taxCode: draft.taxCode.trim(),
                  address: draft.address.trim(),
                  email: draft.email?.trim() || undefined,
                });
                setOpen(false);
              }}
            >
              <ButtonLabel>{t('pos.wholesale.vat.save')}</ButtonLabel>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  );
}
