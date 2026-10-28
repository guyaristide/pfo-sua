import type { BillingItem, LotType, NewAssetInput } from '@/services/contracts';
import { t } from '@/i18n/t';
import { Button, Card, CheckboxField, DockedFooter, Field, FormAttemptContext, Icon, PageHeader, Path, SelectInput, TextInput, type PathStep } from '@/ui/primitives';
import { lotTypeKey } from './AssetRecordScreen';

export type NewAssetStep = 'owner' | 'mandate' | 'specifics' | 'lots' | 'items' | 'summary';
export const newAssetSteps: NewAssetStep[] = ['owner', 'mandate', 'specifics', 'lots', 'items', 'summary'];

export interface LotDraft {
  key: string;
  building: string;
  code: string;
  type: LotType;
  surface: string;
  floor: string;
}

export interface NewAssetDraft {
  step: NewAssetStep;
  /** Étapes dont la personne a tenté de sortir : leurs erreurs sont visibles. */
  attempted: NewAssetStep[];
  name: string;
  location: string;
  ownerName: string;
  registration: string;
  ownerAddress: string;
  representative: string;
  mandateReference: string;
  signedOn: string;
  durationYears: string;
  bankAccountOwner: 'sci' | 'pfo';
  rentAccountDigits: string;
  expensesPaidBy: 'sci' | 'pfo';
  lots: LotDraft[];
  billingItemCodes: string[];
}

export function emptyLot(key: string): LotDraft {
  return { key, building: 'A', code: '', type: 'offices', surface: '', floor: '' };
}

export const emptyNewAssetDraft: NewAssetDraft = {
  step: 'owner',
  attempted: [],
  name: '',
  location: '',
  ownerName: '',
  registration: '',
  ownerAddress: '',
  representative: '',
  mandateReference: '',
  signedOn: '',
  durationYears: '3',
  bankAccountOwner: 'sci',
  rentAccountDigits: '',
  expensesPaidBy: 'sci',
  lots: [],
  billingItemCodes: [],
};

type StepErrors = Record<string, string>;

/** Une validation par étape, lue par le pied fixe, par le Path et par l'envoi (règle 4). */
export function validateStep(draft: NewAssetDraft, step: NewAssetStep): StepErrors {
  const errors: StepErrors = {};
  const required = (key: keyof NewAssetDraft) => {
    if (!String(draft[key]).trim()) errors[key] = t('form.required');
  };
  switch (step) {
    case 'owner':
      (['name', 'location', 'ownerName', 'registration', 'ownerAddress', 'representative'] as const).forEach(required);
      break;
    case 'mandate':
      (['mandateReference', 'signedOn'] as const).forEach(required);
      if (!/^\d{1,2}$/.test(draft.durationYears.trim()) || Number(draft.durationYears) < 1 || Number(draft.durationYears) > 30) errors.durationYears = t('newAsset.field.durationYears.invalid');
      break;
    case 'specifics':
      if (draft.bankAccountOwner === 'sci' && !/^\d{4}$/.test(draft.rentAccountDigits.trim())) errors.rentAccountDigits = t('newAsset.field.rentAccountDigits.invalid');
      break;
    case 'lots': {
      if (draft.lots.length === 0) errors.lots = t('newAsset.lots.none');
      const seen = new Set<string>();
      for (const lot of draft.lots) {
        if (!lot.building.trim()) errors[`${lot.key}.building`] = t('form.required');
        if (!lot.code.trim()) errors[`${lot.key}.code`] = t('form.required');
        else if (seen.has(lot.code.trim().toUpperCase())) errors[`${lot.key}.code`] = t('newAsset.lots.duplicate');
        seen.add(lot.code.trim().toUpperCase());
        if (!/^\d+$/.test(lot.surface.trim()) || Number(lot.surface) <= 0) errors[`${lot.key}.surface`] = t('newAsset.lots.invalidSurface');
      }
      break;
    }
    case 'items':
      if (draft.billingItemCodes.length === 0) errors.billingItemCodes = t('newAsset.items.none');
      break;
    case 'summary':
      break;
  }
  return errors;
}

export function toNewAssetInput(draft: NewAssetDraft): NewAssetInput {
  return {
    name: draft.name.trim(),
    location: draft.location.trim(),
    owner: { name: draft.ownerName.trim(), registration: draft.registration.trim(), address: draft.ownerAddress.trim(), representative: draft.representative.trim() },
    mandate: { reference: draft.mandateReference.trim(), signedOn: draft.signedOn, durationYears: Number(draft.durationYears) },
    bankAccountOwner: draft.bankAccountOwner,
    rentAccountLastDigits: draft.bankAccountOwner === 'sci' ? draft.rentAccountDigits.trim() : null,
    expensesPaidBy: draft.expensesPaidBy,
    lots: draft.lots.map(lot => ({ building: lot.building.trim(), code: lot.code.trim().toUpperCase(), type: lot.type, surface: Number(lot.surface), floor: lot.floor.trim() || null })),
    billingItemCodes: draft.billingItemCodes,
  };
}

interface NewAssetScreenProps {
  draft: NewAssetDraft;
  billingItems: BillingItem[];
  onDraftChange: (draft: NewAssetDraft) => void;
  onUseSample: (step: NewAssetStep) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | undefined;
  onKeepDraft: () => void;
  onDiscardDraft: () => void;
  onBack: () => void;
}

/** Parcours 1 d'Elodie : un nouvel actif en cinq étapes puis un récapitulatif, en page avec brouillon (règle 9). */
export function NewAssetScreen(props: NewAssetScreenProps) {
  const { draft, billingItems, onDraftChange, onUseSample, onSubmit, submitting, submitError, onKeepDraft, onDiscardDraft, onBack } = props;
  const step = draft.step;
  const index = newAssetSteps.indexOf(step);
  const errors = validateStep(draft, step);
  const errorCount = Object.keys(errors).length;
  const attempted = draft.attempted.includes(step);
  const showErrors = attempted && errorCount > 0;
  const allValid = newAssetSteps.every(s => Object.keys(validateStep(draft, s)).length === 0);
  const set = (changes: Partial<NewAssetDraft>) => onDraftChange({ ...draft, ...changes });
  const go = (next: NewAssetStep) => set({ step: next });
  /** Continuer : si l'étape a des erreurs, elles deviennent visibles ; sinon on avance. */
  const tryNext = () => {
    if (errorCount > 0) set({ attempted: attempted ? draft.attempted : [...draft.attempted, step] });
    else go(newAssetSteps[index + 1]!);
  };

  const steps: PathStep<NewAssetStep>[] = newAssetSteps.map(key => ({ key, label: t(`newAsset.step.${key}`) }));
  const field = (key: keyof NewAssetDraft & string, label: string, type: 'text' | 'date' = 'text') => (
    <Field id={`na-${key}`} label={label} required error={errors[key]}>
      <TextInput id={`na-${key}`} type={type} value={String(draft[key])} invalid={!!errors[key]} onChange={e => set({ [key]: e.target.value } as Partial<NewAssetDraft>)} />
    </Field>
  );

  const status = submitError ?? (!showErrors ? t('draft.saved') : errorCount === 1 ? t('newAsset.stepErrors.one') : t('newAsset.stepErrors', { count: errorCount }));

  return (
    <FormAttemptContext.Provider value={attempted}>
      <PageHeader
        object="asset"
        breadcrumbs={[{ label: t('nav.assets'), onClick: onBack }]}
        eyebrow={t('newAsset.required')}
        title={draft.name.trim() || t('newAsset.title')}
        aside={<Path steps={steps} current={step} onSelect={go} label={t('newAsset.pathLabel')} />}
      />

      {step === 'owner' ? (
        <Card
          title={t('newAsset.owner.title')}
          actions={
            <Button variant="base" onClick={() => onUseSample('owner')}>
              {t('newAsset.action.useSampleCompany')}
            </Button>
          }
        >
          <div className="form-grid">
            {field('name', t('newAsset.field.name'))}
            {field('location', t('newAsset.field.location'))}
            {field('ownerName', t('newAsset.field.ownerName'))}
            {field('registration', t('newAsset.field.registration'))}
            {field('ownerAddress', t('newAsset.field.ownerAddress'))}
            {field('representative', t('newAsset.field.representative'))}
          </div>
        </Card>
      ) : null}

      {step === 'mandate' ? (
        <Card
          title={t('newAsset.mandate.title')}
          actions={
            <Button variant="base" onClick={() => onUseSample('mandate')}>
              {t('newAsset.action.useSampleMandate')}
            </Button>
          }
        >
          <div className="form-grid">
            {field('mandateReference', t('newAsset.field.mandateReference'))}
            {field('signedOn', t('newAsset.field.signedOn'), 'date')}
            {field('durationYears', t('newAsset.field.durationYears'))}
          </div>
        </Card>
      ) : null}

      {step === 'specifics' ? (
        <Card title={t('newAsset.specifics.title')}>
          <div className="form-grid">
            <Field id="na-rentAccount" label={t('newAsset.field.rentAccount')} required>
              <SelectInput id="na-rentAccount" value={draft.bankAccountOwner} onChange={e => set({ bankAccountOwner: e.target.value as 'sci' | 'pfo' })}>
                <option value="sci">{t('newAsset.field.rentAccount.sci')}</option>
                <option value="pfo">{t('newAsset.field.rentAccount.pfo')}</option>
              </SelectInput>
            </Field>
            {draft.bankAccountOwner === 'sci' ? (
              <Field id="na-digits" label={t('newAsset.field.rentAccountDigits')} required error={errors.rentAccountDigits}>
                <TextInput id="na-digits" inputMode="numeric" maxLength={4} value={draft.rentAccountDigits} invalid={!!errors.rentAccountDigits} onChange={e => set({ rentAccountDigits: e.target.value })} />
              </Field>
            ) : null}
            <Field id="na-expenses" label={t('newAsset.field.expenses')} required>
              <SelectInput id="na-expenses" value={draft.expensesPaidBy} onChange={e => set({ expensesPaidBy: e.target.value as 'sci' | 'pfo' })}>
                <option value="sci">{t('asset.record.details.expenses.sci')}</option>
                <option value="pfo">{t('asset.record.details.expenses.pfo')}</option>
              </SelectInput>
            </Field>
          </div>
        </Card>
      ) : null}

      {step === 'lots' ? <LotsStep draft={draft} errors={attempted ? errors : {}} onDraftChange={onDraftChange} onUseSample={() => onUseSample('lots')} /> : null}

      {step === 'items' ? (
        <Card title={t('newAsset.items.title')} meta={t('newAsset.items.body')}>
          <div className="checkbox-group">
            {billingItems
              .filter(item => item.active)
              .map(item => (
                <CheckboxField
                  key={item.id}
                  id={`na-item-${item.code}`}
                  label={`${item.label} (${item.code})`}
                  help={item.current.value.inReport ? t('billingItems.inReport') : t('billingItems.outOfReport')}
                  checked={draft.billingItemCodes.includes(item.code)}
                  onChange={checked => set({ billingItemCodes: checked ? [...draft.billingItemCodes, item.code] : draft.billingItemCodes.filter(code => code !== item.code) })}
                />
              ))}
            {attempted && errors.billingItemCodes ? <div className="field__error">{errors.billingItemCodes}</div> : null}
          </div>
        </Card>
      ) : null}

      {step === 'summary' ? <SummaryStep draft={draft} /> : null}

      <DockedFooter
        tone={submitError ? 'danger' : showErrors ? 'warning' : 'neutral'}
        status={status}
        actions={
          <>
            <Button variant="base" onClick={onDiscardDraft}>
              {t('newAsset.action.discardDraft')}
            </Button>
            <Button variant="neutral" onClick={onKeepDraft}>
              {t('newAsset.action.keepDraft')}
            </Button>
            {index > 0 ? (
              <Button variant="neutral" onClick={() => go(newAssetSteps[index - 1]!)}>
                {t('newAsset.action.previous')}
              </Button>
            ) : null}
            {step === 'summary' ? (
              <Button variant="brand" disabled={!allValid || submitting} onClick={onSubmit}>
                {t('newAsset.action.create')}
              </Button>
            ) : (
              <Button variant="brand" onClick={tryNext}>
                {t('newAsset.action.next')}
              </Button>
            )}
          </>
        }
      />
    </FormAttemptContext.Provider>
  );
}

function LotsStep({ draft, errors, onDraftChange, onUseSample }: { draft: NewAssetDraft; errors: StepErrors; onDraftChange: (draft: NewAssetDraft) => void; onUseSample: () => void }) {
  const update = (key: string, changes: Partial<LotDraft>) => onDraftChange({ ...draft, lots: draft.lots.map(lot => (lot.key === key ? { ...lot, ...changes } : lot)) });
  const remove = (key: string) => onDraftChange({ ...draft, lots: draft.lots.filter(lot => lot.key !== key) });
  const add = () => onDraftChange({ ...draft, lots: [...draft.lots, emptyLot(`lot-${Date.now()}-${draft.lots.length}`)] });
  const totalSurface = draft.lots.reduce((sum, lot) => sum + (Number(lot.surface) || 0), 0);
  return (
    <Card
      title={t('newAsset.lots.title')}
      meta={t('newAsset.lots.body')}
      actions={
        <>
          <Button variant="base" onClick={onUseSample}>
            {t('newAsset.lots.useSample')}
          </Button>
          <label className="btn btn--neutral">
            <Icon name="upload" />
            {t('newAsset.lots.import')}
            <input
              type="file"
              accept=".xlsx,.csv"
              className="visually-hidden"
              onChange={event => {
                if (event.target.files && event.target.files.length > 0) onUseSample();
              }}
            />
          </label>
        </>
      }
      flush
    >
      <div className="table-wrap lot-editor">
        <table className="table">
          <caption className="visually-hidden">{t('newAsset.lots.title')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('newAsset.lots.col.building')}</th>
              <th scope="col">{t('newAsset.lots.col.code')}</th>
              <th scope="col">{t('newAsset.lots.col.type')}</th>
              <th scope="col" className="numeric">{t('newAsset.lots.col.surface')}</th>
              <th scope="col">{t('newAsset.lots.col.floor')}</th>
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            {draft.lots.map(lot => (
              <tr key={lot.key}>
                <td>
                  <TextInput aria-label={t('newAsset.lots.col.building')} value={lot.building} invalid={!!errors[`${lot.key}.building`]} onChange={e => update(lot.key, { building: e.target.value })} />
                </td>
                <td>
                  <TextInput aria-label={t('newAsset.lots.col.code')} value={lot.code} invalid={!!errors[`${lot.key}.code`]} onChange={e => update(lot.key, { code: e.target.value })} />
                  {errors[`${lot.key}.code`] ? <div className="field__error">{errors[`${lot.key}.code`]}</div> : null}
                </td>
                <td>
                  <SelectInput aria-label={t('newAsset.lots.col.type')} value={lot.type} onChange={e => update(lot.key, { type: e.target.value as LotType })}>
                    {(Object.keys(lotTypeKey) as LotType[]).map(type => (
                      <option key={type} value={type}>
                        {t(lotTypeKey[type])}
                      </option>
                    ))}
                  </SelectInput>
                </td>
                <td className="numeric">
                  <TextInput aria-label={t('newAsset.lots.col.surface')} inputMode="numeric" value={lot.surface} invalid={!!errors[`${lot.key}.surface`]} onChange={e => update(lot.key, { surface: e.target.value })} />
                </td>
                <td>
                  <TextInput aria-label={t('newAsset.lots.col.floor')} value={lot.floor} onChange={e => update(lot.key, { floor: e.target.value })} />
                </td>
                <td>
                  <div className="table__actions">
                    <Button variant="base" onClick={() => remove(lot.key)}>
                      {t('newAsset.lots.remove')}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6}>{t('newAsset.lots.total', { count: draft.lots.length, surface: totalSurface })}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="card__footer">
        <Button variant="neutral" iconLeading="plus" onClick={add}>
          {t('newAsset.lots.add')}
        </Button>
        {errors.lots ? <span className="field__error" style={{ marginLeft: 12 }}>{errors.lots}</span> : null}
      </div>
    </Card>
  );
}

function SummaryStep({ draft }: { draft: NewAssetDraft }) {
  const buildings = new Set(draft.lots.map(lot => lot.building.trim())).size;
  return (
    <div className="layout-two">
      <Card title={t('newAsset.owner.title')}>
        <dl className="summary-list">
          <dt>{t('newAsset.field.name')}</dt>
          <dd>{draft.name}</dd>
          <dt>{t('newAsset.field.location')}</dt>
          <dd>{draft.location}</dd>
          <dt>{t('newAsset.field.ownerName')}</dt>
          <dd>{draft.ownerName}</dd>
          <dt>{t('newAsset.field.registration')}</dt>
          <dd>{draft.registration}</dd>
        </dl>
      </Card>
      <Card title={t('newAsset.mandate.title')}>
        <dl className="summary-list">
          <dt>{t('newAsset.field.mandateReference')}</dt>
          <dd>{draft.mandateReference}</dd>
          <dt>{t('newAsset.field.signedOn')}</dt>
          <dd>{draft.signedOn}</dd>
          <dt>{t('newAsset.field.durationYears')}</dt>
          <dd>{draft.durationYears}</dd>
          <dt>{t('newAsset.field.rentAccount')}</dt>
          <dd>{draft.bankAccountOwner === 'sci' ? t('newAsset.field.rentAccount.sci') : t('newAsset.field.rentAccount.pfo')}</dd>
          <dt>{t('newAsset.field.expenses')}</dt>
          <dd>{draft.expensesPaidBy === 'sci' ? t('asset.record.details.expenses.sci') : t('asset.record.details.expenses.pfo')}</dd>
        </dl>
      </Card>
      <Card title={t('newAsset.lots.title')}>
        <p>{t('newAsset.summary.lots', { count: draft.lots.length, buildings })}</p>
        <p>{t('newAsset.summary.items', { count: draft.billingItemCodes.length })}</p>
      </Card>
    </div>
  );
}
