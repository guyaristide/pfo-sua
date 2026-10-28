import type { ReminderChannel, ReminderInput, ReminderTemplate, TenantAccount } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import type { MessageKey } from '@/i18n/fr';
import { reminderLevel, type ReminderLevel } from '@/shared/status';
import { t } from '@/i18n/t';
import { Card, Field, FormPage, SelectInput, TextArea, TextInput , issuesFrom } from '@/ui/primitives';

export interface RemindForm {
  level: ReminderLevel;
  channel: ReminderChannel;
  subject: string;
  body: string;
}

const channelKey: Record<ReminderChannel, MessageKey> = {
  email: 'reminders.channel.email',
  letter: 'reminders.channel.letter',
  'registered-letter': 'reminders.channel.registeredLetter',
  file: 'reminders.channel.file',
};
const levelOrder: ReminderLevel[] = ['reminder-1', 'reminder-2', 'reminder-3', 'formal-notice', 'pre-litigation'];

/** Le niveau proposé : celui qui suit le niveau actuel. */
export function nextLevel(current: ReminderLevel): ReminderLevel {
  const index = levelOrder.indexOf(current);
  return levelOrder[Math.min(index + 1, levelOrder.length - 1)] ?? 'reminder-1';
}

/** Remplit un modèle avec les valeurs du dossier : une seule fonction pour l'objet et le corps. */
export function fillTemplate(text: string, account: TenantAccount, fmt: Formatters): string {
  const dueRow = account.schedule.find(row => row.balance < 0);
  return text
    .replace(/\{locataire\}/g, account.name)
    .replace(/\{facture\}/g, dueRow?.label ?? '')
    .replace(/\{montant\}/g, fmt.money(Math.max(0, -account.balance)))
    .replace(/\{echeance\}/g, dueRow ? fmt.shortDate(dueRow.date) : '');
}

export function formFromTemplate(level: ReminderLevel, templates: ReminderTemplate[], account: TenantAccount, fmt: Formatters): RemindForm {
  const template = templates.find(item => item.level === level);
  const value = template?.current.value;
  return {
    level,
    channel: value?.channel ?? 'email',
    subject: value ? fillTemplate(value.subject, account, fmt) : '',
    body: value ? fillTemplate(value.body, account, fmt) : '',
  };
}

export function validateRemind(form: RemindForm): Partial<Record<keyof RemindForm, string>> {
  const errors: Partial<Record<keyof RemindForm, string>> = {};
  if (!form.subject.trim()) errors.subject = t('form.required');
  if (!form.body.trim()) errors.body = t('form.required');
  return errors;
}

export function toReminderInput(form: RemindForm): ReminderInput {
  return { level: form.level, channel: form.channel, subject: form.subject.trim(), body: form.body.trim() };
}

interface RemindTenantScreenProps {
  account: TenantAccount;
  templates: ReminderTemplate[];
  fmt: Formatters;
  form: RemindForm;
  onChange: (form: RemindForm) => void;
  onLevelChange: (level: ReminderLevel) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | undefined;
  onCancel: () => void;
  onOpenArrears: () => void;
}

export function RemindTenantScreen({ account, templates, fmt, form, onChange, onLevelChange, onSubmit, submitting, submitError, onCancel, onOpenArrears }: RemindTenantScreenProps) {
  const errors = validateRemind(form);
  const set = (changes: Partial<RemindForm>) => onChange({ ...form, ...changes });
  const lastPayment = account.history.find(event => event.kind === 'payment');
  const due = fmt.money(Math.max(0, -account.balance));
  return (
    <FormPage
      object="arrears"
      breadcrumbs={[{ label: t('nav.arrears'), onClick: onOpenArrears }]}
      eyebrow={lastPayment ? t('remind.subtitle', { amount: due, date: fmt.shortDate(lastPayment.date) }) : t('remind.subtitle.noPayment', { amount: due })}
      title={t('remind.title', { name: account.name })}
      errorCount={Object.keys(errors).length}
      issues={issuesFrom(errors, key => `remind-${key}`, key => t(key === 'subject' ? 'remind.subject' : 'remind.body'))}
      submitError={submitError}
      submitting={submitting}
      onCancel={onCancel}
      onSubmit={onSubmit}
      saveLabel={t('remind.action.send')}
    >
      <Card meta={t('remind.current', { level: t(reminderLevel[account.reminderLevel].labelKey) })}>
        <div className="form-grid">
          <Field id="remind-level" label={t('remind.level')} required>
            <SelectInput id="remind-level" value={form.level} onChange={e => onLevelChange(e.target.value as ReminderLevel)}>
              {levelOrder.map(level => (
                <option key={level} value={level}>
                  {t(reminderLevel[level].labelKey)}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field id="remind-channel" label={t('remind.channel')} required>
            <SelectInput id="remind-channel" value={form.channel} onChange={e => set({ channel: e.target.value as ReminderChannel })}>
              {(Object.keys(channelKey) as ReminderChannel[]).map(channel => (
                <option key={channel} value={channel}>
                  {t(channelKey[channel])}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <div style={{ marginTop: 16 }}>
          <Field id="remind-subject" label={t('remind.subject')} required error={errors.subject}>
            <TextInput id="remind-subject" value={form.subject} invalid={!!errors.subject} onChange={e => set({ subject: e.target.value })} />
          </Field>
        </div>
        <div style={{ marginTop: 16 }}>
          <Field id="remind-body" label={t('remind.body')} required error={errors.body}>
            <TextArea id="remind-body" value={form.body} invalid={!!errors.body} onChange={e => set({ body: e.target.value })} />
          </Field>
        </div>
        {templates.length === 0 ? null : null}
      </Card>
    </FormPage>
  );
}
