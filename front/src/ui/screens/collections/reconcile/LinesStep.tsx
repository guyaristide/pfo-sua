import type { ReconciliationLine, StatementDetail } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { reconciliationLineState, type ReconciliationLineState } from '@/shared/status';
import { t } from '@/i18n/t';
import type { MessageKey } from '@/i18n/fr';
import { Badge, Button, Card, EmptyState, ListBody, Notice, RecordLink, SplitView, Tabs, type Column, type MenuAction, type TabDefinition } from '@/ui/primitives';
import { LinePanel } from './LinePanel';
import { effectiveState, imputeBlock, isEditable, qualificationOf, qualificationValid, tenantIdOf, workOf, type Counts, type LineTab, type LineWork } from './work';

export interface LinesStepProps {
  statement: StatementDetail;
  fmt: Formatters;
  tab: LineTab;
  selected: string | null;
  works: Record<string, LineWork>;
  /** Un seul changement par geste : onglet, ligne ouverte et travail en cours se mettent à jour ensemble. */
  onChange: (changes: Partial<{ tab: LineTab; selected: string | null; works: Record<string, LineWork> }>) => void;
  counts: Counts;
  /** Rapprochement rouvert (E2.11) : les lignes imputées se corrigent une à une. */
  reopened: boolean;
}

const TABS: LineTab[] = ['ready', 'to-check', 'unrecognised', 'excluded', 'matched'];

/** E2.3 : les lignes du relevé par onglet, en vue scindée avec le panneau de la ligne ouverte (SLDS §4). */
export function LinesStep({ statement, fmt, tab, selected, works, onChange, counts, reopened }: LinesStepProps) {
  const stateOf = (line: ReconciliationLine) => effectiveState(line, workOf(works, line.id));
  const rows = statement.lines.filter(line => stateOf(line) === tab);
  const selectedLine = statement.lines.find(line => line.id === selected) ?? null;
  const onSelect = (next: string | null) => onChange({ selected: next });
  const setWork = (lineId: string, work: LineWork) => onChange({ works: { ...works, [lineId]: work } });

  const readyLines = statement.lines.filter(line => stateOf(line) === 'ready' && isEditable(line, workOf(works, line.id)));
  const readyOk = readyLines.filter(line => imputeBlock(line, workOf(works, line.id), statement.tenants) === null);
  const readyWaiting = readyLines.length - readyOk.length;
  const imputeReady = () => {
    const next = { ...works };
    for (const line of readyOk) next[line.id] = { ...workOf(works, line.id), decision: 'impute' };
    const first = readyLines.find(line => !readyOk.includes(line));
    onChange({ works: next, selected: first ? first.id : null });
  };
  const correct = (line: ReconciliationLine) => onChange({ works: { ...works, [line.id]: { ...workOf(works, line.id), correcting: true } }, tab: 'to-check', selected: line.id });

  const tabs: TabDefinition<LineTab>[] = TABS.map(key => ({ key, label: t(tabKey[key]), count: counts.byState[key] }));

  const columns: Column<ReconciliationLine>[] = [
    { key: 'date', header: t('reconcile.col.date'), render: line => fmt.shortDate(line.date), width: '96px', sortValue: line => line.date },
    {
      key: 'label',
      header: t('reconcile.col.label'),
      sortValue: line => line.label,
      render: line => (
        <div>
          <RecordLink onClick={() => onSelect(line.id === selected ? null : line.id)}>{line.label}</RecordLink>
          {line.hint ? <div className="table__secondary">{line.hint}</div> : null}
        </div>
      ),
    },
    { key: 'amount', header: t('reconcile.col.amount'), numeric: true, render: line => fmt.moneyPlain(line.amount), sortValue: line => line.amount },
    {
      key: 'proposal',
      header: t('reconcile.col.proposal'),
      render: line => {
        const work = workOf(works, line.id);
        if (stateOf(line) === 'excluded') {
          return <span className="table__secondary">{qualificationValid(qualificationOf(line, work)) ? t('reconcile.col.qualified') : t('reconcile.col.toQualify')}</span>;
        }
        const tenant = statement.tenants.find(tn => tn.id === tenantIdOf(line, work));
        return tenant ? (
          <div>
            <div className="table__strong">{tenant.name}</div>
            <div className="table__secondary">{t('reconcile.lot', { lot: tenant.lotCode })}</div>
          </div>
        ) : (
          <span className="table__secondary">{t('reconcile.proposal.none')}</span>
        );
      },
    },
    { key: 'state', header: t('reconcile.col.state'), render: line => <Badge tone={reconciliationLineState[stateOf(line)].tone}>{t(reconciliationLineState[stateOf(line)].labelKey)}</Badge> },
  ];

  const rowActions = (line: ReconciliationLine): MenuAction[] => {
    const work = workOf(works, line.id);
    const actions: MenuAction[] = [{ label: stateOf(line) === 'matched' ? t('reconcile.action.open') : t('reconcile.action.treat'), onSelect: () => onSelect(line.id) }];
    if (reopened && line.state === 'matched' && !work.correcting && work.decision === null) actions.push({ label: t('reconcile.action.correct'), onSelect: () => correct(line) });
    return actions;
  };

  return (
    <Card title={t('reconcile.lines.title')} meta={t('reconcile.lines.progress', { done: counts.treated, total: counts.total })}>
      <Tabs tabs={tabs} current={tab} onChange={next => onChange({ tab: next, selected: null })} label={t('reconcile.tabs.label')}>
        {tab === 'excluded' && counts.toQualify > 0 ? <Notice tone="warning" title={t('reconcile.lines.toQualify', { count: counts.toQualify })} /> : null}
        {tab === 'ready' && readyLines.length > 0 ? (
          <Notice
            tone="info"
            title={readyWaiting > 0 ? t('reconcile.bulk.waiting', { count: readyLines.length, waiting: readyWaiting }) : t('reconcile.bulk.ready', { count: readyLines.length })}
            actions={
              readyOk.length > 0 ? (
                <Button variant="neutral" iconLeading="check" onClick={imputeReady}>
                  {t('reconcile.action.imputeReady', { count: readyOk.length })}
                </Button>
              ) : null
            }
          >
            {readyOk.length === 0 ? t('reconcile.bulk.none') : null}
          </Notice>
        ) : null}
        <SplitView
          list={
            <Card flush className="card--inset">
              <ListBody
                rows={rows}
                haystack={line => [line.label, line.tenantName, line.hint, String(line.amount)]}
                columns={columns}
                rowKey={line => line.id}
                caption={t('reconcile.lines.title')}
                rowActions={rowActions}
                selectedKey={selected}
                empty={<EmptyState icon="payments" title={t(emptyKey[tab].title)} body={t(emptyKey[tab].body)} action={tab === 'matched' ? null : <Button variant="neutral" onClick={() => onChange({ tab: 'matched', selected: null })}>{t('reconcile.empty.seeMatched')}</Button>} />}
              />
            </Card>
          }
          detail={selectedLine ? <LinePanel key={selectedLine.id} line={selectedLine} work={workOf(works, selectedLine.id)} tenants={statement.tenants} fmt={fmt} onWork={work => setWork(selectedLine.id, work)} onClose={() => onSelect(null)} /> : null}
        />
      </Tabs>
    </Card>
  );
}

const tabKey: Record<ReconciliationLineState, MessageKey> = { ready: 'reconcile.tab.ready', 'to-check': 'reconcile.tab.toCheck', unrecognised: 'reconcile.tab.unrecognised', excluded: 'reconcile.tab.excluded', matched: 'reconcile.tab.matched' };
const emptyKey: Record<ReconciliationLineState, { title: MessageKey; body: MessageKey }> = {
  ready: { title: 'reconcile.empty.ready', body: 'reconcile.empty.ready.body' },
  'to-check': { title: 'reconcile.empty.toCheck', body: 'reconcile.empty.toCheck.body' },
  unrecognised: { title: 'reconcile.empty.unrecognised', body: 'reconcile.empty.unrecognised.body' },
  excluded: { title: 'reconcile.empty.excluded', body: 'reconcile.empty.excluded.body' },
  matched: { title: 'reconcile.empty.matched', body: 'reconcile.empty.matched.body' },
};
