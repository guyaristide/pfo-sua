import { useNavigate } from 'react-router';
import { useListAssets } from '@/services/hooks/use-list-assets';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { AssetsScreen } from '@/ui/screens/AssetsScreen';
import { QueryState } from '../query-state';
import { useFormatters } from '../use-formatters';

export function AssetsPage() {
  const fmt = useFormatters();
  const navigate = useNavigate();
  const query = useListAssets();
  const canCreate = usePermission(PERMISSIONS.ASSET_WRITE);
  // La liste vide est rendue par l'écran lui-même (état vide avec l'action « Nouvel actif »).
  return (
    <QueryState query={query}>
      {assets => <AssetsScreen assets={assets} fmt={fmt} canCreate={canCreate} onOpenAsset={id => void navigate(`/assets/${id}`)} onNew={() => void navigate('/assets/new')} />}
    </QueryState>
  );
}
