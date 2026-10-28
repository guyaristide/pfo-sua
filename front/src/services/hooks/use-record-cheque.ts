import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ChequeInput } from '../contracts';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useRecordCheque() {
  const { collections } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ChequeInput) => collections.recordCheque(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.collectionsAll });
    },
  });
}
