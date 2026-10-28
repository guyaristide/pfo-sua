import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useGetDashboard(assetId?: string) {
  const { dashboard } = useServices();
  return useQuery({ queryKey: queryKeys.dashboard(assetId), queryFn: () => dashboard.getSummary(assetId) });
}
