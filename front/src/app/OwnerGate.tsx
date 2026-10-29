import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useSessionQuery } from '@/services/hooks/use-session-query';
import { AppError } from '@/shared/errors';
import { ErrorState, LoadingState } from '@/ui/primitives';

/**
 * L'entrée de l'espace propriétaire : sans session, la connexion propriétaire ; une session de l'équipe
 * n'y entre pas et retourne à l'espace PFO (deux espaces distincts, décision du 14.10).
 */
export function OwnerGate({ children }: { children: ReactNode }) {
  const query = useSessionQuery();
  const location = useLocation();
  if (query.isPending) return <LoadingState />;
  if (query.isError) {
    const error = AppError.from(query.error);
    if (error.kind === 'unauthorized') return <Navigate to="/owner/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
    return <ErrorState reference={error.reference} {...(error.userMessage ? { userMessage: error.userMessage } : {})} onRetry={() => void query.refetch()} />;
  }
  if (query.data.user.role !== 'owner') return <Navigate to="/" replace />;
  return <>{children}</>;
}
