import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useListBankAccounts() {
  const { settings } = useServices();
  return useQuery({ queryKey: queryKeys.settingsSection('bank-accounts'), queryFn: () => settings.listBankAccounts() });
}
