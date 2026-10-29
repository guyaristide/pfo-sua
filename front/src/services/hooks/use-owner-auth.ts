import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

/** Ce que l'e-mail reçu dit du destinataire : accès déjà activé ou non (E3.1). */
export function useOwnerAccess(email: string | null) {
  const { ownerAuth } = useServices();
  return useQuery({ queryKey: queryKeys.ownerAccess(email ?? ''), queryFn: () => ownerAuth.getAccess(email ?? ''), enabled: email !== null && email !== '', retry: false });
}

/** Activation, connexion, lien et mot de passe oublié ; une session ouverte vide le cache de la précédente. */
export function useOwnerAuthActions() {
  const { ownerAuth } = useServices();
  const queryClient = useQueryClient();
  const opened = () => queryClient.clear();
  const activate = useMutation({ mutationFn: ({ email, password }: { email: string; password: string }) => ownerAuth.activate(email, password), onSuccess: opened });
  const signIn = useMutation({ mutationFn: ({ email, password }: { email: string; password: string }) => ownerAuth.signIn(email, password), onSuccess: opened });
  const requestLink = useMutation({ mutationFn: (email: string) => ownerAuth.requestLink(email) });
  const openLink = useMutation({ mutationFn: (email: string) => ownerAuth.openLink(email), onSuccess: opened });
  const requestReset = useMutation({ mutationFn: (email: string) => ownerAuth.requestReset(email) });
  return { activate, signIn, requestLink, openLink, requestReset };
}
