import type { CalendarFrequency, CalendarRule, CalendarRuleInput, CalendarRuleValue, RoleKey } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import type { MessageKey } from '@/i18n/fr';
import { roleKeys, roleLabelKey } from '@/shared/roles';
import { t } from '@/i18n/t';
import { Button, Card, DataTable, Field, FormPage, PageHeader, SelectInput, TextInput, type Column , issuesFrom } from '@/ui/primitives';
import { settingsCrumbs, settingsRootCrumb, type SettingsNavigation } from './crumbs';
import { VersionFields, VersionHistory, sinceLabel, todayIso, validateVersionFields, type VersionFieldsValue } from './versions';

const frequencyKey: Record<CalendarFrequency, MessageKey> = {
  monthly: 'calendar.frequency.monthly',
  quarterly: 'calendar.frequency.quarterly',
  yearly: 'calendar.frequency.yearly',
  'after-event': 'calendar.frequency.afterEvent',
};

const ordinalKey: Record<number, MessageKey> = { 1: 'calendar.ordinal.1', 2: 'calendar.ordinal.2', 3: 'calendar.ordinal.3' };

/** Une seule phrase par règle, lue par la liste, le formulaire et l'historique. */
export function ruleSentence(rule: { frequency: CalendarFrequency; triggerLabel: string | null }, value: CalendarRuleValue, fmt: Formatters): string {
  switch (rule.frequency) {
    case 'monthly':
      return t('calendar.rule.monthly', { day: value.dayOfMonth ?? '' });
    case 'quarterly':
      return value.month === 0 || value.month === null
        ? t('calendar.rule.quarterlyBefore', { day: value.dayOfMonth ?? '' })
        : t('calendar.rule.quarterly', { day: value.dayOfMonth ?? '', position: t(ordinalKey[value.month] ?? 'calendar.ordinal.1') });
    case 'yearly':
      return t('calendar.rule.yearly', { day: value.dayOfMonth ?? '', month: value.month ? fmt.monthName(value.month) : '' });
    case 'after-event':
      return t('calendar.rule.afterEvent', { days: value.offsetDays ?? '', trigger: rule.triggerLabel ?? '' });
  }
}

interface CalendarScreenProps {
  rules: CalendarRule[];
  fmt: Formatters;
  isAdmin: boolean;
  onEdit: (id: string) => void;
  onOpenSettings: () => void;
}

export function CalendarScreen({ rules, fmt, isAdmin, onEdit, onOpenSettings }: CalendarScreenProps) {
  const columns: Column<CalendarRule>[] = [
    {
      key: 'rule',
      header: t('calendar.col.rule'),
      render: rule => (
        <div>
          <div className="table__primary">{rule.label}</div>
          <div className="table__secondary">
            {t(frequencyKey[rule.frequency])} · {sinceLabel(rule.current, fmt)}
          </div>
        </div>
      ),
    },
    { key: 'when', header: t('calendar.col.when'), render: rule => ruleSentence(rule, rule.current.value, fmt) },
    { key: 'owner', header: t('calendar.col.owner'), render: rule => t(roleLabelKey[rule.current.value.ownerRole]) },
    { key: 'next', header: t('calendar.col.next'), render: rule => (rule.nextOccurrence ? fmt.shortDate(rule.nextOccurrence) : <span className="table__secondary">{t('calendar.next.none')}</span>) },
    {
      key: 'actions',
      header: '',
      render: rule =>
        isAdmin ? (
          <div className="table__actions">
            <Button variant="neutral" onClick={() => onEdit(rule.id)}>
              {t('settings.action.edit')}
            </Button>
          </div>
        ) : null,
    },
  ];
  return (
    <>
      <PageHeader object="settings" breadcrumbs={settingsRootCrumb(onOpenSettings)} eyebrow={t('calendar.subtitle')} title={t('calendar.title')} />
      <Card flush>
        <DataTable caption={t('calendar.title')} columns={columns} rows={rules} rowKey={rule => rule.id} footer={[t('calendar.total', { count: rules.length }), '', '', '', '']} />
      </Card>
    </>
  );
}

export interface CalendarRuleForm extends VersionFieldsValue {
  dayOfMonth: string;
  month: string;
  offsetDays: string;
  ownerRole: RoleKey;
}

export function calendarRuleToForm(rule: CalendarRule): CalendarRuleForm {
  const value = rule.current.value;
  return {
    dayOfMonth: value.dayOfMonth?.toString() ?? '',
    month: value.month?.toString() ?? '',
    offsetDays: value.offsetDays?.toString() ?? '',
    ownerRole: value.ownerRole,
    effectiveFrom: todayIso(),
    note: '',
  };
}

const inRange = (value: string, min: number, max: number) => /^\d+$/.test(value.trim()) && Number(value) >= min && Number(value) <= max;

export function validateCalendarRule(form: CalendarRuleForm, frequency: CalendarFrequency): Partial<Record<keyof CalendarRuleForm, string>> {
  const errors: Partial<Record<keyof CalendarRuleForm, string>> = { ...validateVersionFields(form) };
  if (frequency === 'after-event') {
    if (!inRange(form.offsetDays, 0, 365)) errors.offsetDays = t('calendar.field.offsetDays.invalid');
  } else {
    if (!inRange(form.dayOfMonth, 1, 31)) errors.dayOfMonth = t('calendar.field.dayOfMonth.invalid');
    if (frequency === 'yearly' && !inRange(form.month, 1, 12)) errors.month = t('calendar.field.month.invalid');
    if (frequency === 'quarterly' && !inRange(form.month, 0, 3)) errors.month = t('calendar.field.quarterMonth.invalid');
  }
  return errors;
}

export function toCalendarRuleValue(form: CalendarRuleForm, frequency: CalendarFrequency): CalendarRuleValue {
  const number = (value: string) => (value.trim() ? Number(value) : null);
  return {
    dayOfMonth: frequency === 'after-event' ? null : number(form.dayOfMonth),
    month: frequency === 'monthly' || frequency === 'after-event' ? null : number(form.month),
    offsetDays: frequency === 'after-event' ? number(form.offsetDays) : null,
    ownerRole: form.ownerRole,
  };
}

export function toCalendarRuleInput(form: CalendarRuleForm, frequency: CalendarFrequency): CalendarRuleInput {
  return { value: toCalendarRuleValue(form, frequency), effectiveFrom: form.effectiveFrom, note: form.note.trim() || null };
}

interface CalendarRuleFormScreenProps extends SettingsNavigation {
  rule: CalendarRule;
  fmt: Formatters;
  form: CalendarRuleForm;
  onChange: (form: CalendarRuleForm) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | undefined;
}

export function CalendarRuleFormScreen({ rule, fmt, form, onChange, onSubmit, submitting, submitError, onOpenSettings, onOpenSection }: CalendarRuleFormScreenProps) {
  const errors = validateCalendarRule(form, rule.frequency);
  const set = (changes: Partial<CalendarRuleForm>) => onChange({ ...form, ...changes });
  const preview = ruleSentence(rule, toCalendarRuleValue(form, rule.frequency), fmt);
  return (
    <FormPage
      object="settings"
      breadcrumbs={settingsCrumbs({ onOpenSettings, onOpenSection }, t('calendar.title'))}
      eyebrow={t(frequencyKey[rule.frequency])}
      title={rule.label}
      errorCount={Object.keys(errors).length}
      issues={issuesFrom(errors, key => ({ offsetDays: 'cal-offset', dayOfMonth: 'cal-day', month: rule.frequency === 'quarterly' ? 'cal-quarter-month' : 'cal-month', effectiveFrom: 'version-effectiveFrom' })[key] ?? key, key => t(({ offsetDays: 'calendar.field.offsetDays', dayOfMonth: 'calendar.field.dayOfMonth', month: 'calendar.field.month', effectiveFrom: 'version.effectiveFrom' } as const)[key as 'month'] ?? 'calendar.field.month'))}
      submitError={submitError}
      submitting={submitting}
      onCancel={onOpenSection}
      onSubmit={onSubmit}
    >
      <Card meta={preview}>
        <div className="form-grid">
          {rule.frequency === 'after-event' ? (
            <Field id="cal-offset" label={t('calendar.field.offsetDays')} required error={errors.offsetDays} help={rule.triggerLabel ?? undefined}>
              <TextInput id="cal-offset" inputMode="numeric" value={form.offsetDays} invalid={!!errors.offsetDays} onChange={e => set({ offsetDays: e.target.value })} />
            </Field>
          ) : (
            <Field id="cal-day" label={t('calendar.field.dayOfMonth')} required error={errors.dayOfMonth}>
              <TextInput id="cal-day" inputMode="numeric" value={form.dayOfMonth} invalid={!!errors.dayOfMonth} onChange={e => set({ dayOfMonth: e.target.value })} />
            </Field>
          )}
          {rule.frequency === 'quarterly' ? (
            <Field id="cal-quarter-month" label={t('calendar.field.quarterMonth')} required error={errors.month}>
              <SelectInput id="cal-quarter-month" value={form.month} invalid={!!errors.month} onChange={e => set({ month: e.target.value })}>
                {(['0', '1', '2', '3'] as const).map(position => (
                  <option key={position} value={position}>
                    {t(`calendar.position.${position}`)}
                  </option>
                ))}
              </SelectInput>
            </Field>
          ) : null}
          {rule.frequency === 'yearly' ? (
            <Field id="cal-month" label={t('calendar.field.month')} required error={errors.month}>
              <SelectInput id="cal-month" value={form.month} invalid={!!errors.month} onChange={e => set({ month: e.target.value })}>
                <option value="" />
                {Array.from({ length: 12 }, (_, index) => index + 1).map(month => (
                  <option key={month} value={String(month)}>
                    {fmt.monthName(month)}
                  </option>
                ))}
              </SelectInput>
            </Field>
          ) : null}
          <Field id="cal-owner" label={t('calendar.field.owner')} required>
            <SelectInput id="cal-owner" value={form.ownerRole} onChange={e => set({ ownerRole: e.target.value as RoleKey })}>
              {roleKeys.map(role => (
                <option key={role} value={role}>
                  {t(roleLabelKey[role])}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </Card>
      <VersionFields value={form} error={errors.effectiveFrom} onChange={value => set(value)} />
      <VersionHistory versions={rule.versions} current={rule.current} describe={value => `${ruleSentence(rule, value, fmt)} · ${t(roleLabelKey[value.ownerRole])}`} fmt={fmt} />
    </FormPage>
  );
}
