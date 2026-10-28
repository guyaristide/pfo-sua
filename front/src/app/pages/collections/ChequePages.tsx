import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { ChequeRow } from '@/services/contracts';
import { useListCheques, useMarkChequesDeposited, useRejectCheque } from '@/services/hooks/use-cheques';
import { usePermission } from '@/shared/auth/use-permission';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { AppError } from '@/shared/errors';
import { t } from '@/i18n/t';
import { ChequesScreen, RejectChequeScreen, type RejectForm } from '@/ui/screens/collections/ChequesScreen';
import { Button, EmptyState } from '@/ui/primitives';
import { QueryState } from '../../query-state';
import { useScope } from '../../scope-context';
import { useFormatters } from '../../use-formatters';
import { useToast } from '../../toast-context';

const message = (error: unknown) => {
  const appError = AppError.from(error);
  return appError.userMessage ?? t('state.error.body', { reference: appError.reference });
};

export function ChequesPage() {
  const navigate = useNavigate();
  const fmt = useFormatters();
  const toast = useToast();
  const scope = useScope();
  const query = useListCheques(scope.assetId);
  const canRecord = usePermission(PERMISSIONS.COLLECTION_RECORD);
  const deposit = useMarkChequesDeposited();
  return (
    <QueryState query={query}>
      {cheques => (
        <ChequesScreen
          cheques={cheques}
          fmt={fmt}
          canRecord={canRecord}
          onRecord={() => void navigate('/collections/cheques/new')}
          onDeposit={ids =>
            deposit.mutate(ids, {
              onSuccess: rows => {
                toast.notify({ tone: 'success', title: t('cheques.deposited', { count: rows.length }) });
                window.print();
              },
              onError: error => toast.notify({ tone: 'danger', title: message(error) }),
            })
          }
          depositing={deposit.isPending}
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
      submitError={mutation.isError ? message(mutation.error) : undefined}
      onCancel={backToList}
      onBack={() => void navigate('/collections')}
    />
  );
}
