import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useGetBillingOverview(assetId?: string) {
  const { billing } = useServices();
  return useQuery({
    queryKey: queryKeys.billing(assetId),
    queryFn: () => billing.getOverview(assetId),
  });
}
