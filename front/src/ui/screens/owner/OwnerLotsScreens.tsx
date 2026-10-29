import { useState } from 'react';
import type { OwnerDocumentGroup, OwnerLot } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { ownerLotStatus } from '@/shared/status';
import type { MessageKey } from '@/i18n/fr';
import { t } from '@/i18n/t';
import { Badge, Button, Card, EmptyState, FilterPills, ListBody, PageHeader, RelatedList, type Column } from '@/ui/primitives';

type StatusFilter = 'all' | 'rented' | 'signed' | 'vacant';

interface OwnerLotsScreenProps {
  assetName: string;
  lots: OwnerLot[];
  buildings: { key: string; name: string }[];
  fmt: Formatters;
}

/** E3.2 · État locatif de l'actif : par bâtiment, par statut, loyer du trimestre. */
export function OwnerLotsScreen({ assetName, lots, buildings, fmt }: OwnerLotsScreenProps) {
  const [building, setBuilding] = useState<string>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const inBuilding = lots.filter(l => building === 'all' || l.building === building);
  const matches = (lot: OwnerLot, filter: StatusFilter) => filter === 'all' || (filter === 'rented' ? lot.status === 'occupied' || lot.status === 'unpaid' : lot.status === filter);
  const rows = inBuilding.filter(l => matches(l, status));
  const area = lots.reduce((sum, l) => sum + l.area, 0);
  const hasSigned = lots.some(l => l.status === 'signed');
  const statusOptions: StatusFilter[] = hasSigned ? ['all', 'signed', 'vacant'] : ['all', 'rented', 'vacant'];
  const statusLabel: Record<StatusFilter, MessageKey> = { all: 'owner.lots.all', rented: 'owner.lots.rented', signed: 'owner.lot.signed', vacant: 'owner.lots.vacant' };
  const columns: Column<OwnerLot>[] = [
    { key: 'code', header: t('owner.lots.col.lot'), render: l => <span className="table__strong">{l.code}</span>, sortValue: l => l.code },
    { key: 'type', header: t('owner.lots.col.type'), render: l => l.type, sortValue: l => l.type },
    { key: 'area', header: t('owner.lots.col.area'), numeric: true, render: l => t('owner.lots.area', { area: fmt.number(l.area) }), sortValue: l => l.area },
    { key: 'tenant', header: t('owner.lots.col.tenant'), render: l => l.tenantName ?? '', sortValue: l => l.tenantName },
    { key: 'since', header: t('owner.lots.col.since'), render: l => (l.since ? fmt.shortDate(l.since) : ''), sortValue: l => l.since },
    { key: 'rent', header: t('owner.lots.col.rent'), numeric: true, render: l => (l.quarterlyRent !== null ? fmt.moneyPlain(l.quarterlyRent) : ''), sortValue: l => l.quarterlyRent },
    { key: 'status', header: t('owner.lots.col.status'), render: l => <Badge tone={ownerLotStatus[l.status].tone}>{t(ownerLotStatus[l.status].labelKey)}</Badge> },
  ];
  return (
    <>
      <PageHeader
        object="asset"
        eyebrow={assetName}
        title={t('owner.lots.title')}
        highlights={[
          { label: t('owner.new.lots'), value: lots.length },
          { label: hasSigned ? t('owner.new.signed') : t('owner.lots.rented'), value: hasSigned ? lots.filter(l => l.status === 'signed').length : lots.filter(l => matches(l, 'rented')).length },
          { label: t('owner.lots.col.area'), value: t('owner.lots.area', { area: fmt.number(area) }) },
        ]}
      />
      <Card flush>
        <ListBody
          rows={rows}
          haystack={l => [l.code, l.type, l.tenantName]}
          columns={columns}
          rowKey={l => l.code}
          caption={t('owner.lots.title')}
          highlight={l => l.status === 'unpaid'}
          filters={{ options: statusOptions.map(key => ({ key, label: t(statusLabel[key]), count: inBuilding.filter(l => matches(l, key)).length })), value: status, onChange: setStatus, label: t('owner.lots.col.status') }}
          toolbar={buildings.length > 1 ? <FilterPills options={[{ key: 'all', label: t('owner.lots.all'), count: lots.length }, ...buildings.map(b => ({ key: b.key, label: b.name, count: lots.filter(l => l.building === b.key).length }))]} value={building} onChange={setBuilding} label={t('owner.lots.building')} /> : undefined}
          empty={<EmptyState icon="building" title={t('owner.lots.empty')} action={<Button variant="neutral" onClick={() => { setBuilding('all'); setStatus('all'); }}>{t('owner.lots.reset')}</Button>} />}
        />
      </Card>
    </>
  );
}

interface OwnerDocumentsScreenProps {
  assetName: string;
  groups: OwnerDocumentGroup[];
  onDownload: (documentId: string) => void;
  downloading: string | null;
}

/** E3.4 · Documents : comptes-rendus en PDF, et ce que PFO publie pour la SCI. */
export function OwnerDocumentsScreen({ assetName, groups, onDownload, downloading }: OwnerDocumentsScreenProps) {
  return (
    <>
      <PageHeader object="document" eyebrow={assetName} title={t('owner.nav.documents')} />
      {groups.length === 0 ? (
        <Card>
          <EmptyState icon="folder" title={t('owner.documents.empty')} />
        </Card>
      ) : (
        groups.map(group => (
          <RelatedList
            key={group.label}
            title={group.label}
            items={group.documents.map(doc => ({
              id: doc.id,
              label: doc.name,
              meta: doc.detail,
              action: (
                <Button variant="base" iconLeading="download" disabled={downloading === doc.id} onClick={() => onDownload(doc.id)}>
                  {t('owner.report.pdf')}
                </Button>
              ),
            }))}
            empty={{ title: t('owner.documents.empty') }}
          />
        ))
      )}
    </>
  );
}
