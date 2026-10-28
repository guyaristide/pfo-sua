import { useQuery } from '@tanstack/react-query';
import type { SearchScope } from '../contracts';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useSearch(text: string, scope: SearchScope) {
  const { search } = useServices();
  return useQuery({ queryKey: queryKeys.search(text, scope), queryFn: () => search.query(text, scope), enabled: text.trim().length >= 2 });
}
