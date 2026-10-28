import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useGetStatement(statementId: string) {
  const { collections } = useServices();
  return useQuery({
    queryKey: queryKeys.statement(statementId),
    queryFn: () => collections.getStatement(statementId),
  });
}
