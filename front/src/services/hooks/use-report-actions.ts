import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Period, ReportTransition } from '../contracts';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useGenerateReportDrafts() {
  const { reports } = useServices();
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (period: Period) => reports.generateDrafts(period), onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.reportsAll }) });
}

export function useReportTransition(reportId: string) {
  const { reports } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ action, note }: { action: ReportTransition; note: string | null }) => reports.transition(reportId, action, note),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.reportsAll });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
