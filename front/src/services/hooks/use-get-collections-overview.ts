import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useGetCollectionsOverview(assetId?: string) {
  const { collections } = useServices();
  return useQuery({
    queryKey: queryKeys.collections(assetId),
    queryFn: () => collections.getOverview(assetId),
  });
}
