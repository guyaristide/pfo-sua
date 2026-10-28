import type { DashboardSummary } from '@/services/contracts';
import { assets } from './assets';

/** Tableau de bord « Responsable PM » du prototype du 16/10/2026, transposé. */
export const dashboardAll: DashboardSummary = {
  asOf: '2026-10-16T07:00:00Z',
  period: { year: 2026, quarter: 3 },
  vacancyRate: { value: 0.08, deltaPoints: -1, comparedToMonth: '2026-09-01' },
  unpaidRate: { value: 0.055, deltaPoints: -0.6, comparedToMonth: '2026-09-01' },
  preLitigationCount: { value: 2, comparedToMonth: '2026-09-01' },
  budgetRealisationRate: { value: 0.96, asOfDate: '2026-09-30' },
  tasks: [
    {
      id: 't-1',
      title: 'Relire et signer le CRG T3 de l’actif ITC',
      detail: 'Encaissements validés par Vincent · 3 signatures restantes',
      urgency: 'late',
      lateDays: 1,
      target: 'report',
    },
    {
      id: 't-2',
      title: 'Valider 2 baux avant signature',
      detail: 'Café du Plateau (renouvellement) · Atlantis Télécom (avenant, lot C-203)',
      urgency: 'to-validate',
      target: 'asset',
    },
    {
      id: 't-3',
      title: 'Arbitrer 6 relances d’impayés',
      detail: '18 450 000 · 2 dossiers à passer en pré-contentieux',
      urgency: 'this-week',
      target: 'arrears',
    },
  ],
  deadlines: [
    { id: 'd-1', date: '2026-10-15', title: 'CRG T3 2026', detail: 'Relecture et quatre signatures attendues', state: 'late', days: 1, target: 'report' },
    { id: 'd-2', date: '2026-10-31', title: 'Préavis Optique Marcory', detail: 'Bail échu le 31.01.2027', state: 'soon', days: 15, target: 'asset' },
    { id: 'd-3', date: '2026-11-05', title: 'État locatif de novembre', detail: 'À transmettre à l’Asset Manager', state: 'upcoming', target: 'asset' },
    { id: 'd-4', date: '2026-11-08', title: 'Point des impayés', detail: '7 locataires à relancer ou suivre', state: 'upcoming', target: 'arrears' },
  ],
  assets: assets.map((asset, index) => ({
    assetId: asset.id,
    assetName: asset.name,
    lotCount: asset.lotCount,
    occupancyRate: asset.occupancyRate,
    recoveryRate: [0.94, 0.91, 0.97, 0.9, 0.93][index] ?? 0.9,
    unpaidAmount: asset.unpaidAmount,
    reportStatus: (['in-review', 'validated', 'signed', 'draft', 'draft'] as const)[index] ?? 'draft',
  })),
};
