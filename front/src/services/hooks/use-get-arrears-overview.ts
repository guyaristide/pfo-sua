import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useGetArrearsOverview(assetId?: string) {
  const { arrears } = useServices();
  return useQuery({
    queryKey: queryKeys.arrears(assetId),
    queryFn: () => arrears.getOverview(assetId),
  });
}
