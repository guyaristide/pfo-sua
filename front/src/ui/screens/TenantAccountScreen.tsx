import { useState } from 'react';
import type { AccountEvent, DocumentRow, ScheduleRow, TenantAccount } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import type { MessageKey } from '@/i18n/fr';
import { reminderLevel, scheduleStatus, tenantStatus } from '@/shared/status';
import { documentKindKey, leasePeriodicityKey } from '@/shared/labels';
import { TenantLedger } from './tenants/TenantLedger';
import { t } from '@/i18n/t';
import { Badge, Button, Card, DataTable, EmptyState, FieldGrid, ListBody, PageHeader, RecordLayout, RecordLink, Tabs, Timeline, type Column, type TabDefinition } from '@/ui/primitives';

type Tab = 'lease' | 'account' | 'documents' | 'activity';

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
  documents: DocumentRow[];
  onOpenDocument: (documentId: string) => void;
  onRemind: () => void;
  onRecordCheque: () => void;
  onOpenInvoice: (invoiceId: string) => void;
  onOpenAsset: () => void;
  onBack: () => void;
}

/** Dossier locataire du prototype « socle » : conditions du bail, échéancier, historique du compte. */
export function TenantAccountScreen(props: TenantAccountScreenProps) {
  const { account, fmt, canRemind, canRecord, documents, onOpenDocument, onRemind, onRecordCheque, onOpenInvoice, onOpenAsset, onBack } = props;
  // Un locataire qui vient d'être créé n'a pas encore de compte : on ouvre sur son bail (prototype 1).
  const [tab, setTab] = useState<Tab>(account.ledger.length > 0 ? 'account' : 'lease');
  const tabs: TabDefinition<Tab>[] = [
    { key: 'lease', label: t('tenant.tab.lease') },
    { key: 'account', label: t('tenant.tab.account'), count: account.ledger.length },
    { key: 'documents', label: t('tenant.tab.documents'), count: documents.length },
    { key: 'activity', label: t('tenant.tab.history'), count: account.history.length },
  ];
  return (
    <>
      <PageHeader
        object="tenant"
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
          { label: account.balance > 0 ? t('ledger.kpi.advance') : account.balance < 0 ? t('ledger.kpi.due') : t('tenant.highlight.balance'), value: fmt.money(Math.abs(account.balance)) },
          { label: t('tenant.highlight.status'), value: <Badge tone={tenantStatus[account.status].tone}>{t(tenantStatus[account.status].labelKey)}</Badge> },
        ]}
      />
      <Tabs tabs={tabs} current={tab} onChange={setTab} label={account.name}>
        {tab === 'lease' ? (
          <>
            <TermsTab account={account} fmt={fmt} />
            <ScheduleTab rows={account.schedule} fmt={fmt} onOpenInvoice={onOpenInvoice} />
          </>
        ) : null}
        {tab === 'activity' ? <HistoryTab events={account.history} fmt={fmt} /> : null}
        {tab === 'account' ? <TenantLedger tenantName={account.name} entries={account.ledger} fmt={fmt} onOpenInvoice={onOpenInvoice} /> : null}
        {tab === 'documents' ? <DocumentsTab documents={documents} fmt={fmt} onOpen={onOpenDocument} /> : null}
      </Tabs>
    </>
  );
}

function ScheduleTab({ rows, fmt, onOpenInvoice }: { rows: ScheduleRow[]; fmt: Formatters; onOpenInvoice: (invoiceId: string) => void }) {
  const columns: Column<ScheduleRow>[] = [
    { key: 'date', header: t('tenant.schedule.col.date'), render: row => fmt.shortDate(row.date), sortValue: row => row.date },
    { key: 'label', header: t('tenant.schedule.col.label'), render: row => (row.invoiceId ? <RecordLink onClick={() => onOpenInvoice(row.invoiceId as string)}>{row.label}</RecordLink> : <span className="table__strong">{row.label}</span>) },
    { key: 'invoiced', header: t('tenant.schedule.col.invoiced'), numeric: true, render: row => fmt.moneyPlain(row.invoiced) },
    { key: 'collected', header: t('tenant.schedule.col.collected'), numeric: true, render: row => fmt.moneyPlain(row.collected) },
    { key: 'balance', header: t('tenant.schedule.col.balance'), numeric: true, render: row => fmt.moneyPlain(row.balance) },
    { key: 'status', header: t('tenant.schedule.col.status'), render: row => <Badge tone={scheduleStatus[row.status].tone}>{t(scheduleStatus[row.status].labelKey)}</Badge> },
  ];
  const totals = rows.reduce((acc, row) => ({ invoiced: acc.invoiced + row.invoiced, collected: acc.collected + row.collected, balance: acc.balance + row.balance }), { invoiced: 0, collected: 0, balance: 0 });
  return (
    <Card title={t('tenant.tab.schedule')} flush>
      {rows.length === 0 ? (
        <EmptyState icon="invoice" title={t('tenant.schedule.empty')} body={t('ledger.empty.body')} trame />
      ) : (
        <DataTable caption={t('tenant.tab.schedule')} columns={columns} rows={rows} rowKey={row => row.id} highlight={row => row.status === 'late'} footer={[t('tenant.schedule.total'), '', fmt.moneyPlain(totals.invoiced), fmt.moneyPlain(totals.collected), fmt.moneyPlain(totals.balance), '']} />
      )}
    </Card>
  );
}

function TermsTab({ account, fmt }: { account: TenantAccount; fmt: Formatters }) {
  const lease = account.lease;
  return (
    <RecordLayout
      main={
        <Card title={t('tenant.terms.lease')}>
          <FieldGrid
            fields={[
              { label: t('tenant.terms.start'), value: fmt.shortDate(lease.start) },
              { label: t('tenant.terms.end'), value: lease.end ? fmt.shortDate(lease.end) : t('tenant.terms.end.open') },
              { label: t('tenant.terms.duration'), value: t('tenant.terms.years', { years: lease.durationYears }) },
              { label: t('tenant.terms.periodicity'), value: t(leasePeriodicityKey[lease.periodicity]) },
              { label: t('tenant.highlight.rent'), value: fmt.money(lease.monthlyRent) },
              { label: t('tenant.highlight.charges'), value: fmt.money(lease.monthlyCharges) },
              { label: t('tenant.terms.deposit'), value: fmt.money(lease.deposit) },
              { label: t('tenant.terms.keyMoney'), value: fmt.money(lease.keyMoney) },
              { label: t('tenant.terms.indexation'), value: lease.indexation, wide: true },
            ]}
          />
        </Card>
      }
      aside={
        <Card title={t('tenant.terms.company')}>
          <FieldGrid
            columns={1}
            fields={[
              { label: t('tenant.terms.company'), value: account.name },
              { label: t('tenant.terms.registration'), value: account.registration },
              { label: t('tenant.terms.contact'), value: account.contactName },
              { label: t('tenant.terms.email'), value: account.email },
              { label: t('tenant.terms.reminderLevel'), value: <Badge tone={reminderLevel[account.reminderLevel].tone}>{t(reminderLevel[account.reminderLevel].labelKey)}</Badge> },
            ]}
          />
        </Card>
      }
    />
  );
}

function HistoryTab({ events, fmt }: { events: AccountEvent[]; fmt: Formatters }) {
  if (events.length === 0) {
    return (
      <Card title={t('tenant.tab.history')}>
        <EmptyState icon="folder" title={t('tenant.history.empty')} />
      </Card>
    );
  }
  return (
    <Card title={t('tenant.tab.history')} flush>
      <Timeline
        fmt={fmt}
        items={events.map(event => ({
          id: event.id,
          date: event.date,
          title: event.label,
          detail: `${t(eventKindKey[event.kind])}${event.amount !== null ? ` · ${fmt.money(event.amount)}` : ''} · ${fmt.shortDate(event.date)}`,
        }))}
      />
    </Card>
  );
}

/** E1.6 · Documents du locataire : une liste triable, chaque nom ouvre la fiche du document. */
function DocumentsTab({ documents, fmt, onOpen }: { documents: DocumentRow[]; fmt: Formatters; onOpen: (documentId: string) => void }) {
  const columns: Column<DocumentRow>[] = [
    { key: 'name', header: t('documents.col.name'), render: doc => <RecordLink onClick={() => onOpen(doc.id)}>{doc.name}</RecordLink>, sortValue: doc => doc.name },
    { key: 'kind', header: t('documents.col.kind'), render: doc => t(documentKindKey[doc.kind]) },
    { key: 'updated', header: t('documents.col.updated'), render: doc => fmt.shortDate(doc.updatedAt), sortValue: doc => doc.updatedAt },
    { key: 'version', header: t('documents.col.version'), numeric: true, render: doc => t('tenant.documents.version', { version: doc.version }) },
  ];
  return (
    <Card flush>
      <ListBody
        rows={documents}
        haystack={doc => [doc.name]}
        columns={columns}
        rowKey={doc => doc.id}
        caption={t('tenant.tab.documents')}
        empty={<EmptyState icon="folder" title={t('tenant.documents.empty')} />}
      />
    </Card>
  );
}
