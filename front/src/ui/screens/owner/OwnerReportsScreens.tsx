import type { OwnerProfile, OwnerReport, OwnerReportSummary } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { t } from '@/i18n/t';
import { AmountList, Badge, BarList, Button, Card, DataTable, EmptyState, FieldGrid, Notice, PageHeader, RecordLink, type Column } from '@/ui/primitives';
import { agingKey, agingTone, quarterLabel } from './owner-figures';

interface OwnerReportsScreenProps {
  profile: Pick<OwnerProfile, 'assetName' | 'firstReportExpected'>;
  reports: OwnerReportSummary[];
  fmt: Formatters;
  onOpen: (reportId: string) => void;
  onDownload: (reportId: string) => void;
  downloading: string | null;
}

/** E3.3 · Comptes-rendus : un par trimestre, validé et signé ; le titre ouvre la lecture, le menu le PDF. */
export function OwnerReportsScreen({ profile, reports, fmt, onOpen, onDownload, downloading }: OwnerReportsScreenProps) {
  const columns: Column<OwnerReportSummary>[] = [
    { key: 'title', header: t('owner.reports.col.report'), render: r => <RecordLink onClick={() => onOpen(r.id)}>{t('owner.report.title', { quarter: quarterLabel(r) })}</RecordLink>, sortValue: r => r.periodEnd },
    { key: 'period', header: t('owner.crg.period'), render: r => t('owner.report.period', { from: fmt.shortDate(r.periodStart), to: fmt.shortDate(r.periodEnd) }) },
    { key: 'signed', header: t('owner.crg.signedOn'), render: r => fmt.shortDate(r.signedOn), sortValue: r => r.signedOn },
    { key: 'payout', header: t('owner.revenue.col.payout'), numeric: true, render: r => fmt.moneyPlain(r.payout), sortValue: r => r.payout },
    { key: 'status', header: t('owner.crg.status'), render: () => <Badge tone="success">{t('owner.report.validated')}</Badge> },
  ];
  return (
    <>
      <PageHeader object="report" eyebrow={profile.assetName} title={t('owner.nav.reports')} />
      <Card flush>
        {reports.length === 0 ? (
          <EmptyState icon="chart" title={t('owner.noReport.title')} {...(profile.firstReportExpected ? { body: t('owner.noReport.body', { date: fmt.longDate(profile.firstReportExpected) }) } : {})} trame />
        ) : (
          <DataTable
            caption={t('owner.nav.reports')}
            columns={columns}
            rows={reports}
            rowKey={r => r.id}
            rowActions={r => [
              { label: t('owner.report.read'), onSelect: () => onOpen(r.id) },
              { label: t('owner.crg.export'), onSelect: () => onDownload(r.id), disabled: downloading === r.id },
            ]}
          />
        )}
      </Card>
    </>
  );
}

interface OwnerReportScreenProps {
  assetName: string;
  report: OwnerReport;
  fmt: Formatters;
  onDownload: () => void;
  downloading: boolean;
  downloadFailed: boolean;
  onBack: () => void;
}

const sections = [
  { id: 'owner-collected', label: 'owner.crg.toc.collected' },
  { id: 'owner-unpaid', label: 'owner.crg.toc.unpaid' },
  { id: 'owner-charges', label: 'owner.crg.toc.charges' },
  { id: 'owner-fees', label: 'owner.crg.toc.fees' },
  { id: 'owner-payout', label: 'owner.crg.toc.payout' },
  { id: 'owner-budget', label: 'owner.crg.toc.budget' },
  { id: 'owner-signatories', label: 'owner.crg.toc.signatories' },
] as const;

/** E3.3 · Lecture d'un compte-rendu : sommaire, six sections, signataires, export PDF. */
export function OwnerReportScreen({ assetName, report, fmt, onDownload, downloading, downloadFailed, onBack }: OwnerReportScreenProps) {
  const quarter = quarterLabel(report);
  const agingTotal = report.aging.reduce((sum, a) => sum + a.amount, 0);
  const lines = (items: OwnerReport['charges']) => items.map(line => ({ label: line.label, value: fmt.money(line.amount) }));
  return (
    <>
      <PageHeader
        object="report"
        breadcrumbs={[{ label: t('owner.nav.reports'), onClick: onBack }]}
        eyebrow={t('owner.crg.eyebrow', { asset: assetName })}
        title={t('owner.report.title', { quarter })}
        actions={
          <Button variant="neutral" iconLeading="download" disabled={downloading} onClick={onDownload}>
            {t('owner.crg.export')}
          </Button>
        }
        highlights={[
          { label: t('owner.crg.status'), value: <Badge tone="success">{t('owner.report.validated')}</Badge> },
          { label: t('owner.crg.period'), value: t('owner.report.period', { from: fmt.shortDate(report.periodStart), to: fmt.shortDate(report.periodEnd) }) },
          { label: t('owner.crg.signedOn'), value: fmt.shortDate(report.signedOn) },
          { label: t('owner.crg.payout.total'), value: fmt.money(report.payout) },
        ]}
      />
      {downloadFailed ? <Notice tone="warning" title={t('owner.crg.exportFailed')} actions={<Button variant="neutral" onClick={onDownload}>{t('owner.crg.retry')}</Button>} /> : null}
      <div className="owner-report">
        <nav className="owner-report__toc" aria-label={t('owner.crg.toc')}>
          {sections.map(section => (
            <a key={section.id} href={`#${section.id}`}>
              {t(section.label)}
            </a>
          ))}
        </nav>
        <div className="owner-report__sections">
          <Card id="owner-collected" title={t('owner.crg.collected.title')} meta={t('owner.crg.invoiced', { amount: fmt.money(report.invoiced), rate: fmt.percent(report.collected / report.invoiced) })}>
            <FieldGrid
              columns={2}
              fields={[
                { label: t('owner.crg.collected.sub'), value: fmt.money(report.collected), wide: true },
                { label: t('owner.crg.byItem'), value: <AmountList lines={lines(report.byItem)} /> },
                { label: t('owner.crg.byType'), value: <AmountList lines={lines(report.byType)} /> },
              ]}
            />
          </Card>
          <Card id="owner-unpaid" title={t('owner.crg.unpaid.title')} meta={t('owner.crg.unpaid.sub', { date: fmt.shortDate(report.periodEnd), detail: report.unpaidDetail })}>
            <BarList
              label={t('owner.crg.unpaid.title')}
              items={report.aging.map(bucket => ({ key: bucket.bucket, label: t(agingKey[bucket.bucket]), ratio: bucket.amount / Math.max(1, agingTotal), tone: agingTone[bucket.bucket], display: `${fmt.moneyPlain(bucket.amount)} · ${fmt.percent(bucket.amount / Math.max(1, agingTotal))}` }))}
            />
            <AmountList lines={[]} total={{ label: t('owner.crg.unpaid.total'), value: fmt.money(agingTotal) }} />
            <p className="detail-panel__hint">{report.adjustments}</p>
          </Card>
          <Card id="owner-charges" title={t('owner.crg.charges.title')}>
            <AmountList lines={lines(report.charges)} />
          </Card>
          <Card id="owner-fees" title={t('owner.crg.fees.title')}>
            <AmountList lines={lines(report.fees)} />
          </Card>
          <Card id="owner-payout" title={t('owner.crg.payout.title')}>
            <AmountList lines={lines(report.payoutLines)} total={{ label: t('owner.crg.payout.total'), value: fmt.money(report.payout) }} />
          </Card>
          <Card id="owner-budget" title={t('owner.crg.budget.title', { year: report.year })} meta={t('owner.crg.budget.realised', { quarter: `T${report.quarter}`, amount: fmt.money(report.budgetRealised), rate: fmt.percent(report.budgetRate) })}>
            <BarList label={t('owner.crg.budget.title', { year: report.year })} items={[{ key: 'realised', label: t('owner.crg.budget.bar'), ratio: report.budgetRate, display: fmt.percent(report.budgetRate) }]} />
            <AmountList lines={lines(report.budgetLines)} />
          </Card>
          <Card id="owner-signatories" title={t('owner.crg.toc.signatories')} meta={t('owner.crg.annexes')}>
            <FieldGrid columns={2} fields={report.signatories.map(signatory => ({ label: signatory.role, value: signatory.signedBy }))} />
          </Card>
        </div>
      </div>
    </>
  );
}
