import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useListTenants(assetId?: string) {
  const { collections } = useServices();
  return useQuery({ queryKey: queryKeys.tenants(assetId), queryFn: () => collections.listTenants(assetId) });
}
