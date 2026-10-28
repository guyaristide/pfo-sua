import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { BudgetDetail } from '@/services/contracts';
import { useGetBudget } from '@/services/hooks/use-get-budget';
import { useReestimateBudget } from '@/services/hooks/use-budget-actions';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { AppError } from '@/shared/errors';
import { t } from '@/i18n/t';
import { BudgetDetailScreen, ReestimateScreen, reestimateFormFrom, toReestimateInput, type ReestimateForm } from '@/ui/screens/budget/BudgetDetailScreen';
import { QueryState } from '../../query-state';
import { useFormatters } from '../../use-formatters';
import { useToast } from '../../toast-context';

export function BudgetDetailPage() {
  const { budgetId = '' } = useParams();
  const navigate = useNavigate();
  const fmt = useFormatters();
  const query = useGetBudget(budgetId);
  const canValidate = usePermission(PERMISSIONS.BUDGET_VALIDATE);
  return (
    <QueryState query={query}>
      {budget => (
        <BudgetDetailScreen
          budget={budget}
          fmt={fmt}
          canValidate={canValidate}
          onReestimate={() => void navigate(`/budget/${encodeURIComponent(budgetId)}/reestimate`)}
          onOpenAsset={() => void navigate(`/assets/${encodeURIComponent(budget.assetId)}`)}
          onBack={() => void navigate('/budget')}
        />
      )}
    </QueryState>
  );
}

export function ReestimatePage() {
  const { budgetId = '' } = useParams();
  const query = useGetBudget(budgetId);
  return <QueryState query={query}>{budget => <ReestimateBody budget={budget} />}</QueryState>;
}

function ReestimateBody({ budget }: { budget: BudgetDetail }) {
  const navigate = useNavigate();
  const fmt = useFormatters();
  const toast = useToast();
  const [form, setForm] = useState<ReestimateForm>(() => reestimateFormFrom(budget));
  const mutation = useReestimateBudget(budget.id);
  const error = mutation.isError ? AppError.from(mutation.error) : null;
  const backToBudget = () => void navigate(`/budget/${encodeURIComponent(budget.id)}`);
  return (
    <ReestimateScreen
      budget={budget}
      fmt={fmt}
      form={form}
      onChange={setForm}
      onSubmit={() =>
        mutation.mutate(toReestimateInput(form), {
          onSuccess: () => {
            toast.notify({ tone: 'success', title: t('budget.reestimate.done') });
            backToBudget();
          },
        })
      }
      submitting={mutation.isPending}
      submitError={error ? (error.userMessage ?? t('state.error.body', { reference: error.reference })) : undefined}
      onCancel={backToBudget}
      onBack={() => void navigate('/budget')}
    />
  );
}
