import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useGetTenantAccount(tenantId: string) {
  const { tenants } = useServices();
  return useQuery({ queryKey: queryKeys.tenantAccount(tenantId), queryFn: () => tenants.getAccount(tenantId) });
}
