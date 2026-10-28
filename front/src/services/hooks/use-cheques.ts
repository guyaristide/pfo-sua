import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChequeRejectReason } from '../contracts';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useListCheques(assetId?: string) {
  const { collections } = useServices();
  return useQuery({ queryKey: queryKeys.cheques(assetId), queryFn: () => collections.listCheques(assetId) });
}

export function useMarkChequesDeposited() {
  const { collections } = useServices();
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (ids: string[]) => collections.markChequesDeposited(ids), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.collectionsAll }) });
}

export function useRejectCheque(chequeId: string) {
  const { collections } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reason, note }: { reason: ChequeRejectReason; note: string | null }) => collections.rejectCheque(chequeId, reason, note),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.collectionsAll });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tenantsAll });
    },
  });
}
