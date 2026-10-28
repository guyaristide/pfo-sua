import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useGetSettingsOverview() {
  const { settings } = useServices();
  return useQuery({ queryKey: queryKeys.settings, queryFn: () => settings.getOverview() });
}
