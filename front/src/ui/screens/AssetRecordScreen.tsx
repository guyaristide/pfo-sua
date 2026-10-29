import { useState } from 'react';
import type { AssetRecord, LotRow, TenantRow } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { lotStatus, tenantStatus } from '@/shared/status';
import { lotTypeKey } from '@/shared/labels';
import { t } from '@/i18n/t';
import { Badge, Button, Card, EmptyState, FieldGrid, ListBody, PageHeader, RecordLink, Tabs, type Column, type TabDefinition } from '@/ui/primitives';

type Tab = 'lots' | 'tenants' | 'details';

interface AssetRecordScreenProps {
  asset: AssetRecord;
  fmt: Formatters;
  canWrite: boolean;
  onBack: () => void;
  onAddTenant: () => void;
  onImportTenants: () => void;
  onOpenTenant: (tenantId: string) => void;
}

/** Page d'enregistrement SLDS §5 : en-tête avec champs en évidence, puis onglets lots, locataires, société et mandat. */
export function AssetRecordScreen({ asset, fmt, canWrite, onBack, onAddTenant, onImportTenants, onOpenTenant }: AssetRecordScreenProps) {
  const [tab, setTab] = useState<Tab>('lots');
  const tabs: TabDefinition<Tab>[] = [
    { key: 'lots', label: t('asset.record.tab.lots'), count: asset.lots.length },
    { key: 'tenants', label: t('asset.record.tab.tenants'), count: asset.tenants.length },
    { key: 'details', label: t('asset.record.tab.details') },
  ];
  return (
    <>
      <PageHeader
        object="asset"
        breadcrumbs={[{ label: t('nav.assets'), onClick: onBack }]}
        eyebrow={`${asset.code} · ${t('asset.record.subtitle', { location: asset.location, buildings: asset.buildingCount, lots: asset.lotCount })}`}
        title={asset.name}
        actions={
          canWrite ? (
            <>
              <Button variant="neutral" iconLeading="upload" onClick={onImportTenants}>
                {t('asset.record.action.importTenants')}
              </Button>
              <Button variant="brand" iconLeading="plus" onClick={onAddTenant}>
                {t('asset.record.action.addTenant')}
              </Button>
            </>
          ) : null
        }
        highlights={[
          { label: t('asset.record.owner'), value: asset.ownerName },
          { label: t('asset.record.manager'), value: asset.managerName },
          { label: t('asset.record.occupancy'), value: fmt.percent(asset.occupancyRate) },
          { label: t('asset.record.unpaid'), value: fmt.money(asset.unpaidAmount) },
        ]}
      />
      <Tabs tabs={tabs} current={tab} onChange={setTab} label={asset.name}>
        {tab === 'lots' ? <LotsTab lots={asset.lots} fmt={fmt} /> : null}
        {tab === 'tenants' ? <TenantsTab tenants={asset.tenants} fmt={fmt} onOpenTenant={onOpenTenant} onAddTenant={canWrite ? onAddTenant : undefined} /> : null}
        {tab === 'details' ? <DetailsTab asset={asset} fmt={fmt} /> : null}
      </Tabs>
    </>
  );
}

function LotsTab({ lots, fmt }: { lots: LotRow[]; fmt: Formatters }) {
  const columns: Column<LotRow>[] = [
    { key: 'lot', header: t('asset.record.lots.col.lot'), render: lot => <span className="table__strong">{lot.code}</span>, sortValue: lot => lot.code },
    { key: 'building', header: t('asset.record.lots.col.building'), render: lot => lot.building, sortValue: lot => lot.building },
    { key: 'type', header: t('asset.record.lots.col.type'), render: lot => t(lotTypeKey[lot.type]) },
    { key: 'surface', header: t('asset.record.lots.col.surface'), numeric: true, render: lot => t('asset.record.lots.surface', { surface: fmt.number(lot.surface) }), sortValue: lot => lot.surface },
    { key: 'floor', header: t('asset.record.lots.col.floor'), render: lot => lot.floor ?? '' },
    {
      key: 'tenant',
      header: t('asset.record.lots.col.tenant'),
      render: lot => (
        <div>
          <Badge tone={lotStatus[lot.status].tone}>{t(lotStatus[lot.status].labelKey)}</Badge>
          {lot.tenantName ? <div className="table__secondary">{lot.tenantName}</div> : null}
        </div>
      ),
    },
    { key: 'rent', header: t('asset.record.lots.col.rent'), numeric: true, render: lot => (lot.monthlyRent === null ? '' : fmt.moneyPlain(lot.monthlyRent)), sortValue: lot => lot.monthlyRent },
  ];
  return (
    <Card flush>
      <ListBody
        rows={lots}
        haystack={lot => [lot.code, lot.building, lot.tenantName]}
        columns={columns}
        rowKey={lot => lot.id}
        caption={t('asset.record.tab.lots')}
        highlight={lot => lot.status === 'vacant'}
        extra={rows => t('asset.record.lots.count', { occupied: rows.filter(lot => lot.status === 'occupied').length, vacant: rows.filter(lot => lot.status !== 'occupied').length })}
        footer={rows => [t('asset.record.lots.total', { count: rows.length }), '', '', t('asset.record.lots.surface', { surface: fmt.number(rows.reduce((sum, lot) => sum + lot.surface, 0)) }), '', '', fmt.moneyPlain(rows.reduce((sum, lot) => sum + (lot.monthlyRent ?? 0), 0))]}
        empty={<EmptyState icon="building" title={t('asset.record.lots.empty')} />}
      />
    </Card>
  );
}

function TenantsTab({ tenants, fmt, onOpenTenant, onAddTenant }: { tenants: TenantRow[]; fmt: Formatters; onOpenTenant: (tenantId: string) => void; onAddTenant: (() => void) | undefined }) {
  const columns: Column<TenantRow>[] = [
    {
      key: 'tenant',
      header: t('asset.record.tenants.col.tenant'),
      sortValue: tenant => tenant.name,
      render: tenant => (
        <div>
          <RecordLink onClick={() => onOpenTenant(tenant.id)}>{tenant.name}</RecordLink>
          <div className="table__secondary">
            {tenant.contactName} · {tenant.email}
          </div>
        </div>
      ),
    },
    { key: 'lots', header: t('asset.record.tenants.col.lots'), render: tenant => tenant.lotCodes.join(', ') },
    {
      key: 'lease',
      header: t('asset.record.tenants.col.lease'),
      render: tenant =>
        tenant.leaseEnd
          ? t('asset.record.tenants.lease.until', { start: fmt.shortDate(tenant.leaseStart), end: fmt.shortDate(tenant.leaseEnd) })
          : t('asset.record.tenants.lease.open', { start: fmt.shortDate(tenant.leaseStart) }),
    },
    { key: 'rent', header: t('asset.record.tenants.col.rent'), numeric: true, render: tenant => fmt.moneyPlain(tenant.monthlyRent) },
    { key: 'charges', header: t('asset.record.tenants.col.charges'), numeric: true, render: tenant => fmt.moneyPlain(tenant.monthlyCharges) },
    { key: 'balance', header: t('asset.record.tenants.col.balance'), numeric: true, render: tenant => fmt.moneyPlain(tenant.balance), sortValue: tenant => tenant.balance },
    { key: 'status', header: t('asset.record.tenants.col.status'), render: tenant => <Badge tone={tenantStatus[tenant.status].tone}>{t(tenantStatus[tenant.status].labelKey)}</Badge> },
  ];
  const sum = (rows: TenantRow[], pick: (tenant: TenantRow) => number) => rows.reduce((total, tenant) => total + pick(tenant), 0);
  return (
    <Card flush>
      <ListBody
        rows={tenants}
        haystack={tenant => [tenant.name, tenant.contactName, ...tenant.lotCodes]}
        columns={columns}
        rowKey={tenant => tenant.id}
        caption={t('asset.record.tab.tenants')}
        rowActions={tenant => [{ label: t('asset.record.tenants.open'), onSelect: () => onOpenTenant(tenant.id) }]}
        highlight={tenant => tenant.balance < 0}
        footer={rows => [t('asset.record.tenants.total', { count: rows.length }), '', '', fmt.moneyPlain(sum(rows, r => r.monthlyRent)), fmt.moneyPlain(sum(rows, r => r.monthlyCharges)), fmt.moneyPlain(sum(rows, r => r.balance)), '']}
        empty={<EmptyState icon="users" title={t('asset.record.tenants.empty.title')} body={t('asset.record.tenants.empty.body')} trame action={onAddTenant ? <Button variant="neutral" onClick={onAddTenant}>{t('asset.record.action.addTenant')}</Button> : null} />}
      />
    </Card>
  );
}

function DetailsTab({ asset, fmt }: { asset: AssetRecord; fmt: Formatters }) {
  return (
    <div className="section-grid">
      <Card title={t('asset.record.details.owner')}>
        <FieldGrid
          columns={1}
          fields={[
            { label: t('asset.record.details.owner'), value: asset.owner.name },
            { label: t('asset.record.details.registration'), value: asset.owner.registration },
            { label: t('asset.record.details.address'), value: asset.owner.address },
            { label: t('asset.record.details.representative'), value: asset.owner.representative },
          ]}
        />
      </Card>
      <Card title={t('asset.record.details.mandate')}>
        <FieldGrid
          columns={1}
          fields={[
            { label: t('asset.record.details.mandate.reference'), value: asset.mandate.reference },
            { label: t('asset.record.details.mandate.signedOn'), value: fmt.shortDate(asset.mandate.signedOn) },
            { label: t('asset.record.details.mandate.duration'), value: t('asset.record.details.mandate.years', { years: asset.mandate.durationYears }) },
            { label: t('asset.record.details.mandate.endsOn'), value: fmt.shortDate(asset.mandate.endsOn) },
          ]}
        />
      </Card>
      <Card title={t('asset.record.details.specifics')}>
        <FieldGrid
          columns={1}
          fields={[
            { label: t('asset.record.details.rentAccount'), value: asset.rentAccountLabel ?? '' },
            { label: t('asset.record.details.expenses'), value: asset.expensesPaidBy === 'sci' ? t('asset.record.details.expenses.sci') : t('asset.record.details.expenses.pfo') },
            { label: t('asset.record.details.billingItems'), value: asset.billingItemCodes.join(', ') },
          ]}
        />
      </Card>
    </div>
  );
}
