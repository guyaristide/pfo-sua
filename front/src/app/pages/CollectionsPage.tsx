import { useNavigate } from 'react-router';
import { useGetCollectionsOverview } from '@/services/hooks/use-get-collections-overview';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { CollectionsScreen } from '@/ui/screens/CollectionsScreen';
import { QueryState } from '../query-state';
import { useScope } from '../scope-context';
import { useFormatters } from '../use-formatters';

export function CollectionsPage() {
  const fmt = useFormatters();
  const scope = useScope();
  const navigate = useNavigate();
  const query = useGetCollectionsOverview(scope.assetId);
  const canRecord = usePermission(PERMISSIONS.COLLECTION_RECORD);
  // Une boîte « À traiter » vide est un état métier normal : l'écran l'affiche avec son message.
  return (
    <QueryState query={query}>
      {overview => (
        <CollectionsScreen
          overview={overview}
          fmt={fmt}
          canRecord={canRecord}
          onReconcile={statementId => void navigate(`/collections/statements/${encodeURIComponent(statementId)}/reconcile`)}
          onRecordCheque={() => void navigate('/collections/cheques/new')}
          onProcessCaptures={statementId => void navigate(`/collections/statements/${encodeURIComponent(statementId)}/captures`)}
          onImportStatement={() => void navigate('/collections/statements/import')}
          onOpenCheques={() => void navigate('/collections/cheques')}
          onOpenCheque={chequeId => void navigate(`/collections/cheques/${encodeURIComponent(chequeId)}`)}
          onQualify={statementId => void navigate(`/collections/statements/${encodeURIComponent(statementId)}/reconcile?focus=excluded`)}
        />
      )}
    </QueryState>
  );
}
