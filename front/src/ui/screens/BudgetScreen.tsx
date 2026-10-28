import type { BudgetOverview, BudgetRow } from '@/services/contracts';
import type { Formatters } from '@/shared/format/formatters';
import { budgetStatus } from '@/shared/status';
import { t } from '@/i18n/t';
import { Badge, Button, Card, DataTable, EmptyState, ListStatus, PageHeader, ShowMore, useListFilter, type Column } from '@/ui/primitives';

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
  const list = useListFilter(overview.rows, row => [row.assetName, String(row.year)]);
  const totalBudget = list.filtered.reduce((sum, row) => sum + row.budgetAmount, 0);
  const totalRealised = list.filtered.reduce((sum, row) => sum + row.realisedAmount, 0);

  const columns: Column<BudgetRow>[] = [
    {
      key: 'asset',
      header: t('budget.col.asset'),
      render: row => (
        <div>
          <div className="table__primary">{row.assetName}</div>
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
    {
      key: 'actions',
      header: '',
      render: row => (
        <div className="table__actions">
          {canValidate && row.status === 'initial' ? (
            <Button variant="neutral" onClick={() => onReestimate(row.id)}>
              {t('budget.action.reestimate')}
            </Button>
          ) : null}
          <Button variant={canValidate && row.status === 'initial' ? 'base' : 'neutral'} onClick={() => onOpen(row.id)}>
            {t('budget.action.open')}
          </Button>
        </div>
      ),
    },
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
        <ListStatus count={list.filtered.length} extra={fmt.moneyPlain(totalBudget)} search={list.search} onSearch={list.setSearch} />
        {list.filtered.length === 0 ? (
          <EmptyState icon="tag" title={t('budget.empty.title')} body={t('budget.empty.body')} trame />
        ) : (
          <DataTable
            caption={t('budget.title')}
            columns={columns}
            rows={list.visible}
            rowKey={row => row.id}
            footer={[
              t('budget.total', { count: list.filtered.length }),
              '',
              '',
              fmt.moneyPlain(totalBudget),
              fmt.moneyPlain(totalRealised),
              fmt.percent(realisationRate(totalBudget, totalRealised)),
              '',
              '',
            ]}
          />
        )}
        <ShowMore hidden={list.hidden} onClick={list.showMore} />
      </Card>
    </>
  );
}
