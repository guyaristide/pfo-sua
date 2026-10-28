import { useSuspenseQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';
import type { Session } from '../contracts';

/** La session est chargée une fois, en suspense, avant tout écran : les composants la lisent de façon synchrone. */
export function useSession(): Session {
  const { session } = useServices();
  const query = useSuspenseQuery({
    queryKey: queryKeys.session,
    queryFn: () => session.getSession(),
    staleTime: Infinity,
  });
  return query.data;
}
