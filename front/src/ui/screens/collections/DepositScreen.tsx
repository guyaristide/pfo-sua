import { useState } from 'react';
import type { BankDeposit, ChequeRow, DepositSlip } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { depositSlipStatus } from '@/shared/status';
import { t } from '@/i18n/t';
import { Badge, Band, Button, Card, ConfirmDialog, DataTable, EmptyState, FileButton, ListBody, WizardPage, type Column, type PathStep } from '@/ui/primitives';

export type DepositStep = 'choose' | 'slips' | 'done';

const steps = (): PathStep<DepositStep>[] => [
  { key: 'choose', label: t('deposit.step.choose') },
  { key: 'slips', label: t('deposit.step.slips') },
  { key: 'done', label: t('deposit.step.done') },
];

interface ChooseChequesScreenProps {
  cheques: ChequeRow[];
  fmt: Formatters;
  selected: string[];
  onSelected: (ids: string[]) => void;
  onPrepare: () => void;
  preparing: boolean;
  prepareError: string | undefined;
  onBack: () => void;
}

/** E2.7, étape 1 : choisir les chèques dans la liste (sélection de masse), préparer la remise et imprimer la liste. */
export function ChooseChequesScreen({ cheques, fmt, selected, onSelected, onPrepare, preparing, prepareError, onBack }: ChooseChequesScreenProps) {
  const [confirming, setConfirming] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const toDeposit = cheques.filter(c => c.status === 'to-deposit');
  const chosen = toDeposit.filter(c => selected.includes(c.id));
  const total = chosen.reduce((sum, c) => sum + c.amount, 0);
  const assets = new Set(chosen.map(c => c.assetName));
  const problem = chosen.length === 0 ? t('deposit.choose.none') : assets.size > 1 ? t('deposit.choose.oneAsset') : null;
  const columns: Column<ChequeRow>[] = [
    { key: 'tenant', header: t('cheques.col.tenant'), render: c => <span className="table__strong">{c.tenantName}</span>, sortValue: c => c.tenantName },
    { key: 'cheque', header: t('cheques.col.cheque'), render: c => `${c.chequeNumber} · ${c.bank}` },
    { key: 'asset', header: t('cheques.col.asset'), render: c => c.assetName, sortValue: c => c.assetName },
    { key: 'received', header: t('cheques.col.received'), render: c => fmt.shortDate(c.receivedOn), sortValue: c => c.receivedOn },
    { key: 'amount', header: t('cheques.col.amount'), numeric: true, render: c => fmt.moneyPlain(c.amount), sortValue: c => c.amount },
  ];
  const prepare = () => {
    if (problem) setAttempted(true);
    else setConfirming(true);
  };
  return (
    <WizardPage
      object="cheque"
      breadcrumbs={[{ label: t('nav.collections'), onClick: onBack }, { label: t('cheques.title'), onClick: onBack }]}
      eyebrow={t('deposit.subtitle')}
      title={t('deposit.title')}
      steps={steps()}
      current="choose"
      pathLabel={t('deposit.pathLabel')}
      attempted
      footer={{
        status: prepareError ?? (attempted && problem ? problem : chosen.length > 0 ? t('deposit.choose.total', { count: chosen.length, amount: fmt.money(total) }) : t('deposit.choose.none')),
        tone: prepareError ? 'danger' : attempted && problem ? 'warning' : 'neutral',
        actions: (
          <>
            <Button variant="neutral" onClick={onBack}>
              {t('dialog.cancel')}
            </Button>
            <Button variant="brand" iconLeading="print" disabled={preparing} onClick={prepare}>
              {t('deposit.action.prepare')}
            </Button>
          </>
        ),
      }}
    >
      <Card title={t('deposit.choose.title')} meta={t('deposit.choose.body')} flush>
        {toDeposit.length === 0 ? (
          <EmptyState icon="payments" title={t('deposit.choose.empty')} action={<Button variant="neutral" onClick={onBack}>{t('cheques.title')}</Button>} />
        ) : (
          <DataTable caption={t('deposit.choose.title')} columns={columns} rows={toDeposit} rowKey={c => c.id} selection={{ selected, onChange: onSelected }} footer={[t('list.selected', { count: chosen.length }), '', '', '', fmt.moneyPlain(total)]} />
        )}
      </Card>
      <ConfirmDialog
        open={confirming}
        title={t('deposit.confirm.title', { count: chosen.length })}
        confirmLabel={t('deposit.action.prepare')}
        busy={preparing}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          onPrepare();
        }}
      >
        <p>{t('deposit.confirm.body', { amount: fmt.money(total), asset: chosen[0]?.assetName ?? '' })}</p>
      </ConfirmDialog>
    </WizardPage>
  );
}

interface DepositSlipsScreenProps {
  deposit: BankDeposit;
  fmt: Formatters;
  slips: Record<string, DepositSlip>;
  onSlips: (slips: Record<string, DepositSlip>) => void;
  onComplete: () => void;
  completing: boolean;
  completeError: string | undefined;
  onFinish: () => void;
  onBack: () => void;
}

/** E2.7, étape 2 : au retour du coursier, un bordereau par chèque ; puis la confirmation. */
export function DepositSlipsScreen({ deposit, fmt, slips, onSlips, onComplete, completing, completeError, onFinish, onBack }: DepositSlipsScreenProps) {
  const [confirming, setConfirming] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const done = deposit.status === 'deposited';
  const current = done ? deposit.slips : slips;
  const treated = deposit.cheques.filter(c => current[c.id]).length;
  const received = deposit.cheques.filter(c => current[c.id]?.kind === 'received').length;
  const missing = treated - received;
  const set = (id: string, slip: DepositSlip | null) => {
    const next = { ...slips };
    if (slip) next[id] = slip;
    else delete next[id];
    onSlips(next);
  };
  const slipKey = (c: ChequeRow) => (current[c.id]?.kind ?? 'pending') as keyof typeof depositSlipStatus;
  const columns: Column<ChequeRow>[] = [
    { key: 'tenant', header: t('cheques.col.tenant'), render: c => <span className="table__strong">{c.tenantName}</span> },
    { key: 'cheque', header: t('cheques.col.cheque'), render: c => t('deposit.cheque.line', { number: c.chequeNumber, bank: c.bank, date: fmt.shortDate(c.receivedOn), asset: c.assetName }) },
    { key: 'amount', header: t('cheques.col.amount'), numeric: true, render: c => fmt.moneyPlain(c.amount) },
    {
      key: 'slip',
      header: t('deposit.col.slip'),
      render: c => {
        const slip = current[c.id];
        return (
          <div>
            <Badge tone={depositSlipStatus[slipKey(c)].tone}>{t(depositSlipStatus[slipKey(c)].labelKey)}</Badge>
            {slip?.kind === 'received' ? <div className="table__secondary">{slip.name}</div> : null}
          </div>
        );
      },
    },
    ...(done
      ? []
      : [
          {
            key: 'action',
            header: t('deposit.col.action'),
            render: (c: ChequeRow) =>
              current[c.id] ? null : <FileButton variant="neutral" accept="application/pdf,image/*" label={t('deposit.action.slip')} onFile={file => set(c.id, { kind: 'received', name: file.name })} />,
          },
        ]),
  ];
  const validate = () => {
    if (treated < deposit.cheques.length) setAttempted(true);
    else setConfirming(true);
  };
  const title = done ? t('deposit.done.title', { date: fmt.shortDate(deposit.depositedOn ?? deposit.plannedOn), count: deposit.cheques.length }) : t('deposit.slips.title', { date: fmt.shortDate(deposit.plannedOn), account: deposit.accountLabel });
  return (
    <WizardPage
      object="cheque"
      breadcrumbs={[{ label: t('nav.collections'), onClick: onBack }, { label: t('cheques.title'), onClick: onBack }]}
      eyebrow={t('deposit.subtitle')}
      title={t('deposit.title')}
      steps={steps()}
      current={done ? 'done' : 'slips'}
      pathLabel={t('deposit.pathLabel')}
      attempted
      footer={{
        status: completeError ?? (done ? t('deposit.done.credit', { date: fmt.shortDate(deposit.creditExpectedBy) }) : attempted && treated < deposit.cheques.length ? t('deposit.slips.missingSome', { count: deposit.cheques.length - treated }) : t('deposit.slips.progress', { treated, total: deposit.cheques.length })),
        tone: completeError ? 'danger' : done ? 'success' : attempted && treated < deposit.cheques.length ? 'warning' : 'neutral',
        actions: done ? (
          <Button variant="brand" onClick={onFinish}>
            {t('deposit.action.finish')}
          </Button>
        ) : (
          <>
            <Button variant="neutral" onClick={onBack}>
              {t('deposit.action.later')}
            </Button>
            <Button variant="brand" disabled={completing} onClick={validate}>
              {t('deposit.action.validateDeposit')}
            </Button>
          </>
        ),
      }}
    >
      <Band eyebrow={done ? t('deposit.status.deposited') : t('deposit.status.atCourier')} title={title} body={done ? t('deposit.done.body', { amount: fmt.money(deposit.total), reference: deposit.reference ?? '', missing }) : t('deposit.slips.body', { amount: fmt.money(deposit.total) })} />
      <Card title={t('deposit.slips.list')} meta={done ? t('deposit.slips.summary', { received, missing }) : t('deposit.slips.rule')} flush>
        <ListBody
          rows={deposit.cheques}
          haystack={c => [c.tenantName, c.chequeNumber, c.bank]}
          columns={columns}
          rowKey={c => c.id}
          caption={t('deposit.slips.list')}
          rowActions={done ? undefined : c => (current[c.id] ? [{ label: t('deposit.action.removeSlip'), onSelect: () => set(c.id, null) }] : [{ label: t('deposit.action.missing'), onSelect: () => set(c.id, { kind: 'missing' }) }])}
          empty={<EmptyState icon="payments" title={t('deposit.choose.empty')} />}
        />
      </Card>
      <ConfirmDialog
        open={confirming}
        title={t('deposit.validate.title')}
        confirmLabel={t('deposit.action.validateDeposit')}
        busy={completing}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          onComplete();
        }}
      >
        <p>{t('deposit.validate.body', { count: deposit.cheques.length, amount: fmt.money(deposit.total), received, missing })}</p>
      </ConfirmDialog>
    </WizardPage>
  );
}
