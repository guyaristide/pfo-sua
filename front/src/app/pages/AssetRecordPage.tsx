import { useNavigate, useParams } from 'react-router';
import { useGetAssetRecord } from '@/services/hooks/use-get-asset-record';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { AppError } from '@/shared/errors';
import { t } from '@/i18n/t';
import { AssetRecordScreen } from '@/ui/screens/AssetRecordScreen';
import { Button, EmptyState, ErrorState, LoadingState } from '@/ui/primitives';
import { useFormatters } from '../use-formatters';

export function AssetRecordPage() {
  const { assetId = '' } = useParams();
  const fmt = useFormatters();
  const navigate = useNavigate();
  const query = useGetAssetRecord(assetId);
  const canWrite = usePermission(PERMISSIONS.ASSET_WRITE);
  const back = () => void navigate('/assets');

  if (query.isPending) return <LoadingState />;
  if (query.isError) {
    const error = AppError.from(query.error);
    // Fiche introuvable : un état vide avec retour à la liste (SLDS §5), distinct d'une route absente (règle 19).
    if (error.kind === 'resource-missing') {
      return (
        <div className="card">
          <EmptyState icon="building" title={t('state.missingResource')} action={<Button variant="neutral" onClick={back}>{t('asset.record.backToList')}</Button>} />
        </div>
      );
    }
    return <ErrorState reference={error.reference} {...(error.userMessage ? { userMessage: error.userMessage } : {})} onRetry={() => void query.refetch()} />;
  }
  return (
    <AssetRecordScreen
      asset={query.data}
      fmt={fmt}
      canWrite={canWrite}
      onBack={back}
      onAddTenant={() => void navigate(`/assets/${encodeURIComponent(assetId)}/tenants/new`)}
      onImportTenants={() => void navigate(`/assets/${encodeURIComponent(assetId)}/tenants/import`)}
      onOpenTenant={tenantId => void navigate(`/tenants/${encodeURIComponent(tenantId)}`)}
    />
  );
}
