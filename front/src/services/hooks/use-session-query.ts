import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

/** La session sans suspense, pour la garde d'entrée : elle a besoin de voir l'erreur `unauthorized`. */
export function useSessionQuery() {
  const { session } = useServices();
  return useQuery({ queryKey: queryKeys.session, queryFn: () => session.getSession(), staleTime: Infinity, retry: false });
}
