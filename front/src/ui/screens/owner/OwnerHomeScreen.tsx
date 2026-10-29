import { useState } from 'react';
import type { OwnerHome } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import type { MessageKey } from '@/i18n/fr';
import { t } from '@/i18n/t';
import { Badge, BarList, Button, Card, DataTable, KpiRow, Notice, PageHeader, RecordLayout, RecordLink, RelatedList, SelectInput, Timeline, type Column } from '@/ui/primitives';
import { agingKey, agingTone, periodFromKey, periodKey, quarterLabel, reportsIn, totals, type OwnerPeriod } from './owner-figures';

interface OwnerHomeScreenProps {
  home: OwnerHome;
  fmt: Formatters;
  period: OwnerPeriod;
  onPeriod: (period: OwnerPeriod) => void;
  onOpenReport: (reportId: string) => void;
  onOpenReports: () => void;
  onOpenLots: () => void;
}

type KpiKey = 'payout' | 'occupancy' | 'recovery' | 'unpaid';
const kpiDefinition: Record<Exclude<KpiKey, 'payout'>, MessageKey> = { occupancy: 'owner.def.occupancy', recovery: 'owner.def.recovery', unpaid: 'owner.def.unpaid' };

/** E3.2 · Accueil : l'actif et ses interlocuteurs, le trimestre en bref, les comptes-rendus, revenus et impayés, occupation et à venir. */
export function OwnerHomeScreen({ home, fmt, period, onPeriod, onOpenReport, onOpenReports, onOpenLots }: OwnerHomeScreenProps) {
  const [openKpi, setOpenKpi] = useState<KpiKey | null>(null);
  const { profile } = home;
  const inRange = reportsIn(home.reports, period);
  const latest = inRange[0] ?? null;
  const cumulative = inRange.length > 1;
  const sum = totals(inRange);
  const current = home.reports[0] ?? null;

  const contacts = (
    <Card title={t('owner.contacts.title')}>
      {profile.contacts.map(contact => (
        <div key={contact.email} className="owner-contact">
          <div className="table__strong">{`${contact.name} · ${contact.role}`}</div>
          <div className="owner-contact__line">{`${contact.phone} · ${contact.email}`}</div>
        </div>
      ))}
    </Card>
  );
  const occupancy = (
    <Card title={t('owner.occupancy.title')} actions={<Button variant="neutral" onClick={onOpenLots}>{t('owner.occupancy.lots')}</Button>}>
      <BarList label={t('owner.occupancy.title')} items={home.buildings.map(b => ({ key: b.key, label: b.name, ratio: b.occupied / Math.max(1, b.lots), display: `${b.occupied} / ${b.lots}` }))} />
    </Card>
  );
  const vacant =
    home.vacantLots.length > 0 ? (
      <RelatedList
        title={t('owner.vacant.list')}
        max={3}
        items={home.vacantLots.map(lot => ({ id: lot.code, label: lot.code, meta: t('owner.vacant.meta', { type: lot.type, area: fmt.number(lot.area), since: lot.since ? fmt.shortDate(lot.since) : '-' }) }))}
        viewAll={{ label: t('owner.occupancy.lots'), onClick: onOpenLots }}
        empty={{ title: t('owner.lots.empty') }}
      />
    ) : null;
  const upcoming = (
    <Card title={current ? t('owner.upcoming.title') : t('owner.firstSteps.title')} flush>
      <Timeline fmt={fmt} items={home.upcoming.map((item, index) => ({ id: String(index), date: item.date, title: item.title, detail: item.detail }))} />
    </Card>
  );
  const header = <PageHeader object="asset" eyebrow={profile.sciName} title={profile.assetName} highlights={[{ label: t('owner.asset.description'), value: profile.assetDescription }]} />;

  if (!latest || !current) {
    return (
      <>
        {header}
        <Notice tone="info" title={t('owner.noReport.title')}>
          {profile.firstReportExpected ? t('owner.noReport.body', { date: fmt.longDate(profile.firstReportExpected) }) : null}
        </Notice>
        <Card flush>
          <KpiRow
            items={[
              { key: 'lots', label: t('owner.new.lots'), value: home.lotCount },
              { key: 'signed', label: t('owner.new.signed'), value: home.signedCount },
              { key: 'vacant', label: t('owner.new.vacant'), value: home.lotCount - home.signedCount - home.occupiedCount },
            ]}
          />
        </Card>
        <RecordLayout main={upcoming} aside={<>{contacts}{occupancy}</>} />
      </>
    );
  }

  const four = home.reports.slice(0, 4).reverse();
  const four12 = totals(four);
  const previous = home.reports[1] ?? null;
  const agingTotal = latest.aging.reduce((s, a) => s + a.amount, 0);
  const options = [
    ...home.reports.map((r, index) => ({ key: String(index), label: index === 0 ? t('owner.period.latest', { quarter: quarterLabel(r) }) : quarterLabel(r) })),
    { key: 'year', label: t('owner.period.year', { year: current.year }) },
    { key: 'all', label: t('owner.period.all') },
  ];
  const payoutLabel = cumulative ? t('owner.hero.cumulative', { period: period.kind === 'year' ? t('owner.period.year', { year: current.year }) : t('owner.period.all') }) : t('owner.hero.single', { quarter: quarterLabel(latest) });
  const payoutHint = cumulative ? t('owner.hero.count', { count: inRange.length }) : latest.id === current.id && profile.payoutAccount ? t('owner.hero.transfer', { account: profile.payoutAccount }) : t('owner.hero.signed', { date: fmt.shortDate(latest.signedOn) });
  const payoutDelta = !cumulative && previous && latest.id === current.id ? (current.payout - previous.payout) / previous.payout : null;
  const revenueColumns: Column<(typeof four)[number]>[] = [
    { key: 'quarter', header: t('owner.revenue.col.quarter'), render: r => <RecordLink onClick={() => onOpenReport(r.id)}>{quarterLabel(r)}</RecordLink> },
    { key: 'invoiced', header: t('owner.revenue.col.invoiced'), numeric: true, render: r => fmt.moneyPlain(r.invoiced) },
    { key: 'collected', header: t('owner.revenue.col.collected'), numeric: true, render: r => fmt.moneyPlain(r.collected) },
    { key: 'rate', header: t('owner.revenue.col.rate'), numeric: true, render: r => fmt.percent(r.collected / r.invoiced) },
    { key: 'payout', header: t('owner.revenue.col.payout'), numeric: true, render: r => fmt.moneyPlain(r.payout) },
  ];
  const kpiDetail =
    openKpi && openKpi !== 'payout'
      ? { title: t('owner.kpi.how', { label: t(`owner.kpi.${openKpi}`) }), body: null, definition: t(kpiDefinition[openKpi]) }
      : undefined;

  return (
    <>
      <PageHeader
        object="asset"
        eyebrow={profile.sciName}
        title={profile.assetName}
        actions={
          <div className="dashboard-period">
            <SelectInput id="owner-period" aria-label={t('owner.period.label')} value={periodKey(period)} onChange={e => onPeriod(periodFromKey(e.target.value))}>
              {options.map(option => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
            <Button variant="brand" onClick={() => (cumulative ? onOpenReports() : onOpenReport(latest.id))}>
              {cumulative ? t('owner.hero.openAll') : t('owner.hero.open', { quarter: quarterLabel(latest) })}
            </Button>
          </div>
        }
        highlights={[
          { label: t('owner.asset.description'), value: profile.assetDescription },
          { label: t('owner.period.label'), value: cumulative ? t('owner.period.sum', { list: inRange.map(quarterLabel).reverse().join(', ') }) : t('owner.report.period', { from: fmt.shortDate(latest.periodStart), to: fmt.shortDate(latest.periodEnd) }) },
          { label: t('owner.asOf.label'), value: home.asOf ? fmt.shortDate(home.asOf) : '-' },
        ]}
      />
      <Card flush>
        <KpiRow
          items={[
            { key: 'payout', label: payoutLabel, value: fmt.moneyCompact(cumulative ? sum.payout : latest.payout), hint: payoutHint, delta: payoutDelta !== null && previous ? { text: t('owner.kpi.payout.delta', { rate: `${payoutDelta >= 0 ? '+' : '−'}${fmt.percent(Math.abs(payoutDelta), 1)}`, previous: quarterLabel(previous) }), tone: payoutDelta >= 0 ? 'good' : 'bad' } : undefined },
            { key: 'occupancy', label: t('owner.kpi.occupancy'), value: fmt.percent(home.occupiedCount / Math.max(1, home.lotCount)), hint: t('owner.kpi.occupancy.detail', { occupied: home.occupiedCount, lots: home.lotCount }) },
            { key: 'recovery', label: t('owner.kpi.recovery'), value: fmt.percent(sum.collected / Math.max(1, sum.invoiced)), hint: t('owner.kpi.recovery.detail', { collected: fmt.moneyCompact(sum.collected), invoiced: fmt.moneyCompact(sum.invoiced) }) },
            { key: 'unpaid', label: t('owner.kpi.unpaid'), value: fmt.moneyCompact(latest.unpaid), hint: t('owner.kpi.unpaid.detail', { count: home.debtorCount, risk: home.riskCount }) },
          ]}
          open={openKpi}
          onToggle={key => setOpenKpi(key as KpiKey | null)}
          detail={kpiDetail}
        />
      </Card>
      {home.sources ? <p className="detail-panel__hint">{t('owner.asOf', { date: home.asOf ? fmt.shortDate(home.asOf) : '-', sources: home.sources })}</p> : null}
      <RecordLayout
        main={
          <>
            <Card title={t('owner.revenue.title')} meta={t('owner.revenue.meta', { count: four.length })} flush>
              <DataTable
                caption={t('owner.revenue.title')}
                columns={revenueColumns}
                rows={four}
                rowKey={r => r.id}
                footer={[t('owner.revenue.total'), fmt.moneyPlain(four12.invoiced), fmt.moneyPlain(four12.collected), fmt.percent(four12.collected / Math.max(1, four12.invoiced)), fmt.moneyPlain(four12.payout)]}
              />
            </Card>
            <Card title={t('owner.unpaid.title', { date: fmt.shortDate(latest.periodEnd) })} meta={`${fmt.money(agingTotal)} · ${latest.unpaidDetail}`}>
              <BarList
                label={t('owner.unpaid.title', { date: fmt.shortDate(latest.periodEnd) })}
                items={latest.aging.map(bucket => ({ key: bucket.bucket, label: t(agingKey[bucket.bucket]), ratio: bucket.amount / Math.max(1, agingTotal), tone: agingTone[bucket.bucket], display: t('owner.unpaid.line', { amount: fmt.moneyPlain(bucket.amount), count: bucket.tenantCount }) }))}
              />
            </Card>
            {occupancy}
          </>
        }
        aside={
          <>
            {contacts}
            <RelatedList
              title={t('owner.recent.title')}
              max={2}
              items={home.reports.map(report => ({
                id: report.id,
                label: t('owner.report.title', { quarter: quarterLabel(report) }),
                meta: t('owner.report.signed', { date: fmt.shortDate(report.signedOn) }),
                onOpen: () => onOpenReport(report.id),
                aside: <Badge tone="success">{t('owner.report.validated')}</Badge>,
              }))}
              viewAll={{ label: t('owner.recent.all'), onClick: onOpenReports }}
              empty={{ title: t('owner.noReport.title') }}
            />
            {vacant}
            {upcoming}
          </>
        }
      />
    </>
  );
}

