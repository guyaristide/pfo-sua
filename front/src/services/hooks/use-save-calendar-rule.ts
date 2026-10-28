import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CalendarRuleInput } from '../contracts';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

/** Après succès, toutes les sections des paramètres sont rechargées (effectifs du hub compris). */
export function useSaveCalendarRule(id: string) {
  const { settings } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CalendarRuleInput) => settings.saveCalendarRule(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });
}
