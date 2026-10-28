import { useParams } from 'react-router';
import type { AssetSummary, BankAccount } from '@/services/contracts';
import { useListAssets } from '@/services/hooks/use-list-assets';
import { useListBankAccounts } from '@/services/hooks/use-list-bank-accounts';
import { useSaveBankAccount } from '@/services/hooks/use-save-bank-account';
import { AppError } from '@/shared/errors';
import { t } from '@/i18n/t';
import {
  BankAccountFormScreen,
  BankAccountsScreen,
  bankAccountToForm,
  emptyBankAccountForm,
  toBankAccountInput,
  type BankAccountForm,
} from '@/ui/screens/settings/BankAccountsScreen';
import { Button, EmptyState } from '@/ui/primitives';
import { QueryState } from '../../query-state';
import { useDraft } from '../../use-draft';
import { useToast } from '../../toast-context';
import { AdminOnly, useIsAdmin } from './AdminOnly';
import { useSettingsNavigation } from './settings-navigation';

export function BankAccountsPage() {
  const accounts = useListBankAccounts();
  const isAdmin = useIsAdmin();
  const nav = useSettingsNavigation('bank-accounts');
  return (
    <QueryState query={accounts}>
      {rows => (
        <BankAccountsScreen
          accounts={rows}
          isAdmin={isAdmin}
          onNew={() => void nav.navigate('/settings/bank-accounts/new')}
          onEdit={id => void nav.navigate(`/settings/bank-accounts/${encodeURIComponent(id)}/edit`)}
          onOpenSettings={nav.onOpenSettings}
        />
      )}
    </QueryState>
  );
}

export function BankAccountFormPage() {
  const { accountId } = useParams();
  const nav = useSettingsNavigation('bank-accounts');
  const assets = useListAssets();
  const accounts = useListBankAccounts();
  return (
    <AdminOnly onBack={nav.onOpenSection}>
      <QueryState query={assets}>
        {assetRows =>
          accountId ? (
            <QueryState query={accounts}>
              {rows => {
                const account = rows.find(row => row.id === accountId);
                if (!account) {
                  return (
                    <div className="card">
                      <EmptyState icon="bank" title={t('state.missingResource')} action={<Button variant="neutral" onClick={nav.onOpenSection}>{t('settings.action.cancel')}</Button>} />
                    </div>
                  );
                }
                return <BankAccountFormBody account={account} assets={assetRows} />;
              }}
            </QueryState>
          ) : (
            <BankAccountFormBody account={null} assets={assetRows} />
          )
        }
      </QueryState>
    </AdminOnly>
  );
}

function BankAccountFormBody({ account, assets }: { account: BankAccount | null; assets: AssetSummary[] }) {
  const nav = useSettingsNavigation('bank-accounts');
  const toast = useToast();
  const draft = useDraft<BankAccountForm>(`settings.bank-account.${account?.id ?? 'new'}`, account ? bankAccountToForm(account) : emptyBankAccountForm);
  const mutation = useSaveBankAccount(account?.id);
  const error = mutation.isError ? AppError.from(mutation.error) : null;
  return (
    <BankAccountFormScreen
      editing={account !== null}
      assets={assets}
      form={draft.value}
      onChange={draft.setValue}
      submitting={mutation.isPending}
      submitError={error ? (error.userMessage ?? t('state.error.body', { reference: error.reference })) : undefined}
      onSubmit={() =>
        mutation.mutate(toBankAccountInput(draft.value), {
          onSuccess: () => {
            draft.finish();
            toast.notify({ tone: 'success', title: t('settings.saved') });
            nav.onOpenSection();
          },
        })
      }
      onOpenSettings={nav.onOpenSettings}
      onOpenSection={nav.onOpenSection}
    />
  );
}
