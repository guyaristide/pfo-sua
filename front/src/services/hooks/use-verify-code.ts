import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from '../service-context';

/** Après une connexion réussie, tout le cache part : il appartenait à personne, ou à quelqu'un d'autre. */
export function useVerifyCode() {
  const { auth } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) => auth.verifyCode(email, code),
    onSuccess: () => queryClient.clear(),
  });
}
