import type { SearchService } from '@/services/contracts';
import { delay } from '../latency';
import { billingAll } from '../fixtures/billing';
import { documentsAll } from '../fixtures/documents';
import { type MockContext } from '../context';

export function createSearchMock(ctx: MockContext): SearchService {
  const { latency, state } = ctx;
  return {
    query: async (text, scope) => {
      const needle = text.trim().toLowerCase();
      if (needle.length < 2) return [];
      const hit = (...values: (string | null)[]) => values.some(v => v !== null && v.toLowerCase().includes(needle));
      const results = [
        ...(scope === 'all' || scope === 'asset'
          ? state.assets.filter(a => hit(a.name, a.location, a.ownerName)).map(a => ({ kind: 'asset' as const, id: a.id, title: a.name, detail: `${a.location} · ${a.lotCount} lots` }))
          : []),
        ...(scope === 'all' || scope === 'tenant'
          ? state.tenants.filter(tn => hit(tn.name, ...tn.lotCodes)).map(tn => ({ kind: 'tenant' as const, id: tn.id, title: tn.name, detail: `${tn.assetName} · ${tn.lotCodes.join(', ')}` }))
          : []),
        ...(scope === 'all' || scope === 'invoice'
          ? billingAll.invoices.filter(i => hit(i.tenantName, i.assetName)).map(i => ({ kind: 'invoice' as const, id: i.id, title: `${i.tenantName} · ${i.periodStart.slice(0, 7)}`, detail: i.assetName }))
          : []),
        ...(scope === 'all' || scope === 'document'
          ? documentsAll.filter(d => hit(d.name, d.assetName, d.tenantName)).map(d => ({ kind: 'document' as const, id: d.id, title: d.name, detail: d.assetName }))
          : []),
      ];
      return delay(results.slice(0, 50), latency);
    },
  };
}
