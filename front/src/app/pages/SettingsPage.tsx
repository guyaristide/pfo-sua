import { useNavigate } from 'react-router';
import { useGetSettingsOverview } from '@/services/hooks/use-get-settings-overview';
import { SettingsScreen } from '@/ui/screens/SettingsScreen';
import { QueryState } from '../query-state';
import { useIsAdmin } from './settings/AdminOnly';
import { sectionPath } from './settings/settings-navigation';

export function SettingsPage() {
  const query = useGetSettingsOverview();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  return <QueryState query={query}>{overview => <SettingsScreen overview={overview} isAdmin={isAdmin} onOpenSection={key => void navigate(sectionPath[key])} />}</QueryState>;
}
