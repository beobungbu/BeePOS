import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  KeyboardAwareScreen,
  Section,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  Textarea,
  useToast,
} from '@beemvp/beeui-ui';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useScreenHeader } from '../../components/shell/screen-header';
import { receiptTotals } from '../../domain/inventory';
import { formatVND } from '../../domain/money';
import type { Supplier } from '../../domain/types';
import { formatDate } from '../../lib/datetime';
import { goBackOr } from '../../lib/navigation';
import { useT } from '../../i18n';
import { fill } from '../orders/lib/fill';
import { useInventoryStore } from '../../data/inventory-store';
import { currentOrgId, useOrgStore } from '../../data/org-store';
import { useCan } from '../../data/session-store';
import { makeSupplierId, purchaseHistoryFor, useSupplierStore } from '../../data/supplier-store';

/** Form content is capped at 480 and centred at every breakpoint (direction doc section 7). */
const FORM_MAX_WIDTH = 480;

/**
 * The credit the partner gives, in whole days. Anything that is not a positive number is no
 * term at all: a bill dated "due today" because the field held a typo is worse than a bill
 * with no due date.
 */
function paymentTermDays(text: string): number | undefined {
  const parsed = Number.parseInt(text.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
/** Page padding per band: 16 phone, 24 tablet, 32 desktop (direction doc section 7). */
const FORM_PADDING = { phone: 'p-4', tablet: 'p-6', desktop: 'p-8' } as const;

interface SupplierDetailScreenProps {
  /** Absent when the screen is `/inventory/suppliers/new`. */
  supplierId?: string;
}

/**
 * One partner: the editable record and, under it, every goods receipt booked against them.
 *
 * The history is on this screen rather than behind another tap because it is the reason a
 * supplier record exists at all: the question a shop owner opens this screen with is "what do
 * they deliver and what do we owe them", not "what is their address".
 */
export function SupplierDetailScreen({ supplierId }: SupplierDetailScreenProps) {
  const t = useT();
  const toast = useToast();
  const breakpoint = useBreakpoint();
  const canManage = useCan('inventory.manage');

  const suppliers = useSupplierStore((state) => state.suppliers);
  const upsertSupplier = useSupplierStore((state) => state.upsertSupplier);
  const receipts = useInventoryStore((state) => state.goodsReceipts);
  const stores = useOrgStore((state) => state.stores);

  const existing = supplierId ? suppliers.find((item) => item.id === supplierId) : undefined;
  const notFound = Boolean(supplierId) && !existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [paymentTermText, setPaymentTermText] = useState(
    existing?.paymentTermDays !== undefined ? String(existing.paymentTermDays) : '',
  );
  const [note, setNote] = useState(existing?.note ?? '');
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [touched, setTouched] = useState(false);

  const history = useMemo(
    () => (existing ? purchaseHistoryFor(receipts, existing.id) : undefined),
    [receipts, existing],
  );

  useScreenHeader({
    title: existing ? existing.name : t('chain.suppliers.newTitle'),
    subtitle: existing ? t('chain.suppliers.detailTitle') : undefined,
    backTo: '/inventory/suppliers',
  });

  const nameError = touched && name.trim().length === 0 ? t('chain.suppliers.form.requiredError') : undefined;

  function storeName(storeId: string): string {
    return stores.find((store) => store.id === storeId)?.code ?? storeId;
  }

  function handleSave() {
    setTouched(true);
    if (name.trim().length === 0 || !canManage) return;

    const supplier: Supplier = {
      id: existing?.id ?? makeSupplierId(),
      orgId: existing?.orgId ?? currentOrgId(),
      name: name.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      paymentTermDays: paymentTermDays(paymentTermText),
      note: note.trim() || undefined,
      isActive,
    };
    upsertSupplier(supplier);
    toast.show({ title: t('chain.suppliers.savedToast'), variant: 'success' });
    goBackOr('/inventory/suppliers');
  }

  if (notFound) {
    return (
      <View className="flex-1 gap-4 p-4">
        <EmptyState title={t('chain.suppliers.noResults')} description="" />
        <Button variant="outline" onPress={() => goBackOr('/inventory/suppliers')}>
          {t('common.actions.back')}
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAwareScreen contentWidth="md">
      <View
        className={`w-full self-center gap-6 ${FORM_PADDING[breakpoint]}`}
        style={{ maxWidth: FORM_MAX_WIDTH }}
      >
        {existing ? (
          <View className="flex-row items-center justify-end">
            <Badge variant={existing.isActive ? 'success' : 'outline'}>
              {existing.isActive ? t('chain.suppliers.statusActive') : t('chain.suppliers.statusInactive')}
            </Badge>
          </View>
        ) : null}

        <Section title={existing ? t('chain.suppliers.editTitle') : t('chain.suppliers.newTitle')}>
          <View className="gap-4">
            <Field label={t('chain.suppliers.form.name')} required invalid={Boolean(nameError)} error={nameError}>
              <Input value={name} onChangeText={setName} editable={canManage} />
            </Field>
            <Field label={t('chain.suppliers.form.phone')}>
              <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={canManage} />
            </Field>
            <Field label={t('chain.suppliers.form.address')}>
              <Input value={address} onChangeText={setAddress} editable={canManage} />
            </Field>
            <Field
              label={t('chain.suppliers.form.paymentTerm')}
              description={t('chain.suppliers.form.paymentTermHint')}
            >
              <Input
                value={paymentTermText}
                onChangeText={setPaymentTermText}
                keyboardType="number-pad"
                editable={canManage}
                accessibilityLabel={t('chain.suppliers.form.paymentTerm')}
              />
            </Field>
            <Field label={t('chain.suppliers.form.note')}>
              <Textarea value={note} onChangeText={setNote} editable={canManage} />
            </Field>
            <View className="min-h-11 flex-row items-center justify-between">
              <Text variant="label">{t('chain.suppliers.form.status')}</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                disabled={!canManage}
                accessibilityLabel={t('chain.suppliers.form.status')}
              />
            </View>
          </View>
        </Section>

        {existing && history ? (
          <Section title={t('chain.suppliers.history.title')}>
            {history.receipts.length === 0 ? (
              <Text variant="label" tone="muted">{t('chain.suppliers.history.empty')}</Text>
            ) : (
              <Table layout={breakpoint === 'phone' ? 'stacked' : 'scroll'}>
                <TableHeader>
                  <TableRow>
                    <TableHead label={t('chain.suppliers.history.columns.code')}>
                      {t('chain.suppliers.history.columns.code')}
                    </TableHead>
                    <TableHead label={t('chain.suppliers.history.columns.store')}>
                      {t('chain.suppliers.history.columns.store')}
                    </TableHead>
                    <TableHead label={t('chain.suppliers.history.columns.total')}>
                      {t('chain.suppliers.history.columns.total')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.receipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell label={t('chain.suppliers.history.columns.code')}>
                        <Text variant="label" className="font-semibold">{receipt.id}</Text>
                        <Text variant="caption" tone="muted" numeric="tabular">
                          {`${formatDate(receipt.createdAt)} · ${fill(t('chain.suppliers.history.lineCount'), {
                            count: receipt.lines.length,
                          })}`}
                        </Text>
                      </TableCell>
                      <TableCell label={t('chain.suppliers.history.columns.store')}>
                        <Text variant="label" className="font-normal">{storeName(receipt.storeId)}</Text>
                      </TableCell>
                      <TableCell label={t('chain.suppliers.history.columns.total')}>
                        <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                          {formatVND(receiptTotals(receipt.lines).totalCost)}
                        </Text>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Section>
        ) : null}

        <View className="flex-row flex-wrap justify-between gap-2">
          {existing ? (
            <Button variant="outline" onPress={() => router.push('/inventory/receipts/new')}>
              {t('chain.suppliers.newReceipt')}
            </Button>
          ) : (
            <View />
          )}
          <View className="flex-row gap-2">
            <Button variant="outline" onPress={() => goBackOr('/inventory/suppliers')}>
              {t('chain.suppliers.form.cancel')}
            </Button>
            <Button onPress={handleSave} disabled={!canManage}>
              {t('chain.suppliers.form.save')}
            </Button>
          </View>
        </View>
      </View>
    </KeyboardAwareScreen>
  );
}
