import { useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useGetInvoice(invoiceId: string) {
  const { billing } = useServices();
  return useQuery({ queryKey: queryKeys.invoice(invoiceId), queryFn: () => billing.getInvoice(invoiceId) });
}
