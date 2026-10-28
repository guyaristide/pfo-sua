import { useQuery } from '@tanstack/react-query';
import type { Period } from '../contracts';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useCampaignPreview(period: Period) {
  const { billing } = useServices();
  return useQuery({ queryKey: queryKeys.campaignPreview(period.year, period.quarter), queryFn: () => billing.previewCampaign(period) });
}
