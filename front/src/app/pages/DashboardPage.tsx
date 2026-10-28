import { useNavigate } from 'react-router';
import { useSession } from '@/services/hooks/use-session';
import { useGetDashboard } from '@/services/hooks/use-get-dashboard';
import { AppError } from '@/shared/errors';
import { t } from '@/i18n/t';
import { DashboardScreen } from '@/ui/screens/DashboardScreen';
import { EmptyState, ErrorState, LoadingState } from '@/ui/primitives';
import { useScope } from '../scope-context';
import { useFormatters } from '../use-formatters';
import { targetPath } from '../targets';

export function DashboardPage() {
  const session = useSession();
  const scope = useScope();
  const fmt = useFormatters();
  const navigate = useNavigate();
  const query = useGetDashboard(scope.assetId);

  if (query.isPending) return <LoadingState />;
  if (query.isError) {
    const error = AppError.from(query.error);
    return <ErrorState reference={error.reference} {...(error.userMessage ? { userMessage: error.userMessage } : {})} onRetry={() => void query.refetch()} />;
  }
  if (query.data.assets.length === 0) return <EmptyState title={t('state.empty.title')} />;

  return (
    <DashboardScreen
      firstName={session.user.firstName}
      summary={query.data}
      fmt={fmt}
      onOpenAsset={assetId => void navigate(`/assets/${assetId}`)}
      onOpenTarget={target => void navigate(targetPath(target))}
      onOpenCalendar={() => void navigate('/settings/calendar')}
    />
  );
}
