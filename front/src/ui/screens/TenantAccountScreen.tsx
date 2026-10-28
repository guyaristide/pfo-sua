import { useState } from 'react';
import type { AccountEvent, LeasePeriodicity, ScheduleRow, TenantAccount } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import type { MessageKey } from '@/i18n/fr';
import { reminderLevel, scheduleStatus, tenantStatus } from '@/shared/status';
import { t } from '@/i18n/t';
import { Badge, Button, Card, DataTable, EmptyState, PageHeader, Tabs, type Column, type TabDefinition } from '@/ui/primitives';

type Tab = 'terms' | 'schedule' | 'history';

export const periodicityKey: Record<LeasePeriodicity, MessageKey> = {
  monthly: 'tenant.periodicity.monthly',
  quarterly: 'tenant.periodicity.quarterly',
  'half-yearly': 'tenant.periodicity.half-yearly',
  yearly: 'tenant.periodicity.yearly',
};
const eventKindKey: Record<AccountEvent['kind'], MessageKey> = {
  invoice: 'tenant.history.kind.invoice',
  payment: 'tenant.history.kind.payment',
  reminder: 'tenant.history.kind.reminder',
  note: 'tenant.history.kind.note',
};

interface TenantAccountScreenProps {
  account: TenantAccount;
  fmt: Formatters;
  canRemind: boolean;
  canRecord: boolean;
  onRemind: () => void;
  onRecordCheque: () => void;
  onOpenInvoice: (invoiceId: string) => void;
  onOpenAsset: () => void;
  onBack: () => void;
}

/** Dossier locataire du prototype « socle » : conditions du bail, échéancier, historique du compte. */
export function TenantAccountScreen(props: TenantAccountScreenProps) {
  const { account, fmt, canRemind, canRecord, onRemind, onRecordCheque, onOpenInvoice, onOpenAsset, onBack } = props;
  const [tab, setTab] = useState<Tab>('schedule');
  const tabs: TabDefinition<Tab>[] = [
    { key: 'schedule', label: t('tenant.tab.schedule'), count: account.schedule.length },
    { key: 'terms', label: t('tenant.tab.terms') },
    { key: 'history', label: t('tenant.tab.history'), count: account.history.length },
  ];
  return (
    <>
      <PageHeader
        object="asset"
        breadcrumbs={[
          { label: t('nav.assets'), onClick: onBack },
          { label: account.assetName, onClick: onOpenAsset },
          { label: t('tenant.breadcrumb') },
        ]}
        eyebrow={t('tenant.subtitle', { asset: account.assetName, lots: account.lotCodes.join(', ') })}
        title={account.name}
        actions={
          <>
            {canRecord ? (
              <Button variant="neutral" onClick={onRecordCheque}>
                {t('tenant.action.recordCheque')}
              </Button>
            ) : null}
            {canRemind && account.balance < 0 && account.reminderLevel !== 'pre-litigation' ? (
              <Button variant="brand" iconLeading="bell" onClick={onRemind}>
                {t('tenant.action.remind')}
              </Button>
            ) : null}
          </>
        }
        highlights={[
          { label: t('tenant.highlight.rent'), value: fmt.money(account.lease.monthlyRent) },
          { label: t('tenant.highlight.charges'), value: fmt.money(account.lease.monthlyCharges) },
          { label: t('tenant.highlight.balance'), value: fmt.money(account.balance) },
          { label: t('tenant.highlight.status'), value: <Badge tone={tenantStatus[account.status].tone}>{t(tenantStatus[account.status].labelKey)}</Badge> },
        ]}
      />
      <Tabs tabs={tabs} current={tab} onChange={setTab} label={account.name}>
        {tab === 'schedule' ? <ScheduleTab rows={account.schedule} fmt={fmt} onOpenInvoice={onOpenInvoice} /> : null}
        {tab === 'terms' ? <TermsTab account={account} fmt={fmt} /> : null}
        {tab === 'history' ? <HistoryTab events={account.history} fmt={fmt} /> : null}
      </Tabs>
    </>
  );
}

function ScheduleTab({ rows, fmt, onOpenInvoice }: { rows: ScheduleRow[]; fmt: Formatters; onOpenInvoice: (invoiceId: string) => void }) {
  const columns: Column<ScheduleRow>[] = [
    { key: 'date', header: t('tenant.schedule.col.date'), render: row => fmt.shortDate(row.date) },
    { key: 'label', header: t('tenant.schedule.col.label'), render: row => <span className="table__primary">{row.label}</span> },
    { key: 'invoiced', header: t('tenant.schedule.col.invoiced'), numeric: true, render: row => fmt.moneyPlain(row.invoiced) },
    { key: 'collected', header: t('tenant.schedule.col.collected'), numeric: true, render: row => fmt.moneyPlain(row.collected) },
    { key: 'balance', header: t('tenant.schedule.col.balance'), numeric: true, render: row => fmt.moneyPlain(row.balance) },
    { key: 'status', header: t('tenant.schedule.col.status'), render: row => <Badge tone={scheduleStatus[row.status].tone}>{t(scheduleStatus[row.status].labelKey)}</Badge> },
    {
      key: 'actions',
      header: '',
      render: row =>
        row.invoiceId ? (
          <div className="table__actions">
            <Button variant="base" onClick={() => onOpenInvoice(row.invoiceId as string)}>
              {t('tenant.schedule.openInvoice')}
            </Button>
          </div>
        ) : null,
    },
  ];
  const totals = rows.reduce((acc, row) => ({ invoiced: acc.invoiced + row.invoiced, collected: acc.collected + row.collected, balance: acc.balance + row.balance }), { invoiced: 0, collected: 0, balance: 0 });
  return (
    <Card flush>
      {rows.length === 0 ? (
        <EmptyState icon="invoice" title={t('tenant.schedule.empty')} trame />
      ) : (
        <DataTable caption={t('tenant.tab.schedule')} columns={columns} rows={rows} rowKey={row => row.id} footer={[t('tenant.schedule.total'), '', fmt.moneyPlain(totals.invoiced), fmt.moneyPlain(totals.collected), fmt.moneyPlain(totals.balance), '', '']} />
      )}
    </Card>
  );
}

function TermsTab({ account, fmt }: { account: TenantAccount; fmt: Formatters }) {
  const lease = account.lease;
  return (
    <div className="layout-two">
      <Card title={t('tenant.terms.company')}>
        <dl className="summary-list">
          <dt>{t('tenant.terms.company')}</dt>
          <dd>{account.name}</dd>
          <dt>{t('tenant.terms.registration')}</dt>
          <dd>{account.registration ?? ''}</dd>
          <dt>{t('tenant.terms.contact')}</dt>
          <dd>{account.contactName}</dd>
          <dt>{t('tenant.terms.email')}</dt>
          <dd>{account.email}</dd>
          <dt>{t('tenant.terms.reminderLevel')}</dt>
          <dd>
            <Badge tone={reminderLevel[account.reminderLevel].tone}>{t(reminderLevel[account.reminderLevel].labelKey)}</Badge>
          </dd>
        </dl>
      </Card>
      <Card title={t('tenant.terms.lease')}>
        <dl className="summary-list">
          <dt>{t('tenant.terms.start')}</dt>
          <dd>{fmt.shortDate(lease.start)}</dd>
          <dt>{t('tenant.terms.end')}</dt>
          <dd>{lease.end ? fmt.shortDate(lease.end) : t('tenant.terms.end.open')}</dd>
          <dt>{t('tenant.terms.duration')}</dt>
          <dd>{t('tenant.terms.years', { years: lease.durationYears })}</dd>
          <dt>{t('tenant.terms.periodicity')}</dt>
          <dd>{t(periodicityKey[lease.periodicity])}</dd>
          <dt>{t('tenant.terms.deposit')}</dt>
          <dd>{fmt.money(lease.deposit)}</dd>
          <dt>{t('tenant.terms.keyMoney')}</dt>
          <dd>{fmt.money(lease.keyMoney)}</dd>
          <dt>{t('tenant.terms.indexation')}</dt>
          <dd>{lease.indexation}</dd>
        </dl>
      </Card>
    </div>
  );
}

function HistoryTab({ events, fmt }: { events: AccountEvent[]; fmt: Formatters }) {
  if (events.length === 0) {
    return (
      <Card>
        <EmptyState icon="folder" title={t('tenant.history.empty')} />
      </Card>
    );
  }
  return (
    <Card flush>
      {events.map(event => {
        const { day, month } = fmt.dayMonth(event.date);
        return (
          <div className="timeline-item" key={event.id}>
            <div>
              <div className="timeline-item__day">{day}</div>
              <div className="timeline-item__month">{month}</div>
            </div>
            <div>
              <div className="timeline-item__title">{event.label}</div>
              <div className="timeline-item__detail">
                {t(eventKindKey[event.kind])}
                {event.amount !== null ? ` · ${fmt.money(event.amount)}` : ''} · {fmt.shortDate(event.date)}
              </div>
            </div>
          </div>
        );
      })}
    </Card>
  );
}
