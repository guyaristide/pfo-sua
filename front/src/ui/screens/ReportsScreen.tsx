import { useState } from 'react';
import type { ReportRow, ReportsOverview } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { reportStatus, type ReportStatus } from '@/shared/status';
import { t } from '@/i18n/t';
import { Badge, Button, Card, DataTable, EmptyState, FilterPills, ListStatus, PageHeader, ShowMore, useListFilter, type Column } from '@/ui/primitives';

interface ReportsScreenProps {
  overview: ReportsOverview;
  fmt: Formatters;
  canValidate: boolean;
  onOpen: (reportId: string) => void;
  onGenerate: () => void;
  generating: boolean;
}

type Filter = ReportStatus | 'all';

function rowAction(row: ReportRow, canValidate: boolean, onOpen: (reportId: string) => void) {
  const label = row.status === 'in-review' ? t('reports.action.review') : row.status === 'validated' && canValidate ? t('reports.action.validate') : t('reports.action.open');
  return (
    <Button variant={row.status === 'validated' && canValidate ? 'brand' : 'neutral'} onClick={() => onOpen(row.id)}>
      {label}
    </Button>
  );
}

/** CRG côté PFO : un compte rendu par actif et par trimestre, du brouillon à la signature (procédure CRG v3). */
export function ReportsScreen({ overview, fmt, canValidate, onOpen, onGenerate, generating }: ReportsScreenProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const currentPeriod = t('period.quarter', { ...overview.currentPeriod });
  const scoped = filter === 'all' ? overview.rows : overview.rows.filter(r => r.status === filter);
  const list = useListFilter(scoped, row => [row.assetName, t('period.quarter', { ...row.period })]);
  const totalToTransfer = list.filtered.reduce((sum, row) => sum + (row.amountToTransfer ?? 0), 0);
  const computedCount = list.filtered.filter(row => row.amountToTransfer !== null).length;

  const columns: Column<ReportRow>[] = [
    { key: 'asset', header: t('reports.col.asset'), render: row => <span className="table__primary">{row.assetName}</span> },
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
    { key: 'actions', header: '', render: row => <div className="table__actions">{rowAction(row, canValidate, onOpen)}</div> },
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
        <ListStatus
          count={list.filtered.length}
          extra={`${fmt.moneyPlain(totalToTransfer)} (${computedCount})`}
          search={list.search}
          onSearch={list.setSearch}
          filters={<FilterPills options={filters} value={filter} onChange={setFilter} label={t('reports.col.status')} />}
        />
        {list.filtered.length === 0 ? (
          <EmptyState icon="chart" title={t('reports.empty.title')} body={t('reports.empty.body')} trame />
        ) : (
          <DataTable
            caption={t('reports.title')}
            columns={columns}
            rows={list.visible}
            rowKey={row => row.id}
            footer={[t('reports.total', { count: list.filtered.length }), '', '', '', '', fmt.moneyPlain(totalToTransfer), '']}
          />
        )}
        <ShowMore hidden={list.hidden} onClick={list.showMore} />
      </Card>
    </>
  );
}
