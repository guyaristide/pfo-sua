import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useSessionQuery } from '@/services/hooks/use-session-query';
import { AppError } from '@/shared/errors';
import { ErrorState, LoadingState } from '@/ui/primitives';

/**
 * L'entrée de l'espace PFO : sans session valide, retour à la connexion avec l'adresse demandée.
 * Une fois la session en cache, `useSession` la lit sans suspendre.
 */
export function SessionGate({ children }: { children: ReactNode }) {
  const query = useSessionQuery();
  const location = useLocation();

  if (query.isPending) return <LoadingState />;
  if (query.isError) {
    const error = AppError.from(query.error);
    if (error.kind === 'unauthorized') {
      return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
    }
    return <ErrorState reference={error.reference} {...(error.userMessage ? { userMessage: error.userMessage } : {})} onRetry={() => void query.refetch()} />;
  }
  return <>{children}</>;
}
