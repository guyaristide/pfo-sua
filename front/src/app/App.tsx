import { Suspense, useEffect, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { ServicesProvider } from '@/services/service-context';
import { sessionEvents } from '@/services/session-events';
import { LoadingState } from '@/ui/primitives';
import { createServices } from './services-factory';
import { ScopeProvider } from './scope-context';
import { ToastProvider } from './toast-context';
import { router } from './router';

/** La racine de composition : services (mock ou http), cache de requêtes, périmètre, routeur. */
export function App() {
  const services = useMemo(() => createServices(), []);
  const queryClient = useMemo(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } } }),
    [],
  );
  // Une session perdue en cours d'usage : le cache part, la connexion revient avec l'adresse en cours.
  useEffect(
    () =>
      sessionEvents.onLost(() => {
        queryClient.clear();
        const current = router.state.location;
        void router.navigate('/login', { replace: true, state: { from: `${current.pathname}${current.search}`, reason: 'session-lost' } });
      }),
    [queryClient],
  );
  return (
    <ServicesProvider services={services}>
      <QueryClientProvider client={queryClient}>
        <ScopeProvider>
          <ToastProvider>
            <Suspense fallback={<LoadingState />}>
              <RouterProvider router={router} />
            </Suspense>
          </ToastProvider>
        </ScopeProvider>
      </QueryClientProvider>
    </ServicesProvider>
  );
}
