import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { ReminderTemplate, TenantAccount } from '@/services/contracts';
import { useGetTenantAccount } from '@/services/hooks/use-get-tenant-account';
import { useListReminderTemplates } from '@/services/hooks/use-list-reminder-templates';
import { useSendReminder } from '@/services/hooks/use-send-reminder';
import { AppError } from '@/shared/errors';
import { t } from '@/i18n/t';
import { RemindTenantScreen, formFromTemplate, nextLevel, toReminderInput, type RemindForm } from '@/ui/screens/RemindTenantScreen';
import { Button, EmptyState } from '@/ui/primitives';
import { QueryState } from '../query-state';
import { useFormatters } from '../use-formatters';
import { useToast } from '../toast-context';

export function RemindTenantPage() {
  const { tenantId = '' } = useParams();
  const account = useGetTenantAccount(tenantId);
  const templates = useListReminderTemplates();
  return (
    <QueryState query={account}>
      {data => <QueryState query={templates}>{items => <RemindBody account={data} templates={items} />}</QueryState>}
    </QueryState>
  );
}

function RemindBody({ account, templates }: { account: TenantAccount; templates: ReminderTemplate[] }) {
  const navigate = useNavigate();
  const fmt = useFormatters();
  const toast = useToast();
  const [form, setForm] = useState<RemindForm>(() => formFromTemplate(nextLevel(account.reminderLevel), templates, account, fmt));
  const mutation = useSendReminder(account.id);
  const error = mutation.isError ? AppError.from(mutation.error) : null;
  const backToTenant = () => void navigate(`/tenants/${encodeURIComponent(account.id)}`);
  if (account.balance >= 0) {
    return (
      <div className="card">
        <EmptyState icon="check" title={t('remind.upToDate')} action={<Button variant="neutral" onClick={backToTenant}>{t('asset.record.tenants.open')}</Button>} trame />
      </div>
    );
  }
  return (
    <RemindTenantScreen
      account={account}
      templates={templates}
      fmt={fmt}
      form={form}
      onChange={setForm}
      onLevelChange={level => setForm(formFromTemplate(level, templates, account, fmt))}
      onSubmit={() =>
        mutation.mutate(toReminderInput(form), {
          onSuccess: () => {
            toast.notify({ tone: 'success', title: t('remind.sent', { name: account.name }) });
            backToTenant();
          },
        })
      }
      submitting={mutation.isPending}
      submitError={error ? (error.userMessage ?? t('state.error.body', { reference: error.reference })) : undefined}
      onCancel={backToTenant}
      onOpenArrears={() => void navigate('/arrears')}
    />
  );
}
