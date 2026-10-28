import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DocumentUploadInput } from '../contracts';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useUploadDocument() {
  const { documents } = useServices();
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: DocumentUploadInput) => documents.upload(input), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.documentsAll }) });
}
