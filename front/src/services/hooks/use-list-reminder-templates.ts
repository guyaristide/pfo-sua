import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useListReminderTemplates() {
  const { settings } = useServices();
  return useQuery({ queryKey: queryKeys.settingsSection('reminder-templates'), queryFn: () => settings.listReminderTemplates() });
}
