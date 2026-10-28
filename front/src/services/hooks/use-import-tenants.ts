import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TenantImportRow } from '../contracts';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useImportTenants(assetId: string) {
  const { tenants } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: TenantImportRow[]) => tenants.importRows(assetId, rows),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tenantsAll });
    },
  });
}
