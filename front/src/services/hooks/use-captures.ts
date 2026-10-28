import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CaptureAssignment, StatementImportInput } from '../contracts';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useGetCaptures(statementId: string) {
  const { collections } = useServices();
  return useQuery({ queryKey: queryKeys.captures(statementId), queryFn: () => collections.getCaptures(statementId) });
}

export function useAttachCaptures(statementId: string) {
  const { collections } = useServices();
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (assignments: CaptureAssignment[]) => collections.attachCaptures(statementId, assignments), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.collectionsAll }) });
}

export function useImportStatement() {
  const { collections } = useServices();
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: StatementImportInput) => collections.importStatement(input), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.collectionsAll }) });
}
