import type { AssetSummary, CaptureAssignment, CaptureLine, TenantOption } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { t } from '@/i18n/t';
import { Button, Card, DataTable, DockedFooter, EmptyState, PageHeader, SelectInput, type Column } from '@/ui/primitives';

export type Assignments = Record<string, { assetId: string; tenantId: string }>;

interface CapturesScreenProps {
  statementLabel: string;
  lines: CaptureLine[];
  assets: AssetSummary[];
  tenants: TenantOption[];
  fmt: Formatters;
  assignments: Assignments;
  onAssign: (lineId: string, assetId: string, tenantId: string) => void;
  onValidate: (assignments: CaptureAssignment[]) => void;
  submitting: boolean;
  submitError: string | undefined;
  onBack: () => void;
}

/** Prototype 2C : rattacher chaque crédit du compte PFO à son actif puis à son locataire. */
export function CapturesScreen({ statementLabel, lines, assets, tenants, fmt, assignments, onAssign, onValidate, submitting, submitError, onBack }: CapturesScreenProps) {
  const assigned = (line: CaptureLine) => assignments[line.id] ?? { assetId: line.assetId ?? '', tenantId: line.tenantId ?? '' };
  const complete = lines.filter(line => assigned(line).assetId && assigned(line).tenantId);
  const remaining = lines.length - complete.length;
  const columns: Column<CaptureLine>[] = [
    { key: 'date', header: t('captures.col.date'), render: line => fmt.shortDate(line.date), width: '96px' },
    { key: 'label', header: t('captures.col.label'), render: line => <span className="table__primary" style={{ color: 'var(--text-primary)' }}>{line.label}</span> },
    { key: 'amount', header: t('captures.col.amount'), numeric: true, render: line => fmt.moneyPlain(line.amount) },
    {
      key: 'asset',
      header: t('captures.col.asset'),
      render: line => {
        const current = assigned(line);
        return (
          <SelectInput aria-label={t('captures.col.asset')} value={current.assetId} onChange={e => onAssign(line.id, e.target.value, '')}>
            <option value="">{t('captures.pick.asset')}</option>
            {assets.map(asset => (
              <option key={asset.id} value={asset.id}>
                {asset.name}
              </option>
            ))}
          </SelectInput>
        );
      },
    },
    {
      key: 'tenant',
      header: t('captures.col.tenant'),
      render: line => {
        const current = assigned(line);
        const assetName = assets.find(a => a.id === current.assetId)?.name;
        const options = tenants.filter(tn => tn.assetName === assetName);
        return (
          <SelectInput aria-label={t('captures.col.tenant')} value={current.tenantId} disabled={!current.assetId} onChange={e => onAssign(line.id, current.assetId, e.target.value)}>
            <option value="">{t('captures.pick.tenant')}</option>
            {options.map(tn => (
              <option key={tn.id} value={tn.id}>
                {tn.name} ({tn.lotCode})
              </option>
            ))}
          </SelectInput>
        );
      },
    },
  ];
  return (
    <>
      <PageHeader object="collection" breadcrumbs={[{ label: t('nav.collections'), onClick: onBack }, { label: t('captures.breadcrumb') }]} eyebrow={statementLabel} title={t('captures.title')} />
      <Card meta={t('captures.subtitle')} flush>
        {lines.length === 0 ? <EmptyState icon="payments" title={t('captures.empty')} trame /> : <DataTable caption={t('captures.title')} columns={columns} rows={lines} rowKey={line => line.id} />}
      </Card>
      <DockedFooter
        tone={submitError ? 'danger' : remaining === 0 ? 'success' : 'neutral'}
        status={submitError ?? (remaining === 0 ? t('captures.allDone') : t('captures.remaining', { count: remaining }))}
        actions={
          <>
            <Button variant="neutral" onClick={onBack}>
              {t('settings.action.cancel')}
            </Button>
            <Button variant="brand" disabled={submitting || remaining > 0 || lines.length === 0} onClick={() => onValidate(lines.map(line => ({ lineId: line.id, ...assigned(line) })))}>
              {t('captures.action.validate')}
            </Button>
          </>
        }
      />
    </>
  );
}
