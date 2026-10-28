import { useState } from 'react';
import { useParams } from 'react-router';
import type { ReminderTemplate } from '@/services/contracts';
import { useListReminderTemplates } from '@/services/hooks/use-list-reminder-templates';
import { useSaveReminderTemplate } from '@/services/hooks/use-save-reminder-template';
import { AppError } from '@/shared/errors';
import { t } from '@/i18n/t';
import {
  ReminderTemplateFormScreen,
  ReminderTemplatesScreen,
  reminderTemplateToForm,
  toReminderTemplateInput,
  type ReminderTemplateForm,
} from '@/ui/screens/settings/ReminderTemplatesScreen';
import { Button, EmptyState } from '@/ui/primitives';
import { QueryState } from '../../query-state';
import { useDraft } from '../../use-draft';
import { useFormatters } from '../../use-formatters';
import { useToast } from '../../toast-context';
import { AdminOnly, useIsAdmin } from './AdminOnly';
import { useSettingsNavigation } from './settings-navigation';

export function ReminderTemplatesPage() {
  const fmt = useFormatters();
  const templates = useListReminderTemplates();
  const isAdmin = useIsAdmin();
  const nav = useSettingsNavigation('reminder-templates');
  return (
    <QueryState query={templates}>
      {rows => (
        <ReminderTemplatesScreen templates={rows} fmt={fmt} isAdmin={isAdmin} onEdit={id => void nav.navigate(`/settings/reminder-templates/${encodeURIComponent(id)}/edit`)} onOpenSettings={nav.onOpenSettings} />
      )}
    </QueryState>
  );
}

export function ReminderTemplateFormPage() {
  const { templateId = '' } = useParams();
  const nav = useSettingsNavigation('reminder-templates');
  const templates = useListReminderTemplates();
  return (
    <AdminOnly onBack={nav.onOpenSection}>
      <QueryState query={templates}>
        {rows => {
          const template = rows.find(row => row.id === templateId);
          if (!template) {
            return (
              <div className="card">
                <EmptyState icon="bell" title={t('state.missingResource')} action={<Button variant="neutral" onClick={nav.onOpenSection}>{t('settings.action.cancel')}</Button>} />
              </div>
            );
          }
          return <ReminderTemplateFormBody template={template} />;
        }}
      </QueryState>
    </AdminOnly>
  );
}

function ReminderTemplateFormBody({ template }: { template: ReminderTemplate }) {
  const fmt = useFormatters();
  const nav = useSettingsNavigation('reminder-templates');
  const toast = useToast();
  const [initial] = useState(() => reminderTemplateToForm(template));
  const draft = useDraft<ReminderTemplateForm>(`settings.reminder.${template.id}`, initial);
  const mutation = useSaveReminderTemplate(template.id);
  const error = mutation.isError ? AppError.from(mutation.error) : null;
  return (
    <ReminderTemplateFormScreen
      template={template}
      fmt={fmt}
      form={draft.value}
      onChange={draft.setValue}
      submitting={mutation.isPending}
      submitError={error ? (error.userMessage ?? t('state.error.body', { reference: error.reference })) : undefined}
      onSubmit={() =>
        mutation.mutate(toReminderTemplateInput(draft.value), {
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
