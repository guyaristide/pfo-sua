import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useListNotifications() {
  const { notifications } = useServices();
  return useQuery({ queryKey: queryKeys.notifications, queryFn: () => notifications.list(), staleTime: 60_000 });
}

export function useMarkNotificationsRead() {
  const { notifications } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notifications.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}
