import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useGetAssetRecord(assetId: string) {
  const { assets } = useServices();
  return useQuery({ queryKey: queryKeys.assets.record(assetId), queryFn: () => assets.getAssetRecord(assetId) });
}
