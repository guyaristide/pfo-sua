import { useNavigate, useParams } from 'react-router';
import { useGetAssetRecord } from '@/services/hooks/use-get-asset-record';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { t } from '@/i18n/t';
import { AssetRecordScreen } from '@/ui/screens/AssetRecordScreen';
import { Button, EmptyState } from '@/ui/primitives';
import { QueryState } from '../query-state';
import { useFormatters } from '../use-formatters';

export function AssetRecordPage() {
  const { assetId = '' } = useParams();
  const fmt = useFormatters();
  const navigate = useNavigate();
  const query = useGetAssetRecord(assetId);
  const canWrite = usePermission(PERMISSIONS.ASSET_WRITE);
  const back = () => void navigate('/assets');
  return (
    <QueryState
      query={query}
      missing={
        <div className="card">
          <EmptyState icon="building" title={t('state.missingResource')} action={<Button variant="neutral" onClick={back}>{t('asset.record.backToList')}</Button>} />
        </div>
      }
    >
      {asset => (
        <AssetRecordScreen
          asset={asset}
          fmt={fmt}
          canWrite={canWrite}
          onBack={back}
          onAddTenant={() => void navigate(`/assets/${encodeURIComponent(assetId)}/tenants/new`)}
          onImportTenants={() => void navigate(`/assets/${encodeURIComponent(assetId)}/tenants/import`)}
          onOpenTenant={tenantId => void navigate(`/tenants/${encodeURIComponent(tenantId)}`)}
        />
      )}
    </QueryState>
  );
}
