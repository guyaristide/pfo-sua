import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useListRoles() {
  const { settings } = useServices();
  return useQuery({ queryKey: queryKeys.settingsSection('roles'), queryFn: () => settings.listRoles() });
}
