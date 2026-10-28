import type { FeeBaseItem, FeeSettings, FeeSettingsInput, FeeValue } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import type { MessageKey } from '@/i18n/fr';
import { t } from '@/i18n/t';
import { Button, Card, CheckboxField, Field, FormPage, NumberInput, PageHeader , useFormAttempted , issuesFrom } from '@/ui/primitives';
import { settingsCrumbs, settingsRootCrumb, type SettingsNavigation } from './crumbs';
import { VersionFields, VersionHistory, todayIso, validateVersionFields, versionState, type VersionFieldsValue } from './versions';

const baseKey: Record<FeeBaseItem, MessageKey> = { rent: 'fees.base.rent', signage: 'fees.base.signage', ancillary: 'fees.base.ancillary' };
const baseItems = Object.keys(baseKey) as FeeBaseItem[];
/** Montant d'illustration pour l'exemple : l'assiette d'un trimestre ordinaire, pas une donnée métier. */
const EXAMPLE_BASE = 100_000_000;

/** Une seule formule d'honoraires, pour l'exemple comme pour le futur CRG (règle 4). */
export function computeFees(base: number, rate: number): number {
  return Math.round(base * rate);
}

interface FeesScreenProps {
  fees: FeeSettings;
  fmt: Formatters;
  isAdmin: boolean;
  onEdit: () => void;
  onOpenSettings: () => void;
}

export function describeFees(value: FeeValue, fmt: Formatters): string {
  return `${fmt.percent(value.rate, 2)} · ${value.base.map(item => t(baseKey[item])).join(', ')} · ${t('fees.vat')} : ${value.vatApplicable ? t('settings.yes') : t('settings.no')}`;
}

export function FeesScreen({ fees, fmt, isAdmin, onEdit, onOpenSettings }: FeesScreenProps) {
  const value = fees.current.value;
  const scheduled = fees.versions.filter(v => versionState(v, fees.current) === 'scheduled').length;
  return (
    <>
      <PageHeader
        object="settings"
        breadcrumbs={settingsRootCrumb(onOpenSettings)}
        eyebrow={t('fees.subtitle')}
        title={t('fees.title')}
        actions={
          isAdmin ? (
            <Button variant="brand" onClick={onEdit}>
              {t('settings.action.edit')}
            </Button>
          ) : null
        }
        highlights={[
          { label: t('fees.rate'), value: fmt.percent(value.rate, 2) },
          { label: t('fees.base'), value: `${value.base.map(item => t(baseKey[item])).join(', ')} · ${t('fees.base.excluded')}` },
          { label: t('fees.vat'), value: value.vatApplicable ? t('settings.yes') : t('settings.no') },
          { label: t('fees.effectiveFrom'), value: `${fmt.shortDate(fees.current.effectiveFrom)}${scheduled > 0 ? ` · ${t('version.scheduled', { count: scheduled })}` : ''}` },
        ]}
      />
      <Card title={t('fees.example.title')} meta={t('fees.updated', { version: fees.current.version, name: fees.current.createdBy, date: fmt.shortDate(fees.current.createdAt) })}>
        <p>{t('fees.example.body', { base: fmt.money(EXAMPLE_BASE), fees: fmt.money(computeFees(EXAMPLE_BASE, value.rate)) })}</p>
      </Card>
      <VersionHistory versions={fees.versions} current={fees.current} describe={v => describeFees(v, fmt)} fmt={fmt} />
    </>
  );
}

export interface FeesForm extends VersionFieldsValue {
  ratePercent: string;
  base: FeeBaseItem[];
  vatApplicable: boolean;
}

export function feesToForm(fees: FeeSettings): FeesForm {
  const value = fees.current.value;
  return { ratePercent: String(Math.round(value.rate * 10_000) / 100), base: value.base, vatApplicable: value.vatApplicable, effectiveFrom: todayIso(), note: '' };
}

export function validateFees(form: FeesForm): Partial<Record<keyof FeesForm, string>> {
  const errors: Partial<Record<keyof FeesForm, string>> = { ...validateVersionFields(form) };
  const rate = form.ratePercent.trim().replace(',', '.');
  if (!/^\d{1,3}([.]\d{1,2})?$/.test(rate) || Number(rate) > 100) errors.ratePercent = t('fees.field.rate.invalid');
  if (form.base.length === 0) errors.base = t('fees.field.base.pick');
  return errors;
}

export function toFeesInput(form: FeesForm): FeeSettingsInput {
  return {
    value: { rate: Number(form.ratePercent.trim().replace(',', '.')) / 100, base: form.base, vatApplicable: form.vatApplicable },
    effectiveFrom: form.effectiveFrom,
    note: form.note.trim() || null,
  };
}

interface FeesFormScreenProps extends SettingsNavigation {
  fees: FeeSettings;
  fmt: Formatters;
  form: FeesForm;
  onChange: (form: FeesForm) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | undefined;
}

export function FeesFormScreen({ fees, fmt, form, onChange, onSubmit, submitting, submitError, onOpenSettings, onOpenSection }: FeesFormScreenProps) {
  const errors = validateFees(form);
  const attempted = useFormAttempted();
  const set = (changes: Partial<FeesForm>) => onChange({ ...form, ...changes });
  const toggle = (item: FeeBaseItem, checked: boolean) => set({ base: checked ? [...form.base, item] : form.base.filter(b => b !== item) });
  return (
    <FormPage
      object="settings"
      breadcrumbs={settingsCrumbs({ onOpenSettings, onOpenSection }, t('fees.title'))}
      title={t('fees.form.title')}
      errorCount={Object.keys(errors).length}
      issues={issuesFrom(errors, key => ({ ratePercent: 'fees-rate', base: 'fees-rent', effectiveFrom: 'version-effectiveFrom' })[key] ?? key, key => t(({ ratePercent: 'fees.field.rate', base: 'fees.field.base', effectiveFrom: 'version.effectiveFrom' } as const)[key as 'base'] ?? 'fees.field.base'))}
      submitError={submitError}
      submitting={submitting}
      onCancel={onOpenSection}
      onSubmit={onSubmit}
    >
      <Card>
        <div className="form-grid">
          <Field id="fees-rate" label={t('fees.field.rate')} required error={errors.ratePercent}>
            <NumberInput id="fees-rate" decimal unit="%" value={form.ratePercent} invalid={!!errors.ratePercent} onChange={e => set({ ratePercent: e.target.value })} />
          </Field>
        </div>
      </Card>
      <Card title={t('fees.field.base')} meta={t('fees.base.excluded')}>
        <div className="checkbox-group">
          {baseItems.map(item => (
            <CheckboxField key={item} id={`fees-${item}`} label={t(baseKey[item])} checked={form.base.includes(item)} onChange={checked => toggle(item, checked)} />
          ))}
          {attempted && errors.base ? <div className="field__error">{errors.base}</div> : null}
          <CheckboxField id="fees-vat" label={t('fees.field.vat')} checked={form.vatApplicable} onChange={vatApplicable => set({ vatApplicable })} />
        </div>
      </Card>
      <VersionFields value={form} error={errors.effectiveFrom} onChange={value => set(value)} />
      <VersionHistory versions={fees.versions} current={fees.current} describe={v => describeFees(v, fmt)} fmt={fmt} />
    </FormPage>
  );
}
