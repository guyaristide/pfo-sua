import { useState } from 'react';
import type { ExclusionReason, ReconciliationLine, StatementTenant } from '@/services/contracts';
import type { MessageKey } from '@/i18n/fr';
import type { Formatters } from '@/shared/format/formatters';
import { t } from '@/i18n/t';
import { ActionMenu, Badge, Button, DataTable, DetailPanel, DetailSection, Field, FileButton, FormAttemptContext, Inline, Lookup, Notice, NumberInput, SelectInput, TextInput, type Column, type MenuAction } from '@/ui/primitives';
import { balanceOf, effectiveState, emptyWork, imputeBlock, isEditable, needsNote, proofOf, qualificationOf, qualificationValid, rowsOf, tenantIdOf, type AllocationRow, type ExtraKind, type LineWork } from './work';

interface LinePanelProps {
  line: ReconciliationLine;
  work: LineWork;
  tenants: StatementTenant[];
  fmt: Formatters;
  onWork: (work: LineWork) => void;
  onClose: () => void;
}

const REASONS: ExclusionReason[] = ['tenant', 'internal-transfer', 'off-asset', 'bank-fees', 'refund', 'ignore', 'other'];
const reasonKey: Record<ExclusionReason, MessageKey> = {
  tenant: 'reconcile.reason.tenant',
  'internal-transfer': 'reconcile.reason.internalTransfer',
  'off-asset': 'reconcile.reason.offAsset',
  'bank-fees': 'reconcile.reason.bankFees',
  refund: 'reconcile.reason.refund',
  ignore: 'reconcile.reason.ignore',
  other: 'reconcile.reason.other',
};
const extraKey: Record<ExtraKind, MessageKey> = { advance: 'reconcile.add.advance', deposit: 'reconcile.add.deposit', penalties: 'reconcile.add.penalties' };
const digits = (value: string) => Number.parseInt(value.replace(/\D/g, ''), 10) || 0;

/** Le panneau d'une ligne (E2.3, E2.4) : locataire, ventilation, preuve, imputation ou qualification. */
export function LinePanel({ line, work, tenants, fmt, onWork, onClose }: LinePanelProps) {
  const state = effectiveState(line, work);
  const editable = isEditable(line, work);
  const tenantId = tenantIdOf(line, work);
  const tenant = tenants.find(tn => tn.id === tenantId) ?? null;
  const rows = rowsOf(line, work, tenants);
  const balance = balanceOf(line, rows, work);
  const block = imputeBlock(line, work, tenants);
  const proof = proofOf(line, work);
  const [addingTenant, setAddingTenant] = useState(false);
  const patch = (changes: Partial<LineWork>) => onWork({ ...work, ...changes });
  const materialized = () => Object.fromEntries(rows.map(row => [row.id, row.amount]));
  const setAmount = (id: string, value: string) => patch({ amounts: { ...materialized(), [id]: digits(value) } });
  const addExtra = (kind: ExtraKind) => {
    if (!tenantId) return;
    patch({ extras: [...work.extras, { id: `${tenantId}:${kind}`, kind, tenantId }], amounts: materialized() });
  };
  const removeExtra = (id: string) => {
    const amounts = materialized();
    delete amounts[id];
    patch({ extras: work.extras.filter(extra => extra.id !== id), amounts });
  };
  const addActions: MenuAction[] = [
    { label: t('reconcile.add.otherTenant'), onSelect: () => setAddingTenant(true) },
    ...(Object.keys(extraKey) as ExtraKind[]).filter(kind => !work.extras.some(extra => extra.kind === kind && extra.tenantId === tenantId)).map(kind => ({ label: t(extraKey[kind]), onSelect: () => addExtra(kind) })),
    ...(balance.remaining > 0 && !work.offAccount ? [{ label: t('reconcile.add.offAccount'), onSelect: () => patch({ offAccount: { amount: balance.remaining, reason: '' } }) }] : []),
  ];
  const tenantOptions = (exclude: string[]) => tenants.filter(tn => !exclude.includes(tn.id)).map(tn => ({ id: tn.id, label: tn.name, meta: t('reconcile.lot', { lot: tn.lotCode }), icon: 'user' as const }));
  const exclude = () => patch({ decision: 'exclude', qualification: null });
  const undo = () => patch({ decision: null, qualification: null });

  const footer = (
    <>
      {state === 'matched' ? <Badge tone="success">{t('reconcile.panel.imputed')}</Badge> : null}
      {state === 'matched' && work.decision === 'impute' ? (
        <Button variant="neutral" onClick={undo}>
          {t('reconcile.action.undoImpute')}
        </Button>
      ) : null}
      {state === 'excluded' && work.decision === 'exclude' ? (
        <Button variant="neutral" onClick={undo}>
          {t('reconcile.action.undoExclude')}
        </Button>
      ) : null}
      {editable ? (
        <>
          {work.correcting ? (
            <Button variant="neutral" onClick={() => onWork(emptyWork)}>
              {t('reconcile.action.cancel')}
            </Button>
          ) : line.internal ? null : (
            <Button variant="neutral" onClick={exclude}>
              {t('reconcile.action.excludeLine')}
            </Button>
          )}
          <Button variant="brand" disabled={block !== null} aria-describedby={block ? `block-${line.id}` : undefined} onClick={() => patch({ decision: 'impute', amounts: materialized() })}>
            {work.correcting ? t('reconcile.action.applyCorrection') : balance.surplus > 0 ? t('reconcile.action.imputeAdvance') : t('reconcile.action.impute')}
          </Button>
          {block ? (
            <p className="detail-panel__hint" id={`block-${line.id}`}>
              {t(`reconcile.block.${block}`)}
            </p>
          ) : null}
        </>
      ) : null}
    </>
  );

  return (
    <DetailPanel label={t('reconcile.panel.label')} meta={`${fmt.shortDate(line.date)} · ${line.label}`} title={fmt.money(line.amount)} closeLabel={t('reconcile.panel.close')} onClose={onClose} footer={footer}>
      {work.correcting ? (
        <DetailSection title={t('reconcile.correct.beforeAfter')}>
          <Field id={`correct-${line.id}`} label={t('reconcile.panel.tenant')} required>
            <Lookup id={`correct-${line.id}`} options={tenantOptions([])} value={tenantId ?? ''} placeholder={t('reconcile.panel.tenant.placeholder')} onChange={id => patch({ tenantId: id, amounts: {}, others: [], extras: [], offAccount: null })} />
          </Field>
          <div className="before-after">
            <span className="before-after__before">{line.tenantName ? `${line.tenantName} · ${line.lotCode ?? ''}` : t('reconcile.proposal.none')}</span>
            <span className="before-after__after">{tenant ? `${tenant.name} · ${tenant.lotCode}` : t('reconcile.proposal.none')}</span>
          </div>
        </DetailSection>
      ) : null}

      {state === 'excluded' ? <ExcludedSection line={line} work={work} onWork={onWork} /> : null}

      {line.internal && editable ? <Notice tone="info" title={t('reconcile.panel.internal')}>{line.hint}</Notice> : null}

      {!line.internal && !tenant && editable && !work.correcting ? (
        <DetailSection title={t('reconcile.panel.tenant')}>
          <Notice tone="danger" title={t('reconcile.panel.noTenant')}>
            {line.hint}
          </Notice>
          <Field id={`tenant-${line.id}`} label={t('reconcile.panel.tenant')} required>
            <Lookup id={`tenant-${line.id}`} options={tenantOptions([])} value="" placeholder={t('reconcile.panel.tenant.placeholder')} onChange={id => patch({ tenantId: id, amounts: {}, others: [], extras: [], offAccount: null })} />
          </Field>
        </DetailSection>
      ) : null}

      {tenant && !line.internal && state !== 'excluded' ? (
        <>
          <DetailSection title={`${tenant.name} · ${t('reconcile.lot', { lot: tenant.lotCode })}`}>
            {work.tenantId && !work.correcting ? <Badge tone="info">{t('reconcile.panel.chosen')}</Badge> : line.hint ? <p className="detail-panel__hint">{line.hint}</p> : null}
          </DetailSection>

          {line.notice && editable ? (
            <Notice
              tone="info"
              title={t('reconcile.panel.notice')}
              actions={
                <Button variant="neutral" onClick={() => patch({ amounts: { ...Object.fromEntries(rows.map(row => [row.id, 0])), ...line.notice?.amounts } })}>
                  {t('reconcile.action.applyNotice')}
                </Button>
              }
            >
              {line.notice.label}
            </Notice>
          ) : null}

          <DetailSection title={t('reconcile.panel.allocation')}>
            {rows.length === 0 ? <p className="detail-panel__hint">{t('reconcile.panel.noInvoice')}</p> : <AllocationTable rows={rows} tenants={tenants} fmt={fmt} editable={editable} onAmount={setAmount} onRemove={removeExtra} />}
            {work.offAccount ? (
              <Field id={`off-${line.id}`} label={`${t('reconcile.panel.offAccount', { amount: fmt.moneyPlain(work.offAccount.amount) })} · ${t('reconcile.panel.offAccount.reason')}`} required error={editable && !work.offAccount.reason.trim() ? t('form.required') : undefined}>
                <TextInput id={`off-${line.id}`} value={work.offAccount.reason} disabled={!editable} invalid={editable && !work.offAccount.reason.trim()} placeholder={t('reconcile.panel.offAccount.placeholder')} onChange={e => patch({ offAccount: { amount: work.offAccount?.amount ?? 0, reason: e.target.value } })} />
              </Field>
            ) : null}
            <BalanceLine balance={balance} fmt={fmt} />
            {editable ? (
              <Inline gap={8}>
                <ActionMenu label={t('reconcile.action.addAllocation')} text={t('reconcile.action.addAllocation')} actions={addActions} />
                {balance.remaining > 0 && !work.offAccount ? (
                  <Button variant="base" onClick={() => patch({ offAccount: { amount: balance.remaining, reason: '' } })}>
                    {t('reconcile.action.markOffAccount')}
                  </Button>
                ) : null}
                {work.offAccount ? (
                  <Button variant="base" onClick={() => patch({ offAccount: null })}>
                    {t('reconcile.action.cancelOffAccount')}
                  </Button>
                ) : null}
              </Inline>
            ) : null}
            {addingTenant && editable ? (
              <Field id={`other-${line.id}`} label={t('reconcile.add.otherTenant')}>
                <Lookup
                  id={`other-${line.id}`}
                  options={tenantOptions([tenantId ?? '', ...work.others])}
                  value=""
                  placeholder={t('reconcile.panel.tenant.placeholder')}
                  onChange={id => {
                    patch({ others: [...work.others, id], amounts: materialized() });
                    setAddingTenant(false);
                  }}
                />
              </Field>
            ) : null}
          </DetailSection>

          <DetailSection title={t('reconcile.proof.title')}>
            <Notice tone={proof ? 'success' : 'warning'} title={proof ? proof.name : t(`reconcile.proof.hint.${line.paymentKind}`)}>
              {proof ? t('reconcile.proof.inFile') : t('reconcile.proof.required')}
            </Notice>
            {editable && line.paymentKind !== 'cheque' ? (
              <Inline gap={8}>
                {line.availableProof && !proof ? (
                  <Button variant="neutral" onClick={() => patch({ proof: line.availableProof })}>
                    {t(`reconcile.proof.use.${line.availableProof.kind}`)}
                  </Button>
                ) : null}
                <FileButton variant="base" accept="application/pdf,image/*" label={proof ? t('reconcile.proof.replace') : t('reconcile.proof.add')} onFile={file => patch({ proof: { kind: 'file', name: file.name, source: 'upload' } })} />
              </Inline>
            ) : null}
          </DetailSection>
        </>
      ) : null}
    </DetailPanel>
  );
}

interface AllocationTableProps {
  rows: AllocationRow[];
  tenants: StatementTenant[];
  fmt: Formatters;
  editable: boolean;
  onAmount: (id: string, value: string) => void;
  onRemove: (id: string) => void;
}

function AllocationTable({ rows, tenants, fmt, editable, onAmount, onRemove }: AllocationTableProps) {
  const several = new Set(rows.map(row => row.tenantId)).size > 1;
  const nameOf = (id: string) => tenants.find(tn => tn.id === id)?.name ?? id;
  const columns: Column<AllocationRow>[] = [
    {
      key: 'invoice',
      header: t('reconcile.alloc.col.invoice'),
      render: row => (
        <div>
          <div className="table__strong">{row.invoice ? row.invoice.label : t(extraKey[row.kind as ExtraKind])}</div>
          <div className="table__secondary">
            {several ? `${nameOf(row.tenantId)} · ` : ''}
            {row.invoice ? `${row.invoice.reference} · ${t(row.invoice.period === 'prior' ? 'reconcile.alloc.prior' : 'reconcile.alloc.current')}` : t('reconcile.alloc.noInvoice')}
          </div>
        </div>
      ),
    },
    { key: 'due', header: t('reconcile.alloc.col.due'), numeric: true, render: row => (row.invoice ? fmt.moneyPlain(row.invoice.due) : '') },
    {
      key: 'amount',
      header: t('reconcile.alloc.col.amount'),
      numeric: true,
      width: '140px',
      render: row => (editable ? <NumberInput id={`alloc-${row.id}`} aria-label={row.invoice?.label ?? t(extraKey[row.kind as ExtraKind])} value={String(row.amount)} onChange={e => onAmount(row.id, e.target.value)} /> : fmt.moneyPlain(row.amount)),
    },
  ];
  return (
    <DataTable
      caption={t('reconcile.panel.allocation')}
      columns={columns}
      rows={rows}
      rowKey={row => row.id}
      rowActions={editable ? row => (row.invoice ? [] : [{ label: t('reconcile.action.removeRow'), onSelect: () => onRemove(row.id), danger: true }]) : undefined}
    />
  );
}

function BalanceLine({ balance, fmt }: { balance: ReturnType<typeof balanceOf>; fmt: Formatters }) {
  if (balance.remaining < 0) return <p className="balance-line balance-line--danger">{t('reconcile.balance.over', { amount: fmt.moneyPlain(-balance.remaining) })}</p>;
  if (balance.surplus > 0) return <p className="balance-line balance-line--warning">{t('reconcile.balance.surplus', { amount: fmt.moneyPlain(balance.surplus) })}</p>;
  if (balance.remaining > 0) return <p className="balance-line balance-line--warning">{t('reconcile.balance.remaining', { amount: fmt.moneyPlain(balance.remaining) })}</p>;
  return <p className="balance-line balance-line--ok">{t('reconcile.balance.ok')}</p>;
}

interface ExcludedSectionProps {
  line: ReconciliationLine;
  work: LineWork;
  onWork: (work: LineWork) => void;
}

/** E2.4 : affecter une ligne écartée ; un locataire la remet en rapprochement, les autres motifs la qualifient. */
function ExcludedSection({ line, work, onWork }: ExcludedSectionProps) {
  const saved = qualificationOf(line, work);
  const [reason, setReason] = useState<ExclusionReason | ''>(saved?.reason ?? '');
  const [note, setNote] = useState(saved?.note ?? '');
  const [attempted, setAttempted] = useState(false);
  const pending = reason ? { reason, note: note.trim() || null } : null;
  const noteMissing = reason !== '' && needsNote(reason) && !note.trim();
  const save = () => {
    if (!qualificationValid(pending)) {
      setAttempted(true);
      return;
    }
    onWork({ ...work, qualification: pending });
  };
  return (
    <FormAttemptContext.Provider value={attempted}>
      <DetailSection title={t('reconcile.excluded.title')}>
        <p className="detail-panel__hint">{saved ? t('reconcile.excluded.current', { reason: `${t(reasonKey[saved.reason])}${saved.note ? ` · ${saved.note}` : ''}` }) : t('reconcile.excluded.toQualify')}</p>
        <Field id={`reason-${line.id}`} label={t('reconcile.excluded.assign')} required error={!reason ? t('form.required') : undefined}>
          <SelectInput id={`reason-${line.id}`} value={reason} invalid={!reason} onChange={e => setReason(e.target.value as ExclusionReason | '')}>
            <option value="">{t('reconcile.excluded.assign.placeholder')}</option>
            {REASONS.map(key => (
              <option key={key} value={key}>
                {t(reasonKey[key])}
              </option>
            ))}
          </SelectInput>
        </Field>
        {reason === 'tenant' ? (
          <>
            <p className="detail-panel__hint">{t('reconcile.excluded.tenant.help')}</p>
            <Inline>
              <Button variant="brand" onClick={() => onWork({ ...emptyWork, reinstated: true })}>
                {t('reconcile.action.reinstate')}
              </Button>
            </Inline>
          </>
        ) : (
          <>
            {reason === 'ignore' ? <Notice tone="info" title={t('reconcile.excluded.ignore.title')}>{t('reconcile.excluded.ignore.body')}</Notice> : null}
            {reason ? (
              <Field id={`note-${line.id}`} label={needsNote(reason) ? t('reconcile.excluded.note.required') : t('reconcile.excluded.note')} required={needsNote(reason)} error={noteMissing ? t('form.required') : undefined}>
                <TextInput id={`note-${line.id}`} value={note} invalid={noteMissing} placeholder={reason === 'ignore' ? t('reconcile.excluded.note.ignoreHint') : t('reconcile.excluded.note.hint')} onChange={e => setNote(e.target.value)} />
              </Field>
            ) : null}
            <Inline>
              <Button variant="brand" onClick={save}>
                {t('reconcile.action.saveQualification')}
              </Button>
            </Inline>
          </>
        )}
      </DetailSection>
    </FormAttemptContext.Provider>
  );
}
