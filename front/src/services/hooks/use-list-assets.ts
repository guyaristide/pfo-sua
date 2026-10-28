import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useListAssets() {
  const { assets } = useServices();
  return useQuery({ queryKey: queryKeys.assets.all, queryFn: () => assets.listAssets() });
}
