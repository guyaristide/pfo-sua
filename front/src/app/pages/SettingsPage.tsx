import { useNavigate } from 'react-router';
import { useGetSettingsOverview } from '@/services/hooks/use-get-settings-overview';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { AppError } from '@/shared/errors';
import { SettingsScreen } from '@/ui/screens/SettingsScreen';
import { ErrorState, LoadingState } from '@/ui/primitives';
import { sectionPath } from './settings/settings-navigation';

export function SettingsPage() {
  const query = useGetSettingsOverview();
  const isAdmin = usePermission(PERMISSIONS.ADMIN);
  const navigate = useNavigate();

  if (query.isPending) return <LoadingState />;
  if (query.isError) {
    const error = AppError.from(query.error);
    return <ErrorState reference={error.reference} {...(error.userMessage ? { userMessage: error.userMessage } : {})} onRetry={() => void query.refetch()} />;
  }
  return <SettingsScreen overview={query.data} isAdmin={isAdmin} onOpenSection={key => void navigate(sectionPath[key])} />;
}
