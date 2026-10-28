import { useState } from 'react';
import type { ChequeRejectReason, ChequeRow } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { chequeStatus, type ChequeStatusKey } from '@/shared/status';
import { t } from '@/i18n/t';
import { ActionMenu, Badge, Button, Card, DataTable, EmptyState, Field, FilterPills, FormPage, ListStatus, PageHeader, SelectInput, ShowMore, TextInput, issuesFrom, useListFilter, type Column, type MenuAction } from '@/ui/primitives';

type Filter = ChequeStatusKey | 'all';

interface ChequesScreenProps {
  cheques: ChequeRow[];
  fmt: Formatters;
  canRecord: boolean;
  onRecord: () => void;
  onDeposit: (ids: string[]) => void;
  depositing: boolean;
  onReject: (id: string) => void;
  onOpenTenant: (tenantId: string) => void;
  onBack: () => void;
}

export function ChequesScreen({ cheques, fmt, canRecord, onRecord, onDeposit, depositing, onReject, onOpenTenant, onBack }: ChequesScreenProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const scoped = filter === 'all' ? cheques : cheques.filter(c => c.status === filter);
  const list = useListFilter(scoped, row => [row.chequeNumber, row.tenantName, row.bank]);
  const toDeposit = cheques.filter(c => c.status === 'to-deposit');
  const total = list.filtered.reduce((sum, c) => sum + c.amount, 0);
  const columns: Column<ChequeRow>[] = [
    {
      key: 'cheque',
      header: t('cheques.col.cheque'),
      render: row => (
        <div>
          <div className="table__primary">{row.chequeNumber}</div>
          <div className="table__secondary">
            {row.bank} · {row.note}
          </div>
        </div>
      ),
    },
    {
      key: 'tenant',
      header: t('cheques.col.tenant'),
      render: row => (
        <div>
          <div>{row.tenantName}</div>
          <div className="table__secondary">{row.assetName}</div>
        </div>
      ),
    },
    { key: 'amount', header: t('cheques.col.amount'), numeric: true, render: row => fmt.moneyPlain(row.amount) },
    { key: 'received', header: t('cheques.col.received'), render: row => fmt.shortDate(row.receivedOn) },
    { key: 'deposited', header: t('cheques.col.deposited'), render: row => (row.depositedOn ? fmt.shortDate(row.depositedOn) : '') },
    { key: 'status', header: t('cheques.col.status'), render: row => <Badge tone={chequeStatus[row.status].tone}>{t(chequeStatus[row.status].labelKey)}</Badge> },
    {
      key: 'actions',
      header: '',
      render: row => {
        const actions: MenuAction[] = [{ label: t('cheques.action.openTenant'), onSelect: () => onOpenTenant(row.tenantId) }];
        if (canRecord && (row.status === 'deposited' || row.status === 'late' || row.status === 'to-deposit')) {
          actions.push({ label: t('cheques.action.reject'), onSelect: () => onReject(row.id), danger: true });
        }
        return (
          <div className="table__actions">
            <ActionMenu label={t('menu.rowActions')} actions={actions} />
          </div>
        );
      },
    },
  ];
  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: t('cheques.filter.all') },
    ...(Object.keys(chequeStatus) as ChequeStatusKey[]).map(key => ({ key, label: `${t(chequeStatus[key].labelKey)} (${cheques.filter(c => c.status === key).length})` })),
  ];
  return (
    <>
      <PageHeader
        object="collection"
        breadcrumbs={[{ label: t('nav.collections'), onClick: onBack }]}
        eyebrow={t('cheques.subtitle')}
        title={t('cheques.title')}
        actions={
          canRecord ? (
            <>
              <Button variant="neutral" iconLeading="print" disabled={depositing || toDeposit.length === 0} onClick={() => onDeposit(toDeposit.map(c => c.id))}>
                {t('cheques.action.deposit', { count: toDeposit.length })}
              </Button>
              <Button variant="brand" iconLeading="plus" onClick={onRecord}>
                {t('collections.action.recordCheque')}
              </Button>
            </>
          ) : null
        }
      />
      <Card flush>
        <ListStatus count={list.filtered.length} extra={fmt.moneyPlain(total)} search={list.search} onSearch={list.setSearch} filters={<FilterPills options={filters} value={filter} onChange={setFilter} label={t('cheques.col.status')} />} />
        {list.filtered.length === 0 ? (
          <EmptyState icon="payments" title={t('cheques.empty')} />
        ) : (
          <DataTable caption={t('cheques.title')} columns={columns} rows={list.visible} rowKey={row => row.id} footer={[t('cheques.total', { count: list.filtered.length }), '', fmt.moneyPlain(total), '', '', '', '']} />
        )}
        <ShowMore hidden={list.hidden} onClick={list.showMore} />
      </Card>
    </>
  );
}

export interface RejectForm {
  reason: ChequeRejectReason;
  note: string;
}

const reasons: ChequeRejectReason[] = ['insufficient-funds', 'signature', 'amount', 'expired', 'other'];

interface RejectChequeScreenProps {
  cheque: ChequeRow;
  fmt: Formatters;
  form: RejectForm;
  onChange: (form: RejectForm) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | undefined;
  onCancel: () => void;
  onBack: () => void;
}

export function RejectChequeScreen({ cheque, fmt, form, onChange, onSubmit, submitting, submitError, onCancel, onBack }: RejectChequeScreenProps) {
  const errors = form.reason === 'other' && !form.note.trim() ? { note: t('form.required') } : {};
  return (
    <FormPage
      object="collection"
      breadcrumbs={[{ label: t('nav.collections'), onClick: onBack }, { label: t('cheques.title'), onClick: onCancel }]}
      eyebrow={t('cheques.reject.body', { tenant: cheque.tenantName, amount: fmt.money(cheque.amount) })}
      title={t('cheques.reject.title', { number: cheque.chequeNumber })}
      errorCount={Object.keys(errors).length}
      issues={issuesFrom(errors, () => 'rej-note', () => t('cheques.reject.note'))}
      submitError={submitError}
      submitting={submitting}
      onCancel={onCancel}
      onSubmit={onSubmit}
      saveLabel={t('cheques.reject.action')}
    >
      <Card meta={t('cheques.reject.effect')}>
        <div className="form-grid">
          <Field id="rej-reason" label={t('cheques.reject.reason')} required>
            <SelectInput id="rej-reason" value={form.reason} onChange={e => onChange({ ...form, reason: e.target.value as ChequeRejectReason })}>
              {reasons.map(reason => (
                <option key={reason} value={reason}>
                  {t(`cheques.reason.${reason}`)}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field id="rej-note" label={t('cheques.reject.note')} required={form.reason === 'other'} error={errors.note}>
            <TextInput id="rej-note" value={form.note} invalid={!!errors.note} onChange={e => onChange({ ...form, note: e.target.value })} />
          </Field>
        </div>
      </Card>
    </FormPage>
  );
}
