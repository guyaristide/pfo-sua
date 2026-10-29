import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

/** Approbation ou renvoi du dossier mensuel par le gestionnaire de patrimoine (Q20). */
export function useMonthlyFileActions(statementId: string) {
  const { collections } = useServices();
  const client = useQueryClient();
  const refresh = () => {
    void client.invalidateQueries({ queryKey: queryKeys.statement(statementId) });
    void client.invalidateQueries({ queryKey: queryKeys.collectionsAll });
  };
  const approve = useMutation({ mutationFn: () => collections.approveMonthlyFile(statementId), onSuccess: refresh });
  const sendBack = useMutation({ mutationFn: (comment: string) => collections.returnMonthlyFile(statementId, comment), onSuccess: refresh });
  return { approve, sendBack };
}
