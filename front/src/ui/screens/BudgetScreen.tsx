import type { BudgetOverview, BudgetRow } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { budgetStatus } from '@/shared/status';
import { t } from '@/i18n/t';
import { Badge, Button, Card, EmptyState, ListBody, PageHeader, RecordLink, type Column } from '@/ui/primitives';

interface BudgetScreenProps {
  overview: BudgetOverview;
  fmt: Formatters;
  canValidate: boolean;
  onOpen: (budgetId: string) => void;
  onReestimate: (budgetId: string) => void;
  onPrepare: () => void;
  preparing: boolean;
}

/** Une seule formule de réalisation, pour les lignes comme pour le total (règle 4). */
function realisationRate(budget: number, realised: number): number {
  return budget > 0 ? realised / budget : 0;
}

/** Charges et budget : budget initial, réestimé, réalisé, reddition au 15 avril (cadrage du 13/10). */
export function BudgetScreen({ overview, fmt, canValidate, onOpen, onReestimate, onPrepare, preparing }: BudgetScreenProps) {
  const budgetOf = (rows: BudgetRow[]) => rows.reduce((sum, row) => sum + row.budgetAmount, 0);
  const realisedOf = (rows: BudgetRow[]) => rows.reduce((sum, row) => sum + row.realisedAmount, 0);

  const columns: Column<BudgetRow>[] = [
    {
      key: 'asset',
      header: t('budget.col.asset'),
      render: row => (
        <div>
          <RecordLink onClick={() => onOpen(row.id)}>{row.assetName}</RecordLink>
          <div className="table__secondary">{row.detail}</div>
        </div>
      ),
    },
    { key: 'year', header: t('budget.col.year'), numeric: true, render: row => row.year },
    { key: 'status', header: t('budget.col.status'), render: row => <Badge tone={budgetStatus[row.status].tone}>{t(budgetStatus[row.status].labelKey)}</Badge> },
    { key: 'budget', header: t('budget.col.budget'), numeric: true, render: row => fmt.moneyPlain(row.budgetAmount) },
    { key: 'realised', header: t('budget.col.realised'), numeric: true, render: row => fmt.moneyPlain(row.realisedAmount) },
    { key: 'rate', header: t('budget.col.rate'), numeric: true, render: row => fmt.percent(realisationRate(row.budgetAmount, row.realisedAmount)) },
    { key: 'settlement', header: t('budget.col.settlement'), render: row => fmt.shortDate(row.settlementDeadline) },
  ];

  return (
    <>
      <PageHeader
        object="budget"
        eyebrow={t('budget.subtitle')}
        title={t('budget.title')}
        actions={
          canValidate ? (
            <Button variant="brand" iconLeading="plus" disabled={preparing} onClick={onPrepare}>
              {t('budget.action.prepare', { year: overview.year + 1 })}
            </Button>
          ) : null
        }
      />
      <Card title={t('budget.list.title', { year: overview.year })} flush>
        <ListBody
          rows={overview.rows}
          haystack={row => [row.assetName, String(row.year)]}
          columns={columns}
          rowKey={row => row.id}
          caption={t('budget.title')}
          rowActions={row => [{ label: t('budget.action.open'), onSelect: () => onOpen(row.id) }, ...(canValidate && row.status === 'initial' ? [{ label: t('budget.action.reestimate'), onSelect: () => onReestimate(row.id) }] : [])]}
          extra={rows => fmt.moneyPlain(budgetOf(rows))}
          footer={rows => [t('budget.total', { count: rows.length }), '', '', fmt.moneyPlain(budgetOf(rows)), fmt.moneyPlain(realisedOf(rows)), fmt.percent(realisationRate(budgetOf(rows), realisedOf(rows))), '']}
          empty={<EmptyState icon="tag" title={t('budget.empty.title')} body={t('budget.empty.body')} trame action={canValidate ? <Button variant="neutral" disabled={preparing} onClick={onPrepare}>{t('budget.action.prepare', { year: overview.year + 1 })}</Button> : null} />}
        />
      </Card>
    </>
  );
}
