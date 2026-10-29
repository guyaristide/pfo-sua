import type { ChequeCheckIssue, ChequeInput, ChequeRecord, ChequeReturnRecord, TenantOption } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { wordsMatchAmount } from '@/shared/format/number-words';
import { t } from '@/i18n/t';
import { Band, Button, Card, CheckboxField, Checklist, Field, FieldGrid, FileDrop, FormActions, Lookup, Notice, NumberInput, RecordLayout, TextInput, WizardPage, stepStatus, type PathStep } from '@/ui/primitives';
import { ReturnedChequeStep, type ReturnMessage } from './collections/cheque/ReturnedChequeStep';

export type ChequeStep = 'capture' | 'check' | 'receipt';

/** Le formulaire tel qu'il est saisi : des chaînes, converties une seule fois à l'envoi. */
export interface ChequeForm {
  amount: string;
  amountInWords: string;
  bank: string;
  chequeNumber: string;
  payee: string;
  receivedOn: string;
  tenantId: string;
  signed: boolean;
}

export interface ChequeDraft {
  step: ChequeStep;
  form: ChequeForm;
  /** La personne a tenté de confirmer : les erreurs sont visibles. */
  attempted?: boolean;
  /** Chèque non conforme rendu au locataire : la demande de nouveau règlement en cours d'écriture. */
  returning?: ReturnMessage;
}

export const emptyChequeForm: ChequeForm = { amount: '', amountInWords: '', bank: '', chequeNumber: '', payee: '', receivedOn: '', tenantId: '', signed: false };

type FieldKey = keyof ChequeForm;
type TextKey = Exclude<FieldKey, 'signed'>;

/** Une seule validation, partagée par le pied fixe et l'envoi (règle 4). */
export function validateChequeForm(form: ChequeForm): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};
  for (const key of ['amountInWords', 'bank', 'chequeNumber', 'receivedOn', 'tenantId'] as const) {
    if (!form[key].trim()) errors[key] = t('form.required');
  }
  if (!form.amount.trim()) errors.amount = t('form.required');
  else if (!/^\d+$/.test(form.amount.trim()) || Number(form.amount) <= 0) errors.amount = t('form.invalidAmount');
  return errors;
}

/** Contrôles bloquants (E2.6) : chiffres = lettres, bénéficiaire = la SCI de l'actif, signature présente. */
export function chequeIssues(form: ChequeForm, payeeName: string | undefined): ChequeCheckIssue[] {
  const issues: ChequeCheckIssue[] = [];
  const amount = Number(form.amount.trim());
  if (!form.amountInWords.trim() || !Number.isFinite(amount) || !wordsMatchAmount(form.amountInWords, amount)) issues.push('amount-mismatch');
  const payee = form.payee.trim().toLowerCase();
  if (!payee) issues.push('payee-missing');
  else if (payeeName && payee !== payeeName.toLowerCase()) issues.push('payee-wrong');
  if (!form.signed) issues.push('unsigned');
  return issues;
}

export function toChequeInput(form: ChequeForm): ChequeInput {
  return {
    tenantId: form.tenantId,
    amount: Number(form.amount.trim()),
    amountInWords: form.amountInWords.trim(),
    bank: form.bank.trim(),
    chequeNumber: form.chequeNumber.trim(),
    payee: form.payee.trim(),
    receivedOn: form.receivedOn,
    signed: form.signed,
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
  /** Chèque non conforme : la personne le rend au locataire et écrit la demande de nouveau règlement. */
  onReturn: () => void;
  onSendReturn: () => void;
  returning: boolean;
  returnError: string | undefined;
  returned: ChequeReturnRecord | null;
  onAnother: () => void;
  onBack: () => void;
}

const controlKey = {
  amount: { ok: 'cheque.controls.amount.ok', ko: 'cheque.controls.amount.ko' },
  payee: { ok: 'cheque.controls.payee.ok', ko: 'cheque.controls.payee.wrong' },
  signature: { ok: 'cheque.controls.signature.ok', ko: 'cheque.controls.signature.ko' },
} as const;

/** Parcours 2B d'Elodie : photographier ou déposer, vérifier les valeurs lues, reçu et dépôt en banque. */
export function RecordChequeScreen(props: RecordChequeScreenProps) {
  const { tenants, fmt, draft, onDraftChange, onUseSample, onSubmit, submitting, submitError, record, onReturn, onSendReturn, returning, returnError, returned, onAnother, onBack } = props;
  const returningStep = draft.returning !== undefined || returned !== null;
  const step: ChequeStep = record || returningStep ? 'receipt' : draft.step;
  const form = draft.form;
  const errors = validateChequeForm(form);
  const errorCount = Object.keys(errors).length;
  const attempted = draft.attempted === true;
  const showErrors = attempted && errorCount > 0;
  const tenant = tenants.find(option => option.id === form.tenantId);
  const issues = chequeIssues(form, tenant?.payeeName);
  const blocked = errorCount === 0 && issues.length > 0;
  const sendReturn = () => {
    if (!draft.returning?.to.trim() || !draft.returning.body.trim() || !draft.returning.subject.trim()) onDraftChange({ ...draft, attempted: true });
    else onSendReturn();
  };
  const tryConfirm = () => {
    if (errorCount > 0) onDraftChange({ ...draft, attempted: true });
    else if (issues.length === 0) onSubmit();
  };

  const steps: PathStep<ChequeStep>[] = [
    { key: 'capture', label: t('cheque.step.capture') },
    { key: 'check', label: t('cheque.step.check') },
    { key: 'receipt', label: t('cheque.step.receipt') },
  ];
  const setForm = (changes: Partial<ChequeForm>) => onDraftChange({ ...draft, form: { ...form, ...changes } });
  const setStep = (next: ChequeStep) => onDraftChange({ ...draft, step: next });

  const field = (key: TextKey, label: string, type: 'text' | 'date' = 'text') => (
    <Field id={`cheque-${key}`} label={label} required error={errors[key]}>
      {key === 'amount' ? (
        <NumberInput id={`cheque-${key}`} unit={fmt.currencyLabel} value={form[key]} invalid={!!errors[key]} onChange={event => setForm({ [key]: event.target.value })} />
      ) : (
        <TextInput id={`cheque-${key}`} type={type} value={form[key]} invalid={!!errors[key]} onChange={event => setForm({ [key]: event.target.value })} />
      )}
    </Field>
  );

  const control = (key: 'amount' | 'payee' | 'signature') => {
    const failing = key === 'amount' ? issues.includes('amount-mismatch') : key === 'payee' ? issues.includes('payee-missing') || issues.includes('payee-wrong') : issues.includes('unsigned');
    const detail = key === 'payee' && issues.includes('payee-missing') ? t('cheque.controls.payee.missing') : key === 'payee' && issues.includes('payee-wrong') ? t('cheque.controls.payee.wrong') : failing ? t(controlKey[key].ko) : t(controlKey[key].ok);
    return { id: key, tone: failing ? ('danger' as const) : ('success' as const), title: t(key === 'amount' ? 'cheque.controls.amount' : key === 'payee' ? 'cheque.controls.payee.title' : 'cheque.controls.signature'), detail };
  };
  const checkStatus = errorCount === 0 && issues.length > 0 ? { status: t('cheque.check.blocked'), tone: 'warning' as const } : stepStatus(submitError, showErrors, errorCount);
  const footer =
    step === 'receipt' && returningStep
      ? {
          status: returnError ?? (returned ? t('cheque.return.sent', { email: returned.sentTo }) : t('cheque.return.status')),
          tone: returnError ? ('danger' as const) : returned ? ('success' as const) : ('warning' as const),
          actions: returned ? (
            <>
              <Button variant="neutral" onClick={onBack}>
                {t('cheque.action.backToCollections')}
              </Button>
              <Button variant="brand" onClick={onAnother}>
                {t('cheque.action.another')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="neutral" onClick={() => { const { returning: _dropped, ...rest } = draft; onDraftChange(rest); }}>
                {t('cheque.action.backToCheck')}
              </Button>
              <Button variant="brand" disabled={returning} onClick={sendReturn}>
                {t('cheque.return.send')}
              </Button>
            </>
          ),
        }
      : step === 'receipt'
      ? {
          status: t('cheque.toast'),
          tone: 'success' as const,
          actions: (
            <>
              <Button variant="neutral" onClick={onBack}>
                {t('cheque.action.backToCollections')}
              </Button>
              <Button variant="neutral" onClick={onAnother}>
                {t('cheque.action.another')}
              </Button>
              <Button variant="brand" iconLeading="print" onClick={() => window.print()}>
                {t('cheque.action.print')}
              </Button>
            </>
          ),
        }
      : step === 'capture'
        ? {
            status: t('draft.saved'),
            tone: 'neutral' as const,
            actions: (
              <Button variant="neutral" onClick={onBack}>
                {t('cheque.action.cancel')}
              </Button>
            ),
          }
        : {
            status: checkStatus.status,
            tone: checkStatus.tone,
            actions: (
              <>
                <Button variant="neutral" onClick={() => setStep('capture')}>
                  {t('cheque.action.retake')}
                </Button>
                {blocked ? (
                  <Button variant="brand" onClick={onReturn}>
                    {t('cheque.action.return')}
                  </Button>
                ) : (
                  <Button variant="brand" iconLeading="print" disabled={submitting} onClick={tryConfirm}>
                    {t('cheque.action.confirm')}
                  </Button>
                )}
              </>
            ),
          };

  return (
    <WizardPage
      object="cheque"
      breadcrumbs={[{ label: t('nav.collections'), onClick: onBack }, { label: t('cheque.breadcrumb') }]}
      eyebrow={t('collections.cheques.title')}
      title={t('cheque.title')}
      steps={steps}
      current={step}
      onSelectStep={record || returningStep ? undefined : setStep}
      pathLabel={t('cheque.pathLabel')}
      attempted={attempted}
      footer={footer}
    >
      {step === 'capture' ? (
        <Card title={t('cheque.capture.title')} meta={t('cheque.capture.body')}>
          <FileDrop id="cheque-scan" label={t('cheque.capture.drop')} hint={t('cheque.capture.read')} accept="image/*,.pdf" onFile={onUseSample} />
          <FormActions>
            <Button variant="neutral" onClick={onUseSample}>
              {t('cheque.capture.sample')}
            </Button>
          </FormActions>
        </Card>
      ) : null}

      {step === 'check' ? (
        <RecordLayout
          main={
            <Card title={t('cheque.check.title')} meta={t('cheque.check.body')}>
              <div className="form-grid">
                {field('amount', t('cheque.field.amount'))}
                {field('amountInWords', t('cheque.field.amountInWords'))}
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
                <CheckboxField id="cheque-signed" label={t('cheque.field.signed')} help={t('cheque.field.signed.help')} checked={form.signed} onChange={signed => setForm({ signed })} />
              </div>
            </Card>
          }
          aside={
            <>
              <Card title={t('cheque.controls.title')} meta={tenant ? t('cheque.controls.payee', { payee: tenant.payeeName }) : t('cheque.controls.body')}>
                <Checklist items={[control('amount'), control('payee'), control('signature')]} />
                {blocked ? (
                  <Notice tone="danger" title={t('cheque.controls.failed', { count: issues.length })}>
                    {t('cheque.controls.failed.body')}
                  </Notice>
                ) : null}
              </Card>
              <Card title={t('cheque.allocation.title')} meta={t('cheque.allocation.body')}>
                {tenant ? (
                  <FieldGrid
                    columns={1}
                    fields={[
                      { label: t('cheque.tenant.proposed'), value: `${tenant.name} · ${t('reconcile.lot', { lot: tenant.lotCode })}` },
                      { label: t('cheque.tenant.invoices'), value: tenant.dueDetail },
                      { label: t('cheque.tenant.dueLabel'), value: fmt.money(tenant.dueAmount), numeric: true },
                    ]}
                  />
                ) : (
                  <p className="detail-panel__hint">{t('cheque.field.tenant.placeholder')}</p>
                )}
              </Card>
            </>
          }
        />
      ) : null}

      {step === 'receipt' && returningStep ? (
        <ReturnedChequeStep form={form} tenant={tenant ?? null} fmt={fmt} issues={issues} message={draft.returning ?? { to: '', subject: '', body: '' }} onMessage={message => onDraftChange({ ...draft, returning: message })} returned={returned} />
      ) : null}

      {step === 'receipt' && record ? (
        <>
          <Band eyebrow={t('cheque.receipt.summary', { number: record.chequeNumber, tenant: record.tenantName, lot: record.lotCode })} title={t('cheque.receipt.title')} body={record.allocationDetail} />
          <Card>
            <Checklist
              items={[
                { id: 'amount', tone: 'success', title: fmt.money(record.amount), detail: t('cheque.receipt.deposit', { date: fmt.shortDate(record.depositPlannedOn), account: record.depositAccountLabel }) },
                { id: 'alert', tone: 'warning', title: t('cheque.receipt.alert') },
              ]}
            />
          </Card>
        </>
      ) : null}
    </WizardPage>
  );
}
