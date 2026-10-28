import type { BankAccount } from '@/services/contracts';
import { t } from '@/i18n/t';
import { Button, Card, DockedFooter, Field, Icon, PageHeader, SelectInput, TextInput } from '@/ui/primitives';

export interface ImportStatementForm {
  bankAccountId: string;
  period: string;
  fileName: string;
}

interface ImportStatementScreenProps {
  accounts: BankAccount[];
  form: ImportStatementForm;
  onChange: (form: ImportStatementForm) => void;
  sampleAvailable: boolean;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | undefined;
  onBack: () => void;
}

export function ImportStatementScreen({ accounts, form, onChange, sampleAvailable, onSubmit, submitting, submitError, onBack }: ImportStatementScreenProps) {
  const ready = form.bankAccountId && /^\d{4}-\d{2}$/.test(form.period) && form.fileName;
  return (
    <>
      <PageHeader object="collection" breadcrumbs={[{ label: t('nav.collections'), onClick: onBack }]} eyebrow={t('importStatement.subtitle')} title={t('importStatement.title')} />
      <Card>
        <div className="form-grid">
          <Field id="imp-account" label={t('importStatement.field.account')} required>
            <SelectInput id="imp-account" value={form.bankAccountId} onChange={e => onChange({ ...form, bankAccountId: e.target.value })}>
              <option value="">{t('importStatement.field.account.placeholder')}</option>
              {accounts
                .filter(account => account.holder === 'sci')
                .map(account => (
                  <option key={account.id} value={account.id}>
                    {account.bank} {account.accountLabel} · {account.assetName ?? account.holderName}
                  </option>
                ))}
            </SelectInput>
          </Field>
          <Field id="imp-period" label={t('importStatement.field.period')} required>
            <TextInput id="imp-period" type="month" value={form.period} onChange={e => onChange({ ...form, period: e.target.value })} />
          </Field>
        </div>
        <label className="dropzone" style={{ marginTop: 16 }}>
          <Icon name="upload" size={28} />
          <span>{form.fileName ? t('document.upload.chosen', { name: form.fileName }) : t('importStatement.drop')}</span>
          <input
            type="file"
            accept=".pdf,.csv"
            className="visually-hidden"
            onChange={event => {
              const file = event.target.files?.[0];
              if (file) onChange({ ...form, fileName: file.name });
            }}
          />
        </label>
        {sampleAvailable ? (
          <div style={{ marginTop: 12 }}>
            <Button variant="neutral" onClick={() => onChange({ ...form, fileName: 'releve-exemple.pdf', bankAccountId: form.bankAccountId || (accounts.find(a => a.holder === 'sci')?.id ?? ''), period: form.period || '2026-10' })}>
              {t('importStatement.sample')}
            </Button>
          </div>
        ) : null}
      </Card>
      <DockedFooter
        tone={submitError ? 'danger' : 'neutral'}
        status={submitError ?? ''}
        actions={
          <>
            <Button variant="neutral" onClick={onBack}>
              {t('settings.action.cancel')}
            </Button>
            <Button variant="brand" disabled={submitting || !ready} onClick={onSubmit}>
              {t('importStatement.action')}
            </Button>
          </>
        }
      />
    </>
  );
}
