import type { DeliveryInput, DeliveryMode, InvoiceDetail } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import type { MessageKey } from '@/i18n/fr';
import { invoiceStatus } from '@/shared/status';
import { exportCsv } from '@/shared/export/csv';
import { t } from '@/i18n/t';
import {
  Badge,
  Button,
  Card,
  DataTable,
  Field,
  FormPage,
  PageHeader,
  Path,
  RecordLayout,
  SelectInput,
  Stack,
  TextInput,
  Timeline,
  issuesFrom,
  type Column,
  type PathStep,
} from '@/ui/primitives';

export const deliveryModeKey: Record<DeliveryMode, MessageKey> = {
  deposit: 'invoice.delivery.mode.deposit',
  email: 'invoice.delivery.mode.email',
  courier: 'invoice.delivery.mode.courier',
};
type InvoiceStep = 'draft' | 'to-check' | 'issued' | 'delivered' | 'paid';
const pathSteps: InvoiceStep[] = ['draft', 'to-check', 'issued', 'delivered', 'paid'];

interface InvoiceScreenProps {
  invoice: InvoiceDetail;
  fmt: Formatters;
  canIssue: boolean;
  onCheck: () => void;
  checking: boolean;
  onDelivery: () => void;
  onOpenTenant: () => void;
  onBack: () => void;
}

export function InvoiceScreen({
  invoice,
  fmt,
  canIssue,
  onCheck,
  checking,
  onDelivery,
  onOpenTenant,
  onBack,
}: InvoiceScreenProps) {
  const period = fmt.monthYear(invoice.periodStart);
  const current: InvoiceStep = invoice.status === 'partially-paid' ? 'delivered' : invoice.status;
  const steps: PathStep<InvoiceStep>[] = pathSteps.map(key => ({ key, label: t(`invoice.step.${key}`) }));
  const columns: Column<InvoiceDetail['lines'][number]>[] = [
    { key: 'label', header: t('invoice.lines.col.label'), render: line => line.label },
    {
      key: 'amount',
      header: t('invoice.lines.col.amount'),
      numeric: true,
      render: line => fmt.moneyPlain(line.amount),
    },
  ];
  const canCheck = canIssue && (invoice.status === 'to-check' || invoice.status === 'draft');
  const canDeliver = canIssue && invoice.status === 'issued';
  return (
    <>
      <PageHeader
        object="invoice"
        breadcrumbs={[{ label: t('nav.billing'), onClick: onBack }, { label: t('invoice.breadcrumb') }]}
        eyebrow={`${invoice.assetName} · ${invoice.tenantName}`}
        title={t('invoice.title', { period })}
        aside={<Path steps={steps} current={current} label={t('invoice.pathLabel')} />}
        actions={
          <>
            <Button
              variant="neutral"
              iconLeading="download"
              onClick={() =>
                exportCsv(
                  `facture-${invoice.id}`,
                  [
                    { header: t('invoice.lines.col.label'), value: l => l.label },
                    { header: t('invoice.lines.col.amount'), value: l => l.amount },
                  ],
                  invoice.lines,
                )
              }
            >
              {t('invoice.action.export')}
            </Button>
            {invoice.tenantId ? (
              <Button variant="neutral" onClick={onOpenTenant}>
                {t('invoice.action.openTenant')}
              </Button>
            ) : null}
            {canCheck ? (
              <Button variant="brand" iconLeading="check" disabled={checking} onClick={onCheck}>
                {t('invoice.action.check')}
              </Button>
            ) : null}
            {canDeliver ? (
              <Button variant="brand" onClick={onDelivery}>
                {t('invoice.action.delivery')}
              </Button>
            ) : null}
          </>
        }
        highlights={[
          { label: t('invoice.highlight.tenant'), value: invoice.tenantName },
          { label: t('invoice.highlight.amount'), value: fmt.money(invoice.amount) },
          { label: t('invoice.highlight.due'), value: fmt.shortDate(invoice.dueDate) },
          {
            label: t('invoice.highlight.paid'),
            value: (
              <Badge
                tone={invoiceStatus[invoice.status].tone}
              >{`${t(invoiceStatus[invoice.status].labelKey)} · ${fmt.money(invoice.paidAmount)}`}</Badge>
            ),
          },
        ]}
      />
      <RecordLayout
        main={
          <Card title={t('invoice.lines.title')} flush>
            <DataTable
              caption={t('invoice.lines.title')}
              columns={columns}
              rows={invoice.lines}
              rowKey={line => line.label}
              footer={[t('invoice.lines.total'), fmt.moneyPlain(invoice.amount)]}
            />
            <div className="card__footer card__meta">
              {t('invoice.lines.vat')} {fmt.moneyPlain(invoice.vatAmount)}
            </div>
          </Card>
        }
        aside={
          <Stack>
            <Card title={t('invoice.delivery.title')}>
              {invoice.deliveredOn && invoice.deliveryMode ? (
                <p>
                  {t('invoice.delivery.on', {
                    date: fmt.shortDate(invoice.deliveredOn),
                    mode: t(deliveryModeKey[invoice.deliveryMode]),
                    proof: invoice.deliveryProof ?? '',
                  })}
                </p>
              ) : (
                <p className="card__meta">{t('invoice.delivery.none')}</p>
              )}
            </Card>
            <Card title={t('invoice.history.title')} flush>
              <Timeline
                fmt={fmt}
                items={invoice.history.map(event => ({
                  id: event.id,
                  date: event.date,
                  title: event.label,
                  detail: event.amount !== null ? fmt.money(event.amount) : undefined,
                }))}
              />
            </Card>
          </Stack>
        }
      />
    </>
  );
}

export interface DeliveryForm {
  date: string;
  mode: DeliveryMode;
  proof: string;
}

export function validateDelivery(form: DeliveryForm): Partial<Record<keyof DeliveryForm, string>> {
  const errors: Partial<Record<keyof DeliveryForm, string>> = {};
  if (!form.date) errors.date = t('form.required');
  if (!form.proof.trim()) errors.proof = t('form.required');
  return errors;
}

export function toDeliveryInput(form: DeliveryForm): DeliveryInput {
  return { date: form.date, mode: form.mode, proof: form.proof.trim() };
}

interface DeliveryScreenProps {
  invoice: InvoiceDetail;
  fmt: Formatters;
  form: DeliveryForm;
  onChange: (form: DeliveryForm) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | undefined;
  onCancel: () => void;
  onBack: () => void;
}

export function InvoiceDeliveryScreen({
  invoice,
  fmt,
  form,
  onChange,
  onSubmit,
  submitting,
  submitError,
  onCancel,
  onBack,
}: DeliveryScreenProps) {
  const errors = validateDelivery(form);
  const set = (changes: Partial<DeliveryForm>) => onChange({ ...form, ...changes });
  return (
    <FormPage
      object="invoice"
      breadcrumbs={[
        { label: t('nav.billing'), onClick: onBack },
        { label: t('invoice.title', { period: fmt.monthYear(invoice.periodStart) }), onClick: onCancel },
      ]}
      eyebrow={`${invoice.tenantName} · ${fmt.money(invoice.amount)}`}
      title={t('invoice.deliveryForm.title')}
      errorCount={Object.keys(errors).length}
      issues={issuesFrom(
        errors,
        key => `dlv-${key}`,
        key => t(key === 'date' ? 'invoice.deliveryForm.date' : 'invoice.deliveryForm.proof'),
      )}
      submitError={submitError}
      submitting={submitting}
      onCancel={onCancel}
      onSubmit={onSubmit}
    >
      <Card>
        <div className="form-grid">
          <Field id="dlv-date" label={t('invoice.deliveryForm.date')} required error={errors.date}>
            <TextInput
              id="dlv-date"
              type="date"
              value={form.date}
              invalid={!!errors.date}
              onChange={e => set({ date: e.target.value })}
            />
          </Field>
          <Field id="dlv-mode" label={t('invoice.deliveryForm.mode')} required>
            <SelectInput
              id="dlv-mode"
              value={form.mode}
              onChange={e => set({ mode: e.target.value as DeliveryMode })}
            >
              {(Object.keys(deliveryModeKey) as DeliveryMode[]).map(mode => (
                <option key={mode} value={mode}>
                  {t(deliveryModeKey[mode])}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field
            id="dlv-proof"
            label={t('invoice.deliveryForm.proof')}
            required
            error={errors.proof}
            help={t('invoice.deliveryForm.proof.help')}
          >
            <TextInput
              id="dlv-proof"
              value={form.proof}
              invalid={!!errors.proof}
              onChange={e => set({ proof: e.target.value })}
            />
          </Field>
        </div>
      </Card>
    </FormPage>
  );
}
