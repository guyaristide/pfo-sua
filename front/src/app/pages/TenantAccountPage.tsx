import { useNavigate, useParams } from 'react-router';
import { useGetTenantAccount } from '@/services/hooks/use-get-tenant-account';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { TenantAccountScreen } from '@/ui/screens/TenantAccountScreen';
import { QueryState } from '../query-state';
import { useFormatters } from '../use-formatters';

export function TenantAccountPage() {
  const { tenantId = '' } = useParams();
  const navigate = useNavigate();
  const fmt = useFormatters();
  const query = useGetTenantAccount(tenantId);
  const canRemind = usePermission(PERMISSIONS.COLLECTION_RECORD);
  const canRecord = usePermission(PERMISSIONS.COLLECTION_RECORD);
  return (
    <QueryState query={query}>
      {account => (
        <TenantAccountScreen
          account={account}
          fmt={fmt}
          canRemind={canRemind}
          canRecord={canRecord}
          onRemind={() => void navigate(`/arrears/${encodeURIComponent(account.id)}/remind`)}
          onRecordCheque={() => void navigate(`/collections/cheques/new?tenant=${encodeURIComponent(account.id)}`)}
          onOpenInvoice={invoiceId => void navigate(`/billing/invoices/${encodeURIComponent(invoiceId)}`)}
          onOpenAsset={() => void navigate(`/assets/${encodeURIComponent(account.assetId)}`)}
          onBack={() => void navigate('/assets')}
        />
      )}
    </QueryState>
  );
}
