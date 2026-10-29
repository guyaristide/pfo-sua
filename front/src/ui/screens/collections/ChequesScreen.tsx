import { useState } from 'react';
import type { BankDeposit, ChequeRejectReason, ChequeRow } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { chequeStatus, depositStatus, type ChequeStatusKey } from '@/shared/status';
import { t } from '@/i18n/t';
import { Badge, Button, Card, EmptyState, Field, FormPage, ListBody, PageHeader, RecordLink, RelatedList, SelectInput, TextInput, issuesFrom, type Column, type MenuAction } from '@/ui/primitives';

type Filter = ChequeStatusKey | 'all';

interface ChequesScreenProps {
  cheques: ChequeRow[];
  deposits: BankDeposit[];
  fmt: Formatters;
  canRecord: boolean;
  onRecord: () => void;
  onPrepareDeposit: () => void;
  onOpenDeposit: (depositId: string) => void;
  onOpenCheque: (chequeId: string) => void;
  onReject: (id: string) => void;
  onOpenTenant: (tenantId: string) => void;
  onBack: () => void;
}

export function ChequesScreen({ cheques, deposits, fmt, canRecord, onRecord, onPrepareDeposit, onOpenDeposit, onOpenCheque, onReject, onOpenTenant, onBack }: ChequesScreenProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const scoped = filter === 'all' ? cheques : cheques.filter(c => c.status === filter);
  const toDeposit = cheques.filter(c => c.status === 'to-deposit');
  const totalOf = (rows: ChequeRow[]) => rows.reduce((sum, c) => sum + c.amount, 0);
  const columns: Column<ChequeRow>[] = [
    {
      key: 'cheque',
      header: t('cheques.col.cheque'),
      sortValue: row => row.chequeNumber,
      render: row => (
        <div>
          <RecordLink onClick={() => onOpenCheque(row.id)}>{row.chequeNumber}</RecordLink>
          <div className="table__secondary">
            {row.bank} · {row.note}
          </div>
        </div>
      ),
    },
    {
      key: 'tenant',
      header: t('cheques.col.tenant'),
      sortValue: row => row.tenantName,
      render: row => (
        <div>
          <div>{row.tenantName}</div>
          <div className="table__secondary">{row.assetName}</div>
        </div>
      ),
    },
    { key: 'amount', header: t('cheques.col.amount'), numeric: true, render: row => fmt.moneyPlain(row.amount), sortValue: row => row.amount },
    { key: 'received', header: t('cheques.col.received'), render: row => fmt.shortDate(row.receivedOn), sortValue: row => row.receivedOn },
    { key: 'deposited', header: t('cheques.col.deposited'), render: row => (row.depositedOn ? fmt.shortDate(row.depositedOn) : ''), sortValue: row => row.depositedOn },
    { key: 'status', header: t('cheques.col.status'), render: row => <Badge tone={chequeStatus[row.status].tone}>{t(chequeStatus[row.status].labelKey)}</Badge> },
  ];
  const rowActions = (row: ChequeRow): MenuAction[] => {
    const actions: MenuAction[] = [{ label: t('cheques.action.open'), onSelect: () => onOpenCheque(row.id) }, { label: t('cheques.action.openTenant'), onSelect: () => onOpenTenant(row.tenantId) }];
    if (canRecord && (row.status === 'deposited' || row.status === 'late' || row.status === 'to-deposit')) actions.push({ label: t('cheques.action.reject'), onSelect: () => onReject(row.id), danger: true });
    return actions;
  };
  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: t('cheques.filter.all'), count: cheques.length },
    ...(Object.keys(chequeStatus) as ChequeStatusKey[]).map(key => ({ key, label: t(chequeStatus[key].labelKey), count: cheques.filter(c => c.status === key).length })),
  ];
  return (
    <>
      <PageHeader
        object="cheque"
        breadcrumbs={[{ label: t('nav.collections'), onClick: onBack }]}
        eyebrow={t('cheques.subtitle')}
        title={t('cheques.title')}
        actions={
          canRecord ? (
            <>
              {toDeposit.length > 0 ? (
                <Button variant="neutral" iconLeading="print" onClick={onPrepareDeposit}>
                  {t('cheques.action.deposit', { count: toDeposit.length })}
                </Button>
              ) : null}
              <Button variant="brand" iconLeading="plus" onClick={onRecord}>
                {t('collections.action.recordCheque')}
              </Button>
            </>
          ) : null
        }
      />
      <Card flush>
        <ListBody
          rows={scoped}
          haystack={row => [row.chequeNumber, row.tenantName, row.bank]}
          columns={columns}
          rowKey={row => row.id}
          caption={t('cheques.title')}
          rowActions={rowActions}
          highlight={row => row.status === 'late' || row.status === 'rejected'}
          filters={{ options: filters, value: filter, onChange: setFilter, label: t('cheques.col.status') }}
          extra={rows => fmt.moneyPlain(totalOf(rows))}
          footer={rows => [t('cheques.total', { count: rows.length }), '', fmt.moneyPlain(totalOf(rows)), '', '', '']}
          empty={<EmptyState icon="payments" title={t('cheques.empty')} action={canRecord ? <Button variant="neutral" onClick={onRecord}>{t('collections.action.recordCheque')}</Button> : null} />}
        />
      </Card>
      <RelatedList
        title={t('deposits.title')}
        meta={t('deposits.body')}
        max={5}
        items={deposits.map(deposit => ({
          id: deposit.id,
          label: t('deposits.row', { date: fmt.shortDate(deposit.depositedOn ?? deposit.plannedOn), count: deposit.cheques.length, amount: fmt.moneyPlain(deposit.total) }),
          meta: [deposit.accountLabel, deposit.reference, deposit.status === 'deposited' ? t('deposit.done.credit', { date: fmt.shortDate(deposit.creditExpectedBy) }) : null].filter(Boolean).join(' · '),
          onOpen: () => onOpenDeposit(deposit.id),
          aside: <Badge tone={depositStatus[deposit.status].tone}>{t(depositStatus[deposit.status].labelKey)}</Badge>,
        }))}
        empty={{ title: t('deposits.empty'), action: canRecord && toDeposit.length > 0 ? <Button variant="neutral" onClick={onPrepareDeposit}>{t('cheques.action.deposit', { count: toDeposit.length })}</Button> : undefined }}
      />
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
      object="cheque"
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
      saveVariant="destructive"
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
