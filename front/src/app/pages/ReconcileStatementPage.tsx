import { useNavigate, useParams } from 'react-router';
import { useGetStatement } from '@/services/hooks/use-get-statement';
import { useValidateReconciliation } from '@/services/hooks/use-validate-reconciliation';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { AppError } from '@/shared/errors';
import { t } from '@/i18n/t';
import { ReconcileStatementScreen, type ReconcileDraft } from '@/ui/screens/ReconcileStatementScreen';
import { Button, EmptyState, ErrorState, LoadingState } from '@/ui/primitives';
import { useFormatters } from '../use-formatters';
import { useDraft } from '../use-draft';
import { useToast } from '../toast-context';

const initialDraft: ReconcileDraft = { step: 'import', imported: false, decisions: {}, explainerDismissed: false };

export function ReconcileStatementPage() {
  const { statementId = '' } = useParams();
  const fmt = useFormatters();
  const navigate = useNavigate();
  const toast = useToast();
  const query = useGetStatement(statementId);
  const mutation = useValidateReconciliation(statementId);
  const draft = useDraft<ReconcileDraft>(`reconcile.${statementId}`, initialDraft);
  const canValidate = usePermission(PERMISSIONS.COLLECTION_RECORD);
  const back = () => void navigate('/collections');

  if (query.isPending) return <LoadingState />;
  if (query.isError) {
    const error = AppError.from(query.error);
    if (error.kind === 'resource-missing') {
      return (
        <div className="card">
          <EmptyState icon="payments" title={t('state.missingResource')} action={<Button variant="neutral" onClick={back}>{t('reconcile.action.backToCollections')}</Button>} />
        </div>
      );
    }
    return <ErrorState reference={error.reference} {...(error.userMessage ? { userMessage: error.userMessage } : {})} onRetry={() => void query.refetch()} />;
  }

  const validate = () => {
    const decisions = Object.entries(draft.value.decisions).map(([lineId, action]) => ({ lineId, action }));
    mutation.mutate(decisions, {
      onSuccess: result => {
        draft.finish();
        toast.notify({
          tone: 'success',
          title: t('reconcile.result.toast'),
          detail: t('reconcile.result.toast.detail', { matched: result.matchedCount, excluded: result.excludedCount, amount: fmt.money(result.collectedAmount) }),
        });
      },
    });
  };
  const mutationError = mutation.isError ? AppError.from(mutation.error) : null;

  return (
    <ReconcileStatementScreen
      statement={query.data}
      fmt={fmt}
      draft={draft.value}
      onDraftChange={draft.setValue}
      onValidate={validate}
      validating={mutation.isPending}
      validationError={mutationError ? (mutationError.userMessage ?? t('state.error.body', { reference: mutationError.reference })) : undefined}
      result={mutation.data ?? null}
      canValidate={canValidate}
      onRecordCheque={() => void navigate('/collections/cheques/new')}
      onBack={back}
    />
  );
}
