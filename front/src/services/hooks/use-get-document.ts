import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useGetDocument(documentId: string) {
  const { documents } = useServices();
  return useQuery({ queryKey: queryKeys.document(documentId), queryFn: () => documents.getDocument(documentId) });
}
