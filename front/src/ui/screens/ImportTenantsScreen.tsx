import type { LotRow, TenantImportRow } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { t } from '@/i18n/t';
import { exportCsv } from '@/shared/export/csv';
import { Badge, Button, Card, DataTable, DockedFooter, EmptyState, FileDrop, FormActions, PageHeader, type Column } from '@/ui/primitives';

export type ImportCheck = 'ok' | 'unknown-lot' | 'occupied-lot' | 'duplicate-lot';

export interface CheckedRow extends TenantImportRow {
  key: string;
  check: ImportCheck;
}

/** Contrôle chaque ligne contre les lots de l'actif : une seule règle pour l'aperçu et le bouton d'import. */
export function checkRows(rows: TenantImportRow[], lots: LotRow[]): CheckedRow[] {
  const seen = new Set<string>();
  return rows.map((row, index) => {
    const lot = lots.find(l => l.code === row.lotCode);
    let check: ImportCheck = 'ok';
    if (!lot) check = 'unknown-lot';
    else if (lot.status === 'occupied') check = 'occupied-lot';
    else if (seen.has(row.lotCode)) check = 'duplicate-lot';
    seen.add(row.lotCode);
    return { ...row, key: `${index}-${row.lotCode}`, check };
  });
}

interface ImportTenantsScreenProps {
  assetName: string;
  lots: LotRow[];
  rows: TenantImportRow[];
  fmt: Formatters;
  sampleAvailable: boolean;
  onUseSample: () => void;
  onClear: () => void;
  onImport: (rows: TenantImportRow[]) => void;
  submitting: boolean;
  submitError: string | undefined;
  onBack: () => void;
  onOpenAsset: () => void;
}

const checkTone = { ok: 'success', 'unknown-lot': 'danger', 'occupied-lot': 'danger', 'duplicate-lot': 'warning' } as const;
const checkKey = { ok: 'importTenants.check.ok', 'unknown-lot': 'importTenants.check.unknownLot', 'occupied-lot': 'importTenants.check.occupiedLot', 'duplicate-lot': 'importTenants.check.duplicateLot' } as const;

export function ImportTenantsScreen(props: ImportTenantsScreenProps) {
  const { assetName, lots, rows, fmt, sampleAvailable, onUseSample, onClear, onImport, submitting, submitError, onBack, onOpenAsset } = props;
  const checked = checkRows(rows, lots);
  const ready = checked.filter(row => row.check === 'ok');
  const blocked = checked.length - ready.length;
  const columns: Column<CheckedRow>[] = [
    {
      key: 'tenant',
      header: t('importTenants.col.tenant'),
      render: row => (
        <div>
          <div className="table__strong">{row.name}</div>
          <div className="table__secondary">
            {row.contactName} · {row.email}
          </div>
        </div>
      ),
    },
    { key: 'lot', header: t('importTenants.col.lot'), render: row => row.lotCode },
    { key: 'start', header: t('importTenants.col.start'), render: row => fmt.shortDate(row.start) },
    { key: 'rent', header: t('importTenants.col.rent'), numeric: true, render: row => fmt.moneyPlain(row.monthlyRent) },
    { key: 'charges', header: t('importTenants.col.charges'), numeric: true, render: row => fmt.moneyPlain(row.monthlyCharges) },
    { key: 'deposit', header: t('importTenants.col.deposit'), numeric: true, render: row => fmt.moneyPlain(row.deposit) },
    { key: 'check', header: t('importTenants.col.check'), render: row => <Badge tone={checkTone[row.check]}>{t(checkKey[row.check])}</Badge> },
  ];
  return (
    <>
      <PageHeader
        object="asset"
        breadcrumbs={[
          { label: t('nav.assets'), onClick: onBack },
          { label: assetName, onClick: onOpenAsset },
        ]}
        eyebrow={t('importTenants.subtitle')}
        title={t('importTenants.title')}
        actions={
          <Button
            variant="neutral"
            iconLeading="download"
            onClick={() =>
              exportCsv(
                'modele-locataires',
                [
                  { header: t('importTenants.col.tenant'), value: () => '' },
                  { header: t('importTenants.col.contact'), value: () => '' },
                  { header: t('users.field.email'), value: () => '' },
                  { header: t('importTenants.col.lot'), value: () => '' },
                  { header: t('importTenants.col.start'), value: () => '' },
                  { header: t('importTenants.col.rent'), value: () => '' },
                  { header: t('importTenants.col.charges'), value: () => '' },
                  { header: t('importTenants.col.deposit'), value: () => '' },
                ],
                [{}],
              )
            }
          >
            {t('importTenants.template')}
          </Button>
        }
      />
      {rows.length === 0 ? (
        <Card>
          <FileDrop id="import-tenants-file" label={t('importTenants.drop')} accept=".xlsx,.csv" onFile={onUseSample} />
          {sampleAvailable ? (
            <FormActions>
              <Button variant="neutral" onClick={onUseSample}>
                {t('importTenants.sample')}
              </Button>
            </FormActions>
          ) : null}
        </Card>
      ) : (
        <Card
          title={t('importTenants.preview')}
          meta={blocked > 0 ? t('importTenants.blocked', { count: blocked }) : t('importTenants.ready', { count: ready.length })}
          actions={
            <Button variant="base" onClick={onClear}>
              {t('importTenants.action.clear')}
            </Button>
          }
          flush
        >
          {checked.length === 0 ? <EmptyState icon="users" title={t('importTenants.empty')} /> : <DataTable caption={t('importTenants.preview')} columns={columns} rows={checked} rowKey={row => row.key} />}
        </Card>
      )}
      <DockedFooter
        tone={submitError ? 'danger' : blocked > 0 ? 'warning' : 'neutral'}
        status={submitError ?? (rows.length === 0 ? t('importTenants.empty') : blocked > 0 ? t('importTenants.blocked', { count: blocked }) : t('importTenants.ready', { count: ready.length }))}
        actions={
          <>
            <Button variant="neutral" onClick={onOpenAsset}>
              {t('cheque.action.cancel')}
            </Button>
            <Button variant="brand" disabled={submitting || rows.length === 0 || blocked > 0} onClick={() => onImport(ready.map(({ key, check, ...row }) => row))}>
              {t('importTenants.action.import', { count: ready.length })}
            </Button>
          </>
        }
      />
    </>
  );
}
