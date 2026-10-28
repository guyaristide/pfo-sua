import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReconciliationDecision } from '../contracts';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

/** Mutation de validation : après succès, le relevé et les accueils « Encaissements » sont rechargés. */
export function useValidateReconciliation(statementId: string) {
  const { collections } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (decisions: ReconciliationDecision[]) => collections.validateReconciliation(statementId, decisions),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.statement(statementId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.collectionsAll });
    },
  });
}
