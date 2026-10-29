import { useState } from 'react';
import type {
  DashboardDeadline,
  DashboardKpi,
  DashboardKpiKey,
  DashboardPeriod,
  DashboardPeriodKind,
  DashboardSummary,
  DashboardTask,
  NavigationTarget,
} from '@/services/contracts';
import type { MessageKey } from '@/i18n/fr';
import { exportCsv } from '@/shared/export/csv';
import type { Formatters } from '@/shared/format/formatters';
import { reportStatus } from '@/shared/status';
import { t } from '@/i18n/t';
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Icon,
  Inline,
  KpiRow,
  PageHeader,
  RecordLayout,
  RecordLink,
  SelectInput,
  TextInput,
  Timeline,
  type Column,
} from '@/ui/primitives';

interface DashboardScreenProps {
  firstName: string;
  summary: DashboardSummary;
  fmt: Formatters;
  /** Les indicateurs que le rôle affiche, dans l'ordre (E0.1). */
  kpiKeys: DashboardKpiKey[];
  showPortfolio: boolean;
  /** Date du jour ISO : « Chiffres arrêtés ce matin » quand l'arrêté date d'aujourd'hui. */
  today: string;
  period: DashboardPeriod;
  onPeriod: (period: DashboardPeriod) => void;
  onOpenKpiSource: (key: DashboardKpiKey) => void;
  onOpenAsset: (assetId: string) => void;
  onOpenTarget: (target: NavigationTarget) => void;
  onOpenCalendar: () => void;
}

const kpiLabel: Record<DashboardKpiKey, MessageKey> = {
  occupancy: 'dashboard.kpi.occupancy',
  recovery: 'dashboard.kpi.recovery',
  unpaid: 'dashboard.kpi.unpaid',
  'pre-litigation': 'dashboard.kpi.preLitigation',
  collected: 'dashboard.kpi.collected',
  cheques: 'dashboard.kpi.cheques',
  vacancy: 'dashboard.kpi.vacancy',
  budget: 'dashboard.kpi.budget',
  leases: 'dashboard.kpi.leases',
};
const kpiDefinition: Record<DashboardKpiKey, MessageKey> = {
  occupancy: 'dashboard.def.occupancy',
  recovery: 'dashboard.def.recovery',
  unpaid: 'dashboard.def.unpaid',
  'pre-litigation': 'dashboard.def.preLitigation',
  collected: 'dashboard.def.collected',
  cheques: 'dashboard.def.cheques',
  vacancy: 'dashboard.def.vacancy',
  budget: 'dashboard.def.budget',
  leases: 'dashboard.def.leases',
};
const kpiAction: Record<DashboardKpiKey, MessageKey> = {
  occupancy: 'dashboard.action.vacantLots',
  recovery: 'dashboard.action.openInvoices',
  unpaid: 'dashboard.action.arrears',
  'pre-litigation': 'dashboard.action.files',
  collected: 'dashboard.action.reconcile',
  cheques: 'dashboard.action.cheques',
  vacancy: 'dashboard.action.vacantLots',
  budget: 'dashboard.action.budget',
  leases: 'dashboard.action.leases',
};
const kpiUnit: Partial<Record<DashboardKpiKey, MessageKey>> = {
  'pre-litigation': 'dashboard.unit.files',
  cheques: 'dashboard.unit.cheques',
  leases: 'dashboard.unit.leases',
};
const periods: { kind: DashboardPeriodKind; label: MessageKey }[] = [
  { kind: 'today', label: 'dashboard.period.today' },
  { kind: 'last-quarter', label: 'dashboard.period.lastQuarter' },
  { kind: 'year', label: 'dashboard.period.year' },
  { kind: 'since-start', label: 'dashboard.period.sinceStart' },
  { kind: 'custom', label: 'dashboard.period.custom' },
];

function kpiValue(kpi: DashboardKpi, fmt: Formatters) {
  if (kpi.unit === 'percent')
    return fmt.percent(kpi.value, kpi.value < 0.1 && (kpi.value * 1000) % 10 !== 0 ? 1 : 0);
  if (kpi.unit === 'money') return fmt.moneyCompact(kpi.value);
  return String(kpi.value);
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

const deadlineTone: Record<DashboardDeadline['state'], 'late' | 'warning' | undefined> = {
  late: 'late',
  soon: 'warning',
  upcoming: undefined,
};

function deadlineStatus(deadline: DashboardDeadline): string {
  switch (deadline.state) {
    case 'late':
      return t('status.deadline.late', { days: deadline.days ?? 0 });
    case 'soon':
      return t('status.deadline.inDays', { days: deadline.days ?? 0 });
    case 'upcoming':
      return t('status.deadline.upcoming');
  }
}

export function DashboardScreen({
  firstName,
  summary,
  fmt,
  kpiKeys,
  showPortfolio,
  today,
  period,
  onPeriod,
  onOpenKpiSource,
  onOpenAsset,
  onOpenTarget,
  onOpenCalendar,
}: DashboardScreenProps) {
  const [openKpi, setOpenKpi] = useState<DashboardKpiKey | null>(null);
  const kpis = kpiKeys
    .map(key => summary.kpis.find(kpi => kpi.key === key))
    .filter((kpi): kpi is DashboardKpi => kpi !== undefined);
  const selected = kpis.find(kpi => kpi.key === openKpi) ?? null;
  const totalLots = summary.assets.reduce((sum, row) => sum + row.lotCount, 0);
  const totalUnpaid = summary.assets.reduce((sum, row) => sum + row.unpaidAmount, 0);
  const asOfLabel =
    summary.asOf.slice(0, 10) === today
      ? t('dashboard.figuresThisMorning')
      : t('dashboard.figuresAsOf', { when: fmt.shortDate(summary.asOf) });
  const label = (kpi: DashboardKpi) => t(kpiLabel[kpi.key], { period: kpi.periodLabel });
  const columns: Column<DashboardSummary['assets'][number]>[] = [
    {
      key: 'asset',
      header: t('dashboard.assets.col.asset'),
      sortValue: row => row.assetName,
      render: row => <RecordLink onClick={() => onOpenAsset(row.assetId)}>{row.assetName}</RecordLink>,
    },
    {
      key: 'lots',
      header: t('dashboard.assets.col.lots'),
      numeric: true,
      render: row => row.lotCount,
      sortValue: row => row.lotCount,
    },
    {
      key: 'occupancy',
      header: t('dashboard.assets.col.occupancy'),
      numeric: true,
      render: row => fmt.percent(row.occupancyRate),
      sortValue: row => row.occupancyRate,
    },
    {
      key: 'recovery',
      header: t('dashboard.assets.col.recovery'),
      numeric: true,
      render: row => fmt.percent(row.recoveryRate),
      sortValue: row => row.recoveryRate,
    },
    {
      key: 'unpaid',
      header: t('dashboard.assets.col.unpaid'),
      numeric: true,
      render: row => fmt.moneyPlain(row.unpaidAmount),
      sortValue: row => row.unpaidAmount,
    },
    {
      key: 'report',
      header: t('dashboard.assets.col.report'),
      render: row => (
        <Badge tone={reportStatus[row.reportStatus].tone}>{t(reportStatus[row.reportStatus].labelKey)}</Badge>
      ),
    },
  ];

  const exportAssets = () =>
    exportCsv(
      t('export.filename.dashboard'),
      [
        { header: t('dashboard.assets.col.asset'), value: row => row.assetName },
        { header: t('dashboard.assets.col.lots'), value: row => row.lotCount },
        { header: t('dashboard.assets.col.occupancy'), value: row => fmt.percent(row.occupancyRate) },
        { header: t('dashboard.assets.col.recovery'), value: row => fmt.percent(row.recoveryRate) },
        { header: t('dashboard.assets.col.unpaid'), value: row => row.unpaidAmount },
        {
          header: t('dashboard.assets.col.report'),
          value: row => t(reportStatus[row.reportStatus].labelKey),
        },
      ],
      summary.assets,
    );

  return (
    <>
      <PageHeader
        object="dashboard"
        eyebrow={`${fmt.longDate(today)} · ${asOfLabel}`}
        title={t('dashboard.greeting', { name: firstName })}
        actions={
          <div className="dashboard-period">
            <SelectInput
              id="dashboard-period"
              aria-label={t('dashboard.period.label')}
              value={period.kind}
              onChange={e =>
                onPeriod({ kind: e.target.value as DashboardPeriodKind, from: period.from, to: period.to })
              }
            >
              {periods.map(option => (
                <option key={option.kind} value={option.kind}>
                  {t(option.label)}
                </option>
              ))}
            </SelectInput>
            {period.kind === 'custom' ? (
              <>
                <TextInput
                  id="dashboard-from"
                  type="date"
                  aria-label={t('dashboard.period.from')}
                  value={period.from ?? ''}
                  onChange={e => onPeriod({ ...period, from: e.target.value || null })}
                />
                <TextInput
                  id="dashboard-to"
                  type="date"
                  aria-label={t('dashboard.period.to')}
                  value={period.to ?? ''}
                  onChange={e => onPeriod({ ...period, to: e.target.value || null })}
                />
              </>
            ) : null}
          </div>
        }
      />
      <Card flush>
        <KpiRow
          items={kpis.map(kpi => ({
            key: kpi.key,
            label: label(kpi),
            value: kpiValue(kpi, fmt),
            unit: kpiUnit[kpi.key] ? t(kpiUnit[kpi.key]!) : undefined,
            delta: {
              text: kpi.delta,
              tone: kpi.alert || kpi.trend === 'bad' ? 'bad' : kpi.trend === 'good' ? 'good' : 'neutral',
            },
          }))}
          open={openKpi}
          onToggle={key => setOpenKpi(key as DashboardKpiKey | null)}
          detail={
            selected
              ? {
                  title: label(selected),
                  body: selected.detail,
                  definition: t(kpiDefinition[selected.key]),
                  action: { label: t(kpiAction[selected.key]), onClick: () => onOpenKpiSource(selected.key) },
                }
              : undefined
          }
        />
      </Card>

      <RecordLayout
        main={
          <Card
            title={t('dashboard.tasks.title')}
            meta={
              summary.tasks.length > 0
                ? t('dashboard.tasks.subtitle', { count: summary.tasks.length })
                : undefined
            }
            flush
          >
            {summary.tasks.length === 0 ? (
              <EmptyState icon="check" title={t('dashboard.tasks.empty')} trame />
            ) : (
              summary.tasks.map(task => {
                const body = (
                  <>
                    <div>
                      <div className="task-item__title">{task.title}</div>
                      <div className="task-item__detail">{task.detail}</div>
                    </div>
                    <Inline gap={8}>
                      {taskBadge(task)}
                      {task.target ? <Icon name="chevron-right" /> : null}
                    </Inline>
                  </>
                );
                return task.target ? (
                  <button
                    type="button"
                    className="task-item task-item--link"
                    key={task.id}
                    onClick={() => onOpenTarget(task.target as NavigationTarget)}
                  >
                    {body}
                  </button>
                ) : (
                  <div className="task-item" key={task.id}>
                    {body}
                  </div>
                );
              })
            )}
          </Card>
        }
        aside={
          <Card
            title={t('dashboard.deadlines.title')}
            actions={
              <Button variant="base" iconLeading="calendar" onClick={onOpenCalendar}>
                {t('dashboard.deadlines.calendar')}
              </Button>
            }
            flush
          >
            {summary.deadlines.length === 0 ? (
              <EmptyState
                icon="calendar"
                title={t('dashboard.deadlines.empty')}
                action={
                  <Button variant="neutral" onClick={onOpenCalendar}>
                    {t('dashboard.deadlines.calendar')}
                  </Button>
                }
              />
            ) : (
              <Timeline
                fmt={fmt}
                items={summary.deadlines.map(deadline => ({
                  id: deadline.id,
                  date: deadline.date,
                  title: deadline.title,
                  detail: deadline.detail,
                  status: deadlineStatus(deadline),
                  tone: deadlineTone[deadline.state],
                  onOpen: deadline.target
                    ? () => onOpenTarget(deadline.target as NavigationTarget)
                    : undefined,
                }))}
              />
            )}
          </Card>
        }
      />

      {showPortfolio ? (
        <Card
          title={t('dashboard.assets.title')}
          meta={t('dashboard.assets.subtitle', { assets: summary.assets.length, lots: totalLots })}
          actions={
            <Button variant="neutral" iconLeading="download" onClick={exportAssets}>
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
            footer={[
              t('dashboard.assets.total', { assets: summary.assets.length }),
              totalLots,
              '',
              '',
              fmt.moneyPlain(totalUnpaid),
              '',
            ]}
          />
        </Card>
      ) : null}
    </>
  );
}
