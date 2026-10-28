import type { DashboardDeadline, DashboardSummary, DashboardTask, NavigationTarget } from '@/services/contracts';
import { exportCsv } from '@/shared/export/csv';
import type { Formatters } from '@/shared/format/formatters';
import { reportStatus } from '@/shared/status';
import { t } from '@/i18n/t';
import { Badge, Button, Card, DataTable, Icon, Stat, StatRow, type Column } from '@/ui/primitives';

interface DashboardScreenProps {
  firstName: string;
  summary: DashboardSummary;
  fmt: Formatters;
  onOpenAsset: (assetId: string) => void;
  onOpenTarget: (target: NavigationTarget) => void;
  onOpenCalendar: () => void;
}

function deltaOf(indicator: { deltaPoints?: number; comparedToMonth?: string }, fmt: Formatters, lowerIsBetter: boolean) {
  if (indicator.deltaPoints === undefined || !indicator.comparedToMonth) {
    return indicator.comparedToMonth
      ? { text: t('dashboard.kpi.stable', { month: fmt.monthYear(indicator.comparedToMonth) }), tone: 'neutral' as const }
      : undefined;
  }
  const improved = lowerIsBetter ? indicator.deltaPoints < 0 : indicator.deltaPoints > 0;
  return {
    text: t('dashboard.kpi.delta.sinceLastMonth', {
      delta: fmt.signedPoints(indicator.deltaPoints),
      month: fmt.monthYear(indicator.comparedToMonth),
    }),
    tone: improved ? ('good' as const) : ('bad' as const),
  };
}

function taskBadge(task: DashboardTask) {
  switch (task.urgency) {
    case 'late':
      return <Badge tone="danger">{t('status.task.late', { days: task.lateDays ?? 0 })}</Badge>;
    case 'to-validate':
      return <Badge tone="warning">{t('status.task.toValidate')}</Badge>;
    case 'this-week':
      return <Badge tone="neutral">{t('status.task.thisWeek')}</Badge>;
  }
}

function deadlineLabel(deadline: DashboardDeadline) {
  switch (deadline.state) {
    case 'late':
      return <span className="stat__delta stat__delta--bad">{t('status.deadline.late', { days: deadline.days ?? 0 })}</span>;
    case 'soon':
      return <span className="stat__delta" style={{ color: 'var(--status-warning)' }}>{t('status.deadline.inDays', { days: deadline.days ?? 0 })}</span>;
    case 'upcoming':
      return <span className="stat__delta stat__delta--neutral">{t('status.deadline.upcoming')}</span>;
  }
}

export function DashboardScreen({ firstName, summary, fmt, onOpenAsset, onOpenTarget, onOpenCalendar }: DashboardScreenProps) {
  const totalLots = summary.assets.reduce((sum, row) => sum + row.lotCount, 0);
  const totalUnpaid = summary.assets.reduce((sum, row) => sum + row.unpaidAmount, 0);
  const columns: Column<DashboardSummary['assets'][number]>[] = [
    {
      key: 'asset',
      header: t('dashboard.assets.col.asset'),
      render: row => (
        <button type="button" className="btn btn--base" style={{ padding: 0, fontWeight: 700 }} onClick={() => onOpenAsset(row.assetId)}>
          {row.assetName}
        </button>
      ),
    },
    { key: 'lots', header: t('dashboard.assets.col.lots'), numeric: true, render: row => row.lotCount },
    { key: 'occupancy', header: t('dashboard.assets.col.occupancy'), numeric: true, render: row => fmt.percent(row.occupancyRate) },
    { key: 'recovery', header: t('dashboard.assets.col.recovery'), numeric: true, render: row => fmt.percent(row.recoveryRate) },
    { key: 'unpaid', header: t('dashboard.assets.col.unpaid'), numeric: true, render: row => fmt.moneyPlain(row.unpaidAmount) },
    {
      key: 'report',
      header: t('dashboard.assets.col.report'),
      render: row => <Badge tone={reportStatus[row.reportStatus].tone}>{t(reportStatus[row.reportStatus].labelKey)}</Badge>,
    },
  ];

  return (
    <>
      <Card
        title={t('dashboard.greeting', { name: firstName })}
        meta={`${fmt.longDate(summary.asOf)} · ${t('dashboard.figuresAsOf', { when: fmt.shortDate(summary.asOf) })}`}
        flush
      >
        <StatRow>
          <Stat icon="chart" label={t('dashboard.kpi.vacancyRate')} value={fmt.percent(summary.vacancyRate.value)} delta={deltaOf(summary.vacancyRate, fmt, true)} />
          <Stat icon="bell" label={t('dashboard.kpi.unpaidRate')} value={fmt.percent(summary.unpaidRate.value, 1)} delta={deltaOf(summary.unpaidRate, fmt, true)} />
          <Stat
            icon="folder"
            label={t('dashboard.kpi.preLitigation')}
            value={summary.preLitigationCount.value}
            unit={t('dashboard.kpi.preLitigation.unit')}
            delta={deltaOf(summary.preLitigationCount, fmt, true)}
          />
          <Stat
            icon="tag"
            label={t('dashboard.kpi.budgetRealisation', { year: summary.period.year })}
            value={fmt.percent(summary.budgetRealisationRate.value)}
            delta={{ text: t('dashboard.kpi.asOf', { date: fmt.shortDate(summary.budgetRealisationRate.asOfDate) }), tone: 'neutral' }}
          />
        </StatRow>
      </Card>

      <div className="layout-two">
        <Card title={t('dashboard.tasks.title')} meta={t('dashboard.tasks.subtitle', { count: summary.tasks.length })} flush>
          {summary.tasks.map(task => (
            <button type="button" className="task-item task-item--link" key={task.id} onClick={() => (task.target ? onOpenTarget(task.target) : undefined)}>
              <div>
                <div className="task-item__title">{task.title}</div>
                <div className="task-item__detail">{task.detail}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {taskBadge(task)}
                {task.target ? <Icon name="chevron-right" /> : null}
              </div>
            </button>
          ))}
        </Card>
        <Card
          title={t('dashboard.deadlines.title')}
          actions={
            <Button variant="base" iconLeading="calendar" onClick={onOpenCalendar}>
              {t('dashboard.deadlines.calendar')}
            </Button>
          }
          flush
        >
          {summary.deadlines.map(deadline => {
            const { day, month } = fmt.dayMonth(deadline.date);
            return (
              <button type="button" className="timeline-item task-item--link" key={deadline.id} onClick={() => (deadline.target ? onOpenTarget(deadline.target) : undefined)}>
                <div>
                  <div className={deadline.state === 'late' ? 'timeline-item__day timeline-item__day--late' : 'timeline-item__day'}>{day}</div>
                  <div className="timeline-item__month">{month}</div>
                </div>
                <div>
                  <div className="timeline-item__title">{deadline.title}</div>
                  <div className="timeline-item__detail">{deadline.detail}</div>
                  {deadlineLabel(deadline)}
                </div>
              </button>
            );
          })}
        </Card>
      </div>

      <Card
        title={t('dashboard.assets.title')}
        meta={t('dashboard.assets.subtitle', { assets: summary.assets.length, lots: totalLots })}
        actions={
          <Button
            variant="neutral"
            iconLeading="download"
            onClick={() =>
              exportCsv(
                t('export.filename.dashboard'),
                [
                  { header: t('dashboard.assets.col.asset'), value: row => row.assetName },
                  { header: t('dashboard.assets.col.lots'), value: row => row.lotCount },
                  { header: t('dashboard.assets.col.occupancy'), value: row => fmt.percent(row.occupancyRate) },
                  { header: t('dashboard.assets.col.recovery'), value: row => fmt.percent(row.recoveryRate) },
                  { header: t('dashboard.assets.col.unpaid'), value: row => row.unpaidAmount },
                  { header: t('dashboard.assets.col.report'), value: row => t(reportStatus[row.reportStatus].labelKey) },
                ],
                summary.assets,
              )
            }
          >
            {t('list.export.excel')}
          </Button>
        }
        flush
      >
        <DataTable
          caption={t('dashboard.assets.title')}
          columns={columns}
          rows={summary.assets}
          rowKey={row => row.assetId}
          footer={[t('dashboard.assets.total', { assets: summary.assets.length }), totalLots, '', '', fmt.moneyPlain(totalUnpaid), '']}
        />
      </Card>
    </>
  );
}
