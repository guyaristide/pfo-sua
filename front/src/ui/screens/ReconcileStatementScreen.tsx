import { useState } from 'react';
import type { ReconciliationAction, ReconciliationLine, ReconciliationResult, StatementDetail } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { reconciliationLineState, statementStatus, type ReconciliationLineState } from '@/shared/status';
import { t } from '@/i18n/t';
import { exportCsv } from '@/shared/export/csv';
import {
  Badge,
  Band,
  Button,
  Card,
  DataTable,
  DockedFooter,
  EmptyState,
  FilterPills,
  Icon,
  PageHeader,
  Path,
  Stat,
  StatRow,
  type Column,
  type PathStep,
} from '@/ui/primitives';

export type ReconcileStep = 'import' | 'reconcile' | 'validate';

export interface ReconcileDraft {
  step: ReconcileStep;
  imported: boolean;
  decisions: Record<string, ReconciliationAction>;
  explainerDismissed: boolean;
}

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
  onRecordCheque: () => void;
  onBack: () => void;
}

const PENDING: ReconciliationLineState[] = ['ready', 'to-check', 'unrecognised'];
const isPending = (line: ReconciliationLine) => PENDING.includes(line.state);

/** Parcours 2A d'Elodie en page unique à trois étapes : importer, rapprocher, valider (règle 9). */
export function ReconcileStatementScreen(props: ReconcileStatementScreenProps) {
  const { statement, fmt, draft, onDraftChange, onValidate, validating, validationError, result, canValidate, onRecordCheque, onBack } = props;
  const validated = statement.status === 'validated' || result !== null;
  const step: ReconcileStep = validated ? 'validate' : draft.step;
  const imported = draft.imported || statement.imported;
  const month = fmt.monthYear(statement.period);
  const patch = (changes: Partial<ReconcileDraft>) => onDraftChange({ ...draft, ...changes });

  const pending = statement.lines.filter(isPending);
  const decided = pending.filter(line => draft.decisions[line.id] !== undefined);
  const remaining = pending.length - decided.length;
  const credits = statement.lines.filter(line => line.amount > 0);
  const matchedCount = statement.lines.filter(line => line.state === 'matched' || draft.decisions[line.id] === 'confirm').length;
  const excludedCount = statement.lines.filter(line => line.state === 'excluded' || draft.decisions[line.id] === 'exclude').length;
  const collected = statement.lines
    .filter(line => line.state === 'matched' || draft.decisions[line.id] === 'confirm')
    .reduce((sum, line) => sum + line.amount, 0);

  const steps: PathStep<ReconcileStep>[] = [
    { key: 'import', label: t('reconcile.step.import') },
    { key: 'reconcile', label: t('reconcile.step.reconcile') },
    { key: 'validate', label: t('reconcile.step.validate') },
  ];

  const bandTitle = validated
    ? t('reconcile.band.validated', { month })
    : imported
      ? t('reconcile.band.imported', { month, count: credits.length })
      : t('reconcile.band.waiting', { month });

  return (
    <>
      <PageHeader
        object="collection"
        breadcrumbs={[{ label: t('nav.collections'), onClick: onBack }, { label: t('reconcile.breadcrumb') }]}
        eyebrow={t('reconcile.account', { bank: statement.bank, asset: statement.assetName, account: statement.accountLabel })}
        title={t('reconcile.title')}
        aside={<Path steps={steps} current={step} onSelect={validated ? undefined : key => patch({ step: key })} label={t('reconcile.pathLabel')} />}
      />

      <Band
        eyebrow={`${t(statementStatus[statement.status].labelKey)} · ${month}`}
        title={bandTitle}
        actions={
          step === 'import' && !validated ? (
            <>
              {imported ? null : (
                <Button variant="brand" iconLeading="upload" onClick={() => patch({ imported: true })}>
                  {t('reconcile.action.import')}
                </Button>
              )}
              <Button variant="base" onClick={onRecordCheque}>
                {t('reconcile.action.recordCheque')}
              </Button>
            </>
          ) : null
        }
      />

      {step === 'import' ? (
        <ImportStep statement={statement} fmt={fmt} imported={imported} explainerDismissed={draft.explainerDismissed} onDismissExplainer={() => patch({ explainerDismissed: true })} />
      ) : null}
      {step === 'reconcile' ? (
        <LinesStep statement={statement} fmt={fmt} decisions={draft.decisions} onDecisions={decisions => patch({ decisions })} />
      ) : null}
      {step === 'validate' ? (
        <ValidateStep statement={statement} fmt={fmt} month={month} matchedCount={matchedCount} excludedCount={excludedCount} collected={collected} result={result} validated={validated} />
      ) : null}

      {validated ? (
        <DockedFooter
          tone="success"
          status={t('reconcile.band.validated', { month })}
          actions={
            <>
              <Button
                variant="neutral"
                iconLeading="download"
                onClick={() =>
                  exportCsv(
                    `${t('export.filename.reconciliation')}-${statement.period.slice(0, 7)}`,
                    [
                      { header: t('reconcile.col.date'), value: line => fmt.shortDate(line.date) },
                      { header: t('reconcile.col.label'), value: line => line.label },
                      { header: t('reconcile.col.amount'), value: line => line.amount },
                      { header: t('reconcile.col.proposal'), value: line => line.tenantName },
                      { header: t('reconcile.col.due'), value: line => line.invoiceLabel },
                      { header: t('reconcile.col.state'), value: line => t(reconciliationLineState[line.state].labelKey) },
                    ],
                    statement.lines,
                  )
                }
              >
                {t('reconcile.action.download')}
              </Button>
              <Button variant="brand" onClick={onBack}>
                {t('reconcile.action.backToCollections')}
              </Button>
            </>
          }
        />
      ) : step === 'import' ? (
        <DockedFooter
          status={imported ? t('reconcile.import.credits') + ' : ' + credits.length : t('draft.saved')}
          actions={
            <Button variant="brand" disabled={!imported} onClick={() => patch({ step: 'reconcile' })}>
              {t('reconcile.action.continue')}
            </Button>
          }
        />
      ) : step === 'reconcile' ? (
        <DockedFooter
          tone={remaining === 0 ? 'success' : 'neutral'}
          status={remaining === 0 ? t('reconcile.lines.allDone') : t('reconcile.lines.remaining', { count: remaining })}
          actions={
            <>
              <Button variant="neutral" onClick={() => patch({ step: 'import' })}>
                {t('reconcile.step.import')}
              </Button>
              <Button variant="brand" disabled={remaining > 0} onClick={() => patch({ step: 'validate' })}>
                {t('reconcile.step.validate')}
              </Button>
            </>
          }
        />
      ) : (
        <DockedFooter
          tone={validationError ? 'danger' : 'neutral'}
          status={validationError ?? t('reconcile.lines.cutOff', { days: statement.cutOffInDays })}
          actions={
            <>
              <Button variant="neutral" onClick={() => patch({ step: 'reconcile' })}>
                {t('reconcile.action.backToLines')}
              </Button>
              <Button variant="brand" disabled={!canValidate || validating || remaining > 0} onClick={onValidate}>
                {t('reconcile.action.validate')}
              </Button>
            </>
          }
        />
      )}
    </>
  );
}

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
          <div className="explainer">
            {(['1', '2', '3'] as const).map(n => (
              <div className="explainer__step" key={n}>
                <div className="explainer__number">{n}</div>
                <div className="explainer__title">{t(`reconcile.explainer.${n}.title`)}</div>
                {t(`reconcile.explainer.${n}.body`)}
              </div>
            ))}
          </div>
        </Card>
      )}
      {imported ? (
        <div className="layout-two">
          <Card title={t('reconcile.import.title')} flush>
            <StatRow>
              <Stat label={t('reconcile.import.linesRead')} value={statement.linesRead} delta={{ text: t('reconcile.import.pages', { count: statement.pageCount }), tone: 'neutral' }} />
              <Stat label={t('reconcile.import.credits')} value={credits} delta={{ text: t('reconcile.import.credits.note', { count: alreadyMatched }), tone: 'neutral' }} />
              <Stat label={t('reconcile.import.debits')} value={checks.debitsExcluded} delta={{ text: t('reconcile.import.debits.note'), tone: 'neutral' }} />
              <Stat label={t('reconcile.import.duplicates')} value={checks.duplicatesIgnored} delta={{ text: t('reconcile.import.duplicates.note'), tone: 'neutral' }} />
            </StatRow>
            <div className="card__body">
              <div className="page-header__highlights" style={{ borderTop: 0, padding: 0 }}>
                <div className="highlight">
                  <div className="highlight__label">{t('reconcile.import.opening', { date: fmt.shortDate(checks.periodFrom) })}</div>
                  <div className="highlight__value">{fmt.money(checks.openingBalance)}</div>
                </div>
                <div className="highlight">
                  <div className="highlight__label">{t('reconcile.import.closing', { date: fmt.shortDate(checks.periodTo) })}</div>
                  <div className="highlight__value">{fmt.money(checks.closingBalance)}</div>
                </div>
                <div className="highlight">
                  <div className="highlight__label">{t('reconcile.import.variation')}</div>
                  <div className="highlight__value">{fmt.money(checks.closingBalance - checks.openingBalance)}</div>
                </div>
              </div>
            </div>
            <div className="card__footer">
              <div className="card__meta">{t('reconcile.import.previous')}</div>
              {statement.previous.map(previous => (
                <div key={previous.period} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, paddingTop: 4 }}>
                  <span>{t('reconcile.import.previous.row', { month: fmt.monthYear(previous.period), amount: fmt.money(previous.collectedAmount) })}</span>
                  <Badge tone={statementStatus[previous.status].tone}>{t(statementStatus[previous.status].labelKey)}</Badge>
                </div>
              ))}
            </div>
          </Card>
          <Card title={t('reconcile.checks.title')}>
            <ul className="check-list">
              <CheckItem title={t('reconcile.checks.period')} detail={t('reconcile.checks.period.detail', { from: fmt.shortDate(checks.periodFrom), to: fmt.shortDate(checks.periodTo) })} />
              <CheckItem title={t('reconcile.checks.duplicates')} detail={t('reconcile.checks.duplicates.detail', { count: checks.duplicatesIgnored })} />
              <CheckItem title={t('reconcile.checks.debits', { count: checks.debitsExcluded })} detail={t('reconcile.checks.debits.detail')} />
              <CheckItem
                warning={!checks.previousStatementComplete}
                title={checks.previousStatementComplete ? t('reconcile.checks.previous') : t('reconcile.checks.previous.warning')}
                detail={checks.previousStatementComplete ? '' : t('reconcile.checks.previous.detail')}
              />
            </ul>
          </Card>
        </div>
      ) : null}
    </>
  );
}

function CheckItem({ title, detail, warning = false }: { title: string; detail: string; warning?: boolean }) {
  return (
    <li>
      <span className={warning ? 'check-list__mark check-list__mark--warning' : 'check-list__mark'} aria-hidden="true">
        <Icon name={warning ? 'bell' : 'check'} size={12} />
      </span>
      <div>
        <div className="check-list__title">{title}</div>
        {detail ? <div className="check-list__detail">{detail}</div> : null}
      </div>
    </li>
  );
}

interface LinesStepProps {
  statement: StatementDetail;
  fmt: Formatters;
  decisions: Record<string, ReconciliationAction>;
  onDecisions: (decisions: Record<string, ReconciliationAction>) => void;
}

type LineFilter = ReconciliationLineState | 'all';

function LinesStep({ statement, fmt, decisions, onDecisions }: LinesStepProps) {
  const [filter, setFilter] = useState<LineFilter>('all');
  const rows = filter === 'all' ? statement.lines : statement.lines.filter(line => line.state === filter);
  const pending = statement.lines.filter(isPending);
  const done = pending.filter(line => decisions[line.id] !== undefined).length;
  const readyUndecided = statement.lines.filter(line => line.state === 'ready' && decisions[line.id] === undefined);

  const decide = (lineId: string, action: ReconciliationAction | null) => {
    const next = { ...decisions };
    if (action === null) delete next[lineId];
    else next[lineId] = action;
    onDecisions(next);
  };
  const confirmAllReady = () => {
    const next = { ...decisions };
    for (const line of readyUndecided) next[line.id] = 'confirm';
    onDecisions(next);
  };

  const columns: Column<ReconciliationLine>[] = [
    { key: 'date', header: t('reconcile.col.date'), render: line => fmt.shortDate(line.date), width: '96px' },
    {
      key: 'label',
      header: t('reconcile.col.label'),
      render: line => (
        <div>
          <div className="table__primary" style={{ color: 'var(--text-primary)' }}>{line.label}</div>
          {line.hint ? <div className="table__secondary">{line.hint}</div> : null}
        </div>
      ),
    },
    { key: 'amount', header: t('reconcile.col.amount'), numeric: true, render: line => fmt.moneyPlain(line.amount) },
    {
      key: 'proposal',
      header: t('reconcile.col.proposal'),
      render: line =>
        line.tenantName ? (
          <div>
            <div className="table__primary">{line.tenantName}</div>
            {line.lotCode ? <div className="table__secondary">{t('reconcile.lot', { lot: line.lotCode })}</div> : null}
          </div>
        ) : (
          <span className="table__secondary">{t('reconcile.proposal.none')}</span>
        ),
    },
    {
      key: 'due',
      header: t('reconcile.col.due'),
      render: line =>
        line.invoiceLabel ? (
          <div>
            <div>{line.invoiceLabel}</div>
            {line.dueAmount !== null ? <div className="table__secondary numeric">{fmt.moneyPlain(line.dueAmount)}</div> : null}
          </div>
        ) : null,
    },
    {
      key: 'state',
      header: t('reconcile.col.state'),
      render: line => {
        const decision = decisions[line.id];
        if (decision) return <Badge tone={decision === 'confirm' ? 'success' : 'neutral'}>{decision === 'confirm' ? t('reconcile.decided.confirm') : t('reconcile.decided.exclude')}</Badge>;
        return <Badge tone={reconciliationLineState[line.state].tone}>{t(reconciliationLineState[line.state].labelKey)}</Badge>;
      },
    },
    {
      key: 'actions',
      header: '',
      render: line => {
        if (!isPending(line)) return null;
        const decision = decisions[line.id];
        return (
          <div className="table__actions">
            {decision ? (
              <Button variant="base" onClick={() => decide(line.id, null)}>
                {t('reconcile.action.undo')}
              </Button>
            ) : (
              <>
                {line.tenantName ? (
                  <Button variant="neutral" onClick={() => decide(line.id, 'confirm')}>
                    {t('reconcile.action.confirm')}
                  </Button>
                ) : null}
                <Button variant="base" onClick={() => decide(line.id, 'exclude')}>
                  {t('reconcile.action.exclude')}
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const filters: { key: LineFilter; label: string }[] = [
    { key: 'all', label: `${t('reconcile.lines.filter.all')} (${statement.lines.length})` },
    ...(Object.keys(reconciliationLineState) as ReconciliationLineState[]).map(key => ({
      key,
      label: `${t(reconciliationLineState[key].labelKey)} (${statement.lines.filter(line => line.state === key).length})`,
    })),
  ];

  return (
    <Card
      title={t('reconcile.lines.title')}
      meta={t('reconcile.lines.progress', { done, total: pending.length })}
      actions={
        readyUndecided.length > 0 ? (
          <Button variant="neutral" iconLeading="check" onClick={confirmAllReady}>
            {t('reconcile.action.confirmAllReady', { count: readyUndecided.length })}
          </Button>
        ) : null
      }
      flush
    >
      <div className="list-status">
        <div className="list-status__filters">
          <FilterPills options={filters} value={filter} onChange={setFilter} label={t('reconcile.col.state')} />
        </div>
        <div className="progress" style={{ width: 160 }} aria-hidden="true">
          <div className="progress__bar" style={{ width: `${pending.length === 0 ? 100 : Math.round((done / pending.length) * 100)}%` }} />
        </div>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon="payments" title={t('reconcile.lines.empty')} />
      ) : (
        <DataTable caption={t('reconcile.lines.title')} columns={columns} rows={rows} rowKey={line => line.id} />
      )}
    </Card>
  );
}

interface ValidateStepProps {
  statement: StatementDetail;
  fmt: Formatters;
  month: string;
  matchedCount: number;
  excludedCount: number;
  collected: number;
  result: ReconciliationResult | null;
  validated: boolean;
}

function ValidateStep({ statement, fmt, month, matchedCount, excludedCount, collected, result, validated }: ValidateStepProps) {
  return (
    <div className="layout-two">
      <Card title={validated ? t('reconcile.result.title', { bank: statement.bank, asset: statement.assetName }) : t('reconcile.validate.title')} flush>
        <StatRow>
          <Stat label={t('reconcile.validate.collected', { month })} value={fmt.moneyCompact(result?.collectedAmount ?? collected)} />
          <Stat label={t('reconcile.validate.matched')} value={result?.matchedCount ?? matchedCount} />
          <Stat label={t('reconcile.validate.excluded')} value={result?.excludedCount ?? excludedCount} />
        </StatRow>
      </Card>
      <Card title={t('reconcile.validate.after')}>
        <ul className="check-list">
          {(['1', '2', '3', '4'] as const).map(n => (
            <li key={n}>
              <span className="explainer__number" aria-hidden="true">
                {n}
              </span>
              <div className="check-list__detail" style={{ alignSelf: 'center' }}>
                {t(`reconcile.validate.after.${n}`)}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
