import { useNavigate } from 'react-router';
import { useGetArrearsOverview } from '@/services/hooks/use-get-arrears-overview';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { AppError } from '@/shared/errors';
import { ArrearsScreen } from '@/ui/screens/ArrearsScreen';
import { ErrorState, LoadingState } from '@/ui/primitives';
import { useScope } from '../scope-context';
import { useFormatters } from '../use-formatters';

export function ArrearsPage() {
  const fmt = useFormatters();
  const scope = useScope();
  const navigate = useNavigate();
  const query = useGetArrearsOverview(scope.assetId);
  const canRemind = usePermission(PERMISSIONS.COLLECTION_RECORD);

  if (query.isPending) return <LoadingState />;
  if (query.isError) {
    const error = AppError.from(query.error);
    return <ErrorState reference={error.reference} {...(error.userMessage ? { userMessage: error.userMessage } : {})} onRetry={() => void query.refetch()} />;
  }
  return (
    <ArrearsScreen
      overview={query.data}
      fmt={fmt}
      canRemind={canRemind}
      onRemind={tenantId => void navigate(`/arrears/${encodeURIComponent(tenantId)}/remind`)}
      onOpen={tenantId => void navigate(`/tenants/${encodeURIComponent(tenantId)}`)}
    />
  );
}
