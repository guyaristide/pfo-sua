import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NewTenantInput } from '../contracts';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useCreateTenant(assetId: string) {
  const { tenants } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewTenantInput) => tenants.createFromLease(assetId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tenantsAll });
      await queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
  });
}
