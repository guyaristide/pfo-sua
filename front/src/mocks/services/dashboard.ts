import type { DashboardKpi, DashboardKpiKey, DashboardPeriod, DashboardService } from '@/services/contracts';
import { delay } from '../latency';
import { dashboardAll, kpiSeeds } from '../fixtures/dashboard';
import { type MockContext } from '../context';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** Ce que nomme le libellé et à quoi l'évolution se compare, selon la période choisie (E0.1). */
function periodWording(period: DashboardPeriod, kind: 'quarter' | 'month' | 'year' | 'none', today: string) {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7)) - 1;
  const quarter = Math.floor(month / 3);
  const lastQuarter = quarter === 0 ? 4 : quarter;
  switch (period.kind) {
    case 'year':
      return { label: String(year), since: `depuis ${year - 1}` };
    case 'since-start':
      return { label: 'depuis mars 2024', since: 'depuis mars 2024' };
    case 'custom':
      return { label: period.from && period.to ? `du ${period.from.slice(8, 10)}.${period.from.slice(5, 7)} au ${period.to.slice(8, 10)}.${period.to.slice(5, 7)}` : 'la période', since: 'sur la période précédente' };
    case 'last-quarter':
      return { label: `T${lastQuarter}`, since: `depuis le T${lastQuarter === 1 ? 4 : lastQuarter - 1}` };
    case 'today':
      return { label: kind === 'month' ? MONTHS[(month + 11) % 12]! : kind === 'year' ? String(year) : `T${lastQuarter}`, since: '' };
  }
}

export function createDashboardMock(ctx: MockContext): DashboardService {
  const { latency, state, today } = ctx;
  return {
    getSummary: (assetId, period) => {
      const asset = assetId ? state.assets.find(a => a.id === assetId) : undefined;
      const assets = assetId ? dashboardAll.assets.filter(row => row.assetId === assetId) : dashboardAll.assets;
      const kpis: DashboardKpi[] = (Object.keys(kpiSeeds) as DashboardKpiKey[]).map(key => {
        const seed = assetId ? kpiSeeds[key].itc : kpiSeeds[key].all;
        const { period: kind, ...rest } = seed;
        const wording = periodWording(period, kind, today());
        // Hors période du jour, l'évolution se compare à la période équivalente précédente.
        const delta = period.kind === 'today' || kind === 'none' || kind === 'year' ? rest.delta : rest.delta.replace(/depuis .*$/, wording.since);
        const value = key === 'occupancy' && asset ? asset.occupancyRate : key === 'vacancy' && asset ? Math.max(0, 1 - asset.occupancyRate) : rest.value;
        return { key, ...rest, value, delta, periodLabel: wording.label, alert: rest.alert || (key === 'unpaid' && value > 0.2) };
      });
      const asOf = `${today()}T07:00:00`;
      return delay({ ...dashboardAll, asOf, kpis, assets }, latency);
    },
  };
}
