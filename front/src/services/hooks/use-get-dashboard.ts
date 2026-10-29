import { useQuery } from '@tanstack/react-query';
import type { DashboardPeriod } from '../contracts';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useGetDashboard(assetId: string | undefined, period: DashboardPeriod) {
  const { dashboard } = useServices();
  return useQuery({ queryKey: queryKeys.dashboard(assetId, period), queryFn: () => dashboard.getSummary(assetId, period) });
}
