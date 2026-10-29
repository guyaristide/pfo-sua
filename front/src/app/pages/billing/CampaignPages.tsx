import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { Period } from '@/services/contracts';
import { useCampaignPreview } from '@/services/hooks/use-campaign-preview';
import { useGetBillingOverview } from '@/services/hooks/use-get-billing-overview';
import { useIssueChecked, usePrepareCampaign } from '@/services/hooks/use-invoice-actions';
import { errorMessage } from '@/shared/errors';
import { t } from '@/i18n/t';
import { CampaignScreen, IssueScreen } from '@/ui/screens/billing/CampaignScreen';
import { QueryState } from '../../query-state';
import { useScope } from '../../scope-context';
import { useFormatters } from '../../use-formatters';
import { useToast } from '../../toast-context';

/** Les trimestres proposés : le courant et les deux suivants. */
function upcomingPeriods(): Period[] {
  const now = new Date();
  const first = { year: now.getUTCFullYear(), quarter: Math.floor(now.getUTCMonth() / 3) + 1 };
  const periods: Period[] = [];
  for (let i = 0; i < 3; i += 1) {
    const quarter = ((first.quarter - 1 + i) % 4) + 1;
    const year = first.year + Math.floor((first.quarter - 1 + i) / 4);
    periods.push({ year, quarter });
  }
  return periods;
}

export function CampaignPage() {
  const navigate = useNavigate();
  const fmt = useFormatters();
  const toast = useToast();
  const options = upcomingPeriods();
  const [period, setPeriod] = useState<Period>(options[1] ?? options[0]!);
  const preview = useCampaignPreview(period);
  const mutation = usePrepareCampaign();
  return (
    <CampaignScreen
      period={period}
      options={options}
      preview={preview.data ?? null}
      fmt={fmt}
      onPeriodChange={setPeriod}
      onPrepare={() =>
        mutation.mutate(period, {
          onSuccess: result => {
            toast.notify({ tone: 'success', title: t('campaign.done', { count: result.created }) });
            void navigate('/billing');
          },
        })
      }
      submitting={mutation.isPending}
      submitError={mutation.isError ? errorMessage(mutation.error) : undefined}
      onBack={() => void navigate('/billing')}
    />
  );
}

export function IssuePage() {
  const navigate = useNavigate();
  const fmt = useFormatters();
  const toast = useToast();
  const scope = useScope();
  const overview = useGetBillingOverview(scope.assetId);
  const mutation = useIssueChecked();
  return (
    <QueryState query={overview}>
      {data => (
        <IssueScreen
          invoices={data.invoices}
          fmt={fmt}
          onIssue={() =>
            mutation.mutate(scope.assetId, {
              onSuccess: result => {
                toast.notify({ tone: 'success', title: t('campaign.issue.done', { count: result.issued }) });
                void navigate('/billing');
              },
            })
          }
          submitting={mutation.isPending}
          submitError={mutation.isError ? errorMessage(mutation.error) : undefined}
          onBack={() => void navigate('/billing')}
        />
      )}
    </QueryState>
  );
}
