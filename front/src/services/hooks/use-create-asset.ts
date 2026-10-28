import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NewAssetInput } from '../contracts';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

/** Un nouvel actif change la liste, le sélecteur de la barre latérale et les tableaux de bord. */
export function useCreateAsset() {
  const { assets } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewAssetInput) => assets.createAsset(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
