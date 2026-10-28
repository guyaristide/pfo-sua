import type { ChequeInput, ChequeRecord, TenantOption } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { t } from '@/i18n/t';
import { Band, Button, Card, DockedFooter, Field, FormAttemptContext, Icon, Lookup, NumberInput, PageHeader, Path, TextInput, type PathStep } from '@/ui/primitives';

export type ChequeStep = 'capture' | 'check' | 'receipt';

/** Le formulaire tel qu'il est saisi : des chaînes, converties une seule fois à l'envoi. */
export interface ChequeForm {
  amount: string;
  bank: string;
  chequeNumber: string;
  payee: string;
  receivedOn: string;
  tenantId: string;
}

export interface ChequeDraft {
  step: ChequeStep;
  form: ChequeForm;
  /** La personne a tenté de confirmer : les erreurs sont visibles. */
  attempted?: boolean;
}

export const emptyChequeForm: ChequeForm = { amount: '', bank: '', chequeNumber: '', payee: '', receivedOn: '', tenantId: '' };

type FieldKey = keyof ChequeForm;

/** Une seule validation, partagée par le pied fixe et l'envoi (règle 4). */
export function validateChequeForm(form: ChequeForm): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};
  for (const key of ['bank', 'chequeNumber', 'payee', 'receivedOn', 'tenantId'] as const) {
    if (!form[key].trim()) errors[key] = t('form.required');
  }
  if (!form.amount.trim()) errors.amount = t('form.required');
  else if (!/^\d+$/.test(form.amount.trim()) || Number(form.amount) <= 0) errors.amount = t('form.invalidAmount');
  return errors;
}

export function toChequeInput(form: ChequeForm): ChequeInput {
  return {
    tenantId: form.tenantId,
    amount: Number(form.amount.trim()),
    bank: form.bank.trim(),
    chequeNumber: form.chequeNumber.trim(),
    payee: form.payee.trim(),
    receivedOn: form.receivedOn,
  };
}

interface RecordChequeScreenProps {
  tenants: TenantOption[];
  fmt: Formatters;
  draft: ChequeDraft;
  onDraftChange: (draft: ChequeDraft) => void;
  onUseSample: () => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | undefined;
  record: ChequeRecord | null;
  onAnother: () => void;
  onBack: () => void;
}

/** Parcours 2B d'Elodie : photographier ou déposer, vérifier les valeurs lues, reçu et dépôt en banque. */
export function RecordChequeScreen(props: RecordChequeScreenProps) {
  const { tenants, fmt, draft, onDraftChange, onUseSample, onSubmit, submitting, submitError, record, onAnother, onBack } = props;
  const step: ChequeStep = record ? 'receipt' : draft.step;
  const form = draft.form;
  const errors = validateChequeForm(form);
  const errorCount = Object.keys(errors).length;
  const attempted = draft.attempted === true;
  const showErrors = attempted && errorCount > 0;
  const tryConfirm = () => {
    if (errorCount > 0) onDraftChange({ ...draft, attempted: true });
    else onSubmit();
  };
  const tenant = tenants.find(option => option.id === form.tenantId);

  const steps: PathStep<ChequeStep>[] = [
    { key: 'capture', label: t('cheque.step.capture') },
    { key: 'check', label: t('cheque.step.check') },
    { key: 'receipt', label: t('cheque.step.receipt') },
  ];
  const setForm = (changes: Partial<ChequeForm>) => onDraftChange({ ...draft, form: { ...form, ...changes } });
  const setStep = (next: ChequeStep) => onDraftChange({ ...draft, step: next });

  const field = (key: FieldKey, label: string, type: 'text' | 'date' = 'text') => (
    <Field id={`cheque-${key}`} label={label} required error={errors[key]}>
      {key === 'amount' ? (
        <NumberInput id={`cheque-${key}`} unit={fmt.currencyLabel} value={form[key]} invalid={!!errors[key]} onChange={event => setForm({ [key]: event.target.value })} />
      ) : (
        <TextInput id={`cheque-${key}`} type={type} value={form[key]} invalid={!!errors[key]} onChange={event => setForm({ [key]: event.target.value })} />
      )}
    </Field>
  );

  return (
    <FormAttemptContext.Provider value={attempted}>
      <PageHeader
        object="collection"
        breadcrumbs={[{ label: t('nav.collections'), onClick: onBack }, { label: t('cheque.breadcrumb') }]}
        eyebrow={t('collections.cheques.title')}
        title={t('cheque.title')}
        aside={<Path steps={steps} current={step} onSelect={record ? undefined : setStep} label={t('cheque.pathLabel')} />}
      />

      {step === 'capture' ? (
        <Card title={t('cheque.capture.title')} meta={t('cheque.capture.body')}>
          <label className="dropzone">
            <Icon name="camera" size={28} />
            <span>{t('cheque.capture.drop')}</span>
            <span className="field__help">{t('cheque.capture.read')}</span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="visually-hidden"
              onChange={event => {
                if (event.target.files && event.target.files.length > 0) onUseSample();
              }}
            />
          </label>
          <div style={{ marginTop: 12 }}>
            <Button variant="neutral" onClick={onUseSample}>
              {t('cheque.capture.sample')}
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 'check' ? (
        <div className="layout-two">
          <Card title={t('cheque.check.title')} meta={t('cheque.check.body')}>
            <div className="form-grid">
              {field('amount', t('cheque.field.amount'))}
              {field('bank', t('cheque.field.bank'))}
              {field('chequeNumber', t('cheque.field.number'))}
              {field('payee', t('cheque.field.payee'))}
              {field('receivedOn', t('cheque.field.receivedOn'), 'date')}
              <Field id="cheque-tenantId" label={t('cheque.field.tenant')} required error={errors.tenantId}>
                <Lookup
                  id="cheque-tenantId"
                  options={tenants.map(option => ({ id: option.id, label: option.name, meta: `${option.assetName} · ${option.lotCode}`, icon: 'user' }))}
                  value={form.tenantId}
                  invalid={!!errors.tenantId}
                  placeholder={t('cheque.field.tenant.placeholder')}
                  onChange={tenantId => setForm({ tenantId })}
                />
              </Field>
            </div>
          </Card>
          <Card title={t('cheque.allocation.title')} meta={t('cheque.allocation.body')}>
            {tenant ? (
              <div>
                <div className="card__meta">{t('cheque.tenant.proposed')}</div>
                <div className="table__primary">{tenant.name}</div>
                <div className="table__secondary">{t('reconcile.lot', { lot: tenant.lotCode })}</div>
                <p className="field__help">{tenant.dueDetail}</p>
                <div className="card__meta">{t('cheque.tenant.due', { amount: fmt.money(tenant.dueAmount) })}</div>
              </div>
            ) : (
              <p className="field__help">{t('cheque.field.tenant.placeholder')}</p>
            )}
          </Card>
        </div>
      ) : null}

      {step === 'receipt' && record ? (
        <>
          <Band
            eyebrow={t('cheque.receipt.summary', { number: record.chequeNumber, tenant: record.tenantName, lot: record.lotCode })}
            title={t('cheque.receipt.title')}
            body={record.allocationDetail}
            actions={
              <>
                <Button variant="brand" iconLeading="print" onClick={() => window.print()}>
                  {t('cheque.action.print')}
                </Button>
                <Button variant="neutral" onClick={onAnother}>
                  {t('cheque.action.another')}
                </Button>
              </>
            }
          />
          <Card>
            <ul className="check-list">
              <li>
                <span className="check-list__mark" aria-hidden="true">
                  <Icon name="check" size={12} />
                </span>
                <div>
                  <div className="check-list__title">{fmt.money(record.amount)}</div>
                  <div className="check-list__detail">{t('cheque.receipt.deposit', { date: fmt.shortDate(record.depositPlannedOn), account: record.depositAccountLabel })}</div>
                </div>
              </li>
              <li>
                <span className="check-list__mark check-list__mark--warning" aria-hidden="true">
                  <Icon name="bell" size={12} />
                </span>
                <div className="check-list__detail" style={{ alignSelf: 'center' }}>
                  {t('cheque.receipt.alert')}
                </div>
              </li>
            </ul>
          </Card>
        </>
      ) : null}

      {step === 'receipt' ? (
        <DockedFooter
          tone="success"
          status={t('cheque.toast')}
          actions={
            <Button variant="brand" onClick={onBack}>
              {t('cheque.action.backToCollections')}
            </Button>
          }
        />
      ) : step === 'capture' ? (
        <DockedFooter
          status={t('draft.saved')}
          actions={
            <Button variant="neutral" onClick={onBack}>
              {t('cheque.action.cancel')}
            </Button>
          }
        />
      ) : (
        <DockedFooter
          tone={submitError ? 'danger' : showErrors ? 'warning' : 'neutral'}
          status={submitError ?? (!showErrors ? t('draft.saved') : errorCount === 1 ? t('form.errors.one') : t('form.errors', { count: errorCount }))}
          actions={
            <>
              <Button variant="neutral" onClick={() => setStep('capture')}>
                {t('cheque.action.retake')}
              </Button>
              <Button variant="brand" iconLeading="print" disabled={submitting} onClick={tryConfirm}>
                {t('cheque.action.confirm')}
              </Button>
            </>
          }
        />
      )}
    </FormAttemptContext.Provider>
  );
}
