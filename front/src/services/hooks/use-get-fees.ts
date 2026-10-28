import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useGetFees() {
  const { settings } = useServices();
  return useQuery({ queryKey: queryKeys.settingsSection('fees'), queryFn: () => settings.getFees() });
}
