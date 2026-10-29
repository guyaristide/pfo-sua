import type { ReportDetail, ReportService } from '@/services/contracts';
import { AppError } from '@/shared/errors';
import { delay } from '../latency';
import { reportsAll } from '../fixtures/reports';
import { reportDetail } from '../fixtures/details';
import { type MockContext } from '../context';

export function createReportMock(ctx: MockContext): ReportService {
  const { latency, byAsset, state, author, today } = ctx;
  return {
    getOverview: assetId => delay({ ...reportsAll, rows: byAsset(state.reports, assetId) }, latency),
    getReport: async id => {
      const report = state.reports.find(r => r.id === id);
      if (!report) throw new AppError('resource-missing');
      return delay(report, latency);
    },
    generateDrafts: async period => {
      const missing = state.assets.filter(a => !state.reports.some(r => r.assetName === a.name && r.period.year === period.year && r.period.quarter === period.quarter));
      if (missing.length === 0) throw new AppError('business', { userMessage: `Tous les CRG T${period.quarter} ${period.year} existent déjà.` });
      const due = new Date(Date.UTC(period.year, period.quarter * 3, 15)).toISOString().slice(0, 10);
      const created = missing.map(a =>
        reportDetail({ id: `r-${period.year}${period.quarter}-${a.id}`, assetName: a.name, period, status: 'draft', preparedBy: author(), dueDate: due, amountToTransfer: null, stepDetail: 'Brouillon généré, en attente des rapprochements' }),
      );
      state.reports = [...created, ...state.reports];
      return delay({ created: created.length }, latency);
    },
    transition: async (id, action, note) => {
      const report = state.reports.find(r => r.id === id);
      if (!report) throw new AppError('resource-missing');
      const next: Record<string, ReportDetail['status'] | undefined> = {
        'draft:submit': 'in-review',
        'in-review:validate': 'validated',
        'validated:sign': 'signed',
        'in-review:reopen': 'draft',
        'validated:reopen': 'in-review',
      };
      const status = next[`${report.status}:${action}`];
      if (!status) throw new AppError('business', { userMessage: 'Cette étape n’est pas possible dans l’état actuel du CRG.' });
      const labels: Record<string, string> = { submit: 'Envoyé en relecture', validate: 'Validé', sign: 'Signé et transmis au propriétaire', reopen: 'Rouvert' };
      const amount = report.amountToTransfer ?? Math.round(28_000_000 + Math.random() * 20_000_000);
      const updated: ReportDetail = {
        ...report,
        status,
        amountToTransfer: amount,
        sections: report.sections.map(section => (section.key === 'transfer' ? { ...section, amount } : section)),
        stepDetail: `${labels[action]} par ${author()} le ${today()}${note ? ` · ${note}` : ''}`,
        signatories: status === 'signed' ? report.signatories.map(sg => ({ ...sg, signedOn: today() })) : report.signatories,
        history: [{ id: `${id}-${action}-${Date.now()}`, date: today(), kind: 'note', label: `${labels[action]} par ${author()}${note ? ` · ${note}` : ''}`, amount: null }, ...report.history],
      };
      state.reports = state.reports.map(r => (r.id === id ? updated : r));
      return delay(updated, latency);
    },
  };
}
