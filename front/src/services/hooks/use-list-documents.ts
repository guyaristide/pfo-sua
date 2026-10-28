import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useListDocuments(assetId?: string) {
  const { documents } = useServices();
  return useQuery({
    queryKey: queryKeys.documents(assetId),
    queryFn: () => documents.listDocuments(assetId),
  });
}
