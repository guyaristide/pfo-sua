import type { LeasePeriodicity, LotRow, NewTenantInput } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { t } from '@/i18n/t';
import { Button, Card, DockedFooter, Field, FormAttemptContext, Icon, Lookup, NumberInput, PageHeader, Path, SelectInput, TextInput, type PathStep } from '@/ui/primitives';
import { periodicityKey } from './TenantAccountScreen';

export type NewTenantStep = 'lease' | 'check' | 'save';
const steps: NewTenantStep[] = ['lease', 'check', 'save'];

export interface NewTenantDraft {
  step: NewTenantStep;
  attempted: boolean;
  name: string;
  registration: string;
  contactName: string;
  email: string;
  lotCode: string;
  start: string;
  durationYears: string;
  monthlyRent: string;
  monthlyCharges: string;
  deposit: string;
  keyMoney: string;
  periodicity: LeasePeriodicity;
  indexation: string;
}

export const emptyNewTenantDraft: NewTenantDraft = {
  step: 'lease',
  attempted: false,
  name: '',
  registration: '',
  contactName: '',
  email: '',
  lotCode: '',
  start: '',
  durationYears: '3',
  monthlyRent: '',
  monthlyCharges: '',
  deposit: '',
  keyMoney: '0',
  periodicity: 'quarterly',
  indexation: '',
};

const amount = (value: string) => /^\d+$/.test(value.trim());

export function validateNewTenant(draft: NewTenantDraft): Partial<Record<keyof NewTenantDraft, string>> {
  const errors: Partial<Record<keyof NewTenantDraft, string>> = {};
  for (const key of ['name', 'contactName', 'email', 'lotCode', 'start'] as const) if (!draft[key].trim()) errors[key] = t('form.required');
  if (draft.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) errors.email = t('users.field.email.invalid');
  if (!/^\d{1,2}$/.test(draft.durationYears.trim()) || Number(draft.durationYears) < 1) errors.durationYears = t('newAsset.field.durationYears.invalid');
  for (const key of ['monthlyRent', 'monthlyCharges', 'deposit', 'keyMoney'] as const) if (!amount(draft[key])) errors[key] = t('form.invalidAmount');
  return errors;
}

export function toNewTenantInput(draft: NewTenantDraft): NewTenantInput {
  return {
    name: draft.name.trim(),
    registration: draft.registration.trim(),
    contactName: draft.contactName.trim(),
    email: draft.email.trim().toLowerCase(),
    lotCode: draft.lotCode,
    lease: {
      start: draft.start,
      durationYears: Number(draft.durationYears),
      monthlyRent: Number(draft.monthlyRent),
      monthlyCharges: Number(draft.monthlyCharges),
      deposit: Number(draft.deposit),
      keyMoney: Number(draft.keyMoney),
      periodicity: draft.periodicity,
      indexation: draft.indexation.trim(),
    },
  };
}

const monthsPerPeriod: Record<LeasePeriodicity, number> = { monthly: 1, quarterly: 3, 'half-yearly': 6, yearly: 12 };

interface NewTenantScreenProps {
  assetName: string;
  vacantLots: LotRow[];
  fmt: Formatters;
  draft: NewTenantDraft;
  onDraftChange: (draft: NewTenantDraft) => void;
  sampleAvailable: boolean;
  onUseSample: () => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | undefined;
  onBack: () => void;
  onOpenAsset: () => void;
}

/** Prototype « facture d'entrée » : déposer le bail, vérifier les conditions lues, enregistrer. */
export function NewTenantScreen(props: NewTenantScreenProps) {
  const { assetName, vacantLots, fmt, draft, onDraftChange, sampleAvailable, onUseSample, onSubmit, submitting, submitError, onBack, onOpenAsset } = props;
  const step = draft.step;
  const index = steps.indexOf(step);
  const errors = validateNewTenant(draft);
  const errorCount = Object.keys(errors).length;
  const showErrors = draft.attempted && errorCount > 0;
  const set = (changes: Partial<NewTenantDraft>) => onDraftChange({ ...draft, ...changes });
  const pathSteps: PathStep<NewTenantStep>[] = steps.map(key => ({ key, label: t(`newTenant.step.${key}`) }));
  const tryNext = () => {
    if (step === 'check' && errorCount > 0) set({ attempted: true });
    else set({ step: steps[index + 1]! });
  };
  const rent = Number(draft.monthlyRent) || 0;
  const charges = Number(draft.monthlyCharges) || 0;
  const entry = (Number(draft.deposit) || 0) + (Number(draft.keyMoney) || 0);
  const perPeriod = (rent + charges) * monthsPerPeriod[draft.periodicity];
  const status = submitError ?? (!showErrors ? t('draft.saved') : errorCount === 1 ? t('newTenant.stepErrors.one') : t('newTenant.stepErrors', { count: errorCount }));

  const field = (key: keyof NewTenantDraft & string, label: string, options: { type?: 'text' | 'date' | 'email'; numeric?: boolean; unit?: string; required?: boolean } = {}) => (
    <Field id={`nt-${key}`} label={label} required={options.required ?? true} error={errors[key]}>
      {options.numeric ? (
        <NumberInput id={`nt-${key}`} unit={options.unit} value={String(draft[key])} invalid={!!errors[key]} onChange={e => set({ [key]: e.target.value } as Partial<NewTenantDraft>)} />
      ) : (
        <TextInput id={`nt-${key}`} type={options.type ?? 'text'} value={String(draft[key])} invalid={!!errors[key]} onChange={e => set({ [key]: e.target.value } as Partial<NewTenantDraft>)} />
      )}
    </Field>
  );

  return (
    <FormAttemptContext.Provider value={draft.attempted}>
      <PageHeader
        object="asset"
        breadcrumbs={[
          { label: t('nav.assets'), onClick: onBack },
          { label: assetName, onClick: onOpenAsset },
        ]}
        eyebrow={draft.lotCode ? t('reconcile.lot', { lot: draft.lotCode }) : assetName}
        title={draft.name.trim() || t('newTenant.title')}
        aside={<Path steps={pathSteps} current={step} onSelect={key => set({ step: key })} label={t('newTenant.pathLabel')} />}
      />

      {step === 'lease' ? (
        <Card title={t('newTenant.lease.title')}>
          <label className="dropzone">
            <Icon name="upload" size={28} />
            <span>{t('newTenant.lease.drop')}</span>
            <span className="field__help">{t('newTenant.lease.read')}</span>
            <input
              type="file"
              accept="application/pdf"
              className="visually-hidden"
              onChange={event => {
                if (event.target.files && event.target.files.length > 0) onUseSample();
              }}
            />
          </label>
          {sampleAvailable ? (
            <div style={{ marginTop: 12 }}>
              <Button variant="neutral" onClick={onUseSample}>
                {t('newTenant.lease.sample')}
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      {step === 'check' ? (
        <Card title={t('newTenant.check.title')}>
          <div className="form-grid">
            {field('name', t('newTenant.field.name'))}
            {field('registration', t('newTenant.field.registration'), { required: false })}
            {field('contactName', t('newTenant.field.contactName'))}
            {field('email', t('newTenant.field.email'), { type: 'email' })}
            <Field id="nt-lotCode" label={t('newTenant.field.lot')} required error={errors.lotCode} help={vacantLots.length === 0 ? t('newTenant.field.lot.none') : undefined}>
              <Lookup
                id="nt-lotCode"
                options={vacantLots.map(lot => ({ id: lot.code, label: lot.code, meta: `${lot.building} · ${t('asset.record.lots.surface', { surface: lot.surface })}`, icon: 'building' }))}
                value={draft.lotCode}
                invalid={!!errors.lotCode}
                placeholder={t('newTenant.field.lot.placeholder')}
                onChange={lotCode => set({ lotCode })}
              />
            </Field>
            {field('start', t('newTenant.field.start'), { type: 'date' })}
            {field('durationYears', t('newTenant.field.durationYears'), { numeric: true })}
            {field('monthlyRent', t('newTenant.field.monthlyRent'), { numeric: true, unit: fmt.currencyLabel })}
            {field('monthlyCharges', t('newTenant.field.monthlyCharges'), { numeric: true, unit: fmt.currencyLabel })}
            {field('deposit', t('newTenant.field.deposit'), { numeric: true, unit: fmt.currencyLabel })}
            {field('keyMoney', t('newTenant.field.keyMoney'), { numeric: true, unit: fmt.currencyLabel })}
            <Field id="nt-periodicity" label={t('newTenant.field.periodicity')} required>
              <SelectInput id="nt-periodicity" value={draft.periodicity} onChange={e => set({ periodicity: e.target.value as LeasePeriodicity })}>
                {(Object.keys(periodicityKey) as LeasePeriodicity[]).map(key => (
                  <option key={key} value={key}>
                    {t(periodicityKey[key])}
                  </option>
                ))}
              </SelectInput>
            </Field>
            {field('indexation', t('newTenant.field.indexation'), { required: false })}
          </div>
        </Card>
      ) : null}

      {step === 'save' ? (
        <div className="layout-two">
          <Card title={t('newTenant.summary.title')}>
            <dl className="summary-list">
              <dt>{t('newTenant.field.name')}</dt>
              <dd>{draft.name}</dd>
              <dt>{t('newTenant.field.lot')}</dt>
              <dd>{draft.lotCode}</dd>
              <dt>{t('newTenant.field.start')}</dt>
              <dd>{draft.start ? fmt.shortDate(draft.start) : ''}</dd>
              <dt>{t('newTenant.field.durationYears')}</dt>
              <dd>{draft.durationYears}</dd>
              <dt>{t('newTenant.field.monthlyRent')}</dt>
              <dd>{fmt.money(rent)}</dd>
              <dt>{t('newTenant.field.monthlyCharges')}</dt>
              <dd>{fmt.money(charges)}</dd>
            </dl>
          </Card>
          <Card title={t('newTenant.billing.title')}>
            <ul className="check-list">
              <li>
                <span className="check-list__mark" aria-hidden="true">
                  <Icon name="invoice" size={12} />
                </span>
                <div>
                  <div className="check-list__title">{t('newTenant.billing.entry')}</div>
                  <div className="check-list__detail">
                    {t('newTenant.billing.entry.detail', { deposit: fmt.money(Number(draft.deposit) || 0), keyMoney: fmt.money(Number(draft.keyMoney) || 0) })} · {fmt.money(entry)}
                  </div>
                </div>
              </li>
              <li>
                <span className="check-list__mark" aria-hidden="true">
                  <Icon name="calendar" size={12} />
                </span>
                <div>
                  <div className="check-list__title">{t('newTenant.billing.first')}</div>
                  <div className="check-list__detail">{t('newTenant.billing.first.detail', { amount: fmt.money(perPeriod), period: t(periodicityKey[draft.periodicity]).toLocaleLowerCase() })}</div>
                </div>
              </li>
            </ul>
          </Card>
        </div>
      ) : null}

      <DockedFooter
        tone={submitError ? 'danger' : showErrors ? 'warning' : 'neutral'}
        status={status}
        actions={
          <>
            <Button variant="neutral" onClick={onOpenAsset}>
              {t('cheque.action.cancel')}
            </Button>
            {index > 0 ? (
              <Button variant="neutral" onClick={() => set({ step: steps[index - 1]! })}>
                {t('newTenant.action.previous')}
              </Button>
            ) : null}
            {step === 'save' ? (
              <Button variant="brand" disabled={submitting || errorCount > 0} onClick={onSubmit}>
                {t('newTenant.action.save')}
              </Button>
            ) : (
              <Button variant="brand" onClick={tryNext} disabled={step === 'lease' && !draft.name}>
                {t('newTenant.action.next')}
              </Button>
            )}
          </>
        }
      />
    </FormAttemptContext.Provider>
  );
}
