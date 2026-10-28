import { useNavigate } from 'react-router';
import { useListDocuments } from '@/services/hooks/use-list-documents';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { AppError } from '@/shared/errors';
import { DocumentsScreen } from '@/ui/screens/DocumentsScreen';
import { ErrorState, LoadingState } from '@/ui/primitives';
import { useScope } from '../scope-context';
import { useFormatters } from '../use-formatters';

export function DocumentsPage() {
  const fmt = useFormatters();
  const scope = useScope();
  const navigate = useNavigate();
  const query = useListDocuments(scope.assetId);
  const canUpload = usePermission(PERMISSIONS.ASSET_WRITE);

  if (query.isPending) return <LoadingState />;
  if (query.isError) {
    const error = AppError.from(query.error);
    return <ErrorState reference={error.reference} {...(error.userMessage ? { userMessage: error.userMessage } : {})} onRetry={() => void query.refetch()} />;
  }
  return <DocumentsScreen documents={query.data} fmt={fmt} canUpload={canUpload} onOpen={id => void navigate(`/documents/${encodeURIComponent(id)}`)} onUpload={() => void navigate('/documents/new')} />;
}
