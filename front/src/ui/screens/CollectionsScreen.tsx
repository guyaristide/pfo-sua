import type { BankStatementRow, CollectionInboxItem, CollectionsOverview } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { inboxKindTone, statementStatus } from '@/shared/status';
import { t, hasMessage } from '@/i18n/t';
import { Badge, Button, Card, DataTable, EmptyState, PageHeader, Stat, StatRow, type Column, RecordLink, type MenuAction } from '@/ui/primitives';

interface CollectionsScreenProps {
  overview: CollectionsOverview;
  fmt: Formatters;
  canRecord: boolean;
  onReconcile: (statementId: string) => void;
  onRecordCheque: () => void;
  onProcessCaptures: (statementId: string) => void;
  onImportStatement: () => void;
  onOpenCheques: () => void;
  /** Ouvre le rapprochement sur l'onglet « Écartées », première ligne à qualifier (E2.1). */
  onQualify: (statementId: string) => void;
  onOpenCheque: (chequeId: string) => void;
}

const inboxKindKey: Record<CollectionInboxItem['kind'], string> = {
  'cheque-rejected': 'chequeRejected',
  'cheque-late': 'chequeLate',
  'statement-to-reconcile': 'statementToReconcile',
  'excluded-to-qualify': 'excludedToQualify',
  'bank-captures': 'bankCaptures',
  observation: 'observation',
};

function label(prefix: string, kind: CollectionInboxItem['kind']): string {
  const key = `${prefix}.${inboxKindKey[kind]}`;
  return hasMessage(key) ? t(key) : kind;
}

/** L'action principale d'un relevé selon son statut : rapprocher, traiter les captures, ou ouvrir. */
function statementOpen(row: BankStatementRow, onReconcile: (statementId: string) => void, onProcessCaptures: (statementId: string) => void): MenuAction {
  switch (row.status) {
    case 'to-reconcile':
    case 'reopened':
      return { label: t('collections.statements.action.reconcile'), onSelect: () => onReconcile(row.id) };
    case 'captures-to-process':
      return { label: t('collections.statements.action.process'), onSelect: () => onProcessCaptures(row.id) };
    case 'validated-with-observation':
    case 'validated':
      return { label: t('collections.statements.action.open'), onSelect: () => onReconcile(row.id) };
  }
}

/** Accueil « Encaissements » du parcours 2 : à traiter, compteurs de chèques, relevés par compte. */
export function CollectionsScreen({ overview, fmt, canRecord, onReconcile, onRecordCheque, onProcessCaptures, onImportStatement, onOpenCheques, onQualify, onOpenCheque }: CollectionsScreenProps) {
  const columns: Column<BankStatementRow>[] = [
    {
      key: 'account',
      header: t('collections.statements.col.account'),
      render: row => (
        <div>
          <RecordLink onClick={statementOpen(row, onReconcile, onProcessCaptures).onSelect}>{row.bank}</RecordLink>
          <div className="table__secondary">
            {row.accountOwner === 'sci' ? t('collections.statements.ownerSci') : t('collections.statements.ownerPfo')}
          </div>
        </div>
      ),
    },
    { key: 'asset', header: t('collections.statements.col.asset'), render: row => row.assetName ?? t('collections.statements.severalAssets') },
    { key: 'period', header: t('collections.statements.col.lastStatement'), render: row => fmt.monthYear(row.lastPeriod) },
    {
      key: 'status',
      header: t('collections.statements.col.status'),
      render: row => (
        <div>
          <Badge tone={statementStatus[row.status].tone}>{t(statementStatus[row.status].labelKey)}</Badge>
          <div className="table__secondary">{row.statusDetail}</div>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        object="collection"
        eyebrow={t('collections.subtitle')}
        title={t('collections.title')}
        actions={
          canRecord ? (
            <>
              <Button variant="neutral" onClick={onRecordCheque}>
                {t('collections.action.recordCheque')}
              </Button>
              <Button variant="brand" iconLeading="upload" onClick={onImportStatement}>
                {t('collections.action.importStatement')}
              </Button>
            </>
          ) : null
        }
      />

      <Card title={t('collections.inbox.title')} meta={t('collections.inbox.count', { count: overview.inbox.length })} flush>
        {overview.inbox.length === 0 ? (
          <EmptyState icon="payments" title={t('collections.inbox.empty')} trame />
        ) : (
          overview.inbox.map(item => (
            <div className={`inbox-item inbox-item--${inboxKindTone[item.kind] ?? 'neutral'}`} key={item.id}>
              <div>
                <div className="inbox-item__kind">{label('collections.inbox.kind', item.kind)}</div>
                <div className="inbox-item__title">{item.title}</div>
                <div className="inbox-item__detail">{item.detail}</div>
              </div>
              <Button
                variant="neutral"
                onClick={
                  item.statementId
                    ? () => (item.kind === 'bank-captures' ? onProcessCaptures(item.statementId as string) : item.kind === 'excluded-to-qualify' ? onQualify(item.statementId as string) : onReconcile(item.statementId as string))
                    : item.chequeId && item.kind === 'cheque-late'
                      ? () => onOpenCheque(item.chequeId as string)
                      : () => onOpenCheques()
                }
              >
                {label('collections.inbox.action', item.kind)}
              </Button>
            </div>
          ))
        )}
      </Card>

      <Card
        title={t('collections.cheques.title')}
        actions={
          <Button variant="base" onClick={onOpenCheques}>
            {t('collections.cheques.pending')}
          </Button>
        }
        flush
      >
        <StatRow>
          <Stat
            label={t('collections.cheques.toDeposit')}
            value={overview.cheques.toDeposit.count}
            hint={overview.cheques.toDeposit.amount !== undefined ? t('collections.cheques.toDeposit.hint', { amount: fmt.money(overview.cheques.toDeposit.amount), note: overview.cheques.toDeposit.note }) : overview.cheques.toDeposit.note}
          />
          <Stat label={t('collections.cheques.deposited')} value={overview.cheques.deposited.count} hint={overview.cheques.deposited.note} />
          <Stat label={t('collections.cheques.late')} value={overview.cheques.late.count} {...(overview.cheques.late.count > 0 ? { delta: { text: overview.cheques.late.note, tone: 'bad' as const } } : { hint: overview.cheques.late.note })} />
          <Stat label={t('collections.cheques.rejected')} value={overview.cheques.rejected.count} {...(overview.cheques.rejected.count > 0 ? { delta: { text: overview.cheques.rejected.note, tone: 'bad' as const } } : { hint: overview.cheques.rejected.note })} />
        </StatRow>
      </Card>

      <Card title={t('collections.statements.title')} meta={t('collections.statements.deadline')} flush>
        <DataTable caption={t('collections.statements.title')} columns={columns} rows={overview.statements} rowKey={row => row.id} rowActions={row => [statementOpen(row, onReconcile, onProcessCaptures)]} highlight={row => row.status === 'to-reconcile' || row.status === 'reopened'} />
      </Card>
    </>
  );
}
