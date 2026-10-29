import { useState } from 'react';
import type { ArrearsOverview, ArrearsRow } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { arrearsBucket, reminderLevel, type ArrearsBucket } from '@/shared/status';
import { t } from '@/i18n/t';
import { exportCsv } from '@/shared/export/csv';
import { Badge, Button, Card, EmptyState, ListBody, PageHeader, RecordLink, Stat, StatRow, type Column } from '@/ui/primitives';

interface ArrearsScreenProps {
  overview: ArrearsOverview;
  fmt: Formatters;
  canRemind: boolean;
  onRemind: (tenantId: string) => void;
  onOpen: (tenantId: string) => void;
}

type Filter = ArrearsBucket | 'all';

/** Impayés : point à date, tranches 30 / 60 / 90 jours du tableau direction, niveau de relance par locataire. */
export function ArrearsScreen({ overview, fmt, canRemind, onRemind, onOpen }: ArrearsScreenProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const scoped = filter === 'all' ? overview.rows : overview.rows.filter(r => r.bucket === filter);
  const totalOf = (rows: ArrearsRow[]) => rows.reduce((sum, row) => sum + row.amountDue, 0);

  const columns: Column<ArrearsRow>[] = [
    {
      key: 'tenant',
      header: t('arrears.col.tenant'),
      render: row => (
        <div>
          <RecordLink onClick={() => onOpen(row.tenantId)}>{row.tenantName}</RecordLink>
          <div className="table__secondary">{row.assetName}</div>
        </div>
      ),
    },
    { key: 'due', header: t('arrears.col.due'), numeric: true, render: row => fmt.moneyPlain(row.amountDue) },
    { key: 'lateDays', header: t('arrears.col.lateDays'), numeric: true, render: row => t('arrears.lateDays', { days: row.lateDays }) },
    {
      key: 'bucket',
      header: t('arrears.col.bucket'),
      render: row => <Badge tone={arrearsBucket[row.bucket].tone}>{t(arrearsBucket[row.bucket].labelKey)}</Badge>,
    },
    {
      key: 'lastPayment',
      header: t('arrears.col.lastPayment'),
      render: row => (row.lastPaymentDate ? fmt.shortDate(row.lastPaymentDate) : <span className="table__secondary">{t('arrears.lastPayment.none')}</span>),
    },
    {
      key: 'reminder',
      header: t('arrears.col.reminder'),
      render: row => <Badge tone={reminderLevel[row.reminderLevel].tone}>{t(reminderLevel[row.reminderLevel].labelKey)}</Badge>,
    },
  ];

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: t('arrears.filter.all') },
    ...(Object.keys(arrearsBucket) as ArrearsBucket[]).map(key => ({ key, label: t(arrearsBucket[key].labelKey) })),
  ];

  return (
    <>
      <PageHeader
        object="arrears"
        eyebrow={t('arrears.asOf', { date: fmt.longDate(overview.asOf) })}
        title={t('arrears.title')}
        actions={
          <Button
            variant="neutral"
            iconLeading="download"
            onClick={() =>
              exportCsv(
                t('export.filename.arrears'),
                [
                  { header: t('arrears.col.tenant'), value: row => row.tenantName },
                  { header: t('arrears.col.asset'), value: row => row.assetName },
                  { header: t('arrears.col.due'), value: row => row.amountDue },
                  { header: t('arrears.col.lateDays'), value: row => row.lateDays },
                  { header: t('arrears.col.bucket'), value: row => t(arrearsBucket[row.bucket].labelKey) },
                  { header: t('arrears.col.lastPayment'), value: row => (row.lastPaymentDate ? fmt.shortDate(row.lastPaymentDate) : '') },
                  { header: t('arrears.col.reminder'), value: row => t(reminderLevel[row.reminderLevel].labelKey) },
                ],
                scoped,
              )
            }
          >
            {t('arrears.action.export')}
          </Button>
        }
      />

      <Card flush>
        <StatRow>
          <Stat label={t('arrears.kpi.total')} value={fmt.moneyCompact(overview.totalDue)} delta={{ text: t('arrears.total', { count: overview.rows.length }), tone: 'neutral' }} />
          <Stat label={t('arrears.kpi.rate')} value={fmt.percent(overview.unpaidRate)} />
          <Stat label={t('arrears.kpi.preLitigation')} value={overview.preLitigationCount} unit={t('arrears.kpi.preLitigation.unit')} delta={{ text: t('status.reminder.preLitigation'), tone: overview.preLitigationCount > 0 ? 'bad' : 'neutral' }} />
          <Stat icon="calendar" label={t('arrears.kpi.direction')} value={fmt.shortDate(overview.directionReportDate)} delta={{ text: t('arrears.kpi.direction.note'), tone: 'neutral' }} />
        </StatRow>
      </Card>

      <Card title={t('arrears.list.title')} flush>
        <ListBody
          rows={scoped}
          haystack={row => [row.tenantName, row.assetName]}
          columns={columns}
          rowKey={row => row.id}
          rowActions={row => [{ label: t('arrears.action.open'), onSelect: () => onOpen(row.tenantId) }, ...(canRemind && row.reminderLevel !== 'pre-litigation' ? [{ label: t('arrears.action.remind'), onSelect: () => onRemind(row.tenantId) }] : [])]}
          caption={t('arrears.list.title')}
          filters={{ options: filters, value: filter, onChange: setFilter, label: t('arrears.col.bucket') }}
          extra={rows => fmt.moneyPlain(totalOf(rows))}
          footer={rows => [t('arrears.total', { count: rows.length }), fmt.moneyPlain(totalOf(rows)), '', '', '', '']}
          empty={<EmptyState icon="bell" title={t('arrears.empty.title')} body={t('arrears.empty.body')} trame />}
        />
      </Card>
    </>
  );
}
