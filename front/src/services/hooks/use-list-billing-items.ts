import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useListBillingItems() {
  const { settings } = useServices();
  return useQuery({ queryKey: queryKeys.settingsSection('billing-items'), queryFn: () => settings.listBillingItems() });
}
