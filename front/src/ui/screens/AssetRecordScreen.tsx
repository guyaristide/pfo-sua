import { useState } from 'react';
import type { AssetRecord, LotRow, LotType, TenantRow } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import type { MessageKey } from '@/i18n/fr';
import { lotStatus, tenantStatus } from '@/shared/status';
import { t } from '@/i18n/t';
import { Badge, Button, Card, DataTable, EmptyState, ListStatus, PageHeader, ShowMore, Tabs, useListFilter, type Column, type TabDefinition } from '@/ui/primitives';

export const lotTypeKey: Record<LotType, MessageKey> = {
  offices: 'lot.type.offices',
  shops: 'lot.type.shops',
  villas: 'lot.type.villas',
  apartments: 'lot.type.apartments',
  land: 'lot.type.land',
  parking: 'lot.type.parking',
};

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
        eyebrow={`${t('nav.assets')} · ${asset.code}`}
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
      <p className="card__meta">{t('asset.record.subtitle', { location: asset.location, buildings: asset.buildingCount, lots: asset.lotCount })}</p>
      <Tabs tabs={tabs} current={tab} onChange={setTab} label={asset.name}>
        {tab === 'lots' ? <LotsTab lots={asset.lots} fmt={fmt} /> : null}
        {tab === 'tenants' ? <TenantsTab tenants={asset.tenants} fmt={fmt} onOpenTenant={onOpenTenant} /> : null}
        {tab === 'details' ? <DetailsTab asset={asset} fmt={fmt} /> : null}
      </Tabs>
    </>
  );
}

function LotsTab({ lots, fmt }: { lots: LotRow[]; fmt: Formatters }) {
  const list = useListFilter(lots, lot => [lot.code, lot.building, lot.tenantName]);
  const occupied = list.filtered.filter(lot => lot.status === 'occupied').length;
  const columns: Column<LotRow>[] = [
    { key: 'lot', header: t('asset.record.lots.col.lot'), render: lot => <span className="table__primary">{lot.code}</span> },
    { key: 'building', header: t('asset.record.lots.col.building'), render: lot => lot.building },
    { key: 'type', header: t('asset.record.lots.col.type'), render: lot => t(lotTypeKey[lot.type]) },
    { key: 'surface', header: t('asset.record.lots.col.surface'), numeric: true, render: lot => t('asset.record.lots.surface', { surface: lot.surface }) },
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
    { key: 'rent', header: t('asset.record.lots.col.rent'), numeric: true, render: lot => (lot.monthlyRent === null ? '' : fmt.moneyPlain(lot.monthlyRent)) },
  ];
  const totalSurface = list.filtered.reduce((sum, lot) => sum + lot.surface, 0);
  const totalRent = list.filtered.reduce((sum, lot) => sum + (lot.monthlyRent ?? 0), 0);
  return (
    <Card flush>
      <ListStatus
        count={list.filtered.length}
        extra={t('asset.record.lots.count', { occupied, vacant: list.filtered.length - occupied })}
        search={list.search}
        onSearch={list.setSearch}
      />
      {list.filtered.length === 0 ? (
        <EmptyState icon="building" title={t('asset.record.lots.empty')} />
      ) : (
        <DataTable
          caption={t('asset.record.tab.lots')}
          columns={columns}
          rows={list.visible}
          rowKey={lot => lot.id}
          footer={[t('asset.record.lots.total', { count: list.filtered.length }), '', '', t('asset.record.lots.surface', { surface: totalSurface }), '', '', fmt.moneyPlain(totalRent)]}
        />
      )}
      <ShowMore hidden={list.hidden} onClick={list.showMore} />
    </Card>
  );
}

function TenantsTab({ tenants, fmt, onOpenTenant }: { tenants: TenantRow[]; fmt: Formatters; onOpenTenant: (tenantId: string) => void }) {
  const list = useListFilter(tenants, tenant => [tenant.name, tenant.contactName, ...tenant.lotCodes]);
  const columns: Column<TenantRow>[] = [
    {
      key: 'tenant',
      header: t('asset.record.tenants.col.tenant'),
      render: tenant => (
        <div>
          <div className="table__primary">{tenant.name}</div>
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
    { key: 'balance', header: t('asset.record.tenants.col.balance'), numeric: true, render: tenant => fmt.moneyPlain(tenant.balance) },
    { key: 'status', header: t('asset.record.tenants.col.status'), render: tenant => <Badge tone={tenantStatus[tenant.status].tone}>{t(tenantStatus[tenant.status].labelKey)}</Badge> },
    {
      key: 'actions',
      header: '',
      render: tenant => (
        <div className="table__actions">
          <Button variant="neutral" onClick={() => onOpenTenant(tenant.id)}>
            {t('asset.record.tenants.open')}
          </Button>
        </div>
      ),
    },
  ];
  const totalRent = list.filtered.reduce((sum, tenant) => sum + tenant.monthlyRent, 0);
  const totalCharges = list.filtered.reduce((sum, tenant) => sum + tenant.monthlyCharges, 0);
  const totalBalance = list.filtered.reduce((sum, tenant) => sum + tenant.balance, 0);
  return (
    <Card flush>
      <ListStatus count={list.filtered.length} search={list.search} onSearch={list.setSearch} />
      {list.filtered.length === 0 ? (
        <EmptyState icon="users" title={t('asset.record.tenants.empty.title')} body={t('asset.record.tenants.empty.body')} trame />
      ) : (
        <DataTable
          caption={t('asset.record.tab.tenants')}
          columns={columns}
          rows={list.visible}
          rowKey={tenant => tenant.id}
          footer={[t('asset.record.tenants.total', { count: list.filtered.length }), '', '', fmt.moneyPlain(totalRent), fmt.moneyPlain(totalCharges), fmt.moneyPlain(totalBalance), '', '']}
        />
      )}
      <ShowMore hidden={list.hidden} onClick={list.showMore} />
    </Card>
  );
}

function DetailsTab({ asset, fmt }: { asset: AssetRecord; fmt: Formatters }) {
  return (
    <div className="layout-two">
      <Card title={t('asset.record.details.owner')}>
        <dl className="summary-list">
          <dt>{t('asset.record.details.owner')}</dt>
          <dd>{asset.owner.name}</dd>
          <dt>{t('asset.record.details.registration')}</dt>
          <dd>{asset.owner.registration}</dd>
          <dt>{t('asset.record.details.address')}</dt>
          <dd>{asset.owner.address}</dd>
          <dt>{t('asset.record.details.representative')}</dt>
          <dd>{asset.owner.representative}</dd>
        </dl>
      </Card>
      <Card title={t('asset.record.details.mandate')}>
        <dl className="summary-list">
          <dt>{t('asset.record.details.mandate.reference')}</dt>
          <dd>{asset.mandate.reference}</dd>
          <dt>{t('asset.record.details.mandate.signedOn')}</dt>
          <dd>{fmt.shortDate(asset.mandate.signedOn)}</dd>
          <dt>{t('asset.record.details.mandate.duration')}</dt>
          <dd>{t('asset.record.details.mandate.years', { years: asset.mandate.durationYears })}</dd>
          <dt>{t('asset.record.details.mandate.endsOn')}</dt>
          <dd>{fmt.shortDate(asset.mandate.endsOn)}</dd>
        </dl>
      </Card>
      <Card title={t('asset.record.details.specifics')}>
        <dl className="summary-list">
          <dt>{t('asset.record.details.rentAccount')}</dt>
          <dd>{asset.rentAccountLabel ?? ''}</dd>
          <dt>{t('asset.record.details.expenses')}</dt>
          <dd>{asset.expensesPaidBy === 'sci' ? t('asset.record.details.expenses.sci') : t('asset.record.details.expenses.pfo')}</dd>
          <dt>{t('asset.record.details.billingItems')}</dt>
          <dd>{asset.billingItemCodes.join(', ')}</dd>
        </dl>
      </Card>
    </div>
  );
}
