import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

/** Rouvre un rapprochement validé avec un motif (E2.11) : une nouvelle version du dossier suivra. */
export function useReopenReconciliation(statementId: string) {
  const { collections } = useServices();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => collections.reopenReconciliation(statementId, reason),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.statement(statementId) });
      void client.invalidateQueries({ queryKey: queryKeys.collectionsAll });
    },
  });
}
