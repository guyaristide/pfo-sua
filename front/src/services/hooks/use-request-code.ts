import { useMutation } from '@tanstack/react-query';
import { useServices } from '../service-context';

export function useRequestCode() {
  const { auth } = useServices();
  return useMutation({ mutationFn: (email: string) => auth.requestCode(email) });
}
