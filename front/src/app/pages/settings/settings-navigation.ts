import { useNavigate } from 'react-router';
import type { SettingsSectionKey } from '@/services/contracts';

export const sectionPath: Record<SettingsSectionKey, string> = {
  users: '/settings/users',
  'billing-items': '/settings/billing-items',
  calendar: '/settings/calendar',
  'reminder-templates': '/settings/reminder-templates',
  'bank-accounts': '/settings/bank-accounts',
  fees: '/settings/fees',
};

/** Les deux retours que chaque écran des paramètres propose : le hub et sa section. */
export function useSettingsNavigation(section: SettingsSectionKey) {
  const navigate = useNavigate();
  return {
    navigate,
    onOpenSettings: () => void navigate('/settings'),
    onOpenSection: () => void navigate(sectionPath[section]),
  };
}
