import { useNavigate } from 'react-router';
import { useGetBillingOverview } from '@/services/hooks/use-get-billing-overview';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { AppError } from '@/shared/errors';
import { BillingScreen } from '@/ui/screens/BillingScreen';
import { ErrorState, LoadingState } from '@/ui/primitives';
import { useScope } from '../scope-context';
import { useFormatters } from '../use-formatters';

export function BillingPage() {
  const fmt = useFormatters();
  const scope = useScope();
  const navigate = useNavigate();
  const query = useGetBillingOverview(scope.assetId);
  const canIssue = usePermission(PERMISSIONS.INVOICE_ISSUE);

  if (query.isPending) return <LoadingState />;
  if (query.isError) {
    const error = AppError.from(query.error);
    return <ErrorState reference={error.reference} {...(error.userMessage ? { userMessage: error.userMessage } : {})} onRetry={() => void query.refetch()} />;
  }
  return (
    <BillingScreen
      overview={query.data}
      fmt={fmt}
      canIssue={canIssue}
      onOpenInvoice={id => void navigate(`/billing/invoices/${encodeURIComponent(id)}`)}
      onPrepare={() => void navigate('/billing/campaigns/new')}
      onIssue={() => void navigate('/billing/issue')}
    />
  );
}
