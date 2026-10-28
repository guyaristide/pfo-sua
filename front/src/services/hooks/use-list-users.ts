import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useListUsers() {
  const { settings } = useServices();
  return useQuery({ queryKey: queryKeys.settingsSection('users'), queryFn: () => settings.listUsers() });
}
