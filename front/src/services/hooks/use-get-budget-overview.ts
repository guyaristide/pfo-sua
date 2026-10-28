import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useGetBudgetOverview(assetId?: string) {
  const { budget } = useServices();
  return useQuery({
    queryKey: queryKeys.budget(assetId),
    queryFn: () => budget.getOverview(assetId),
  });
}
