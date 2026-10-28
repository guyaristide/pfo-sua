import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReminderInput } from '../contracts';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useSendReminder(tenantId: string) {
  const { tenants } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReminderInput) => tenants.sendReminder(tenantId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tenantAccount(tenantId) });
      await queryClient.invalidateQueries({ queryKey: ['arrears'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
