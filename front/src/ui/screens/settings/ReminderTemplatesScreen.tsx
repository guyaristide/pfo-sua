import type { ReminderChannel, ReminderTemplate, ReminderTemplateInput, ReminderTemplateValue } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import type { MessageKey } from '@/i18n/fr';
import { reminderLevel } from '@/shared/status';
import { t } from '@/i18n/t';
import { Badge, Button, Card, DataTable, Field, FormPage, PageHeader, SelectInput, TextArea, TextInput, type Column , issuesFrom } from '@/ui/primitives';
import { settingsCrumbs, settingsRootCrumb, type SettingsNavigation } from './crumbs';
import { VersionFields, VersionHistory, todayIso, validateVersionFields, type VersionFieldsValue } from './versions';

const channelKey: Record<ReminderChannel, MessageKey> = {
  email: 'reminders.channel.email',
  letter: 'reminders.channel.letter',
  'registered-letter': 'reminders.channel.registeredLetter',
  file: 'reminders.channel.file',
};

interface ReminderTemplatesScreenProps {
  templates: ReminderTemplate[];
  fmt: Formatters;
  isAdmin: boolean;
  onEdit: (id: string) => void;
  onOpenSettings: () => void;
}

export function ReminderTemplatesScreen({ templates, fmt, isAdmin, onEdit, onOpenSettings }: ReminderTemplatesScreenProps) {
  const columns: Column<ReminderTemplate>[] = [
    { key: 'level', header: t('reminders.col.level'), render: template => <Badge tone={reminderLevel[template.level].tone}>{t(reminderLevel[template.level].labelKey)}</Badge> },
    { key: 'delay', header: t('reminders.col.delay'), render: template => t('reminders.delay', { days: template.current.value.delayDays }) },
    { key: 'channel', header: t('reminders.col.channel'), render: template => t(channelKey[template.current.value.channel]) },
    { key: 'subject', header: t('reminders.col.subject'), render: template => <span className="table__primary" style={{ color: 'var(--text-primary)' }}>{template.current.value.subject}</span> },
    {
      key: 'updated',
      header: t('reminders.col.updated'),
      render: template => (
        <div>
          <div>{fmt.shortDate(template.current.effectiveFrom)}</div>
          <div className="table__secondary">{t('version.since', { version: template.current.version, date: fmt.shortDate(template.current.createdAt) })}</div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: template =>
        isAdmin ? (
          <div className="table__actions">
            <Button variant="neutral" onClick={() => onEdit(template.id)}>
              {t('settings.action.edit')}
            </Button>
          </div>
        ) : null,
    },
  ];
  return (
    <>
      <PageHeader object="settings" breadcrumbs={settingsRootCrumb(onOpenSettings)} eyebrow={t('reminders.subtitle')} title={t('reminders.title')} />
      <Card flush>
        <DataTable caption={t('reminders.title')} columns={columns} rows={templates} rowKey={template => template.id} footer={[t('reminders.total', { count: templates.length }), '', '', '', '', '']} />
      </Card>
    </>
  );
}

export interface ReminderTemplateForm extends VersionFieldsValue {
  delayDays: string;
  channel: ReminderChannel;
  subject: string;
  body: string;
}

export function reminderTemplateToForm(template: ReminderTemplate): ReminderTemplateForm {
  const value = template.current.value;
  return { delayDays: String(value.delayDays), channel: value.channel, subject: value.subject, body: value.body, effectiveFrom: todayIso(), note: '' };
}

export function describeReminderTemplate(value: ReminderTemplateValue): string {
  return `${t('reminders.delay', { days: value.delayDays })} · ${t(channelKey[value.channel])} · ${value.subject}`;
}

export function validateReminderTemplate(form: ReminderTemplateForm): Partial<Record<keyof ReminderTemplateForm, string>> {
  const errors: Partial<Record<keyof ReminderTemplateForm, string>> = { ...validateVersionFields(form) };
  if (!/^\d+$/.test(form.delayDays.trim()) || Number(form.delayDays) < 1 || Number(form.delayDays) > 365) errors.delayDays = t('reminders.field.delayDays.invalid');
  if (!form.subject.trim()) errors.subject = t('form.required');
  if (!form.body.trim()) errors.body = t('form.required');
  return errors;
}

export function toReminderTemplateInput(form: ReminderTemplateForm): ReminderTemplateInput {
  return {
    value: { delayDays: Number(form.delayDays), channel: form.channel, subject: form.subject.trim(), body: form.body.trim() },
    effectiveFrom: form.effectiveFrom,
    note: form.note.trim() || null,
  };
}

interface ReminderTemplateFormScreenProps extends SettingsNavigation {
  template: ReminderTemplate;
  fmt: Formatters;
  form: ReminderTemplateForm;
  onChange: (form: ReminderTemplateForm) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | undefined;
}

export function ReminderTemplateFormScreen({ template, fmt, form, onChange, onSubmit, submitting, submitError, onOpenSettings, onOpenSection }: ReminderTemplateFormScreenProps) {
  const errors = validateReminderTemplate(form);
  const set = (changes: Partial<ReminderTemplateForm>) => onChange({ ...form, ...changes });
  return (
    <FormPage
      object="settings"
      breadcrumbs={settingsCrumbs({ onOpenSettings, onOpenSection }, t('reminders.title'))}
      eyebrow={t(reminderLevel[template.level].labelKey)}
      title={t('reminders.form.title')}
      errorCount={Object.keys(errors).length}
      issues={issuesFrom(errors, key => ({ delayDays: 'rt-delay', subject: 'rt-subject', body: 'rt-body', effectiveFrom: 'version-effectiveFrom' })[key] ?? key, key => t(({ delayDays: 'reminders.field.delayDays', subject: 'reminders.field.subject', body: 'reminders.field.body', effectiveFrom: 'version.effectiveFrom' } as const)[key as 'body'] ?? 'reminders.field.body'))}
      submitError={submitError}
      submitting={submitting}
      onCancel={onOpenSection}
      onSubmit={onSubmit}
    >
      <Card meta={t('reminders.form.body')}>
        <div className="form-grid">
          <Field id="rt-delay" label={t('reminders.field.delayDays')} required error={errors.delayDays}>
            <TextInput id="rt-delay" inputMode="numeric" value={form.delayDays} invalid={!!errors.delayDays} onChange={e => set({ delayDays: e.target.value })} />
          </Field>
          <Field id="rt-channel" label={t('reminders.field.channel')} required>
            <SelectInput id="rt-channel" value={form.channel} onChange={e => set({ channel: e.target.value as ReminderChannel })}>
              {(Object.keys(channelKey) as ReminderChannel[]).map(key => (
                <option key={key} value={key}>
                  {t(channelKey[key])}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <div style={{ marginTop: 16 }}>
          <Field id="rt-subject" label={t('reminders.field.subject')} required error={errors.subject}>
            <TextInput id="rt-subject" value={form.subject} invalid={!!errors.subject} onChange={e => set({ subject: e.target.value })} />
          </Field>
        </div>
        <div style={{ marginTop: 16 }}>
          <Field id="rt-body" label={t('reminders.field.body')} required error={errors.body}>
            <TextArea id="rt-body" value={form.body} invalid={!!errors.body} onChange={e => set({ body: e.target.value })} />
          </Field>
        </div>
      </Card>
      <VersionFields value={form} error={errors.effectiveFrom} onChange={value => set(value)} />
      <VersionHistory versions={template.versions} current={template.current} describe={describeReminderTemplate} fmt={fmt} />
    </FormPage>
  );
}
