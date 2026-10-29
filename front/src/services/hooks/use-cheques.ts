import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChequeFollowUpInput, ChequeRejectReason, ChequeReturnInput, DepositSlip } from '../contracts';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useListCheques(assetId?: string) {
  const { collections } = useServices();
  return useQuery({ queryKey: queryKeys.cheques(assetId), queryFn: () => collections.listCheques(assetId) });
}

export function useListDeposits(assetId?: string) {
  const { collections } = useServices();
  return useQuery({ queryKey: queryKeys.deposits(assetId), queryFn: () => collections.listDeposits(assetId) });
}

export function useGetDeposit(depositId: string) {
  const { collections } = useServices();
  return useQuery({ queryKey: queryKeys.deposit(depositId), queryFn: () => collections.getDeposit(depositId) });
}

export function usePrepareDeposit() {
  const { collections } = useServices();
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (chequeIds: string[]) => collections.prepareDeposit(chequeIds), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.collectionsAll }) });
}

export function useCompleteDeposit(depositId: string) {
  const { collections } = useServices();
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (slips: Record<string, DepositSlip>) => collections.completeDeposit(depositId, slips), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.collectionsAll }) });
}

export function useReturnCheque() {
  const { collections } = useServices();
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: ChequeReturnInput) => collections.returnCheque(input), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tenantsAll }) });
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

export function useGetCheque(chequeId: string) {
  const { collections } = useServices();
  return useQuery({ queryKey: queryKeys.cheque(chequeId), queryFn: () => collections.getCheque(chequeId) });
}

/** E2.10 : rapprocher un crédit candidat, l'écarter, ou noter une démarche auprès de la banque. */
export function useChequeActions(chequeId: string) {
  const { collections } = useServices();
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.cheque(chequeId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.collectionsAll });
    void queryClient.invalidateQueries({ queryKey: queryKeys.tenantsAll });
  };
  const match = useMutation({ mutationFn: ({ statementId, lineId }: { statementId: string; lineId: string }) => collections.matchChequeCredit(chequeId, statementId, lineId), onSuccess: refresh });
  const dismiss = useMutation({ mutationFn: (lineId: string) => collections.dismissChequeCredit(chequeId, lineId), onSuccess: refresh });
  const note = useMutation({ mutationFn: (input: ChequeFollowUpInput) => collections.addChequeFollowUp(chequeId, input), onSuccess: refresh });
  return { match, dismiss, note };
}
