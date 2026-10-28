import type { BankStatementRow, CollectionInboxItem, CollectionsOverview } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { inboxKindTone, statementStatus } from '@/shared/status';
import { t, hasMessage } from '@/i18n/t';
import { Badge, Button, Card, DataTable, EmptyState, PageHeader, Stat, StatRow, type Column } from '@/ui/primitives';

interface CollectionsScreenProps {
  overview: CollectionsOverview;
  fmt: Formatters;
  canRecord: boolean;
  onReconcile: (statementId: string) => void;
  onRecordCheque: () => void;
  onProcessCaptures: (statementId: string) => void;
  onImportStatement: () => void;
  onOpenCheques: () => void;
}

const inboxKindKey: Record<CollectionInboxItem['kind'], string> = {
  'cheque-rejected': 'chequeRejected',
  'cheque-late': 'chequeLate',
  'statement-to-reconcile': 'statementToReconcile',
  'bank-captures': 'bankCaptures',
  observation: 'observation',
};

function label(prefix: string, kind: CollectionInboxItem['kind']): string {
  const key = `${prefix}.${inboxKindKey[kind]}`;
  return hasMessage(key) ? t(key) : kind;
}

function statementAction(row: BankStatementRow, onReconcile: (statementId: string) => void, onProcessCaptures: (statementId: string) => void) {
  switch (row.status) {
    case 'to-reconcile':
      return (
        <Button variant="neutral" onClick={() => onReconcile(row.id)}>
          {t('collections.statements.action.reconcile')}
        </Button>
      );
    case 'captures-to-process':
      return (
        <Button variant="neutral" onClick={() => onProcessCaptures(row.id)}>
          {t('collections.statements.action.process')}
        </Button>
      );
    case 'validated-with-observation':
      return (
        <Button variant="neutral" onClick={() => onReconcile(row.id)}>
          {t('collections.statements.action.open')}
        </Button>
      );
    case 'validated':
      return (
        <Button variant="base" onClick={() => onReconcile(row.id)}>
          {t('collections.statements.action.open')}
        </Button>
      );
  }
}

/** Accueil « Encaissements » du parcours 2 : à traiter, compteurs de chèques, relevés par compte. */
export function CollectionsScreen({ overview, fmt, canRecord, onReconcile, onRecordCheque, onProcessCaptures, onImportStatement, onOpenCheques }: CollectionsScreenProps) {
  const columns: Column<BankStatementRow>[] = [
    {
      key: 'account',
      header: t('collections.statements.col.account'),
      render: row => (
        <div>
          <div className="table__primary" style={{ color: 'var(--text-primary)' }}>{row.bank}</div>
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
    { key: 'actions', header: '', render: row => <div className="table__actions">{statementAction(row, onReconcile, onProcessCaptures)}</div> },
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
          <EmptyState icon="payments" title={t('collections.inbox.empty')} />
        ) : (
          overview.inbox.map(item => (
            <div className={`inbox-item inbox-item--${inboxKindTone[item.kind] ?? 'neutral'}`} key={item.id}>
              <div>
                <div className="inbox-item__kind">{label('collections.inbox.kind', item.kind)}</div>
                <div className="inbox-item__title">{item.title}</div>
                <div className="inbox-item__detail">{item.detail}</div>
              </div>
              <Button
                variant={item.kind === 'cheque-rejected' ? 'brand' : 'neutral'}
                onClick={
                  item.statementId
                    ? () => (item.kind === 'bank-captures' ? onProcessCaptures(item.statementId as string) : onReconcile(item.statementId as string))
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
            delta={{
              text: `${overview.cheques.toDeposit.amount !== undefined ? fmt.money(overview.cheques.toDeposit.amount) + ' · ' : ''}${overview.cheques.toDeposit.note}`,
              tone: 'neutral',
            }}
          />
          <Stat label={t('collections.cheques.deposited')} value={overview.cheques.deposited.count} delta={{ text: overview.cheques.deposited.note, tone: 'neutral' }} />
          <Stat label={t('collections.cheques.late')} value={overview.cheques.late.count} delta={{ text: overview.cheques.late.note, tone: overview.cheques.late.count > 0 ? 'bad' : 'neutral' }} />
          <Stat label={t('collections.cheques.rejected')} value={overview.cheques.rejected.count} delta={{ text: overview.cheques.rejected.note, tone: overview.cheques.rejected.count > 0 ? 'bad' : 'neutral' }} />
        </StatRow>
      </Card>

      <Card title={t('collections.statements.title')} meta={t('collections.statements.deadline')} flush>
        <DataTable caption={t('collections.statements.title')} columns={columns} rows={overview.statements} rowKey={row => row.id} />
      </Card>
    </>
  );
}
