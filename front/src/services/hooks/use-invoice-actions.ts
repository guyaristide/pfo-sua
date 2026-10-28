import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DeliveryInput, Period } from '../contracts';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

function useInvalidateBilling() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.billingAll });
}

export function useMarkInvoiceChecked(invoiceId: string) {
  const { billing } = useServices();
  const invalidate = useInvalidateBilling();
  return useMutation({ mutationFn: () => billing.markChecked(invoiceId), onSuccess: invalidate });
}

export function useRecordDelivery(invoiceId: string) {
  const { billing } = useServices();
  const invalidate = useInvalidateBilling();
  return useMutation({ mutationFn: (input: DeliveryInput) => billing.recordDelivery(invoiceId, input), onSuccess: invalidate });
}

export function usePrepareCampaign() {
  const { billing } = useServices();
  const invalidate = useInvalidateBilling();
  return useMutation({ mutationFn: (period: Period) => billing.prepareCampaign(period), onSuccess: invalidate });
}

export function useIssueChecked() {
  const { billing } = useServices();
  const invalidate = useInvalidateBilling();
  return useMutation({ mutationFn: (assetId?: string) => billing.issueChecked(assetId), onSuccess: invalidate });
}
