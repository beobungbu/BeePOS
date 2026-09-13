import { useEffect } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, ButtonLabel, EmptyState, Text, useToast } from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import { useScreenHeader } from '../../../components/shell/screen-header';
import { useCatalogStore } from '../../../data/catalog-store';
import { useCustomerStore } from '../../../data/customer-store';
import { useOrderStore } from '../../../data/order-store';
import { useOrgStore } from '../../../data/org-store';
import { useSettingsStore } from '../../../data/settings-store';
import { formatVND } from '../../../domain/money';
import { vatInvoiceFor } from '../../pos/lib/build-order';
import { useT } from '../../../i18n';
import '../../../i18n/orders.vi';
import '../../../i18n/orders.en';
import { formatDate } from '../../../lib/datetime';
import { fill } from '../lib/fill';
import {
  ensureInvoiceStylesheet,
  INVOICE_PRINT_ID,
  printInvoice,
  shareInvoice,
} from '../lib/invoice-print';
import {
  formatInvoiceText,
  INVOICE_FORM_NO,
  invoiceFigures,
  invoiceNumber,
  invoiceSerial,
} from '../lib/vat-invoice';

/**
 * The A5 VAT invoice, opened from a wholesale order for a company buyer.
 *
 * Layout follows the familiar 01GTKT shape: form number, serial, number and date; the seller
 * block; the buyer block; a ruled line table; goods total, VAT and grand total; the amount in
 * words; and two signature areas. Unit prices are net of tax and per base unit, so the buyer
 * reconciles the invoice against the goods they counted.
 *
 * The sheet says plainly that the serial and the number are generated locally and that
 * nothing has been issued through an e-invoice provider, which is the truth about a prototype.
 */
export function VatInvoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const toast = useToast();

  const order = useOrderStore((state) => state.orders.find((item) => item.id === id));
  const products = useCatalogStore((state) => state.products);
  const customer = useCustomerStore((state) =>
    state.customers.find((item) => item.id === order?.customerId),
  );
  const bankInfo = useSettingsStore((state) => state.bankInfo);
  // Seller block, branch and staff come from the chain this device is signed into, not the
  // demo seed: an invoice carrying another chain's name and MST is a false tax document.
  const organization = useOrgStore((state) => state.organization);
  const stores = useOrgStore((state) => state.stores);
  const allStaff = useOrgStore((state) => state.staff);

  useScreenHeader({
    title: t('orders.vatInvoice.title'),
    subtitle: order?.code,
    backTo: order ? `/orders/${order.id}` : '/orders',
  });

  // Before the early return: the stylesheet has to reach the document whether or not this
  // order resolved, and hooks cannot run conditionally.
  useEffect(() => {
    ensureInvoiceStylesheet();
  }, []);

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center gap-4 p-6">
        <EmptyState
          title={t('orders.vatInvoice.notFound')}
          description={t('orders.empty.description')}
        />
        <Button variant="outline" onPress={() => router.push('/orders')}>
          {t('orders.detail.back')}
        </Button>
      </View>
    );
  }

  // The order's own buyer block when it has one, and the customer record otherwise: an order
  // taken before the block existed, or one whose cashier never opened it, still has to print.
  const buyer = order.vatInvoice ?? vatInvoiceFor(customer);
  if (!buyer) {
    return (
      <View className="flex-1 items-center justify-center gap-4 p-6">
        <EmptyState
          title={t('orders.vatInvoice.title')}
          description={t('orders.vatInvoice.needCompany')}
        />
        <Button variant="outline" onPress={() => router.push(`/orders/${order.id}`)}>
          {t('orders.detail.back')}
        </Button>
      </View>
    );
  }

  const issuedAt = new Date(order.createdAt);
  const figures = invoiceFigures(order, products);
  const serial = invoiceSerial(issuedAt);
  const number = invoiceNumber(order);
  const store = stores.find((item) => item.id === order.storeId);
  const seller = allStaff.find((item) => item.id === (order.salesRepId ?? order.cashierId));
  // The chain record is null only before onboarding has run, which no signed-in route reaches.
  const sellerName = organization?.name ?? '';
  const sellerTaxCode = organization?.taxCode;
  const bankAccount = [bankInfo.accountNumber, bankInfo.bankName].filter(Boolean).join(' · ');

  function handlePrint() {
    if (printInvoice()) {
      toast.show({ title: t('pos.receipt.printedToast'), variant: 'success' });
      return;
    }
    toast.show({ title: t('pos.receipt.printFailed'), variant: 'warning' });
  }

  async function handleShare() {
    const text = formatInvoiceText({
      order: order!,
      figures,
      buyer,
      sellerName,
      serial,
      number,
      labels: {
        heading: t('orders.vatInvoice.heading'),
        serial: t('orders.vatInvoice.serial'),
        number: t('orders.vatInvoice.number'),
        seller: t('orders.vatInvoice.seller'),
        buyerName: t('orders.vatInvoice.buyerName'),
        taxCode: t('orders.vatInvoice.buyerTaxCode'),
        goodsTotal: t('orders.vatInvoice.goodsTotal'),
        tax: t('orders.vatInvoice.colAmount'),
        grandTotal: t('orders.vatInvoice.grandTotal'),
        inWords: t('orders.vatInvoice.inWords'),
      },
    });
    const outcome = await shareInvoice(text, t('orders.vatInvoice.title'));
    if (outcome === 'shared') toast.show({ title: t('pos.receipt.sharedToast'), variant: 'success' });
    else if (outcome === 'failed') toast.show({ title: t('pos.receipt.shareFailed'), variant: 'warning' });
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4 pb-10">
      <View className="flex-row flex-wrap items-center gap-2">
        <Text variant="label" className="flex-1 font-normal text-muted-foreground">
          {t('orders.vatInvoice.paperSize')}
        </Text>
        {Platform.OS === 'web' ? (
          <Button onPress={handlePrint}>
            <ButtonLabel>{t('orders.vatInvoice.print')}</ButtonLabel>
          </Button>
        ) : (
          <Button onPress={handleShare}>
            <ButtonLabel>{t('orders.vatInvoice.share')}</ButtonLabel>
          </Button>
        )}
      </View>

      <View
        nativeID={INVOICE_PRINT_ID}
        className="gap-3 self-center rounded-lg border border-border bg-surface p-6"
        style={{ width: '100%', maxWidth: 560 }}
      >
        <View className="items-center gap-1">
          <Text variant="caption" className="text-muted-foreground">
            {`${t('orders.vatInvoice.formNo')}: ${INVOICE_FORM_NO}`}
          </Text>
          <Text variant="title" className="text-center font-bold text-foreground">
            {t('orders.vatInvoice.heading')}
          </Text>
          <Text variant="caption" className="text-center text-muted-foreground" numeric="tabular">
            {`${t('orders.vatInvoice.serial')}: ${serial} · ${t('orders.vatInvoice.number')}: ${number} · ${t(
              'orders.vatInvoice.issuedOn',
            )} ${formatDate(order.createdAt)}`}
          </Text>
        </View>

        <View className="h-px bg-border-strong" />

        <View className="gap-1">
          <InvoiceRow label={t('orders.vatInvoice.seller')} value={sellerName} bold />
          {/* A chain that has not entered its MST prints no seller tax-code row at all:
              a blank line on a tax document reads as missing data a reader would chase. */}
          {sellerTaxCode ? (
            <InvoiceRow label={t('orders.vatInvoice.sellerTaxCode')} value={sellerTaxCode} />
          ) : null}
          <InvoiceRow label={t('orders.vatInvoice.sellerAddress')} value={store?.address ?? ''} />
          {/* Blank rows on a tax document read as missing data rather than as "not
              applicable", so the bank line appears only once the chain has entered one. */}
          {bankAccount ? (
            <InvoiceRow label={t('orders.vatInvoice.bankAccount')} value={bankAccount} />
          ) : null}
        </View>

        <View className="h-px bg-border-strong" />

        <View className="gap-1">
          <InvoiceRow label={t('orders.vatInvoice.buyerContact')} value={customer?.contactName ?? ''} />
          <InvoiceRow label={t('orders.vatInvoice.buyerName')} value={buyer.buyerName} bold />
          <InvoiceRow label={t('orders.vatInvoice.buyerTaxCode')} value={buyer.taxCode} />
          <InvoiceRow label={t('orders.vatInvoice.buyerAddress')} value={buyer.address} />
          <InvoiceRow
            label={t('orders.vatInvoice.paymentTerms')}
            value={
              order.dueDate
                ? `${t('orders.lifecycle.onAccount')} · ${formatDate(order.dueDate.toISOString())}`
                : t(`orders.paymentMethod.${order.payments[0]?.method ?? 'cash'}`)
            }
          />
        </View>

        <View className="h-px bg-border-strong" />

        <View className="gap-1">
          <View className="flex-row gap-2 pb-1">
            <Text variant="caption" className="w-6 text-muted-foreground">
              {t('orders.vatInvoice.colIndex')}
            </Text>
            <Text variant="caption" className="flex-1 text-muted-foreground">
              {t('orders.vatInvoice.colName')}
            </Text>
            <Text variant="caption" className="w-12 text-muted-foreground">
              {t('orders.vatInvoice.colUnit')}
            </Text>
            <Text variant="caption" className="w-14 text-right text-muted-foreground">
              {t('orders.vatInvoice.colQty')}
            </Text>
            <Text variant="caption" className="w-20 text-right text-muted-foreground">
              {t('orders.vatInvoice.colUnitPrice')}
            </Text>
            <Text variant="caption" className="w-24 text-right text-muted-foreground">
              {t('orders.vatInvoice.colAmount')}
            </Text>
          </View>
          <View className="h-px bg-border" />
          {figures.lines.map((line) => (
            <View key={`${line.index}-${line.name}`} className="flex-row gap-2 py-1">
              <Text variant="caption" className="w-6 text-foreground" numeric="tabular">
                {line.index}
              </Text>
              <Text variant="caption" className="flex-1 text-foreground">
                {line.name}
              </Text>
              <Text variant="caption" className="w-12 text-foreground">
                {line.unit}
              </Text>
              <Text variant="caption" className="w-14 text-right text-foreground" numeric="tabular">
                {line.qty}
              </Text>
              <Text variant="caption" className="w-20 text-right text-foreground" numeric="tabular">
                {formatVND(line.unitPrice)}
              </Text>
              <Text variant="caption" className="w-24 text-right text-foreground" numeric="tabular">
                {formatVND(line.amount)}
              </Text>
            </View>
          ))}
          <View className="h-px bg-border" />
          <TotalRow label={t('orders.vatInvoice.goodsTotal')} value={formatVND(figures.goodsTotal)} bold />
          <TotalRow
            label={fill(t('orders.vatInvoice.taxLine'), { rate: figures.taxRatePercent })}
            value={formatVND(figures.taxTotal)}
          />
          <TotalRow label={t('orders.vatInvoice.grandTotal')} value={formatVND(figures.grandTotal)} bold />
        </View>

        <Text variant="caption" className="text-foreground">
          <Text variant="caption" className="text-muted-foreground">
            {`${t('orders.vatInvoice.inWords')}: `}
          </Text>
          {figures.amountInWords}
        </Text>

        <View className="mt-4 flex-row justify-between gap-6">
          <View className="flex-1 items-center gap-1">
            <Text variant="caption" className="font-semibold text-foreground">
              {t('orders.vatInvoice.buyerSign')}
            </Text>
            <Text variant="caption" className="text-muted-foreground">
              {t('orders.vatInvoice.buyerSignHint')}
            </Text>
          </View>
          <View className="flex-1 items-center gap-1">
            <Text variant="caption" className="font-semibold text-foreground">
              {t('orders.vatInvoice.sellerSign')}
            </Text>
            <Text variant="caption" className="text-muted-foreground">
              {t('orders.vatInvoice.sellerSignHint')}
            </Text>
            <Text variant="caption" className="mt-6 text-foreground">
              {seller?.name ?? ''}
            </Text>
          </View>
        </View>
      </View>

      <View className="self-center rounded-md bg-warning/10 p-4" style={{ maxWidth: 560 }}>
        <View className="flex-row items-center gap-2">
          <AppIcon name="triangle-alert" size={18} tone="warning" />
          <Text variant="label" className="font-semibold text-warning">
            {t('orders.vatInvoice.disclaimerTitle')}
          </Text>
        </View>
        <Text variant="caption" className="mt-1 text-muted-foreground">
          {t('orders.vatInvoice.disclaimer')}
        </Text>
      </View>
    </ScrollView>
  );
}

function InvoiceRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      <Text variant="caption" className="w-36 text-muted-foreground">
        {label}
      </Text>
      <Text
        variant="caption"
        className={`min-w-0 flex-1 ${bold ? 'font-bold text-foreground' : 'text-foreground'}`}
      >
        {value}
      </Text>
    </View>
  );
}

function TotalRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row items-center justify-between gap-3 py-0.5">
      <Text
        variant="caption"
        className={`min-w-0 flex-1 text-right ${bold ? 'font-bold text-foreground' : 'text-muted-foreground'}`}
      >
        {label}
      </Text>
      <Text
        variant="caption"
        className={`w-24 text-right ${bold ? 'font-bold text-foreground' : 'text-foreground'}`}
        numeric="tabular"
      >
        {value}
      </Text>
    </View>
  );
}
