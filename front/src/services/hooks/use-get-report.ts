import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useGetReport(reportId: string) {
  const { reports } = useServices();
  return useQuery({ queryKey: queryKeys.report(reportId), queryFn: () => reports.getReport(reportId) });
}
