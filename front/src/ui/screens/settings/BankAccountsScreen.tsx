import type { AssetSummary, BankAccount, BankAccountInput, StatementCadence } from '@/services/contracts';
import { t } from '@/i18n/t';
import { Button, Card, EmptyState, Field, FormPage, ListBody, PageHeader, SelectInput, TextInput, issuesFrom, type Column } from '@/ui/primitives';
import { settingsCrumbs, settingsRootCrumb, type SettingsNavigation } from './crumbs';

const cadenceLabel = (cadence: StatementCadence) => (cadence === 'monthly' ? t('bankAccounts.cadence.monthly') : t('bankAccounts.cadence.daily'));

interface BankAccountsScreenProps {
  accounts: BankAccount[];
  isAdmin: boolean;
  onNew: () => void;
  onEdit: (id: string) => void;
  onOpenSettings: () => void;
}

export function BankAccountsScreen({ accounts, isAdmin, onNew, onEdit, onOpenSettings }: BankAccountsScreenProps) {
  const columns: Column<BankAccount>[] = [
    {
      key: 'account',
      header: t('bankAccounts.col.account'),
      render: account => (
        <div>
          <div className="table__strong">
            {account.bank} {account.accountLabel}
          </div>
          <div className="table__secondary">{account.holder === 'sci' ? t('bankAccounts.holder.sci') : t('bankAccounts.holder.pfo')}</div>
        </div>
      ),
    },
    { key: 'holder', header: t('bankAccounts.col.holder'), render: account => account.holderName },
    { key: 'asset', header: t('bankAccounts.col.asset'), render: account => account.assetName ?? <span className="table__secondary">{t('bankAccounts.asset.none')}</span> },
    { key: 'cadence', header: t('bankAccounts.col.cadence'), render: account => cadenceLabel(account.cadence) },
  ];
  return (
    <>
      <PageHeader
        object="settings"
        breadcrumbs={settingsRootCrumb(onOpenSettings)}
        eyebrow={t('bankAccounts.subtitle')}
        title={t('bankAccounts.title')}
        actions={
          isAdmin ? (
            <Button variant="brand" iconLeading="plus" onClick={onNew}>
              {t('bankAccounts.action.new')}
            </Button>
          ) : null
        }
      />
      <Card flush>
        <ListBody
          rows={accounts}
          haystack={account => [account.bank, account.holderName, account.assetName]}
          columns={columns}
          rowKey={account => account.id}
          caption={t('bankAccounts.title')}
          rowActions={isAdmin ? account => [{ label: t('settings.action.edit'), onSelect: () => onEdit(account.id) }] : undefined}
          footer={rows => [t('bankAccounts.total', { count: rows.length }), '', '', '']}
          empty={<EmptyState icon="bank" title={t('bankAccounts.empty.title')} body={t('bankAccounts.empty.body')} action={isAdmin ? <Button variant="neutral" onClick={onNew}>{t('bankAccounts.action.new')}</Button> : null} />}
        />
      </Card>
    </>
  );
}

export interface BankAccountForm {
  bank: string;
  holder: 'sci' | 'pfo';
  holderName: string;
  assetName: string;
  lastDigits: string;
  cadence: StatementCadence;
}

export const emptyBankAccountForm: BankAccountForm = { bank: '', holder: 'sci', holderName: '', assetName: '', lastDigits: '', cadence: 'monthly' };

export function bankAccountToForm(account: BankAccount): BankAccountForm {
  return {
    bank: account.bank,
    holder: account.holder,
    holderName: account.holderName,
    assetName: account.assetName ?? '',
    lastDigits: account.accountLabel.replace(/\D/g, ''),
    cadence: account.cadence,
  };
}

export function validateBankAccount(form: BankAccountForm): Partial<Record<keyof BankAccountForm, string>> {
  const errors: Partial<Record<keyof BankAccountForm, string>> = {};
  if (!form.bank.trim()) errors.bank = t('form.required');
  if (!form.holderName.trim()) errors.holderName = t('form.required');
  if (form.holder === 'sci' && !form.assetName) errors.assetName = t('form.required');
  if (!/^\d{4}$/.test(form.lastDigits.trim())) errors.lastDigits = t('bankAccounts.field.accountLabel.invalid');
  return errors;
}

export function toBankAccountInput(form: BankAccountForm): BankAccountInput {
  return {
    bank: form.bank.trim(),
    holder: form.holder,
    holderName: form.holderName.trim(),
    assetName: form.holder === 'sci' ? form.assetName : null,
    lastDigits: form.lastDigits.trim(),
    cadence: form.cadence,
  };
}

interface BankAccountFormScreenProps extends SettingsNavigation {
  editing: boolean;
  assets: AssetSummary[];
  form: BankAccountForm;
  onChange: (form: BankAccountForm) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | undefined;
}

export function BankAccountFormScreen({ editing, assets, form, onChange, onSubmit, submitting, submitError, onOpenSettings, onOpenSection }: BankAccountFormScreenProps) {
  const errors = validateBankAccount(form);
  const set = (changes: Partial<BankAccountForm>) => onChange({ ...form, ...changes });
  return (
    <FormPage
      object="settings"
      breadcrumbs={settingsCrumbs({ onOpenSettings, onOpenSection }, t('bankAccounts.title'))}
      title={editing ? t('bankAccounts.form.editTitle') : t('bankAccounts.form.newTitle')}
      errorCount={Object.keys(errors).length}
      issues={issuesFrom(errors, key => ({ bank: 'ba-bank', holderName: 'ba-holderName', assetName: 'ba-asset', lastDigits: 'ba-digits' })[key] ?? `ba-${key}`, key => t(({ bank: 'bankAccounts.field.bank', holderName: 'bankAccounts.field.holderName', assetName: 'bankAccounts.field.asset', lastDigits: 'bankAccounts.field.accountLabel' } as const)[key as 'bank'] ?? 'bankAccounts.field.bank'))}
      submitError={submitError}
      submitting={submitting}
      onCancel={onOpenSection}
      onSubmit={onSubmit}
    >
      <Card>
        <div className="form-grid">
          <Field id="ba-bank" label={t('bankAccounts.field.bank')} required error={errors.bank}>
            <TextInput id="ba-bank" value={form.bank} invalid={!!errors.bank} onChange={e => set({ bank: e.target.value })} />
          </Field>
          <Field id="ba-holder" label={t('bankAccounts.field.holder')} required>
            <SelectInput id="ba-holder" value={form.holder} onChange={e => set({ holder: e.target.value as 'sci' | 'pfo', cadence: e.target.value === 'pfo' ? 'daily' : 'monthly' })}>
              <option value="sci">{t('bankAccounts.holder.sci')}</option>
              <option value="pfo">{t('bankAccounts.holder.pfo')}</option>
            </SelectInput>
          </Field>
          <Field id="ba-holderName" label={t('bankAccounts.field.holderName')} required error={errors.holderName}>
            <TextInput id="ba-holderName" value={form.holderName} invalid={!!errors.holderName} onChange={e => set({ holderName: e.target.value })} />
          </Field>
          <Field id="ba-asset" label={t('bankAccounts.field.asset')} required={form.holder === 'sci'} error={errors.assetName}>
            <SelectInput id="ba-asset" value={form.assetName} invalid={!!errors.assetName} disabled={form.holder === 'pfo'} onChange={e => set({ assetName: e.target.value })}>
              <option value="">{t('bankAccounts.field.asset.placeholder')}</option>
              {assets.map(asset => (
                <option key={asset.id} value={asset.name}>
                  {asset.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field id="ba-digits" label={t('bankAccounts.field.accountLabel')} required error={errors.lastDigits}>
            <TextInput id="ba-digits" inputMode="numeric" maxLength={4} value={form.lastDigits} invalid={!!errors.lastDigits} onChange={e => set({ lastDigits: e.target.value })} />
          </Field>
          <Field id="ba-cadence" label={t('bankAccounts.field.cadence')} required>
            <SelectInput id="ba-cadence" value={form.cadence} onChange={e => set({ cadence: e.target.value as StatementCadence })}>
              <option value="monthly">{t('bankAccounts.cadence.monthly')}</option>
              <option value="daily">{t('bankAccounts.cadence.daily')}</option>
            </SelectInput>
          </Field>
        </div>
      </Card>
    </FormPage>
  );
}
