import { useNavigate } from 'react-router';
import { useGetArrearsOverview } from '@/services/hooks/use-get-arrears-overview';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { ArrearsScreen } from '@/ui/screens/ArrearsScreen';
import { QueryState } from '../query-state';
import { useScope } from '../scope-context';
import { useFormatters } from '../use-formatters';

export function ArrearsPage() {
  const fmt = useFormatters();
  const scope = useScope();
  const navigate = useNavigate();
  const query = useGetArrearsOverview(scope.assetId);
  const canRemind = usePermission(PERMISSIONS.COLLECTION_RECORD);
  return (
    <QueryState query={query}>
      {overview => (
        <ArrearsScreen
          overview={overview}
          fmt={fmt}
          canRemind={canRemind}
          onRemind={tenantId => void navigate(`/arrears/${encodeURIComponent(tenantId)}/remind`)}
          onOpen={tenantId => void navigate(`/tenants/${encodeURIComponent(tenantId)}`)}
        />
      )}
    </QueryState>
  );
}
