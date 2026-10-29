import type { OwnerHome, OwnerReport, OwnerReportSummary, OwnerService } from '@/services/contracts';
import { AppError } from '@/shared/errors';
import { delay } from '../latency';
import { ownerSeeds, type OwnerSeed } from '../fixtures/owner';
import { simplePdf } from '../pdf';
import { formatMoney } from '@/shared/format/money';
import { type MockContext } from '../context';

const summary = (r: OwnerReport): OwnerReportSummary => ({ id: r.id, quarter: r.quarter, year: r.year, periodStart: r.periodStart, periodEnd: r.periodEnd, signedOn: r.signedOn, invoiced: r.invoiced, collected: r.collected, unpaid: r.unpaid, payout: r.payout, aging: r.aging, unpaidDetail: r.unpaidDetail });
const short = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

/** L'espace propriétaire, borné à la SCI de la session : un propriétaire ne voit jamais un autre actif. */
export function createOwnerMock(ctx: MockContext): OwnerService {
  const { latency, state, currentKey, activeSession } = ctx;
  const money = (n: number) => formatMoney(n, { currency: activeSession().tenant.currency, locale: activeSession().tenant.locale, style: 'full' });
  const seed = (): OwnerSeed => {
    const account = state.owners.find(o => o.sessionKey === currentKey());
    if (!account) throw new AppError('forbidden', { userMessage: 'Cet espace est réservé aux propriétaires.' });
    return ownerSeeds[account.seed];
  };
  return {
    getHome: async () => {
      const s = seed();
      const latest = s.reports[0];
      const rented = (status: string) => status === 'occupied' || status === 'unpaid';
      const home: OwnerHome = {
        profile: s.profile,
        asOf: latest ? latest.periodEnd : null,
        sources: latest ? `compte-rendu T${latest.quarter} ${latest.year}, validé le ${short(latest.signedOn)}, et du point des impayés de septembre, validé le 08.10.2026` : null,
        reports: s.reports.map(summary),
        buildings: s.buildings.map(b => ({ ...b, occupied: s.lots.filter(l => l.building === b.key && (rented(l.status) || l.status === 'signed')).length })),
        vacantLots: s.lots.filter(l => l.status === 'vacant' && s.reports.length > 0).map(l => ({ code: l.code, type: l.type, area: l.area, since: l.since })),
        lotCount: s.lots.length,
        occupiedCount: s.lots.filter(l => rented(l.status)).length,
        signedCount: s.lots.filter(l => l.status === 'signed').length,
        debtorCount: latest ? latest.aging.reduce((sum, a) => sum + a.tenantCount, 0) : 0,
        riskCount: s.riskCount,
        upcoming: s.upcoming,
      };
      return delay(home, latency);
    },
    listReports: async () => delay(seed().reports.map(summary), latency),
    getReport: async id => {
      const report = seed().reports.find(r => r.id === id);
      if (!report) throw new AppError('resource-missing');
      return delay(report, latency);
    },
    listLots: async () => delay(seed().lots, latency),
    listDocuments: async () => delay(seed().documents, latency),
    download: async id => {
      const s = seed();
      const report = s.reports.find(r => r.id === id);
      const document = s.documents.flatMap(g => g.documents).find(d => d.id === id);
      if (!report && !document) throw new AppError('resource-missing');
      const title = report ? `Compte-rendu de gestion · T${report.quarter} ${report.year}` : document!.name;
      const lines = [
        { text: 'PFO Immobilier', size: 11 },
        { text: title, size: 18 },
        { text: `${s.profile.assetName} · ${s.profile.sciName}`, size: 12 },
        ...(report
          ? [
              { text: `Du ${short(report.periodStart)} au ${short(report.periodEnd)} · signé le ${short(report.signedOn)}` },
              { text: `Encaissé : ${money(report.collected)}`, size: 12 },
              { text: `Facturé : ${money(report.invoiced)}`, size: 12 },
              { text: `Impayés : ${money(report.unpaid)} · ${report.unpaidDetail}`, size: 12 },
              ...report.byItem.map(line => ({ text: `    ${line.label} : ${money(line.amount)}` })),
              { text: `Solde reversé à la SCI : ${money(report.payout)}`, size: 12 },
            ]
          : [{ text: document!.detail }]),
      ];
      const fileName = report ? `CRG ${s.profile.assetName} ${report.quarter}T${String(report.year).slice(2)}.pdf` : document!.fileName;
      // Un fichier ne se clone pas comme une donnée : il sort tel quel après la latence.
      await delay(undefined, latency);
      return { fileName, blob: simplePdf(lines) };
    },
  };
}
