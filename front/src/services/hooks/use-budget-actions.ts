import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReestimateInput } from '../contracts';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useReestimateBudget(budgetId: string) {
  const { budget } = useServices();
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: ReestimateInput) => budget.reestimate(budgetId, input), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.budgetAll }) });
}

export function usePrepareBudgetYear() {
  const { budget } = useServices();
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (year: number) => budget.prepareYear(year), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.budgetAll }) });
}
