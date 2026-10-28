import { useMemo } from 'react';
import { useSession } from '@/services/hooks/use-session';
import { createFormatters, type Formatters } from '@/shared/format/formatters';

export function useFormatters(): Formatters {
  const { tenant } = useSession();
  return useMemo(() => createFormatters(tenant), [tenant]);
}
