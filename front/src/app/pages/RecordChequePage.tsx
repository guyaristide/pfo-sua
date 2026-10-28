import { useNavigate, useSearchParams } from 'react-router';
import { useListTenants } from '@/services/hooks/use-list-tenants';
import { useRecordCheque } from '@/services/hooks/use-record-cheque';
import { AppError } from '@/shared/errors';
import { t } from '@/i18n/t';
import { RecordChequeScreen, emptyChequeForm, toChequeInput, type ChequeDraft } from '@/ui/screens/RecordChequeScreen';
import { ErrorState, LoadingState } from '@/ui/primitives';
import { useScope } from '../scope-context';
import { useFormatters } from '../use-formatters';
import { useDraft } from '../use-draft';
import { useToast } from '../toast-context';

const initialDraft: ChequeDraft = { step: 'capture', form: emptyChequeForm };

/**
 * Valeurs « lues » du chèque d'exemple du prototype 2B. La lecture réelle (photo ou scan) viendra avec
 * le module M13 ; d'ici là, déposer un fichier remplit ces valeurs.
 */
const sampleForm = { amount: '1200000', bank: 'BLCI', chequeNumber: '0045822', payee: 'SCI ITC', receivedOn: '2026-10-12', tenantId: 'tn-pharma' };

export function RecordChequePage() {
  const fmt = useFormatters();
  const scope = useScope();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toast = useToast();
  const tenants = useListTenants(scope.assetId);
  const mutation = useRecordCheque();
  const preselected = params.get('tenant');
  const draft = useDraft<ChequeDraft>('cheque.new', preselected ? { step: 'check', form: { ...emptyChequeForm, tenantId: preselected } } : initialDraft);
  const back = () => void navigate('/collections');

  if (tenants.isPending) return <LoadingState />;
  if (tenants.isError) {
    const error = AppError.from(tenants.error);
    return <ErrorState reference={error.reference} {...(error.userMessage ? { userMessage: error.userMessage } : {})} onRetry={() => void tenants.refetch()} />;
  }

  const submit = () => {
    mutation.mutate(toChequeInput(draft.value.form), {
      onSuccess: () => {
        draft.finish();
        toast.notify({ tone: 'success', title: t('cheque.toast') });
      },
    });
  };
  const mutationError = mutation.isError ? AppError.from(mutation.error) : null;

  return (
    <RecordChequeScreen
      tenants={tenants.data}
      fmt={fmt}
      draft={draft.value}
      onDraftChange={draft.setValue}
      onUseSample={() => draft.setValue({ step: 'check', form: sampleForm })}
      onSubmit={submit}
      submitting={mutation.isPending}
      submitError={mutationError ? (mutationError.userMessage ?? t('state.error.body', { reference: mutationError.reference })) : undefined}
      record={mutation.data ?? null}
      onAnother={() => {
        mutation.reset();
        draft.discard();
      }}
      onBack={back}
    />
  );
}
