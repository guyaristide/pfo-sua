import { useState } from 'react';
import type { BillingOverview, InvoiceRow } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { invoiceStatus, type InvoiceStatus } from '@/shared/status';
import { t } from '@/i18n/t';
import { Badge, Button, Card, DataTable, EmptyState, FilterPills, ListStatus, PageHeader, ShowMore, Stat, StatRow, useListFilter, type Column } from '@/ui/primitives';

interface BillingScreenProps {
  overview: BillingOverview;
  fmt: Formatters;
  canIssue: boolean;
  onOpenInvoice: (invoiceId: string) => void;
  onPrepare: () => void;
  onIssue: () => void;
}

type Filter = InvoiceStatus | 'all';

/** Facturation trimestrielle (cadrage du 13/10) : campagne en cours, contrôle avant émission, distribution tracée. */
export function BillingScreen({ overview, fmt, canIssue, onOpenInvoice, onPrepare, onIssue }: BillingScreenProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const period = t('period.quarter', { ...overview.campaign.period });
  const scoped = filter === 'all' ? overview.invoices : overview.invoices.filter(i => i.status === filter);
  const list = useListFilter(scoped, row => [row.tenantName, row.assetName]);
  const totalAmount = list.filtered.reduce((sum, row) => sum + row.amount, 0);

  const columns: Column<InvoiceRow>[] = [
    {
      key: 'tenant',
      header: t('billing.col.tenant'),
      render: row => (
        <div>
          <div className="table__primary">{row.tenantName}</div>
          <div className="table__secondary">{row.assetName}</div>
        </div>
      ),
    },
    { key: 'period', header: t('billing.col.period'), render: row => fmt.monthYear(row.periodStart) },
    { key: 'amount', header: t('billing.col.amount'), numeric: true, render: row => fmt.moneyPlain(row.amount) },
    { key: 'due', header: t('billing.col.due'), render: row => fmt.shortDate(row.dueDate) },
    {
      key: 'status',
      header: t('billing.col.status'),
      render: row => <Badge tone={invoiceStatus[row.status].tone}>{t(invoiceStatus[row.status].labelKey)}</Badge>,
    },
    {
      key: 'delivery',
      header: t('billing.col.delivery'),
      render: row => <span className={row.deliveryDetail ? undefined : 'table__secondary'}>{row.deliveryDetail ?? t('billing.delivery.none')}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: row => (
        <div className="table__actions">
          <Button variant="neutral" onClick={() => onOpenInvoice(row.id)}>
            {row.status === 'to-check' && canIssue ? t('billing.action.check') : t('billing.action.open')}
          </Button>
        </div>
      ),
    },
  ];

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: t('billing.filter.all') },
    ...(Object.keys(invoiceStatus) as InvoiceStatus[]).map(key => ({ key, label: t(invoiceStatus[key].labelKey) })),
  ];

  return (
    <>
      <PageHeader
        object="invoice"
        eyebrow={t('billing.subtitle')}
        title={t('billing.title')}
        actions={
          canIssue ? (
            <>
              <Button variant="neutral" onClick={onIssue}>
                {t('billing.action.issue')}
              </Button>
              <Button variant="brand" iconLeading="plus" onClick={onPrepare}>
                {t('billing.action.prepare', { period })}
              </Button>
            </>
          ) : null
        }
      />

      <Card
        title={t('billing.campaign.title', { period })}
        meta={t('billing.campaign.deadlines', { issue: fmt.shortDate(overview.campaign.issueDeadline), due: fmt.shortDate(overview.campaign.dueDate) })}
        flush
      >
        <StatRow>
          <Stat label={t('billing.campaign.issued')} value={overview.campaign.issuedCount} delta={{ text: t('billing.campaign.issued.note', { count: overview.campaign.invoiceCount }), tone: 'neutral' }} />
          <Stat label={t('billing.campaign.toCheck')} value={overview.campaign.toCheckCount} delta={{ text: t('billing.campaign.toCheck.note'), tone: overview.campaign.toCheckCount > 0 ? 'bad' : 'neutral' }} />
          <Stat label={t('billing.campaign.delivered')} value={overview.campaign.deliveredCount} delta={{ text: t('billing.campaign.delivered.note'), tone: 'neutral' }} />
          <Stat label={t('billing.campaign.total')} value={fmt.moneyCompact(overview.campaign.totalAmount)} delta={{ text: t('billing.campaign.total.note'), tone: 'neutral' }} />
        </StatRow>
      </Card>

      <Card title={t('billing.list.title')} flush>
        <ListStatus
          count={list.filtered.length}
          extra={fmt.moneyPlain(totalAmount)}
          search={list.search}
          onSearch={list.setSearch}
          filters={<FilterPills options={filters} value={filter} onChange={setFilter} label={t('billing.col.status')} />}
        />
        {list.filtered.length === 0 ? (
          <EmptyState icon="invoice" title={t('billing.empty.title')} body={t('billing.empty.body')} trame />
        ) : (
          <DataTable
            caption={t('billing.list.title')}
            columns={columns}
            rows={list.visible}
            rowKey={row => row.id}
            footer={[t('billing.total', { count: list.filtered.length }), '', fmt.moneyPlain(totalAmount), '', '', '', '']}
          />
        )}
        <ShowMore hidden={list.hidden} onClick={list.showMore} />
      </Card>
    </>
  );
}
