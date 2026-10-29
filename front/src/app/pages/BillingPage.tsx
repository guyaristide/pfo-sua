import { useNavigate } from 'react-router';
import { useGetBillingOverview } from '@/services/hooks/use-get-billing-overview';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { BillingScreen } from '@/ui/screens/BillingScreen';
import { QueryState } from '../query-state';
import { useScope } from '../scope-context';
import { useFormatters } from '../use-formatters';

export function BillingPage() {
  const fmt = useFormatters();
  const scope = useScope();
  const navigate = useNavigate();
  const query = useGetBillingOverview(scope.assetId);
  const canIssue = usePermission(PERMISSIONS.INVOICE_ISSUE);
  return (
    <QueryState query={query}>
      {overview => (
        <BillingScreen
          overview={overview}
          fmt={fmt}
          canIssue={canIssue}
          onOpenInvoice={id => void navigate(`/billing/invoices/${encodeURIComponent(id)}`)}
          onPrepare={() => void navigate('/billing/campaigns/new')}
          onIssue={() => void navigate('/billing/issue')}
        />
      )}
    </QueryState>
  );
}
