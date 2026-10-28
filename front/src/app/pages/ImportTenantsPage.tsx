import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { AssetRecord, TenantImportRow } from '@/services/contracts';
import { useGetAssetRecord } from '@/services/hooks/use-get-asset-record';
import { useImportTenants } from '@/services/hooks/use-import-tenants';
import { useServices } from '@/services/service-context';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { AppError } from '@/shared/errors';
import { t } from '@/i18n/t';
import { ImportTenantsScreen } from '@/ui/screens/ImportTenantsScreen';
import { Button, EmptyState } from '@/ui/primitives';
import { QueryState } from '../query-state';
import { useFormatters } from '../use-formatters';
import { useToast } from '../toast-context';

export function ImportTenantsPage() {
  const { assetId = '' } = useParams();
  const navigate = useNavigate();
  const canWrite = usePermission(PERMISSIONS.TENANT_WRITE);
  const record = useGetAssetRecord(assetId);
  if (!canWrite) {
    return (
      <div className="card">
        <EmptyState icon="lock" title={t('settings.adminOnly')} action={<Button variant="neutral" onClick={() => void navigate(`/assets/${assetId}`)}>{t('asset.record.backToList')}</Button>} />
      </div>
    );
  }
  return <QueryState query={record}>{asset => <ImportBody asset={asset} />}</QueryState>;
}

function ImportBody({ asset }: { asset: AssetRecord }) {
  const navigate = useNavigate();
  const fmt = useFormatters();
  const toast = useToast();
  const { demo } = useServices();
  const [rows, setRows] = useState<TenantImportRow[]>([]);
  const mutation = useImportTenants(asset.id);
  const error = mutation.isError ? AppError.from(mutation.error) : null;
  const openAsset = () => void navigate(`/assets/${encodeURIComponent(asset.id)}`);
  return (
    <ImportTenantsScreen
      assetName={asset.name}
      lots={asset.lots}
      rows={rows}
      fmt={fmt}
      sampleAvailable={demo.enabled}
      onUseSample={() => void demo.sampleTenantRows(asset.id).then(setRows)}
      onClear={() => setRows([])}
      onImport={ready =>
        mutation.mutate(ready, {
          onSuccess: result => {
            toast.notify({ tone: 'success', title: t('importTenants.done', { count: result.created }) });
            openAsset();
          },
        })
      }
      submitting={mutation.isPending}
      submitError={error ? (error.userMessage ?? t('state.error.body', { reference: error.reference })) : undefined}
      onBack={() => void navigate('/assets')}
      onOpenAsset={openAsset}
    />
  );
}
