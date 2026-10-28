import { useState } from 'react';
import { useParams } from 'react-router';
import type { CalendarRule } from '@/services/contracts';
import { useListCalendarRules } from '@/services/hooks/use-list-calendar-rules';
import { useSaveCalendarRule } from '@/services/hooks/use-save-calendar-rule';
import { AppError } from '@/shared/errors';
import { t } from '@/i18n/t';
import { CalendarRuleFormScreen, CalendarScreen, calendarRuleToForm, toCalendarRuleInput, type CalendarRuleForm } from '@/ui/screens/settings/CalendarScreen';
import { Button, EmptyState } from '@/ui/primitives';
import { QueryState } from '../../query-state';
import { useDraft } from '../../use-draft';
import { useFormatters } from '../../use-formatters';
import { useToast } from '../../toast-context';
import { AdminOnly, useIsAdmin } from './AdminOnly';
import { useSettingsNavigation } from './settings-navigation';

export function CalendarPage() {
  const fmt = useFormatters();
  const rules = useListCalendarRules();
  const isAdmin = useIsAdmin();
  const nav = useSettingsNavigation('calendar');
  return (
    <QueryState query={rules}>
      {rows => <CalendarScreen rules={rows} fmt={fmt} isAdmin={isAdmin} onEdit={id => void nav.navigate(`/settings/calendar/${encodeURIComponent(id)}/edit`)} onOpenSettings={nav.onOpenSettings} />}
    </QueryState>
  );
}

export function CalendarRuleFormPage() {
  const { ruleId = '' } = useParams();
  const nav = useSettingsNavigation('calendar');
  const rules = useListCalendarRules();
  return (
    <AdminOnly onBack={nav.onOpenSection}>
      <QueryState query={rules}>
        {rows => {
          const rule = rows.find(row => row.id === ruleId);
          if (!rule) {
            return (
              <div className="card">
                <EmptyState icon="calendar" title={t('state.missingResource')} action={<Button variant="neutral" onClick={nav.onOpenSection}>{t('settings.action.cancel')}</Button>} />
              </div>
            );
          }
          return <CalendarRuleFormBody rule={rule} />;
        }}
      </QueryState>
    </AdminOnly>
  );
}

function CalendarRuleFormBody({ rule }: { rule: CalendarRule }) {
  const fmt = useFormatters();
  const nav = useSettingsNavigation('calendar');
  const toast = useToast();
  const [initial] = useState(() => calendarRuleToForm(rule));
  const draft = useDraft<CalendarRuleForm>(`settings.calendar.${rule.id}`, initial);
  const mutation = useSaveCalendarRule(rule.id);
  const error = mutation.isError ? AppError.from(mutation.error) : null;
  return (
    <CalendarRuleFormScreen
      rule={rule}
      fmt={fmt}
      form={draft.value}
      onChange={draft.setValue}
      submitting={mutation.isPending}
      submitError={error ? (error.userMessage ?? t('state.error.body', { reference: error.reference })) : undefined}
      onSubmit={() =>
        mutation.mutate(toCalendarRuleInput(draft.value, rule.frequency), {
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
