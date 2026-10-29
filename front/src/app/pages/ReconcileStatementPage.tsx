import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useGetStatement } from '@/services/hooks/use-get-statement';
import { useValidateReconciliation } from '@/services/hooks/use-validate-reconciliation';
import { useMonthlyFileActions } from '@/services/hooks/use-monthly-file-actions';
import { useReopenReconciliation } from '@/services/hooks/use-reopen-reconciliation';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { errorMessage } from '@/shared/errors';
import { t } from '@/i18n/t';
import { ReconcileStatementScreen, initialReconcileDraft, type ReconcileDraft } from '@/ui/screens/ReconcileStatementScreen';
import { buildDecisions } from '@/ui/screens/collections/reconcile/work';
import { Button, EmptyState } from '@/ui/primitives';
import { QueryState } from '../query-state';
import { useFormatters } from '../use-formatters';
import { useDraft } from '../use-draft';
import { useToast } from '../toast-context';

export function ReconcileStatementPage() {
  const { statementId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const fmt = useFormatters();
  const navigate = useNavigate();
  const toast = useToast();
  const query = useGetStatement(statementId);
  const mutation = useValidateReconciliation(statementId);
  const file = useMonthlyFileActions(statementId);
  const reopen = useReopenReconciliation(statementId);
  const draft = useDraft<ReconcileDraft>(`reconcile.${statementId}`, initialReconcileDraft);
  const canValidate = usePermission(PERMISSIONS.COLLECTION_RECORD);
  const canApprove = usePermission(PERMISSIONS.COLLECTION_APPROVE);
  const back = () => void navigate('/collections');

  // « Qualifier » depuis l'accueil : on arrive directement sur l'onglet des lignes écartées.
  const focus = params.get('focus');
  useEffect(() => {
    if (focus !== 'excluded') return;
    draft.setValue(current => ({ ...current, step: 'reconcile', imported: true, tab: 'excluded', selected: null }));
    setParams({}, { replace: true });
  }, [focus, draft, setParams]);

  const reopenWith = (reason: string) =>
    reopen.mutate(reason, {
      onSuccess: () => {
        mutation.reset();
        draft.setValue({ ...initialReconcileDraft, step: 'reconcile', imported: true, tab: 'matched' });
        toast.notify({ tone: 'info', title: t('reconcile.reopen.toast') });
      },
    });

  const validate = () => {
    const statement = query.data;
    if (!statement) return;
    mutation.mutate(buildDecisions(statement, draft.value.works), {
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
  const approve = () => file.approve.mutate(undefined, { onSuccess: () => toast.notify({ tone: 'success', title: t('file.toast.approved') }) });
  const sendBack = (comment: string) => file.sendBack.mutate(comment, { onSuccess: () => toast.notify({ tone: 'info', title: t('file.toast.returned') }) });
  const fileError = file.approve.isError ? errorMessage(file.approve.error) : file.sendBack.isError ? errorMessage(file.sendBack.error) : undefined;

  return (
    <QueryState
      query={query}
      missing={
        <div className="card">
          <EmptyState icon="payments" title={t('state.missingResource')} action={<Button variant="neutral" onClick={back}>{t('reconcile.action.backToCollections')}</Button>} />
        </div>
      }
    >
      {statement => (
        <ReconcileStatementScreen
          statement={statement}
          fmt={fmt}
          draft={draft.value}
          onDraftChange={draft.setValue}
          onValidate={validate}
          validating={mutation.isPending}
          validationError={mutation.isError ? errorMessage(mutation.error) : undefined}
          result={mutation.data ?? null}
          canValidate={canValidate}
          canApprove={canApprove}
          fileBusy={file.approve.isPending || file.sendBack.isPending}
          fileError={fileError}
          onApprove={approve}
          onReturn={sendBack}
          onReopen={reopenWith}
          reopening={reopen.isPending}
          reopenError={reopen.isError ? errorMessage(reopen.error) : undefined}
          onRecordCheque={() => void navigate('/collections/cheques/new')}
          onBack={back}
        />
      )}
    </QueryState>
  );
}
