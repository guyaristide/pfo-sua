import type { BillingItem, BillingItemInput, BillingItemValue, BillingPeriodicity } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import type { MessageKey } from '@/i18n/fr';
import { t } from '@/i18n/t';
import { Badge, Button, Card, CheckboxField, DataTable, EmptyState, Field, FormPage, ListStatus, PageHeader, SelectInput, ShowMore, TextInput, useListFilter, type Column , issuesFrom } from '@/ui/primitives';
import { settingsCrumbs, settingsRootCrumb, type SettingsNavigation } from './crumbs';
import { scopeLabel } from './UsersScreen';
import { VersionFields, VersionHistory, sinceLabel, todayIso, validateVersionFields, type VersionFieldsValue } from './versions';

export const periodicityKey: Record<BillingPeriodicity, MessageKey> = {
  quarterly: 'billingItems.periodicity.quarterly',
  monthly: 'billingItems.periodicity.monthly',
  once: 'billingItems.periodicity.once',
};

interface BillingItemsScreenProps {
  items: BillingItem[];
  fmt: Formatters;
  isAdmin: boolean;
  onNew: () => void;
  onEdit: (id: string) => void;
  onOpenSettings: () => void;
}

const yesNo = (value: boolean) => (value ? t('settings.yes') : t('settings.no'));

export function BillingItemsScreen({ items, fmt, isAdmin, onNew, onEdit, onOpenSettings }: BillingItemsScreenProps) {
  const list = useListFilter(items, item => [item.code, item.label]);
  const columns: Column<BillingItem>[] = [
    {
      key: 'item',
      header: t('billingItems.col.item'),
      render: item => (
        <div>
          <div className="table__primary">{item.label}</div>
          <div className="table__secondary">
            {item.code} · {sinceLabel(item.current, fmt)}
          </div>
        </div>
      ),
    },
    { key: 'report', header: t('billingItems.col.report'), render: item => <Badge tone={item.current.value.inReport ? 'success' : 'neutral'}>{item.current.value.inReport ? t('billingItems.inReport') : t('billingItems.outOfReport')}</Badge> },
    { key: 'feeBase', header: t('billingItems.col.feeBase'), render: item => yesNo(item.current.value.inFeeBase) },
    { key: 'vat', header: t('billingItems.col.vat'), render: item => yesNo(item.current.value.vatApplicable) },
    { key: 'periodicity', header: t('billingItems.col.periodicity'), render: item => t(periodicityKey[item.current.value.periodicity]) },
    { key: 'scope', header: t('billingItems.col.scope'), render: item => scopeLabel(item.assetScope) },
    {
      key: 'actions',
      header: '',
      render: item =>
        isAdmin ? (
          <div className="table__actions">
            <Button variant="neutral" onClick={() => onEdit(item.id)}>
              {t('settings.action.edit')}
            </Button>
          </div>
        ) : null,
    },
  ];
  return (
    <>
      <PageHeader
        object="settings"
        breadcrumbs={settingsRootCrumb(onOpenSettings)}
        eyebrow={t('billingItems.subtitle')}
        title={t('billingItems.title')}
        actions={
          isAdmin ? (
            <Button variant="brand" iconLeading="plus" onClick={onNew}>
              {t('billingItems.action.new')}
            </Button>
          ) : null
        }
      />
      <Card flush>
        <ListStatus count={list.filtered.length} search={list.search} onSearch={list.setSearch} />
        {list.filtered.length === 0 ? (
          <EmptyState icon="tag" title={t('billingItems.empty.title')} body={t('billingItems.empty.body')} />
        ) : (
          <DataTable caption={t('billingItems.title')} columns={columns} rows={list.visible} rowKey={item => item.id} footer={[t('billingItems.total', { count: list.filtered.length }), '', '', '', '', '', '']} />
        )}
        <ShowMore hidden={list.hidden} onClick={list.showMore} />
      </Card>
    </>
  );
}

export interface BillingItemForm extends VersionFieldsValue {
  code: string;
  label: string;
  periodicity: BillingPeriodicity;
  inReport: boolean;
  inFeeBase: boolean;
  vatApplicable: boolean;
}

export function emptyBillingItemForm(): BillingItemForm {
  return { code: '', label: '', periodicity: 'quarterly', inReport: true, inFeeBase: false, vatApplicable: true, effectiveFrom: todayIso(), note: '' };
}

export function billingItemToForm(item: BillingItem): BillingItemForm {
  return { code: item.code, label: item.label, ...item.current.value, effectiveFrom: todayIso(), note: '' };
}

export function describeBillingItem(value: BillingItemValue): string {
  return [
    value.inReport ? t('billingItems.inReport') : t('billingItems.outOfReport'),
    `${t('billingItems.col.feeBase')} : ${value.inFeeBase ? t('settings.yes') : t('settings.no')}`,
    `${t('billingItems.col.vat')} : ${value.vatApplicable ? t('settings.yes') : t('settings.no')}`,
    t(periodicityKey[value.periodicity]),
  ].join(' · ');
}

export function validateBillingItem(form: BillingItemForm): Partial<Record<keyof BillingItemForm, string>> {
  const errors: Partial<Record<keyof BillingItemForm, string>> = { ...validateVersionFields(form) };
  if (!form.code.trim()) errors.code = t('form.required');
  else if (!/^[A-Z]{3,5}$/.test(form.code.trim())) errors.code = t('billingItems.field.code.invalid');
  if (!form.label.trim()) errors.label = t('form.required');
  return errors;
}

export function toBillingItemInput(form: BillingItemForm): BillingItemInput {
  return {
    code: form.code.trim(),
    label: form.label.trim(),
    value: { periodicity: form.periodicity, inReport: form.inReport, inFeeBase: form.inFeeBase, vatApplicable: form.vatApplicable },
    effectiveFrom: form.effectiveFrom,
    note: form.note.trim() || null,
  };
}

interface BillingItemFormScreenProps extends SettingsNavigation {
  /** L'élément modifié, pour son historique ; absent à la création. */
  item: BillingItem | null;
  fmt: Formatters;
  form: BillingItemForm;
  onChange: (form: BillingItemForm) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | undefined;
}

export function BillingItemFormScreen({ item, fmt, form, onChange, onSubmit, submitting, submitError, onOpenSettings, onOpenSection }: BillingItemFormScreenProps) {
  const editing = item !== null;
  const errors = validateBillingItem(form);
  const set = (changes: Partial<BillingItemForm>) => onChange({ ...form, ...changes });
  return (
    <FormPage
      object="settings"
      breadcrumbs={settingsCrumbs({ onOpenSettings, onOpenSection }, t('billingItems.title'))}
      title={editing ? t('billingItems.form.editTitle') : t('billingItems.form.newTitle')}
      errorCount={Object.keys(errors).length}
      issues={issuesFrom(errors, key => (key === 'effectiveFrom' ? 'version-effectiveFrom' : `bi-${key}`), key => t(key === 'effectiveFrom' ? 'version.effectiveFrom' : key === 'code' ? 'billingItems.field.code' : 'billingItems.field.label'))}
      submitError={submitError}
      submitting={submitting}
      onCancel={onOpenSection}
      onSubmit={onSubmit}
    >
      <Card>
        <div className="form-grid">
          <Field id="bi-code" label={t('billingItems.field.code')} required error={errors.code} help={t('billingItems.field.code.help')}>
            <TextInput id="bi-code" value={form.code} invalid={!!errors.code} maxLength={5} onChange={e => set({ code: e.target.value.toUpperCase() })} />
          </Field>
          <Field id="bi-label" label={t('billingItems.field.label')} required error={errors.label}>
            <TextInput id="bi-label" value={form.label} invalid={!!errors.label} onChange={e => set({ label: e.target.value })} />
          </Field>
          <Field id="bi-periodicity" label={t('billingItems.field.periodicity')} required>
            <SelectInput id="bi-periodicity" value={form.periodicity} onChange={e => set({ periodicity: e.target.value as BillingPeriodicity })}>
              {(Object.keys(periodicityKey) as BillingPeriodicity[]).map(key => (
                <option key={key} value={key}>
                  {t(periodicityKey[key])}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </Card>
      <Card>
        <div className="checkbox-group">
          <CheckboxField id="bi-inReport" label={t('billingItems.field.inReport')} checked={form.inReport} onChange={inReport => set({ inReport })} />
          <CheckboxField id="bi-inFeeBase" label={t('billingItems.field.inFeeBase')} checked={form.inFeeBase} onChange={inFeeBase => set({ inFeeBase })} />
          <CheckboxField id="bi-vat" label={t('billingItems.field.vat')} checked={form.vatApplicable} onChange={vatApplicable => set({ vatApplicable })} />
        </div>
      </Card>
      <VersionFields value={form} error={errors.effectiveFrom} onChange={value => set(value)} />
      {item ? <VersionHistory versions={item.versions} current={item.current} describe={describeBillingItem} fmt={fmt} /> : null}
    </FormPage>
  );
}
