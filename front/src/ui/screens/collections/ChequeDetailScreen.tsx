import { useState } from 'react';
import type { CandidateCredit, ChequeDetail, ChequeFollowUpInput } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { chequeStatus } from '@/shared/status';
import { t } from '@/i18n/t';
import { Badge, Button, Card, ConfirmDialog, Field, FormActions, FormAttemptContext, Notice, PageHeader, RecordLayout, RelatedList, TextInput, Timeline } from '@/ui/primitives';

interface ChequeDetailScreenProps {
  detail: ChequeDetail;
  fmt: Formatters;
  canAct: boolean;
  followUp: ChequeFollowUpInput;
  onFollowUp: (input: ChequeFollowUpInput) => void;
  onAddFollowUp: () => void;
  onMatch: (statementId: string, lineId: string) => void;
  onDismiss: (lineId: string) => void;
  busy: boolean;
  error: string | undefined;
  onReject: () => void;
  onOpenTenant: () => void;
  onOpenCheques: () => void;
  onBack: () => void;
}

/** E2.10 : un chèque déposé, non repéré dans les relevés importés ; crédit candidat, démarches, bascule vers le rejet. */
export function ChequeDetailScreen({ detail, fmt, canAct, followUp, onFollowUp, onAddFollowUp, onMatch, onDismiss, busy, error, onReject, onOpenTenant, onOpenCheques, onBack }: ChequeDetailScreenProps) {
  const { cheque } = detail;
  const status = chequeStatus[cheque.status];
  const open = cheque.status === 'late' || cheque.status === 'deposited';
  const candidates = detail.candidates.filter(c => !c.dismissed);
  const [matching, setMatching] = useState<CandidateCredit | null>(null);
  const [attempted, setAttempted] = useState(false);
  const note = () => {
    if (!followUp.date || !followUp.who.trim() || !followUp.reply.trim()) {
      setAttempted(true);
      return;
    }
    setAttempted(false);
    onAddFollowUp();
  };
  return (
    <>
      <PageHeader
        object="cheque"
        breadcrumbs={[
          { label: t('nav.collections'), onClick: onBack },
          { label: t('cheques.title'), onClick: onOpenCheques },
        ]}
        eyebrow={`${cheque.tenantName} · ${t('reconcile.lot', { lot: detail.lotCode })}`}
        title={t('chequeDetail.title', { number: cheque.chequeNumber })}
        actions={
          <>
            <Button variant="neutral" onClick={onOpenTenant}>
              {t('cheques.action.openTenant')}
            </Button>
            {canAct && open ? (
              <Button variant="destructive" onClick={onReject}>
                {t('cheques.action.reject')}
              </Button>
            ) : null}
          </>
        }
        highlights={[
          { label: t('cheques.col.status'), value: <Badge tone={status.tone}>{t(status.labelKey)}</Badge> },
          { label: t('cheques.col.amount'), value: fmt.money(cheque.amount) },
          { label: t('cheque.field.bank'), value: cheque.bank },
          { label: t('cheques.col.deposited'), value: cheque.depositedOn ? fmt.shortDate(cheque.depositedOn) : '-' },
          { label: t('chequeDetail.slip'), value: detail.slipName ?? t('deposit.slip.pending') },
        ]}
      />
      {cheque.status === 'late' ? (
        <Notice tone="danger" title={t('chequeDetail.late', { days: detail.daysSinceDeposit ?? 0 })}>
          {t('chequeDetail.late.body')}
        </Notice>
      ) : null}
      {cheque.status === 'collected' ? (
        <Notice tone="success" title={t('chequeDetail.collected')}>
          {cheque.note}
        </Notice>
      ) : null}
      {error ? <Notice tone="danger" title={error} /> : null}
      <RecordLayout
        main={
          <>
            {cheque.status === 'collected' ? null : (
              <RelatedList
                title={t('chequeDetail.candidates.title')}
                meta={t('chequeDetail.candidates.body')}
                items={candidates.map(candidate => ({
                  id: candidate.lineId,
                  label: `${fmt.shortDate(candidate.date)} · ${candidate.label} · ${fmt.moneyPlain(candidate.amount)}`,
                  meta: `${candidate.statementLabel} · ${candidate.hint}`,
                  action: canAct ? (
                    <>
                      <Button variant="base" disabled={busy} onClick={() => onDismiss(candidate.lineId)}>
                        {t('chequeDetail.action.dismiss')}
                      </Button>
                      <Button variant="neutral" disabled={busy} onClick={() => setMatching(candidate)}>
                        {t('chequeDetail.action.match')}
                      </Button>
                    </>
                  ) : null,
                }))}
                empty={{ title: t('chequeDetail.candidates.none', { amount: fmt.moneyPlain(cheque.amount) }) }}
              />
            )}
            {open && canAct ? (
              <Card title={t('chequeDetail.contact.title')} meta={t('chequeDetail.contact.body')}>
                <FormAttemptContext.Provider value={attempted}>
                  <div className="form-grid">
                    <Field id="fu-date" label={t('chequeDetail.contact.date')} required error={!followUp.date ? t('form.required') : undefined}>
                      <TextInput id="fu-date" type="date" value={followUp.date} invalid={!followUp.date} onChange={e => onFollowUp({ ...followUp, date: e.target.value })} />
                    </Field>
                    <Field id="fu-who" label={t('chequeDetail.contact.who')} required error={!followUp.who.trim() ? t('form.required') : undefined}>
                      <TextInput id="fu-who" value={followUp.who} invalid={!followUp.who.trim()} placeholder={t('chequeDetail.contact.who.placeholder')} onChange={e => onFollowUp({ ...followUp, who: e.target.value })} />
                    </Field>
                    <Field id="fu-reply" label={t('chequeDetail.contact.reply')} required error={!followUp.reply.trim() ? t('form.required') : undefined}>
                      <TextInput id="fu-reply" value={followUp.reply} invalid={!followUp.reply.trim()} onChange={e => onFollowUp({ ...followUp, reply: e.target.value })} />
                    </Field>
                  </div>
                  <FormActions>
                    <Button variant="neutral" disabled={busy} onClick={note}>
                      {t('chequeDetail.action.note')}
                    </Button>
                  </FormActions>
                </FormAttemptContext.Provider>
              </Card>
            ) : null}
          </>
        }
        aside={
          <Card title={`${t('chequeDetail.followUps.title')} (${detail.followUps.length})`} meta={t('chequeDetail.followUps.body')} flush>
            {detail.followUps.length === 0 ? (
              <p className="card__body detail-panel__hint">{t('chequeDetail.followUps.none')}</p>
            ) : (
              <Timeline fmt={fmt} items={[...detail.followUps].reverse().map(item => ({ id: item.id, date: item.date, title: item.who, detail: item.reply }))} />
            )}
          </Card>
        }
      />
      <ConfirmDialog
        open={matching !== null}
        title={t('chequeDetail.match.title', { number: cheque.chequeNumber })}
        confirmLabel={t('chequeDetail.action.match')}
        busy={busy}
        onCancel={() => setMatching(null)}
        onConfirm={() => {
          if (matching) onMatch(matching.statementId, matching.lineId);
          setMatching(null);
        }}
      >
        <p>{matching ? t('chequeDetail.match.body', { amount: fmt.money(cheque.amount), tenant: cheque.tenantName, date: fmt.shortDate(matching.date) }) : null}</p>
      </ConfirmDialog>
    </>
  );
}
