import { useNavigate } from 'react-router';
import { useGetBudgetOverview } from '@/services/hooks/use-get-budget-overview';
import { usePrepareBudgetYear } from '@/services/hooks/use-budget-actions';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { errorMessage } from '@/shared/errors';
import { t } from '@/i18n/t';
import { BudgetScreen } from '@/ui/screens/BudgetScreen';
import { QueryState } from '../query-state';
import { useScope } from '../scope-context';
import { useFormatters } from '../use-formatters';
import { useToast } from '../toast-context';

export function BudgetPage() {
  const fmt = useFormatters();
  const scope = useScope();
  const navigate = useNavigate();
  const toast = useToast();
  const query = useGetBudgetOverview(scope.assetId);
  const canValidate = usePermission(PERMISSIONS.BUDGET_VALIDATE);
  const prepare = usePrepareBudgetYear();
  return (
    <QueryState query={query}>
      {overview => (
        <BudgetScreen
          overview={overview}
          fmt={fmt}
          canValidate={canValidate}
          onOpen={id => void navigate(`/budget/${encodeURIComponent(id)}`)}
          onReestimate={id => void navigate(`/budget/${encodeURIComponent(id)}/reestimate`)}
          preparing={prepare.isPending}
          onPrepare={() =>
            prepare.mutate(overview.year + 1, {
              onSuccess: result => toast.notify({ tone: 'success', title: t('budget.prepare.done', { count: result.created }) }),
              onError: error => toast.notify({ tone: 'danger', title: errorMessage(error) }),
            })
          }
        />
      )}
    </QueryState>
  );
}
