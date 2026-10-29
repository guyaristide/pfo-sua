import type { AssetSummary } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { t } from '@/i18n/t';
import { exportCsv } from '@/shared/export/csv';
import { assetDataStatus } from '@/shared/status';
import { Badge, Button, Card, EmptyState, ListBody, PageHeader, RecordLink, type Column } from '@/ui/primitives';

interface AssetsScreenProps {
  assets: AssetSummary[];
  fmt: Formatters;
  canCreate: boolean;
  onOpenAsset: (assetId: string) => void;
  onNew: () => void;
}

/** Vue de liste SLDS §4 : ligne d'état avec effectif, recherche dans la liste, lots de 20, état vide avec action. */
export function AssetsScreen({ assets, fmt, canCreate, onOpenAsset, onNew }: AssetsScreenProps) {
  const lotsOf = (rows: AssetSummary[]) => rows.reduce((sum, a) => sum + a.lotCount, 0);
  const occupancyOf = (rows: AssetSummary[]) => (lotsOf(rows) > 0 ? rows.reduce((sum, a) => sum + a.occupancyRate * a.lotCount, 0) / lotsOf(rows) : 0);

  const columns: Column<AssetSummary>[] = [
    {
      key: 'asset',
      header: t('assets.col.asset'),
      render: a => (
        <div>
          <RecordLink onClick={() => onOpenAsset(a.id)}>{a.name}</RecordLink>
          <div className="table__secondary">{a.location}</div>
        </div>
      ),
    },
    { key: 'owner', header: t('assets.col.owner'), render: a => a.ownerName },
    { key: 'lots', header: t('assets.col.lots'), numeric: true, render: a => a.lotCount },
    { key: 'occupancy', header: t('assets.col.occupancy'), numeric: true, render: a => (a.dataStatus === 'active' ? fmt.percent(a.occupancyRate) : '') },
    { key: 'unpaid', header: t('assets.col.unpaid'), numeric: true, render: a => (a.dataStatus === 'active' ? fmt.moneyPlain(a.unpaidAmount) : '') },
    { key: 'status', header: t('assets.col.status'), render: a => <Badge tone={assetDataStatus[a.dataStatus].tone}>{t(assetDataStatus[a.dataStatus].labelKey)}</Badge> },
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
                    { header: t('assets.col.asset'), value: (a: AssetSummary) => a.name },
                    { header: t('assets.col.owner'), value: a => a.ownerName },
                    { header: t('assets.col.lots'), value: a => a.lotCount },
                    { header: t('assets.col.occupancy'), value: a => fmt.percent(a.occupancyRate) },
                    { header: t('assets.col.unpaid'), value: a => a.unpaidAmount },
                  ],
                  assets,
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
        <ListBody
          rows={assets}
          haystack={a => [a.name, a.location, a.ownerName]}
          columns={columns}
          rowKey={a => a.id}
          caption={t('assets.title')}
          rowActions={a => [{ label: t('assets.open'), onSelect: () => onOpenAsset(a.id) }]}
          extra={rows => t('assets.lots.count', { count: lotsOf(rows) })}
          footer={rows => [t('assets.total', { count: rows.length }), '', lotsOf(rows), fmt.percent(occupancyOf(rows)), fmt.moneyPlain(rows.reduce((sum, a) => sum + a.unpaidAmount, 0)), '']}
          empty={
            <EmptyState
              icon="building"
              title={t('assets.empty.title')}
              body={t('assets.empty.body')}
              action={
                canCreate ? (
                  <Button variant="neutral" iconLeading="plus" onClick={onNew}>
                    {t('assets.new')}
                  </Button>
                ) : null
              }
            />
          }
        />
      </Card>
    </>
  );
}
