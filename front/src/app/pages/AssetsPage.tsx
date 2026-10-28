import { useNavigate } from 'react-router';
import { useListAssets } from '@/services/hooks/use-list-assets';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { AppError } from '@/shared/errors';
import { AssetsScreen } from '@/ui/screens/AssetsScreen';
import { ErrorState, LoadingState } from '@/ui/primitives';
import { useFormatters } from '../use-formatters';

export function AssetsPage() {
  const fmt = useFormatters();
  const navigate = useNavigate();
  const query = useListAssets();
  const canCreate = usePermission(PERMISSIONS.ASSET_WRITE);

  if (query.isPending) return <LoadingState />;
  if (query.isError) {
    const error = AppError.from(query.error);
    return <ErrorState reference={error.reference} {...(error.userMessage ? { userMessage: error.userMessage } : {})} onRetry={() => void query.refetch()} />;
  }
  // La liste vide est rendue par l'écran lui-même (état vide avec l'action « Nouvel actif »).
  return <AssetsScreen assets={query.data} fmt={fmt} canCreate={canCreate} onOpenAsset={id => void navigate(`/assets/${id}`)} onNew={() => void navigate('/assets/new')} />;
}
