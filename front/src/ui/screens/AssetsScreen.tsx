import type { AssetSummary } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { t } from '@/i18n/t';
import { exportCsv } from '@/shared/export/csv';
import { Button, Card, DataTable, EmptyState, ListStatus, PageHeader, ShowMore, useListFilter, type Column } from '@/ui/primitives';

interface AssetsScreenProps {
  assets: AssetSummary[];
  fmt: Formatters;
  canCreate: boolean;
  onOpenAsset: (assetId: string) => void;
  onNew: () => void;
}

/** Vue de liste SLDS §4 : ligne d'état avec effectif, recherche dans la liste, lots de 20, état vide avec action. */
export function AssetsScreen({ assets, fmt, canCreate, onOpenAsset, onNew }: AssetsScreenProps) {
  const list = useListFilter(assets, a => [a.name, a.location, a.ownerName]);
  const { filtered, visible } = list;
  const totalLots = filtered.reduce((sum, a) => sum + a.lotCount, 0);
  const totalUnpaid = filtered.reduce((sum, a) => sum + a.unpaidAmount, 0);
  const totalWeightedOccupancy = totalLots > 0 ? filtered.reduce((sum, a) => sum + a.occupancyRate * a.lotCount, 0) / totalLots : 0;

  const columns: Column<AssetSummary>[] = [
    {
      key: 'asset',
      header: t('assets.col.asset'),
      render: a => (
        <div>
          <div className="table__primary">{a.name}</div>
          <div className="table__secondary">{a.location}</div>
        </div>
      ),
    },
    { key: 'owner', header: t('assets.col.owner'), render: a => a.ownerName },
    { key: 'lots', header: t('assets.col.lots'), numeric: true, render: a => a.lotCount },
    { key: 'occupancy', header: t('assets.col.occupancy'), numeric: true, render: a => fmt.percent(a.occupancyRate) },
    { key: 'unpaid', header: t('assets.col.unpaid'), numeric: true, render: a => fmt.moneyPlain(a.unpaidAmount) },
    {
      key: 'actions',
      header: '',
      render: a => (
        <div className="table__actions">
          <Button variant="neutral" onClick={() => onOpenAsset(a.id)}>
            {t('assets.open')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        object="asset"
        eyebrow={t('nav.assets')}
        title={t('assets.title')}
        actions={
          <>
            <Button
              variant="neutral"
              iconLeading="download"
              onClick={() =>
                exportCsv(
                  t('export.filename.assets'),
                  [
                    { header: t('assets.col.asset'), value: a => a.name },
                    { header: t('assets.col.owner'), value: a => a.ownerName },
                    { header: t('assets.col.lots'), value: a => a.lotCount },
                    { header: t('assets.col.occupancy'), value: a => fmt.percent(a.occupancyRate) },
                    { header: t('assets.col.unpaid'), value: a => a.unpaidAmount },
                  ],
                  filtered,
                )
              }
            >
              {t('list.export.excel')}
            </Button>
            {canCreate ? (
              <Button variant="brand" iconLeading="plus" onClick={onNew}>
                {t('assets.new')}
              </Button>
            ) : null}
          </>
        }
      />
      <Card flush>
        <ListStatus
          count={filtered.length}
          extra={`${totalLots} ${t('assets.col.lots').toLocaleLowerCase()}`}
          search={list.search}
          onSearch={list.setSearch}
        />
        {filtered.length === 0 ? (
          <EmptyState
            icon="building"
            title={t('assets.empty.title')}
            body={t('assets.empty.body')}
            action={
              canCreate && assets.length === 0 ? (
                <Button variant="brand" iconLeading="plus" onClick={onNew}>
                  {t('assets.new')}
                </Button>
              ) : null
            }
          />
        ) : (
          <DataTable
            caption={t('assets.title')}
            columns={columns}
            rows={visible}
            rowKey={a => a.id}
            footer={[t('assets.total', { count: filtered.length }), '', totalLots, fmt.percent(totalWeightedOccupancy), fmt.moneyPlain(totalUnpaid), '']}
          />
        )}
        <ShowMore hidden={list.hidden} onClick={list.showMore} />
      </Card>
    </>
  );
}
