import { useNavigate, useSearchParams } from 'react-router';
import { useListTenants } from '@/services/hooks/use-list-tenants';
import { useRecordCheque } from '@/services/hooks/use-record-cheque';
import { useReturnCheque } from '@/services/hooks/use-cheques';
import { errorMessage } from '@/shared/errors';
import { t } from '@/i18n/t';
import { RecordChequeScreen, chequeIssues, emptyChequeForm, toChequeInput, type ChequeDraft } from '@/ui/screens/RecordChequeScreen';
import { QueryState } from '../query-state';
import { useScope } from '../scope-context';
import { useFormatters } from '../use-formatters';
import { useDraft } from '../use-draft';
import { useToast } from '../toast-context';
import { useSession } from '@/services/hooks/use-session';

const initialDraft: ChequeDraft = { step: 'capture', form: emptyChequeForm };

/**
 * Valeurs « lues » du chèque d'exemple du prototype 2B. La lecture réelle (photo ou scan) viendra avec
 * le module M13 ; d'ici là, déposer un fichier remplit ces valeurs.
 */
const sampleForm = { amount: '1200000', amountInWords: 'Un million deux cent mille', bank: 'BLCI', chequeNumber: '0045822', payee: 'SCI ITC', receivedOn: '2026-10-12', tenantId: 'tn-pharma', signed: true };

export function RecordChequePage() {
  const fmt = useFormatters();
  const scope = useScope();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toast = useToast();
  const session = useSession();
  const tenants = useListTenants(scope.assetId);
  const mutation = useRecordCheque();
  const returnMutation = useReturnCheque();
  const preselected = params.get('tenant');
  const draft = useDraft<ChequeDraft>('cheque.new', preselected ? { step: 'check', form: { ...emptyChequeForm, tenantId: preselected } } : initialDraft);
  const back = () => void navigate('/collections');

  return (
    <QueryState query={tenants}>
      {options => {
        const tenant = options.find(option => option.id === draft.value.form.tenantId);
        const startReturn = () => {
          const form = draft.value.form;
          const sender = `${session.user.firstName} ${session.user.lastName}`;
          draft.setValue({
            ...draft.value,
            returning: {
              to: tenant?.email ?? '',
              subject: t('cheque.return.template.subject', { number: form.chequeNumber }),
              body: t('cheque.return.template.body', { tenant: tenant?.name ?? '', number: form.chequeNumber, amount: fmt.money(Number(form.amount) || 0), sender }),
            },
          });
        };
        const sendReturn = () => {
          const form = draft.value.form;
          const message = draft.value.returning;
          if (!message) return;
          returnMutation.mutate(
            { cheque: toChequeInput(form), issues: chequeIssues(form, tenant?.payeeName), message },
            { onSuccess: result => { draft.finish(); toast.notify({ tone: 'success', title: t('cheque.return.toast'), detail: t('cheque.return.sent', { email: result.sentTo }) }); } },
          );
        };
        return (
          <RecordChequeScreen
            tenants={options}
            fmt={fmt}
            draft={draft.value}
            onDraftChange={draft.setValue}
            onUseSample={() => draft.setValue({ step: 'check', form: sampleForm })}
            onSubmit={() =>
              mutation.mutate(toChequeInput(draft.value.form), {
                onSuccess: () => {
                  draft.finish();
                  toast.notify({ tone: 'success', title: t('cheque.toast') });
                },
              })
            }
            submitting={mutation.isPending}
            submitError={mutation.isError ? errorMessage(mutation.error) : undefined}
            record={mutation.data ?? null}
            onReturn={startReturn}
            onSendReturn={sendReturn}
            returning={returnMutation.isPending}
            returnError={returnMutation.isError ? errorMessage(returnMutation.error) : undefined}
            returned={returnMutation.data ?? null}
            onAnother={() => {
              mutation.reset();
              returnMutation.reset();
              draft.discard();
            }}
            onBack={back}
          />
        );
      }}
    </QueryState>
  );
}
