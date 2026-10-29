import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { BankDeposit, ChequeDetail, ChequeFollowUpInput, ChequeRow, DepositSlip } from '@/services/contracts';
import { useChequeActions, useCompleteDeposit, useGetCheque, useGetDeposit, useListCheques, useListDeposits, usePrepareDeposit, useRejectCheque } from '@/services/hooks/use-cheques';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { errorMessage } from '@/shared/errors';
import { t } from '@/i18n/t';
import { ChequesScreen, RejectChequeScreen, type RejectForm } from '@/ui/screens/collections/ChequesScreen';
import { ChooseChequesScreen, DepositSlipsScreen } from '@/ui/screens/collections/DepositScreen';
import { ChequeDetailScreen } from '@/ui/screens/collections/ChequeDetailScreen';
import { useDraft } from '../../use-draft';
import { Button, EmptyState } from '@/ui/primitives';
import { QueryState } from '../../query-state';
import { useScope } from '../../scope-context';
import { useFormatters } from '../../use-formatters';
import { useToast } from '../../toast-context';

export function ChequesPage() {
  const navigate = useNavigate();
  const fmt = useFormatters();
  const scope = useScope();
  const query = useListCheques(scope.assetId);
  const canRecord = usePermission(PERMISSIONS.COLLECTION_RECORD);
  const deposits = useListDeposits(scope.assetId);
  return (
    <QueryState query={query}>
      {cheques => (
        <ChequesScreen
          cheques={cheques}
          deposits={deposits.data ?? []}
          fmt={fmt}
          canRecord={canRecord}
          onRecord={() => void navigate('/collections/cheques/new')}
          onPrepareDeposit={() => void navigate('/collections/cheques/deposit')}
          onOpenDeposit={id => void navigate(`/collections/cheques/deposits/${encodeURIComponent(id)}`)}
          onOpenCheque={id => void navigate(`/collections/cheques/${encodeURIComponent(id)}`)}
          onReject={id => void navigate(`/collections/cheques/${encodeURIComponent(id)}/reject`)}
          onOpenTenant={tenantId => void navigate(`/tenants/${encodeURIComponent(tenantId)}`)}
          onBack={() => void navigate('/collections')}
        />
      )}
    </QueryState>
  );
}

export function RejectChequePage() {
  const { chequeId = '' } = useParams();
  const navigate = useNavigate();
  const scope = useScope();
  const query = useListCheques(scope.assetId);
  return (
    <QueryState query={query}>
      {cheques => {
        const cheque = cheques.find(c => c.id === chequeId);
        if (!cheque) {
          return (
            <div className="card">
              <EmptyState icon="payments" title={t('state.missingResource')} action={<Button variant="neutral" onClick={() => void navigate('/collections/cheques')}>{t('cheques.title')}</Button>} />
            </div>
          );
        }
        return <RejectBody cheque={cheque} />;
      }}
    </QueryState>
  );
}

function RejectBody({ cheque }: { cheque: ChequeRow }) {
  const navigate = useNavigate();
  const fmt = useFormatters();
  const toast = useToast();
  const [form, setForm] = useState<RejectForm>({ reason: 'insufficient-funds', note: '' });
  const mutation = useRejectCheque(cheque.id);
  const backToList = () => void navigate('/collections/cheques');
  return (
    <RejectChequeScreen
      cheque={cheque}
      fmt={fmt}
      form={form}
      onChange={setForm}
      onSubmit={() =>
        mutation.mutate(
          { reason: form.reason, note: form.note.trim() || null },
          {
            onSuccess: () => {
              toast.notify({ tone: 'success', title: t('cheques.rejected') });
              backToList();
            },
          },
        )
      }
      submitting={mutation.isPending}
      submitError={mutation.isError ? errorMessage(mutation.error) : undefined}
      onCancel={backToList}
      onBack={() => void navigate('/collections')}
    />
  );
}

/** E2.7, étape 1 : choisir les chèques, imprimer la liste pour le coursier. */
export function PrepareDepositPage() {
  const navigate = useNavigate();
  const fmt = useFormatters();
  const scope = useScope();
  const toast = useToast();
  const query = useListCheques(scope.assetId);
  const [selected, setSelected] = useState<string[]>([]);
  const prepare = usePrepareDeposit();
  return (
    <QueryState query={query}>
      {cheques => (
        <ChooseChequesScreen
          cheques={cheques}
          fmt={fmt}
          selected={selected}
          onSelected={setSelected}
          onPrepare={() =>
            prepare.mutate(selected, {
              onSuccess: deposit => {
                toast.notify({ tone: 'success', title: t('deposit.prepared', { count: deposit.cheques.length }) });
                window.print();
                void navigate(`/collections/cheques/deposits/${encodeURIComponent(deposit.id)}`, { replace: true });
              },
            })
          }
          preparing={prepare.isPending}
          prepareError={prepare.isError ? errorMessage(prepare.error) : undefined}
          onBack={() => void navigate('/collections/cheques')}
        />
      )}
    </QueryState>
  );
}

/** E2.7, étape 2 : un bordereau par chèque, puis la confirmation de la remise. */
export function DepositPage() {
  const { depositId = '' } = useParams();
  const navigate = useNavigate();
  const query = useGetDeposit(depositId);
  return (
    <QueryState
      query={query}
      missing={
        <div className="card">
          <EmptyState icon="bank" title={t('state.missingResource')} action={<Button variant="neutral" onClick={() => void navigate('/collections/cheques')}>{t('cheques.title')}</Button>} />
        </div>
      }
    >
      {deposit => <DepositBody deposit={deposit} />}
    </QueryState>
  );
}

function DepositBody({ deposit }: { deposit: BankDeposit }) {
  const navigate = useNavigate();
  const fmt = useFormatters();
  const toast = useToast();
  const draft = useDraft<Record<string, DepositSlip>>(`deposit.${deposit.id}`, {});
  const complete = useCompleteDeposit(deposit.id);
  return (
    <DepositSlipsScreen
      deposit={deposit}
      fmt={fmt}
      slips={draft.value}
      onSlips={draft.setValue}
      onComplete={() =>
        complete.mutate(draft.value, {
          onSuccess: result => {
            draft.finish();
            toast.notify({ tone: 'success', title: t('deposit.completed', { count: result.cheques.length }) });
          },
        })
      }
      completing={complete.isPending}
      completeError={complete.isError ? errorMessage(complete.error) : undefined}
      onFinish={() => void navigate('/collections')}
      onBack={() => void navigate('/collections/cheques')}
    />
  );
}

/** E2.10 : la fiche d'un chèque, ouverte depuis « À traiter » ou la liste des chèques. */
export function ChequeDetailPage() {
  const { chequeId = '' } = useParams();
  const navigate = useNavigate();
  const query = useGetCheque(chequeId);
  return (
    <QueryState
      query={query}
      missing={
        <div className="card">
          <EmptyState icon="payments" title={t('state.missingResource')} action={<Button variant="neutral" onClick={() => void navigate('/collections/cheques')}>{t('cheques.title')}</Button>} />
        </div>
      }
    >
      {detail => <ChequeDetailBody detail={detail} />}
    </QueryState>
  );
}

function ChequeDetailBody({ detail }: { detail: ChequeDetail }) {
  const navigate = useNavigate();
  const fmt = useFormatters();
  const toast = useToast();
  const canAct = usePermission(PERMISSIONS.COLLECTION_RECORD);
  const actions = useChequeActions(detail.cheque.id);
  const [followUp, setFollowUp] = useState<ChequeFollowUpInput>({ date: new Date().toISOString().slice(0, 10), who: '', reply: '' });
  const failed = [actions.match, actions.dismiss, actions.note].find(m => m.isError);
  return (
    <ChequeDetailScreen
      detail={detail}
      fmt={fmt}
      canAct={canAct}
      followUp={followUp}
      onFollowUp={setFollowUp}
      onAddFollowUp={() =>
        actions.note.mutate(followUp, {
          onSuccess: () => {
            setFollowUp({ ...followUp, who: '', reply: '' });
            toast.notify({ tone: 'success', title: t('chequeDetail.noted') });
          },
        })
      }
      onMatch={(statementId, lineId) => actions.match.mutate({ statementId, lineId }, { onSuccess: () => toast.notify({ tone: 'success', title: t('chequeDetail.matched', { number: detail.cheque.chequeNumber }) }) })}
      onDismiss={lineId => actions.dismiss.mutate(lineId)}
      busy={actions.match.isPending || actions.dismiss.isPending || actions.note.isPending}
      error={failed ? errorMessage(failed.error) : undefined}
      onReject={() => void navigate(`/collections/cheques/${encodeURIComponent(detail.cheque.id)}/reject`)}
      onOpenTenant={() => void navigate(`/tenants/${encodeURIComponent(detail.cheque.tenantId)}`)}
      onOpenCheques={() => void navigate('/collections/cheques')}
      onBack={() => void navigate('/collections')}
    />
  );
}
