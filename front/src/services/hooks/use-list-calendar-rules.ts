import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useListCalendarRules() {
  const { settings } = useServices();
  return useQuery({ queryKey: queryKeys.settingsSection('calendar'), queryFn: () => settings.listCalendarRules() });
}
