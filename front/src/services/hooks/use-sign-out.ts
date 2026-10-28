import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from '../service-context';

export function useSignOut() {
  const { auth } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => auth.signOut(),
    onSettled: () => queryClient.clear(),
  });
}
