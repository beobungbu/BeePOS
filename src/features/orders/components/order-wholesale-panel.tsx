import { View } from 'react-native';
import {
  Badge,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@beemvp/beeui-ui';
import { useTableRowClass } from '../../../components/table-row-density';
import { formatVND } from '../../../domain/money';
import type { Customer, DeliveryNote, Order, Product, Staff } from '../../../domain/types';
import { useT } from '../../../i18n';
import { formatDate } from '../../../lib/datetime';
import { unitConversionText } from '../../pos/lib/wholesale';
import type { DeliveryProgress } from '../lib/delivery';

interface OrderWholesalePanelProps {
  order: Order;
  progress: DeliveryProgress;
  products: Product[];
  notes: DeliveryNote[];
  customer: Customer | undefined;
  rep: Staff | undefined;
  onMarkDelivered: (noteId: string) => void;
}

/**
 * The wholesale half of the order detail: how much of each line has arrived, and the delivery
 * notes that carried it.
 *
 * `Còn lại` is a warning-coloured column rather than a badge of its own
 * (`docs/design/specs/commerce.md` section G): partial delivery is normal in wholesale, so
 * the state belongs in the number rather than in an exception marker beside it.
 */
export function OrderWholesalePanel({
  order,
  progress,
  products,
  notes,
  customer,
  rep,
  onMarkDelivered,
}: OrderWholesalePanelProps) {
  const t = useT();
  const rowClass = useTableRowClass();
  const nameOf = (productId: string) =>
    products.find((product) => product.id === productId)?.name ?? productId;

  return (
    <View className="gap-4">
      <Card className="gap-3">
        <Text variant="label" className="font-semibold text-foreground">
          {t('orders.lifecycle.title')}
        </Text>
        <View className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead label={t('orders.detail.lines')}>{t('orders.detail.lines')}</TableHead>
                <TableHead className="items-end text-right" label={t('orders.delivery.ordered')}>
                  {t('orders.delivery.ordered')}
                </TableHead>
                <TableHead className="items-end text-right" label={t('orders.delivery.deliveredQty')}>
                  {t('orders.delivery.deliveredQty')}
                </TableHead>
                <TableHead className="items-end text-right" label={t('orders.delivery.remaining')}>
                  {t('orders.delivery.remaining')}
                </TableHead>
                <TableHead className="items-end text-right" label={t('orders.detail.total')}>
                  {t('orders.detail.total')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {progress.lines.map((row) => (
                <TableRow className={rowClass} key={row.line.productId}>
                  <TableCell label={t('orders.detail.lines')}>
                    <View className="gap-0.5">
                      <Text variant="label" className="font-semibold text-foreground" numberOfLines={2}>
                        {nameOf(row.line.productId)}
                      </Text>
                      <Text variant="caption" className="text-muted-foreground">
                        {unitConversionText(
                          products.find((product) => product.id === row.line.productId),
                          row.line,
                        )}
                      </Text>
                    </View>
                  </TableCell>
                  <TableCell className="items-end text-right" label={t('orders.delivery.ordered')}>
                    <Text variant="label" className="text-right font-normal text-foreground" numeric="tabular">
                      {row.orderedQty}
                    </Text>
                  </TableCell>
                  <TableCell className="items-end text-right" label={t('orders.delivery.deliveredQty')}>
                    <Text variant="label" className="text-right font-semibold text-foreground" numeric="tabular">
                      {row.deliveredQty}
                    </Text>
                  </TableCell>
                  <TableCell className="items-end text-right" label={t('orders.delivery.remaining')}>
                    <Text
                      variant="label"
                      className={`text-right font-normal tabular-nums ${
                        row.remainingQty > 0 ? 'text-warning' : 'text-subtle-foreground'
                      }`}
                    >
                      {row.remainingQty}
                    </Text>
                  </TableCell>
                  <TableCell className="items-end text-right" label={t('orders.detail.total')}>
                    <Text variant="label" className="text-right font-normal text-foreground" numeric="tabular">
                      {formatVND(row.lineTotal)}
                    </Text>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </View>
        <Text variant="caption" className="text-muted-foreground">
          {`${t('orders.lifecycle.delivered')} ${formatVND(progress.deliveredValue)} · ${t(
            'orders.lifecycle.pendingValue',
          )} ${formatVND(progress.pendingValue)} · ${t('orders.detail.total')} ${formatVND(order.total)}`}
        </Text>
      </Card>

      <Card className="gap-3">
        <Text variant="label" className="font-semibold text-foreground">
          {t('orders.delivery.title')}
        </Text>
        {notes.length === 0 ? (
          <Text variant="caption" className="text-muted-foreground">
            {t('orders.delivery.empty')}
          </Text>
        ) : (
          notes.map((note) => (
            <View
              key={note.id}
              className="flex-row flex-wrap items-center gap-2 border-b border-border pb-2 last:border-b-0"
            >
              <View className="min-w-0 flex-1 gap-0.5">
                <Text variant="label" className="font-semibold text-foreground" numberOfLines={1}>
                  {note.id}
                </Text>
                <Text variant="caption" className="text-muted-foreground" numberOfLines={2}>
                  {note.lines
                    .map((line) => `${nameOf(line.productId)} ${line.qty}`)
                    .join(', ')}
                </Text>
                {note.deliveredAt ? (
                  <Text variant="caption" className="text-subtle-foreground" numeric="tabular">
                    {formatDate(note.deliveredAt.toISOString())}
                  </Text>
                ) : null}
              </View>
              <Badge variant={note.status === 'delivered' ? 'success' : 'warning'}>
                {note.status === 'delivered'
                  ? t('orders.delivery.statusDelivered')
                  : t('orders.delivery.statusPending')}
              </Badge>
              {note.status === 'pending' ? (
                <Button size="sm" onPress={() => onMarkDelivered(note.id)}>
                  {t('orders.delivery.markDelivered')}
                </Button>
              ) : null}
            </View>
          ))
        )}
      </Card>

      <Card className="gap-2">
        <Text variant="label" className="font-semibold text-foreground">
          {t('orders.delivery.deliverTo')}
        </Text>
        <Text variant="label" className="font-normal text-foreground">
          {order.deliveryAddress ?? customer?.deliveryAddress ?? '-'}
        </Text>
        <Text variant="caption" className="text-muted-foreground">
          {[customer?.contactName, customer?.phone].filter(Boolean).join(' · ')}
        </Text>
        <Text variant="caption" className="text-muted-foreground">
          {`${t('orders.lifecycle.salesRep')}: ${rep?.name ?? t('orders.lifecycle.noRep')}`}
        </Text>
      </Card>
    </View>
  );
}
