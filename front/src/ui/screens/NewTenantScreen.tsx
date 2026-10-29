import type { LeasePeriodicity, LotRow, NewTenantInput } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { t } from '@/i18n/t';
import { isEmail } from '@/shared/validation';
import {
  Button,
  Card,
  Checklist,
  Field,
  FieldGrid,
  FileDrop,
  FormActions,
  Lookup,
  NumberInput,
  RecordLayout,
  SelectInput,
  TextInput,
  WizardPage,
  stepStatus,
  type PathStep,
} from '@/ui/primitives';
import { leasePeriodicityKey } from '@/shared/labels';

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
  for (const key of ['name', 'contactName', 'email', 'lotCode', 'start'] as const)
    if (!draft[key].trim()) errors[key] = t('form.required');
  if (draft.email.trim() && !isEmail(draft.email)) errors.email = t('form.email.invalid');
  if (!/^\d{1,2}$/.test(draft.durationYears.trim()) || Number(draft.durationYears) < 1)
    errors.durationYears = t('newAsset.field.durationYears.invalid');
  for (const key of ['monthlyRent', 'monthlyCharges', 'deposit', 'keyMoney'] as const)
    if (!amount(draft[key])) errors[key] = t('form.invalidAmount');
  return errors;
}

/** Remplit le brouillon avec un bail lu (ou d'exemple) et passe à la vérification. */
export function draftFromLease(
  draft: NewTenantDraft,
  lease: NewTenantInput,
  fallbackLotCode: string,
): NewTenantDraft {
  return {
    ...draft,
    step: 'check',
    name: lease.name,
    registration: lease.registration,
    contactName: lease.contactName,
    email: lease.email,
    lotCode: lease.lotCode || fallbackLotCode,
    start: lease.lease.start,
    durationYears: String(lease.lease.durationYears),
    monthlyRent: String(lease.lease.monthlyRent),
    monthlyCharges: String(lease.lease.monthlyCharges),
    deposit: String(lease.lease.deposit),
    keyMoney: String(lease.lease.keyMoney),
    periodicity: lease.lease.periodicity,
    indexation: lease.lease.indexation,
  };
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

const monthsPerPeriod: Record<LeasePeriodicity, number> = {
  monthly: 1,
  quarterly: 3,
  'half-yearly': 6,
  yearly: 12,
};

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
  const {
    assetName,
    vacantLots,
    fmt,
    draft,
    onDraftChange,
    sampleAvailable,
    onUseSample,
    onSubmit,
    submitting,
    submitError,
    onBack,
    onOpenAsset,
  } = props;
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

  const field = (
    key: keyof NewTenantDraft & string,
    label: string,
    options: { type?: 'text' | 'date' | 'email'; numeric?: boolean; unit?: string; required?: boolean } = {},
  ) => (
    <Field id={`nt-${key}`} label={label} required={options.required ?? true} error={errors[key]}>
      {options.numeric ? (
        <NumberInput
          id={`nt-${key}`}
          unit={options.unit}
          value={String(draft[key])}
          invalid={!!errors[key]}
          onChange={e => set({ [key]: e.target.value } as Partial<NewTenantDraft>)}
        />
      ) : (
        <TextInput
          id={`nt-${key}`}
          type={options.type ?? 'text'}
          value={String(draft[key])}
          invalid={!!errors[key]}
          onChange={e => set({ [key]: e.target.value } as Partial<NewTenantDraft>)}
        />
      )}
    </Field>
  );

  const footer = stepStatus(submitError, showErrors, errorCount);
  const actions = (
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
  );

  return (
    <WizardPage
      object="asset"
      breadcrumbs={[
        { label: t('nav.assets'), onClick: onBack },
        { label: assetName, onClick: onOpenAsset },
      ]}
      eyebrow={draft.lotCode ? t('reconcile.lot', { lot: draft.lotCode }) : assetName}
      title={draft.name.trim() || t('newTenant.title')}
      steps={pathSteps}
      current={step}
      onSelectStep={key => set({ step: key })}
      pathLabel={t('newTenant.pathLabel')}
      attempted={draft.attempted}
      footer={{ status: footer.status, tone: footer.tone, actions }}
    >
      {step === 'lease' ? (
        <Card title={t('newTenant.lease.title')}>
          <FileDrop
            id="lease-file"
            label={t('newTenant.lease.drop')}
            hint={t('newTenant.lease.read')}
            accept="application/pdf"
            onFile={onUseSample}
          />
          {sampleAvailable ? (
            <FormActions>
              <Button variant="neutral" onClick={onUseSample}>
                {t('newTenant.lease.sample')}
              </Button>
            </FormActions>
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
            <Field
              id="nt-lotCode"
              label={t('newTenant.field.lot')}
              required
              error={errors.lotCode}
              help={vacantLots.length === 0 ? t('newTenant.field.lot.none') : undefined}
            >
              <Lookup
                id="nt-lotCode"
                options={vacantLots.map(lot => ({
                  id: lot.code,
                  label: lot.code,
                  meta: `${lot.building} · ${t('asset.record.lots.surface', { surface: lot.surface })}`,
                  icon: 'building',
                }))}
                value={draft.lotCode}
                invalid={!!errors.lotCode}
                placeholder={t('newTenant.field.lot.placeholder')}
                onChange={lotCode => set({ lotCode })}
              />
            </Field>
            {field('start', t('newTenant.field.start'), { type: 'date' })}
            {field('durationYears', t('newTenant.field.durationYears'), { numeric: true })}
            {field('monthlyRent', t('newTenant.field.monthlyRent'), {
              numeric: true,
              unit: fmt.currencyLabel,
            })}
            {field('monthlyCharges', t('newTenant.field.monthlyCharges'), {
              numeric: true,
              unit: fmt.currencyLabel,
            })}
            {field('deposit', t('newTenant.field.deposit'), { numeric: true, unit: fmt.currencyLabel })}
            {field('keyMoney', t('newTenant.field.keyMoney'), { numeric: true, unit: fmt.currencyLabel })}
            <Field id="nt-periodicity" label={t('newTenant.field.periodicity')} required>
              <SelectInput
                id="nt-periodicity"
                value={draft.periodicity}
                onChange={e => set({ periodicity: e.target.value as LeasePeriodicity })}
              >
                {(Object.keys(leasePeriodicityKey) as LeasePeriodicity[]).map(key => (
                  <option key={key} value={key}>
                    {t(leasePeriodicityKey[key])}
                  </option>
                ))}
              </SelectInput>
            </Field>
            {field('indexation', t('newTenant.field.indexation'), { required: false })}
          </div>
        </Card>
      ) : null}

      {step === 'save' ? (
        <RecordLayout
          main={
            <Card title={t('newTenant.summary.title')}>
              <FieldGrid
                columns={1}
                fields={[
                  { label: t('newTenant.field.name'), value: draft.name },
                  { label: t('newTenant.field.lot'), value: draft.lotCode },
                  { label: t('newTenant.field.start'), value: draft.start ? fmt.shortDate(draft.start) : '' },
                  { label: t('newTenant.field.durationYears'), value: draft.durationYears },
                  { label: t('newTenant.field.monthlyRent'), value: fmt.money(rent) },
                  { label: t('newTenant.field.monthlyCharges'), value: fmt.money(charges) },
                ]}
              />
            </Card>
          }
          aside={
            <Card title={t('newTenant.billing.title')}>
              <Checklist
                items={[
                  {
                    id: 'entry',
                    tone: 'step',
                    title: t('newTenant.billing.entry'),
                    detail: `${t('newTenant.billing.entry.detail', { deposit: fmt.money(Number(draft.deposit) || 0), keyMoney: fmt.money(Number(draft.keyMoney) || 0) })} · ${fmt.money(entry)}`,
                  },
                  {
                    id: 'first',
                    tone: 'step',
                    title: t('newTenant.billing.first'),
                    detail: t('newTenant.billing.first.detail', {
                      amount: fmt.money(perPeriod),
                      period: t(leasePeriodicityKey[draft.periodicity]).toLocaleLowerCase(),
                    }),
                  },
                ]}
              />
            </Card>
          }
        />
      ) : null}
    </WizardPage>
  );
}
