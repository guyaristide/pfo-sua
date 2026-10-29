import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReconciliationDecision } from '@/services/contracts';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useValidateReconciliation(statementId: string) {
  const { collections } = useServices();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (decisions: ReconciliationDecision[]) => collections.validateReconciliation(statementId, decisions),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.statement(statementId) });
      void client.invalidateQueries({ queryKey: queryKeys.collectionsAll });
      void client.invalidateQueries({ queryKey: queryKeys.tenantsAll });
    },
  });
}
