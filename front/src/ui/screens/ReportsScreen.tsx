import { useState } from 'react';
import type { ReportRow, ReportsOverview } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { reportStatus, type ReportStatus } from '@/shared/status';
import { t } from '@/i18n/t';
import { Badge, Button, Card, EmptyState, ListBody, PageHeader, RecordLink, type Column } from '@/ui/primitives';

interface ReportsScreenProps {
  overview: ReportsOverview;
  fmt: Formatters;
  canValidate: boolean;
  onOpen: (reportId: string) => void;
  onGenerate: () => void;
  generating: boolean;
}

type Filter = ReportStatus | 'all';

function rowActionLabel(row: ReportRow, canValidate: boolean) {
  return row.status === 'in-review' ? t('reports.action.review') : row.status === 'validated' && canValidate ? t('reports.action.validate') : t('reports.action.open');
}

/** CRG côté PFO : un compte rendu par actif et par trimestre, du brouillon à la signature (procédure CRG v3). */
export function ReportsScreen({ overview, fmt, canValidate, onOpen, onGenerate, generating }: ReportsScreenProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const currentPeriod = t('period.quarter', { ...overview.currentPeriod });
  const scoped = filter === 'all' ? overview.rows : overview.rows.filter(r => r.status === filter);
  const totalOf = (rows: ReportRow[]) => rows.reduce((sum, row) => sum + (row.amountToTransfer ?? 0), 0);

  const columns: Column<ReportRow>[] = [
    { key: 'asset', header: t('reports.col.asset'), render: row => <RecordLink onClick={() => onOpen(row.id)}>{row.assetName}</RecordLink>, sortValue: row => row.assetName },
    { key: 'period', header: t('reports.col.period'), render: row => t('period.quarter', { ...row.period }) },
    {
      key: 'status',
      header: t('reports.col.status'),
      render: row => (
        <div>
          <Badge tone={reportStatus[row.status].tone}>{t(reportStatus[row.status].labelKey)}</Badge>
          <div className="table__secondary">{row.stepDetail}</div>
        </div>
      ),
    },
    { key: 'preparedBy', header: t('reports.col.preparedBy'), render: row => row.preparedBy },
    { key: 'due', header: t('reports.col.due'), render: row => fmt.shortDate(row.dueDate) },
    {
      key: 'amount',
      header: t('reports.col.amount'),
      numeric: true,
      render: row => (row.amountToTransfer === null ? <span className="table__secondary">{t('reports.amount.pending')}</span> : fmt.moneyPlain(row.amountToTransfer)),
    },
  ];

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: t('reports.filter.all') },
    ...(Object.keys(reportStatus) as ReportStatus[]).map(key => ({ key, label: t(reportStatus[key].labelKey) })),
  ];

  return (
    <>
      <PageHeader
        object="report"
        eyebrow={t('reports.subtitle')}
        title={t('reports.title')}
        actions={
          canValidate ? (
            <Button variant="brand" iconLeading="plus" disabled={generating} onClick={onGenerate}>
              {t('reports.action.generate', { period: currentPeriod })}
            </Button>
          ) : null
        }
      />
      <Card title={t('reports.list.title', { period: currentPeriod })} flush>
        <ListBody
          rows={scoped}
          haystack={row => [row.assetName, t('period.quarter', { ...row.period })]}
          columns={columns}
          rowKey={row => row.id}
          rowActions={row => [{ label: rowActionLabel(row, canValidate), onSelect: () => onOpen(row.id) }]}
          caption={t('reports.title')}
          filters={{ options: filters, value: filter, onChange: setFilter, label: t('reports.col.status') }}
          extra={rows => `${fmt.moneyPlain(totalOf(rows))} (${rows.filter(row => row.amountToTransfer !== null).length})`}
          footer={rows => [t('reports.total', { count: rows.length }), '', '', '', '', fmt.moneyPlain(totalOf(rows))]}
          empty={<EmptyState icon="chart" title={t('reports.empty.title')} body={t('reports.empty.body')} trame action={canValidate ? <Button variant="neutral" disabled={generating} onClick={onGenerate}>{t('reports.action.generate', { period: currentPeriod })}</Button> : null} />}
        />
      </Card>
    </>
  );
}
