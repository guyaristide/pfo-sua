import type { BudgetDetail, BudgetService } from '@/services/contracts';
import { AppError } from '@/shared/errors';
import { delay } from '../latency';
import { budgetAll } from '../fixtures/budget';
import { budgetDetail } from '../fixtures/details';
import { type MockContext } from '../context';

export function createBudgetMock(ctx: MockContext): BudgetService {
  const { latency, byAsset, state, author, today } = ctx;
  return {
    getOverview: assetId => delay({ ...budgetAll, rows: byAsset(state.budgets, assetId) }, latency),
    getBudget: async id => {
      const found = state.budgets.find(b => b.id === id);
      if (!found) throw new AppError('resource-missing');
      return delay(found, latency);
    },
    reestimate: async (id, input) => {
      const found = state.budgets.find(b => b.id === id);
      if (!found) throw new AppError('resource-missing');
      if (found.status === 'settled') throw new AppError('business', { userMessage: 'La reddition de ce budget est faite : il ne se réestime plus.' });
      const lines = found.lines.map(line => {
        const change = input.lines.find(l => l.id === line.id);
        return change ? { ...line, reestimated: change.reestimated } : line;
      });
      const updated: BudgetDetail = {
        ...found,
        lines,
        status: 're-estimated',
        budgetAmount: lines.reduce((sum, line) => sum + (line.reestimated ?? line.budget), 0),
        detail: `Réestimé le ${today()} par ${author()}${input.note ? ` · ${input.note}` : ''}`,
      };
      state.budgets = state.budgets.map(b => (b.id === id ? updated : b));
      return delay(updated, latency);
    },
    prepareYear: async year => {
      const missing = state.assets.filter(a => !state.budgets.some(b => b.assetName === a.name && b.year === year));
      if (missing.length === 0) throw new AppError('business', { userMessage: `Les budgets ${year} existent déjà pour tous les actifs.` });
      const created = missing.map(a => {
        const previous = state.budgets.filter(b => b.assetName === a.name).sort((x, y) => y.year - x.year)[0];
        const amount = previous ? Math.round(previous.budgetAmount * 1.03) : 50_000_000;
        return budgetDetail({ id: `b-${year}-${a.id}`, assetName: a.name, year, status: 'initial', budgetAmount: amount, realisedAmount: 0, settlementDeadline: `${year + 1}-04-15`, detail: `Budget initial préparé le ${today()} depuis les devis` });
      });
      state.budgets = [...created, ...state.budgets];
      return delay({ created: created.length }, latency);
    },
  };
}
