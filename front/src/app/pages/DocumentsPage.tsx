import { useNavigate } from 'react-router';
import { useListDocuments } from '@/services/hooks/use-list-documents';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { DocumentsScreen } from '@/ui/screens/DocumentsScreen';
import { QueryState } from '../query-state';
import { useScope } from '../scope-context';
import { useFormatters } from '../use-formatters';

export function DocumentsPage() {
  const fmt = useFormatters();
  const scope = useScope();
  const navigate = useNavigate();
  const query = useListDocuments(scope.assetId);
  const canUpload = usePermission(PERMISSIONS.ASSET_WRITE);
  return (
    <QueryState query={query}>
      {documents => <DocumentsScreen documents={documents} fmt={fmt} canUpload={canUpload} onOpen={id => void navigate(`/documents/${encodeURIComponent(id)}`)} onUpload={() => void navigate('/documents/new')} />}
    </QueryState>
  );
}
