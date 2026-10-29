import { useState } from 'react';
import type { ReconciliationResult, StatementDetail } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { reconciliationLineState, statementStatus } from '@/shared/status';
import { t } from '@/i18n/t';
import { exportCsv } from '@/shared/export/csv';
import { Band, Button, Card, Checklist, Dialog, FieldGrid, Field, FormAttemptContext, KpiRow, Notice, RecordLayout, RelatedList, Badge, TextArea, WizardPage, type PathStep } from '@/ui/primitives';
import { StatementHistory } from './collections/reconcile/StatementHistory';
import { LinesStep } from './collections/reconcile/LinesStep';
import { MonthlyFileCard } from './collections/reconcile/MonthlyFileCard';
import { buildDecisions, countsOf, effectiveState, qualificationOf, qualificationValid, workOf, type LineTab, type LineWork } from './collections/reconcile/work';

export type ReconcileStep = 'import' | 'reconcile' | 'validate';

export interface ReconcileDraft {
  step: ReconcileStep;
  imported: boolean;
  tab: LineTab;
  selected: string | null;
  works: Record<string, LineWork>;
  explainerDismissed: boolean;
}

export const initialReconcileDraft: ReconcileDraft = { step: 'import', imported: false, tab: 'ready', selected: null, works: {}, explainerDismissed: false };

interface ReconcileStatementScreenProps {
  statement: StatementDetail;
  fmt: Formatters;
  draft: ReconcileDraft;
  onDraftChange: (draft: ReconcileDraft) => void;
  onValidate: () => void;
  validating: boolean;
  validationError: string | undefined;
  result: ReconciliationResult | null;
  canValidate: boolean;
  canApprove: boolean;
  fileBusy: boolean;
  fileError: string | undefined;
  onApprove: () => void;
  onReturn: (comment: string) => void;
  /** Rouvrir le rapprochement validé, avec un motif (E2.11). */
  onReopen: (reason: string) => void;
  reopening: boolean;
  reopenError: string | undefined;
  onRecordCheque: () => void;
  onBack: () => void;
}

/** Parcours 2A d'Elodie en page unique à trois étapes : importer, rapprocher, valider (règle 9). */
export function ReconcileStatementScreen(props: ReconcileStatementScreenProps) {
  const { statement, fmt, draft, onDraftChange, onValidate, validating, validationError, result, canValidate, canApprove, fileBusy, fileError, onApprove, onReturn, onReopen, reopening, reopenError, onRecordCheque, onBack } = props;
  const reopened = statement.status === 'reopened';
  const validated = statement.status === 'validated' || statement.status === 'validated-with-observation' || result !== null;
  const step: ReconcileStep = validated ? 'validate' : reopened && draft.step === 'import' ? 'reconcile' : draft.step;
  const imported = draft.imported || statement.imported;
  const month = fmt.monthYear(statement.period);
  const patch = (changes: Partial<ReconcileDraft>) => onDraftChange({ ...draft, ...changes });
  const counts = countsOf(statement, draft.works);
  const remaining = counts.total - counts.treated;
  const credits = statement.lines.filter(line => line.amount > 0);
  const [confirming, setConfirming] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenAttempted, setReopenAttempted] = useState(false);
  const reasonShort = reopenReason.trim().length < 5;
  const submitReopen = () => {
    if (reasonShort) {
      setReopenAttempted(true);
      return;
    }
    setReopenOpen(false);
    onReopen(reopenReason.trim());
  };

  const steps: PathStep<ReconcileStep>[] = [
    { key: 'import', label: t('reconcile.step.import') },
    { key: 'reconcile', label: t('reconcile.step.reconcile') },
    { key: 'validate', label: t('reconcile.step.validate') },
  ];

  const bandTitle = validated
    ? t('reconcile.band.validated', { month })
    : reopened
      ? t('reconcile.band.reopened', { month, version: (statement.file?.version ?? 0) + 1 })
      : imported
      ? t('reconcile.band.imported', { month, count: credits.length })
      : t('reconcile.band.waiting', { month });

  const exportLines = () =>
    exportCsv(
      `${t('export.filename.reconciliation')}-${statement.period.slice(0, 7)}`,
      [
        { header: t('reconcile.col.date'), value: line => fmt.shortDate(line.date) },
        { header: t('reconcile.col.label'), value: line => line.label },
        { header: t('reconcile.col.amount'), value: line => line.amount },
        { header: t('reconcile.col.proposal'), value: line => line.tenantName },
        { header: t('reconcile.col.due'), value: line => line.invoiceLabel },
        { header: t('reconcile.col.state'), value: line => t(reconciliationLineState[effectiveState(line, workOf(draft.works, line.id))].labelKey) },
        { header: t('reconcile.proof.title'), value: line => line.proof?.name ?? '' },
        { header: t('reconcile.excluded.assign'), value: line => qualificationOf(line, workOf(draft.works, line.id))?.note ?? '' },
      ],
      statement.lines,
    );
  const goQualify = () => {
    const first = statement.lines.find(line => effectiveState(line, workOf(draft.works, line.id)) === 'excluded' && !qualificationValid(qualificationOf(line, workOf(draft.works, line.id))));
    patch({ step: 'reconcile', tab: 'excluded', selected: first?.id ?? null });
  };
  const readyToValidate = remaining === 0 && counts.toQualify === 0 && (!reopened || counts.treated > 0);
  const reconcileStatus = reopened && counts.total === 0 ? t('reconcile.reopened.hint') : remaining > 0 ? t('reconcile.lines.remaining', { count: remaining }) : counts.toQualify > 0 ? t('reconcile.lines.toQualify', { count: counts.toQualify }) : t('reconcile.lines.allDone');

  const footer = validated
    ? {
        status: statement.reportSigned ? t('reconcile.reopen.locked') : statement.file ? t(`status.file.${fileKey[statement.file.status]}`) : t('reconcile.band.validated', { month }),
        tone: 'success' as const,
        actions: (
          <>
            {canValidate && !statement.reportSigned && !statement.observation && statement.file && statement.file.status !== 'submitted' ? (
              <Button variant="neutral" onClick={() => setReopenOpen(true)}>
                {t('reconcile.action.reopen')}
              </Button>
            ) : null}
            <Button variant="neutral" iconLeading="download" onClick={exportLines}>
              {t('reconcile.action.download')}
            </Button>
            <Button variant="neutral" onClick={onBack}>
              {t('reconcile.action.backToCollections')}
            </Button>
          </>
        ),
      }
    : step === 'import'
      ? {
          status: imported ? t('reconcile.import.status', { count: credits.length }) : t('reconcile.import.waiting'),
          tone: 'neutral' as const,
          actions: imported ? (
            <Button variant="brand" onClick={() => patch({ step: 'reconcile' })}>
              {t('reconcile.action.continue')}
            </Button>
          ) : (
            <Button variant="brand" iconLeading="upload" onClick={() => patch({ imported: true })}>
              {t('reconcile.action.import')}
            </Button>
          ),
        }
      : step === 'reconcile'
        ? {
            status: reconcileStatus,
            tone: readyToValidate ? ('success' as const) : ('neutral' as const),
            actions: (
              <>
                {reopened ? null : (
                  <Button variant="neutral" onClick={() => patch({ step: 'import' })}>
                    {t('reconcile.step.import')}
                  </Button>
                )}
                {remaining === 0 && counts.toQualify > 0 ? (
                  <Button variant="brand" onClick={goQualify}>
                    {t('reconcile.action.qualify')}
                  </Button>
                ) : (
                  <Button variant="brand" disabled={!readyToValidate} onClick={() => patch({ step: 'validate' })}>
                    {t('reconcile.step.validate')}
                  </Button>
                )}
              </>
            ),
          }
        : {
            status: validationError ?? (counts.toQualify > 0 ? t('reconcile.lines.toQualify', { count: counts.toQualify }) : canValidate ? t('reconcile.lines.cutOff', { days: statement.cutOffInDays }) : t('reconcile.validate.noRight')),
            tone: validationError ? ('danger' as const) : ('neutral' as const),
            actions: (
              <>
                <Button variant="neutral" onClick={() => patch({ step: 'reconcile' })}>
                  {t('reconcile.action.backToLines')}
                </Button>
                {counts.toQualify > 0 ? (
                  <Button variant="brand" onClick={goQualify}>
                    {t('reconcile.action.qualify')}
                  </Button>
                ) : canValidate ? (
                  <Button variant="brand" disabled={validating || !readyToValidate} onClick={() => setConfirming(true)}>
                    {t('reconcile.action.validate')}
                  </Button>
                ) : null}
              </>
            ),
          };

  const decisions = buildDecisions(statement, draft.works);
  const ignored = statement.lines.filter(line => qualificationOf(line, workOf(draft.works, line.id))?.reason === 'ignore').length;

  return (
    <WizardPage
      object="collection"
      breadcrumbs={[{ label: t('nav.collections'), onClick: onBack }, { label: t('reconcile.breadcrumb') }]}
      eyebrow={t('reconcile.account', { bank: statement.bank, asset: statement.assetName, account: statement.accountLabel })}
      title={t('reconcile.title')}
      steps={steps}
      current={step}
      onSelectStep={validated ? undefined : key => patch({ step: key })}
      pathLabel={t('reconcile.pathLabel')}
      attempted
      footer={footer}
    >
      <Band
        eyebrow={`${t(statementStatus[statement.status].labelKey)} · ${month}`}
        title={bandTitle}
        actions={
          step === 'import' && !validated ? (
            <Button variant="neutral" onClick={onRecordCheque}>
              {t('reconcile.action.recordCheque')}
            </Button>
          ) : null
        }
      />

      {statement.observation && (statement.status === 'validated-with-observation' || reopened) ? (
        <Notice
          tone="warning"
          title={t('reconcile.observation.title', { by: statement.observation.by, date: fmt.shortDate(statement.observation.date) })}
          actions={
            canValidate && !reopened && !statement.reportSigned ? (
              <Button variant="neutral" onClick={() => setReopenOpen(true)}>
                {t('reconcile.action.reopen')}
              </Button>
            ) : null
          }
        >
          {t('reconcile.observation.quote', { text: statement.observation.text })}
        </Notice>
      ) : null}
      {step === 'import' ? (
        <ImportStep statement={statement} fmt={fmt} imported={imported} explainerDismissed={draft.explainerDismissed} onDismissExplainer={() => patch({ explainerDismissed: true })} />
      ) : null}
      {step === 'reconcile' ? (
        <LinesStep
          statement={statement}
          fmt={fmt}
          tab={draft.tab}
          selected={draft.selected}
          works={draft.works}
          onChange={patch}
          counts={counts}
          reopened={reopened}
        />
      ) : null}
      {step === 'validate' ? (
        <ValidateStep statement={statement} fmt={fmt} month={month} counts={counts} ignored={ignored} result={result} validated={validated} canApprove={canApprove} fileBusy={fileBusy} fileError={fileError} onApprove={onApprove} onReturn={onReturn} onDownload={exportLines} />
      ) : null}

      <Dialog
        open={reopenOpen}
        title={t('reconcile.reopen.title', { month })}
        closeLabel={t('reconcile.panel.close')}
        onClose={() => setReopenOpen(false)}
        footer={
          <>
            <Button variant="neutral" onClick={() => setReopenOpen(false)}>
              {t('dialog.cancel')}
            </Button>
            <Button variant="brand" disabled={reopening} onClick={submitReopen}>
              {t('reconcile.action.reopenConfirm')}
            </Button>
          </>
        }
      >
        <FormAttemptContext.Provider value={reopenAttempted}>
          <Notice tone="info" title={t('reconcile.reopen.report')}>
            {t('reconcile.reopen.body')}
          </Notice>
          <Field id="reopen-reason" label={t('reconcile.reopen.reason')} required help={t('reconcile.reopen.reason.help')} error={reasonShort ? t('reconcile.reopen.reason.short') : undefined}>
            <TextArea id="reopen-reason" rows={3} value={reopenReason} invalid={reasonShort} onChange={e => setReopenReason(e.target.value)} />
          </Field>
          {reopenError ? <Notice tone="danger" title={reopenError} /> : null}
        </FormAttemptContext.Provider>
      </Dialog>
      <Dialog
        open={confirming}
        title={t('reconcile.confirm.title', { month })}
        closeLabel={t('reconcile.panel.close')}
        onClose={() => setConfirming(false)}
        footer={
          <>
            <Button variant="neutral" onClick={() => setConfirming(false)}>
              {t('dialog.cancel')}
            </Button>
            <Button variant="brand" disabled={validating} onClick={() => { setConfirming(false); onValidate(); }}>
              {t('reconcile.action.validate')}
            </Button>
          </>
        }
      >
        <FieldGrid
          columns={3}
          fields={[
            { label: t('reconcile.validate.collected', { month }), value: fmt.money(counts.collected), numeric: true },
            { label: t('reconcile.validate.matched'), value: counts.byState.matched, numeric: true },
            { label: t('reconcile.validate.excluded'), value: ignored > 0 ? `${counts.byState.excluded} · ${t('reconcile.validate.ignored', { count: ignored })}` : counts.byState.excluded },
          ]}
        />
        <p>{t('reconcile.confirm.body', { count: decisions.length })}</p>
      </Dialog>
    </WizardPage>
  );
}

const fileKey = { submitted: 'submitted', approved: 'approved', 'sent-to-accounting': 'sentToAccounting', returned: 'returned' } as const;

interface ImportStepProps {
  statement: StatementDetail;
  fmt: Formatters;
  imported: boolean;
  explainerDismissed: boolean;
  onDismissExplainer: () => void;
}

function ImportStep({ statement, fmt, imported, explainerDismissed, onDismissExplainer }: ImportStepProps) {
  const { checks } = statement;
  const alreadyMatched = statement.lines.filter(line => line.state === 'matched').length;
  const credits = statement.lines.filter(line => line.amount > 0).length;
  return (
    <>
      {explainerDismissed ? null : (
        <Card
          title={t('reconcile.explainer.title')}
          actions={
            <Button variant="base" onClick={onDismissExplainer}>
              {t('reconcile.explainer.dismiss')}
            </Button>
          }
        >
          <Checklist items={(['1', '2', '3'] as const).map(n => ({ id: n, tone: 'step' as const, title: t(`reconcile.explainer.${n}.title`), detail: t(`reconcile.explainer.${n}.body`) }))} />
        </Card>
      )}
      {imported ? (
        <RecordLayout
          main={
            <>
              <Card title={t('reconcile.import.title')} flush>
                <KpiRow
                  items={[
                    { key: 'read', label: t('reconcile.import.linesRead'), value: statement.linesRead, hint: t('reconcile.import.pages', { count: statement.pageCount }) },
                    { key: 'credits', label: t('reconcile.import.credits'), value: credits, hint: t('reconcile.import.credits.note', { count: alreadyMatched }) },
                    { key: 'debits', label: t('reconcile.import.debits'), value: checks.debitsExcluded, hint: t('reconcile.import.debits.note') },
                    { key: 'duplicates', label: t('reconcile.import.duplicates'), value: checks.duplicatesIgnored, hint: t('reconcile.import.duplicates.note') },
                  ]}
                />
              </Card>
              <Card title={t('reconcile.import.balances')}>
                <FieldGrid
                  columns={3}
                  fields={[
                    { label: t('reconcile.import.opening', { date: fmt.shortDate(checks.periodFrom) }), value: fmt.money(checks.openingBalance), numeric: true },
                    { label: t('reconcile.import.closing', { date: fmt.shortDate(checks.periodTo) }), value: fmt.money(checks.closingBalance), numeric: true },
                    { label: t('reconcile.import.variation'), value: fmt.money(checks.closingBalance - checks.openingBalance), numeric: true },
                  ]}
                />
              </Card>
            </>
          }
          aside={
            <>
              <Card title={t('reconcile.checks.title')}>
                <Checklist
                  items={[
                    { id: 'period', tone: 'success', title: t('reconcile.checks.period'), detail: t('reconcile.checks.period.detail', { from: fmt.shortDate(checks.periodFrom), to: fmt.shortDate(checks.periodTo) }) },
                    { id: 'duplicates', tone: 'success', title: t('reconcile.checks.duplicates'), detail: t('reconcile.checks.duplicates.detail', { count: checks.duplicatesIgnored }) },
                    { id: 'debits', tone: 'success', title: t('reconcile.checks.debits', { count: checks.debitsExcluded }), detail: t('reconcile.checks.debits.detail') },
                    checks.previousStatementComplete
                      ? { id: 'previous', tone: 'success', title: t('reconcile.checks.previous') }
                      : { id: 'previous', tone: 'warning', title: t('reconcile.checks.previous.warning'), detail: t('reconcile.checks.previous.detail') },
                  ]}
                />
              </Card>
              <RelatedList
                title={t('reconcile.import.previous')}
                items={statement.previous.map(previous => ({
                  id: previous.period,
                  label: fmt.monthYear(previous.period),
                  meta: t('reconcile.import.previous.collected', { amount: fmt.money(previous.collectedAmount) }),
                  aside: <Badge tone={statementStatus[previous.status].tone}>{t(statementStatus[previous.status].labelKey)}</Badge>,
                }))}
                empty={{ title: t('reconcile.import.previous.empty') }}
              />
            </>
          }
        />
      ) : null}
    </>
  );
}

interface ValidateStepProps {
  statement: StatementDetail;
  fmt: Formatters;
  month: string;
  counts: ReturnType<typeof countsOf>;
  ignored: number;
  result: ReconciliationResult | null;
  validated: boolean;
  canApprove: boolean;
  fileBusy: boolean;
  fileError: string | undefined;
  onApprove: () => void;
  onReturn: (comment: string) => void;
  onDownload: () => void;
}

function ValidateStep({ statement, fmt, month, counts, ignored, result, validated, canApprove, fileBusy, fileError, onApprove, onReturn, onDownload }: ValidateStepProps) {
  const file = statement.file ?? result?.file ?? null;
  const ignoredCount = file?.ignoredCount ?? ignored;
  return (
    <RecordLayout
      main={
        <>
          <Card title={validated ? t('reconcile.result.title', { bank: statement.bank, asset: statement.assetName }) : t('reconcile.validate.title')} flush>
            <KpiRow
              items={[
                { key: 'collected', label: t('reconcile.validate.collected', { month }), value: fmt.moneyCompact(file?.collectedAmount ?? result?.collectedAmount ?? counts.collected) },
                { key: 'matched', label: t('reconcile.validate.matched'), value: file?.imputedCount ?? counts.byState.matched },
                { key: 'excluded', label: t('reconcile.validate.excluded'), value: file?.excludedCount ?? counts.byState.excluded, hint: ignoredCount > 0 ? t('reconcile.validate.ignored', { count: ignoredCount }) : undefined },
              ]}
            />
          </Card>
          {file ? <MonthlyFileCard file={file} bank={statement.bank} month={month} fmt={fmt} canApprove={canApprove} busy={fileBusy} error={fileError} onApprove={onApprove} onReturn={onReturn} onDownload={onDownload} /> : null}
          {statement.journal.length > 0 || statement.fileVersions.length > 0 ? <StatementHistory statement={statement} fmt={fmt} onDownload={onDownload} /> : null}
        </>
      }
      aside={
        <Card title={t('reconcile.validate.after')}>
          <Checklist items={(['1', '2', '3', '4'] as const).map(n => ({ id: n, tone: validated ? ('success' as const) : ('step' as const), title: t(`reconcile.validate.after.${n}`) }))} />
        </Card>
      }
    />
  );
}
