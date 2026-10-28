import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useGetReportsOverview(assetId?: string) {
  const { reports } = useServices();
  return useQuery({
    queryKey: queryKeys.reports(assetId),
    queryFn: () => reports.getOverview(assetId),
  });
}
