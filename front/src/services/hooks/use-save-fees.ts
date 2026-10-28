import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FeeSettingsInput } from '../contracts';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

/** Après succès, toutes les sections des paramètres sont rechargées (effectifs du hub compris). */
export function useSaveFees() {
  const { settings } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FeeSettingsInput) => settings.saveFees(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });
}
