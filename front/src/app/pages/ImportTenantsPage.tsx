import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { AssetRecord, TenantImportRow } from '@/services/contracts';
import { useGetAssetRecord } from '@/services/hooks/use-get-asset-record';
import { useImportTenants } from '@/services/hooks/use-import-tenants';
import { useServices } from '@/services/service-context';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { errorMessage } from '@/shared/errors';
import { t } from '@/i18n/t';
import { ImportTenantsScreen } from '@/ui/screens/ImportTenantsScreen';
import { QueryState } from '../query-state';
import { RequirePermission } from '../require-permission';
import { useFormatters } from '../use-formatters';
import { useToast } from '../toast-context';

export function ImportTenantsPage() {
  const { assetId = '' } = useParams();
  const navigate = useNavigate();
  const record = useGetAssetRecord(assetId);
  return (
    <RequirePermission permission={PERMISSIONS.TENANT_WRITE} onBack={() => void navigate(`/assets/${assetId}`)} backLabel={t('asset.record.backToList')}>
      <QueryState query={record}>{asset => <ImportBody asset={asset} />}</QueryState>
    </RequirePermission>
  );
}

function ImportBody({ asset }: { asset: AssetRecord }) {
  const navigate = useNavigate();
  const fmt = useFormatters();
  const toast = useToast();
  const { demo } = useServices();
  const [rows, setRows] = useState<TenantImportRow[]>([]);
  const mutation = useImportTenants(asset.id);
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
      submitError={mutation.isError ? errorMessage(mutation.error) : undefined}
      onBack={() => void navigate('/assets')}
      onOpenAsset={openAsset}
    />
  );
}
