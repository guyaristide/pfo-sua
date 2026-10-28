import { useNavigate } from 'react-router';
import { usePrepareBudgetYear } from '@/services/hooks/use-budget-actions';
import { useToast } from '../toast-context';
import { t } from '@/i18n/t';
import { useGetBudgetOverview } from '@/services/hooks/use-get-budget-overview';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { AppError } from '@/shared/errors';
import { BudgetScreen } from '@/ui/screens/BudgetScreen';
import { ErrorState, LoadingState } from '@/ui/primitives';
import { useScope } from '../scope-context';
import { useFormatters } from '../use-formatters';

export function BudgetPage() {
  const fmt = useFormatters();
  const scope = useScope();
  const navigate = useNavigate();
  const toast = useToast();
  const prepare = usePrepareBudgetYear();
  const query = useGetBudgetOverview(scope.assetId);
  const canValidate = usePermission(PERMISSIONS.BUDGET_VALIDATE);

  if (query.isPending) return <LoadingState />;
  if (query.isError) {
    const error = AppError.from(query.error);
    return <ErrorState reference={error.reference} {...(error.userMessage ? { userMessage: error.userMessage } : {})} onRetry={() => void query.refetch()} />;
  }
  return (
    <BudgetScreen
      overview={query.data}
      fmt={fmt}
      canValidate={canValidate}
      onOpen={id => void navigate(`/budget/${encodeURIComponent(id)}`)}
      onReestimate={id => void navigate(`/budget/${encodeURIComponent(id)}/reestimate`)}
      preparing={prepare.isPending}
      onPrepare={() =>
        prepare.mutate(query.data.year + 1, {
          onSuccess: result => toast.notify({ tone: 'success', title: t('budget.prepare.done', { count: result.created }) }),
          onError: error => {
            const appError = AppError.from(error);
            toast.notify({ tone: 'danger', title: appError.userMessage ?? t('state.error.body', { reference: appError.reference }) });
          },
        })
      }
    />
  );
}
