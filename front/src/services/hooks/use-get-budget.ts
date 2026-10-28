import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useGetBudget(budgetId: string) {
  const { budget } = useServices();
  return useQuery({ queryKey: queryKeys.budgetDetail(budgetId), queryFn: () => budget.getBudget(budgetId) });
}
