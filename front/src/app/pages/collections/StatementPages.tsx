import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAttachCaptures, useGetCaptures, useImportStatement } from '@/services/hooks/use-captures';
import { useGetCollectionsOverview } from '@/services/hooks/use-get-collections-overview';
import { useListAssets } from '@/services/hooks/use-list-assets';
import { useListBankAccounts } from '@/services/hooks/use-list-bank-accounts';
import { useListTenants } from '@/services/hooks/use-list-tenants';
import { useServices } from '@/services/service-context';
import { AppError } from '@/shared/errors';
import { t } from '@/i18n/t';
import { CapturesScreen, type Assignments } from '@/ui/screens/collections/CapturesScreen';
import { ImportStatementScreen, type ImportStatementForm } from '@/ui/screens/collections/ImportStatementScreen';
import { QueryState } from '../../query-state';
import { useFormatters } from '../../use-formatters';
import { useToast } from '../../toast-context';

const message = (error: unknown) => {
  const appError = AppError.from(error);
  return appError.userMessage ?? t('state.error.body', { reference: appError.reference });
};

export function CapturesPage() {
  const { statementId = '' } = useParams();
  const navigate = useNavigate();
  const fmt = useFormatters();
  const toast = useToast();
  const lines = useGetCaptures(statementId);
  const assets = useListAssets();
  const tenants = useListTenants();
  const overview = useGetCollectionsOverview();
  const [assignments, setAssignments] = useState<Assignments>({});
  const mutation = useAttachCaptures(statementId);
  const back = () => void navigate('/collections');
  const statement = overview.data?.statements.find(st => st.id === statementId);
  return (
    <QueryState query={lines}>
      {rows => (
        <QueryState query={assets}>
          {assetRows => (
            <QueryState query={tenants}>
              {tenantRows => (
                <CapturesScreen
                  statementLabel={statement ? `${statement.bank} · ${t('collections.statements.ownerPfo')} · ${fmt.monthYear(statement.lastPeriod)}` : ''}
                  lines={rows}
                  assets={assetRows}
                  tenants={tenantRows}
                  fmt={fmt}
                  assignments={assignments}
                  onAssign={(lineId, assetId, tenantId) => setAssignments(current => ({ ...current, [lineId]: { assetId, tenantId } }))}
                  onValidate={list =>
                    mutation.mutate(list, {
                      onSuccess: () => {
                        toast.notify({ tone: 'success', title: t('captures.done') });
                        back();
                      },
                    })
                  }
                  submitting={mutation.isPending}
                  submitError={mutation.isError ? message(mutation.error) : undefined}
                  onBack={back}
                />
              )}
            </QueryState>
          )}
        </QueryState>
      )}
    </QueryState>
  );
}

export function ImportStatementPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { demo } = useServices();
  const accounts = useListBankAccounts();
  const [form, setForm] = useState<ImportStatementForm>({ bankAccountId: '', period: '', fileName: '' });
  const mutation = useImportStatement();
  return (
    <QueryState query={accounts}>
      {rows => (
        <ImportStatementScreen
          accounts={rows}
          form={form}
          onChange={setForm}
          sampleAvailable={demo.enabled}
          onSubmit={() =>
            mutation.mutate(
              { bankAccountId: form.bankAccountId, period: `${form.period}-01` },
              {
                onSuccess: result => {
                  toast.notify({ tone: 'success', title: t('importStatement.done') });
                  void navigate(`/collections/statements/${encodeURIComponent(result.statementId)}/reconcile`, { replace: true });
                },
              },
            )
          }
          submitting={mutation.isPending}
          submitError={mutation.isError ? message(mutation.error) : undefined}
          onBack={() => void navigate('/collections')}
        />
      )}
    </QueryState>
  );
}
