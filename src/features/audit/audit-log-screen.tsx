import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Badge,
  EmptyState,
  SafeArea,
  Screen,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@beemvp/beeui-ui';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useScreenHeader } from '../../components/shell/screen-header';
import { selectContentHeight } from '../../components/select-content-height';
import { StatStrip } from '../../components/stat-strip';
import { Toolbar } from '../../components/toolbar';
import {
  AUDIT_ACTIONS,
  AUDIT_ACTION_TONE,
  countAuditActions,
  filterAuditEvents,
  isAuditAction,
  isAuditEntity,
  type AuditAction,
  type AuditTone,
} from '../../domain/audit';
import type { AuditEvent } from '../../domain/types';
import { formatDateTime } from '../../lib/datetime';
import { useT } from '../../i18n';
import { fill } from '../orders/lib/fill';
import { useAuditEvents } from '../../data/audit-store';
import { useOrgStore } from '../../data/org-store';

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'px-6' } as const;

/** Badge variant per action tone. Only sensitive acts get colour (mockup section 7). */
const TONE_VARIANT: Record<AuditTone, 'outline' | 'warning' | 'destructive'> = {
  neutral: 'outline',
  warning: 'warning',
  destructive: 'destructive',
};

const ALL = 'all';

/**
 * `/settings/audit`: who did what, when (`docs/design/mockups/chain-ops.html` section 7).
 *
 * Read only, and deliberately so: a log with an edit control on it is not evidence of
 * anything. The route needs `audit.view`, which a cashier does not have; the guard in
 * `app/(app)/_layout.tsx` and the nav list read the same permission, so the screen cannot be
 * reached by typing the URL either.
 */
export function AuditLogScreen() {
  const t = useT();
  const breakpoint = useBreakpoint();
  const isWide = breakpoint !== 'phone';
  const isDesktop = breakpoint === 'desktop';

  const events = useAuditEvents();
  const staffList = useOrgStore((state) => state.staff);

  const [query, setQuery] = useState('');
  const [staffId, setStaffId] = useState<string>(ALL);
  const [action, setAction] = useState<string>(ALL);

  const rows = useMemo(
    () =>
      filterAuditEvents(events, {
        staffId: staffId === ALL ? null : staffId,
        action: action === ALL ? null : (action as AuditAction),
        query,
      }),
    [events, staffId, action, query],
  );
  const counts = useMemo(() => countAuditActions(rows), [rows]);

  useScreenHeader({
    title: t('chain.audit.title'),
    subtitle: fill(t('chain.audit.subtitle'), { count: rows.length }),
  });

  function staffName(id: string): string {
    return staffList.find((member) => member.id === id)?.name ?? id;
  }

  function actionLabel(value: string): string {
    return isAuditAction(value) ? t(`chain.audit.actions.${value}`) : value;
  }

  function entityLabel(event: AuditEvent): string {
    return isAuditEntity(event.entity) ? t(`chain.audit.entities.${event.entity}`) : event.entity;
  }

  function toneOf(value: string): AuditTone {
    return isAuditAction(value) ? AUDIT_ACTION_TONE[value] : 'neutral';
  }

  const searchField = (
    <View className={isDesktop ? 'w-[300px] min-w-60 shrink' : ''}>
      <SearchInput
        accessibilityLabel={t('chain.audit.searchPlaceholder')}
        placeholder={t('chain.audit.searchPlaceholder')}
        onChangeText={setQuery}
        onSearch={setQuery}
      />
    </View>
  );

  const staffSelect = (
    <View className={isWide ? 'w-56' : ''}>
      <Select value={staffId} onValueChange={setStaffId}>
        <SelectTrigger accessibilityLabel={t('chain.audit.filterStaff')}>
          <SelectValue placeholder={t('chain.audit.filterStaffAll')} />
        </SelectTrigger>
        <SelectContent maxHeight={selectContentHeight(staffList.length + 1)}>
          <SelectItem value={ALL} textValue={t('chain.audit.filterStaffAll')}>
            {t('chain.audit.filterStaffAll')}
          </SelectItem>
          {staffList.map((member) => (
            <SelectItem key={member.id} value={member.id} textValue={member.name}>
              {member.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </View>
  );

  const actionSelect = (
    <View className={isWide ? 'w-56' : ''}>
      <Select value={action} onValueChange={setAction}>
        <SelectTrigger accessibilityLabel={t('chain.audit.filterAction')}>
          <SelectValue placeholder={t('chain.audit.filterActionAll')} />
        </SelectTrigger>
        <SelectContent maxHeight={selectContentHeight(AUDIT_ACTIONS.length + 1)}>
          <SelectItem value={ALL} textValue={t('chain.audit.filterActionAll')}>
            {t('chain.audit.filterActionAll')}
          </SelectItem>
          {AUDIT_ACTIONS.map((value) => (
            <SelectItem key={value} value={value} textValue={t(`chain.audit.actions.${value}`)}>
              {t(`chain.audit.actions.${value}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </View>
  );

  const stats = (
    <StatStrip
      layout={isDesktop ? 'row' : 'stacked'}
      items={[
        { label: t('chain.audit.stat.total'), value: String(rows.length) },
        { label: t('chain.audit.stat.void'), value: String(counts.orderVoid), tone: 'destructive' },
        { label: t('chain.audit.stat.refund'), value: String(counts.orderRefund), tone: 'warning' },
        {
          label: t('chain.audit.stat.price'),
          value: String(counts.productPrice + counts.storePrice),
        },
        { label: t('chain.audit.stat.cash'), value: String(counts.cashIn + counts.cashOut) },
      ]}
    />
  );

  const list =
    rows.length === 0 ? (
      <EmptyState
        title={events.length === 0 ? t('chain.audit.empty') : t('chain.audit.noResults')}
        description=""
      />
    ) : isWide ? (
      <Table layout="scroll">
        <TableHeader>
          <TableRow>
            <TableHead label={t('chain.audit.columns.time')}>{t('chain.audit.columns.time')}</TableHead>
            <TableHead label={t('chain.audit.columns.staff')}>{t('chain.audit.columns.staff')}</TableHead>
            <TableHead label={t('chain.audit.columns.action')}>{t('chain.audit.columns.action')}</TableHead>
            <TableHead label={t('chain.audit.columns.entity')}>{t('chain.audit.columns.entity')}</TableHead>
            <TableHead label={t('chain.audit.columns.summary')}>{t('chain.audit.columns.summary')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((event) => (
            <TableRow key={event.id}>
              <TableCell label={t('chain.audit.columns.time')}>
                <Text variant="caption" tone="muted" numeric="tabular">
                  {formatDateTime(new Date(event.createdAt).toISOString())}
                </Text>
              </TableCell>
              <TableCell label={t('chain.audit.columns.staff')}>
                <Text variant="label" className="font-normal">{staffName(event.staffId)}</Text>
              </TableCell>
              <TableCell label={t('chain.audit.columns.action')}>
                <Badge variant={TONE_VARIANT[toneOf(event.action)]}>{actionLabel(event.action)}</Badge>
              </TableCell>
              <TableCell label={t('chain.audit.columns.entity')}>
                {/* `TableCell` lays its children in a row, so the object and its id need a box
                    of their own or they run together as "Đơn hàngHD-HN01-...". */}
                <View className="min-w-0">
                  <Text variant="label" className="font-semibold">{entityLabel(event)}</Text>
                  <Text variant="caption" tone="muted" numeric="tabular" numberOfLines={1}>
                    {event.entityId}
                  </Text>
                </View>
              </TableCell>
              <TableCell label={t('chain.audit.columns.summary')}>
                <Text variant="label" className="font-normal" numberOfLines={2}>{event.summary}</Text>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ) : (
      // The phone reverses the order the mockup gives: badge and time first, the summary as
      // the main line, the person and the object underneath. A list row has one strong line,
      // and on this screen the sentence is what the reader came for.
      <View className="overflow-hidden rounded-lg border border-border bg-surface">
        {rows.map((event) => (
          <View key={event.id} className="gap-1 border-b border-border p-3">
            <View className="flex-row items-center gap-2">
              <Badge variant={TONE_VARIANT[toneOf(event.action)]}>{actionLabel(event.action)}</Badge>
              <Text variant="caption" tone="muted" numeric="tabular">
                {formatDateTime(new Date(event.createdAt).toISOString())}
              </Text>
            </View>
            <Text variant="label" className="font-semibold text-foreground">{event.summary}</Text>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {`${staffName(event.staffId)} · ${event.entityId}`}
            </Text>
          </View>
        ))}
      </View>
    );

  if (isDesktop) {
    return (
      <Screen>
        <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
          <View className={`border-b border-border bg-surface ${GUTTER.desktop}`}>
            <Toolbar
              search={searchField}
              activeFilterCount={(staffId === ALL ? 0 : 1) + (action === ALL ? 0 : 1)}
            >
              {staffSelect}
              {actionSelect}
            </Toolbar>
          </View>
          <View className={GUTTER.desktop}>{stats}</View>
          <ScrollView className="min-h-0 flex-1" contentContainerClassName="pb-6">
            <View className={GUTTER.desktop}>{list}</View>
          </ScrollView>
        </SafeArea>
      </Screen>
    );
  }

  return (
    <Screen>
      <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
        <ScrollView className="flex-1">
          <View className={`flex-1 gap-4 ${GUTTER[breakpoint]}`}>
            {searchField}
            <View className={isWide ? 'flex-row items-center gap-2' : 'gap-2'}>
              {staffSelect}
              {actionSelect}
            </View>
            {stats}
            {list}
          </View>
        </ScrollView>
      </SafeArea>
    </Screen>
  );
}
