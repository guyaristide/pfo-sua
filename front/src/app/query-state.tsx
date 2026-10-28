import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { AppError } from '@/shared/errors';
import { ErrorState, LoadingState } from '@/ui/primitives';

interface QueryStateProps<T> {
  query: UseQueryResult<T>;
  children: (data: T) => ReactNode;
}

/** Les trois états d'une requête (règle 2) en un seul endroit : chargement, erreur avec référence, données. */
export function QueryState<T>({ query, children }: QueryStateProps<T>) {
  if (query.isPending) return <LoadingState />;
  if (query.isError) {
    const error = AppError.from(query.error);
    return <ErrorState reference={error.reference} {...(error.userMessage ? { userMessage: error.userMessage } : {})} onRetry={() => void query.refetch()} />;
  }
  return <>{children(query.data)}</>;
}
